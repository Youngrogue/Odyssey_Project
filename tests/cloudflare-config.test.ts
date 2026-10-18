import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  mkdtempSync,
  mkdirSync,
  copyFileSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

let scratch: string;
const database =
  "postgresql://fixture:fixture-password@ep-fixture.neon.tech/odyssey?sslmode=require";
beforeEach(() => {
  scratch = mkdtempSync(join(tmpdir(), "odyssey-deploy-test-"));
  mkdirSync(join(scratch, "cloudflare"));
  copyFileSync("wrangler.jsonc", join(scratch, "wrangler.jsonc"));
  copyFileSync(
    "cloudflare/scheduler.wrangler.jsonc",
    join(scratch, "cloudflare/scheduler.wrangler.jsonc"),
  );
  // Fake the CLI boundary: capture fixture input, never contact Cloudflare.
  mkdirSync(join(scratch, "bin"));
  writeFileSync(
    join(scratch, "bin/pnpm"),
    `#!/usr/bin/env node
const fs = require("node:fs");
fs.writeFileSync(process.env.ODYSSEY_SECRET_CAPTURE, fs.readFileSync(0));
`,
    { mode: 0o700 },
  );
});
afterEach(() => rmSync(scratch, { recursive: true, force: true }));
function run(script: string, target: string, env: Record<string, string> = {}) {
  return spawnSync(process.execPath, [resolve("scripts", script), target], {
    cwd: scratch,
    encoding: "utf8",
    timeout: 15000,
    env: {
      NODE_ENV: "test",
      PATH: `${scratch}/bin:${process.env.PATH}`,
      CLOUDFLARE_ACCOUNT_ID: "a".repeat(32),
      WAITLIST_ENABLED: "false",
      WRANGLER_SEND_METRICS: "false",
      ODYSSEY_SECRET_CAPTURE: join(scratch, "captured.json"),
      ...env,
    },
  });
}
describe("direct Neon deployment boundaries", () => {
  it("keeps the production hostname separate and refuses incomplete opening secrets", () => {
    const closed = run("cloudflare-config.mjs", "production");
    expect(closed.status).toBe(0);
    const config = JSON.parse(
      readFileSync(join(scratch, ".cloudflare-build/landing.json"), "utf8"),
    );
    expect(config.routes).toEqual([
      {
        pattern: "odyssey.soralives.xyz",
        custom_domain: true,
        zone_name: "soralives.xyz",
      },
    ]);
    const open = run("cloudflare-config.mjs", "production", {
      DATABASE_URL: database,
      WAITLIST_ENABLED: "true",
      RELEASE_CHECKS_PASSED: "true",
    });
    expect(open.status).not.toBe(0);
    expect(open.stderr).toContain("all runtime signing and mail secrets");
  });
  it("keeps paused cleanup scheduled without serializing the database secret", () => {
    const result = run("cloudflare-config.mjs", "staging", {
      DATABASE_URL: database,
      CRON_SECRET: "fixture-signing-secret",
    });
    expect(result.status).toBe(0);
    const landing = readFileSync(
      join(scratch, ".cloudflare-build/landing.json"),
      "utf8",
    );
    const scheduler = JSON.parse(
      readFileSync(join(scratch, ".cloudflare-build/scheduler.json"), "utf8"),
    );
    expect(landing).not.toContain(database);
    expect(landing).not.toContain("fixture-password");
    expect(landing).not.toContain("hyperdrive");
    expect(JSON.parse(landing).routes).toEqual([
      {
        pattern: "odyssey-staging.soralives.xyz",
        custom_domain: true,
        zone_name: "soralives.xyz",
      },
    ]);
    expect(JSON.parse(landing).vars.WAITLIST_ENABLED).toBe("false");
    expect(scheduler.vars).toEqual({
      SCHEDULER_ENABLED: "true",
      MAIL_ENABLED: "false",
    });
    expect(scheduler.triggers.crons).toContain("0 3 * * *");
    expect(result.stdout + result.stderr).not.toContain(database);
  });
  it("refuses missing or non-Neon configuration before opening collection", () => {
    for (const url of [
      "",
      "postgresql://fixture:fixture-password@other.example/db",
    ]) {
      const result = run("cloudflare-config.mjs", "production", {
        DATABASE_URL: url,
        WAITLIST_ENABLED: "true",
        RELEASE_CHECKS_PASSED: "true",
      });
      expect(result.status).not.toBe(0);
      expect(result.stdout + result.stderr).not.toContain("fixture-password");
    }
  });
  it("sends the database URL only to landing secret storage, never scheduler or logs", () => {
    for (const target of ["landing", "scheduler"]) {
      const result = run("cloudflare-secrets.mjs", target, {
        DATABASE_URL: database,
        CRON_SECRET: "fixture-signing-secret",
      });
      expect(result.status).toBe(0);
      const values = JSON.parse(
        readFileSync(join(scratch, "captured.json"), "utf8"),
      );
      expect(values).toEqual(
        target === "landing"
          ? { DATABASE_URL: database, CRON_SECRET: "fixture-signing-secret" }
          : { CRON_SECRET: "fixture-signing-secret" },
      );
      expect(result.stdout + result.stderr).not.toContain(database);
    }
  });
  it("requires the database secret when collection is enabled", () => {
    const result = run("cloudflare-secrets.mjs", "landing", {
      WAITLIST_ENABLED: "true",
      WAITLIST_TOKEN_SECRET: "fixture-token-secret",
      CRON_SECRET: "fixture-cron-secret",
      RESEND_API_KEY: "fixture-mail-key",
      RESEND_WEBHOOK_SECRET: "fixture-webhook-secret",
    });
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Required runtime secrets are missing");
  });
});
