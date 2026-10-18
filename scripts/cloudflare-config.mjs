import { mkdir, writeFile } from "node:fs/promises";
import { experimental_readRawConfig } from "wrangler";
import { isNeonDatabaseUrl } from "../src/lib/waitlist/database-url.mjs";
const target = process.argv[2];
if (!["staging", "production"].includes(target))
  throw Error("Choose staging or production");
const account = process.env.CLOUDFLARE_ACCOUNT_ID;
if (!/^[a-f0-9]{32}$/.test(account ?? ""))
  throw Error("CLOUDFLARE_ACCOUNT_ID is required");
const database = process.env.DATABASE_URL;
if (database && !isNeonDatabaseUrl(database))
  throw Error("DATABASE_URL must be a Neon PostgreSQL URL with required TLS");
const enabled = process.env.WAITLIST_ENABLED === "true";
if (enabled && !database) throw Error("Collection requires DATABASE_URL");
if (
  enabled &&
  (!process.env.RESEND_API_KEY?.startsWith("re_") ||
    !process.env.RESEND_WEBHOOK_SECRET?.startsWith("whsec_") ||
    (process.env.WAITLIST_TOKEN_SECRET?.length ?? 0) < 32 ||
    (process.env.CRON_SECRET?.length ?? 0) < 32)
)
  throw Error(
    "Opening collection requires all runtime signing and mail secrets",
  );
if (
  target === "production" &&
  enabled &&
  process.env.RELEASE_CHECKS_PASSED !== "true"
)
  throw Error("Public collection requires recorded release checks");
if (
  target === "staging" &&
  enabled &&
  process.env.STAGING_ACCESS_VERIFIED !== "true"
)
  throw Error(
    "Protect staging with Cloudflare Access before enabling test signups",
  );
const name =
  target === "production" ? "odyssey-landing" : "odyssey-landing-staging";
const hostname =
  target === "production"
    ? "odyssey.soralives.xyz"
    : "odyssey-staging.soralives.xyz";
const { rawConfig: config } = experimental_readRawConfig({
  config: "wrangler.jsonc",
});
config.name = name;
config.account_id = account;
config.main = "../.open-next/worker.js";
config.assets.directory = "../.open-next/assets";
config.services[0].service = name;
config.durable_objects = {
  bindings: [
    {
      name: "MAIL_RECOVERY",
      class_name: "MailRecovery",
      script_name: `${name}-scheduler`,
    },
  ],
};
config.routes = [
  { pattern: hostname, custom_domain: true, zone_name: "soralives.xyz" },
];
config.vars = {
  ...config.vars,
  DEPLOYMENT_ENV: target,
  APP_ORIGIN: `https://${hostname}`,
  WAITLIST_ENABLED: String(enabled),
  SITE_INDEXING_ENABLED: String(
    target === "production" &&
      enabled &&
      process.env.SITE_INDEXING_ENABLED === "true",
  ),
};
await mkdir(".cloudflare-build", { recursive: true });
await writeFile(
  ".cloudflare-build/landing.json",
  JSON.stringify(config, null, 2) + "\n",
);
const { rawConfig: scheduler } = experimental_readRawConfig({
  config: "cloudflare/scheduler.wrangler.jsonc",
});
scheduler.name = `${name}-scheduler`;
scheduler.account_id = account;
scheduler.main = "../cloudflare/scheduler.ts";
scheduler.services[0].service = name;
const scheduled = Boolean(database && process.env.CRON_SECRET);
scheduler.vars = {
  SCHEDULER_ENABLED: String(scheduled),
  MAIL_ENABLED: String(enabled),
};
scheduler.triggers.crons = scheduled ? ["*/5 * * * *", "0 3 * * *"] : [];
await writeFile(
  ".cloudflare-build/scheduler.json",
  JSON.stringify(scheduler, null, 2) + "\n",
);
// Only used if this scheduler has never been deployed. It establishes the
// cross-script Durable Object target without activating schedules or collection.
await writeFile(
  ".cloudflare-build/scheduler-bootstrap.json",
  JSON.stringify(
    {
      ...scheduler,
      services: [],
      vars: { SCHEDULER_ENABLED: "false", MAIL_ENABLED: "false" },
      triggers: { crons: [] },
    },
    null,
    2,
  ) + "\n",
);
console.log(
  `Prepared ${target}; collection ${enabled ? "enabled" : "closed"}; schedules ${scheduled ? "enabled" : "disabled"}.`,
);
