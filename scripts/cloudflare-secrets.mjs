import { spawnSync } from "node:child_process";
const target = process.argv[2];
if (!["landing", "scheduler"].includes(target))
  throw Error("Choose landing or scheduler");
const names =
  target === "landing"
    ? [
        "DATABASE_URL",
        "WAITLIST_TOKEN_SECRET",
        "CRON_SECRET",
        "RESEND_API_KEY",
        "RESEND_WEBHOOK_SECRET",
      ]
    : ["CRON_SECRET"];
const values = Object.fromEntries(
  names
    .filter((name) => process.env[name])
    .map((name) => [name, process.env[name]]),
);
if (
  process.env.WAITLIST_ENABLED === "true" &&
  names.some((name) => !values[name])
)
  throw Error("Required runtime secrets are missing");
if (!Object.keys(values).length) {
  console.log("No runtime secrets supplied; collection must remain closed.");
  process.exit(0);
}
const child = spawnSync(
  "pnpm",
  [
    "exec",
    "wrangler",
    "secret",
    "bulk",
    "--config",
    `.cloudflare-build/${target}.json`,
  ],
  {
    input: JSON.stringify(values),
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  },
);
// Do not forward CLI output: credentials must not appear in CI logs, even on failures.
if (child.status !== 0) {
  console.error(
    "Secret configuration failed. Review provider settings privately.",
  );
  process.exit(1);
}
console.log(
  `Configured ${Object.keys(values).length} ${target} runtime secrets.`,
);
