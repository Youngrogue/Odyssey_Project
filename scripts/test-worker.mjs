import { spawn } from "node:child_process";
import { setTimeout } from "node:timers/promises";
import assert from "node:assert/strict";
const origin = "http://127.0.0.1:43219";
const worker = spawn(
  "pnpm",
  [
    "exec",
    "wrangler",
    "dev",
    "--local",
    "--port",
    "43219",
    "--ip",
    "127.0.0.1",
    "--inspector-port",
    "43220",
    "--env-file",
    ".dev.vars.example",
  ],
  {
    stdio: ["ignore", "pipe", "pipe"],
    env: {
      ...process.env,
      WRANGLER_SEND_METRICS: "false",
      CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
      CLOUDFLARE_INCLUDE_PROCESS_ENV: "false",
      WRANGLER_LOG_PATH: ".wrangler/logs/",
    },
  },
);
let output = "";
worker.stdout.on("data", (chunk) => {
  output = (output + chunk).slice(-6000);
});
worker.stderr.on("data", (chunk) => {
  output = (output + chunk).slice(-6000);
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 60; attempt++) {
    if (worker.exitCode !== null) throw Error("Worker stopped during startup");
    try {
      const result = await fetch(origin, { signal: AbortSignal.timeout(1000) });
      if (result.ok) {
        ready = true;
        break;
      }
    } catch {}
    await setTimeout(500);
  }
  assert(ready, "Worker did not start");
  const smoke = spawn(
    process.execPath,
    ["scripts/smoke-deployment.mjs", origin],
    { stdio: "inherit", env: { ...process.env, WAITLIST_ENABLED: "false" } },
  );
  const code = await new Promise((resolve) => smoke.on("exit", resolve));
  assert.equal(code, 0, "Worker smoke tests");
  const attempt = await fetch(`${origin}/api/waitlist`, {
    method: "POST",
    headers: { "content-type": "application/json", origin },
    body: JSON.stringify({ email: "closed-check@example.com" }),
  });
  assert.equal(attempt.status, 503, "Unconfigured collection must stay closed");
  const media = await fetch(`${origin}/media/odyssey-launch-web.mp4`, {
    headers: { Range: "bytes=0-255" },
  });
  assert([200, 206].includes(media.status), "Video asset");
  await media.body?.cancel();
  console.log(
    "Local Workers runtime passed; deployed free-tier CPU verification is still required.",
  );
} catch (error) {
  console.error(error.message);
  // Local closed worker only: runtime secrets are not configured in this test.
  console.error(output);
  process.exitCode = 1;
} finally {
  worker.kill("SIGTERM");
}
