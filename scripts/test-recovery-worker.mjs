import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

// Use the local runtime bundled with the pinned Wrangler, never a provider or
// database credential. All state is temporary and every external fetch is absent.
const require = createRequire(import.meta.url);
const wranglerRequire = createRequire(require.resolve("wrangler/package.json"));
const { Miniflare, convertV4MiniflareOptions } = wranglerRequire("miniflare");
const scratch = await mkdtemp(join(tmpdir(), "odyssey-recovery-"));
let runtime;
try {
  const env = Object.fromEntries(
    ["PATH", "HOME", "TMPDIR", "SystemRoot"]
      .filter((name) => process.env[name])
      .map((name) => [name, process.env[name]]),
  );
  const build = spawnSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "deploy",
      "--dry-run",
      "--config",
      "cloudflare/scheduler.wrangler.jsonc",
      "--outdir",
      join(scratch, "bundle"),
      "--env-file",
      resolve(".dev.vars.example"),
    ],
    {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...env,
        WRANGLER_SEND_METRICS: "false",
        WRANGLER_LOG_PATH: join(scratch, "logs"),
        CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
        CLOUDFLARE_INCLUDE_PROCESS_ENV: "false",
      },
    },
  );
  assert.equal(build.status, 0, "Closed scheduler must compile for workerd");
  const options = convertV4MiniflareOptions({
    rootPath: scratch,
    host: "127.0.0.1",
    port: 0,
    cf: false,
    telemetry: { enabled: false },
    resourcePersistencePath: join(scratch, "state"),
    workers: [
      {
        name: "test-landing",
        modules: true,
        compatibilityDate: "2026-10-17",
        script: `export default {fetch(request, env) {
        return env.MAIL_RECOVERY.get(env.MAIL_RECOVERY.idFromName("outbox")).fetch(request);
      }};`,
        durableObjects: {
          MAIL_RECOVERY: {
            className: "MailRecovery",
            scriptName: "test-scheduler",
            useSQLite: true,
          },
        },
      },
      {
        name: "test-scheduler",
        modules: true,
        compatibilityDate: "2026-10-17",
        scriptPath: join(scratch, "bundle", "scheduler.js"),
        bindings: { SCHEDULER_ENABLED: "false", MAIL_ENABLED: "false" },
        durableObjects: {
          MAIL_RECOVERY: { className: "MailRecovery", useSQLite: true },
        },
      },
    ],
  });
  runtime = new Miniflare(options);
  const request = async (path, body) => {
    const response = await runtime.dispatchFetch(
      `https://local.test${path}`,
      body === undefined ? {} : { method: "POST", body: JSON.stringify(body) },
    );
    assert.equal(response.status, 200);
    return response.json();
  };
  assert.deepEqual(await request("/state"), { revision: 0, dueAt: 0 });
  await Promise.all(Array.from({ length: 10 }, () => request("/arm", {})));
  assert.deepEqual(await request("/state"), { revision: 10, dueAt: 0 });
  assert.deepEqual(await request("/project", { revision: 9, dueAt: null }), {
    updated: false,
  });
  const dueAt = Date.now() + 86400000;
  assert.deepEqual(await request("/project", { revision: 10, dueAt }), {
    updated: true,
  });
  await runtime.dispose();
  runtime = new Miniflare(options);
  assert.deepEqual(await request("/state"), { revision: 11, dueAt });
  await request("/arm", {});
  assert.deepEqual(await request("/project", { revision: 11, dueAt: null }), {
    updated: false,
  });
  assert.deepEqual(await request("/state"), { revision: 12, dueAt: 0 });
  assert.equal(
    (
      await (
        await runtime.getWorker("test-scheduler")
      ).fetch("https://scheduler.test/arm", { method: "POST" })
    ).status,
    404,
  );
  console.log(
    "Real workerd passed: cross-script SQLite coordinator, concurrent arming, stale projection rejection, persistence after restart, private public surface.",
  );
} finally {
  await runtime?.dispose();
  await rm(scratch, { recursive: true, force: true });
}
