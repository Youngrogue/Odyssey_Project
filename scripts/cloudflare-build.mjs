import { spawnSync } from "node:child_process";
import { copyFile, access } from "node:fs/promises";
const target = process.argv[2] ?? "local";
if (!["local", "staging", "production"].includes(target))
  throw Error("Invalid build environment");
const env = Object.fromEntries(
  ["PATH", "HOME", "TMPDIR", "SYSTEMROOT", "CI"]
    .filter((key) => process.env[key])
    .map((key) => [key, process.env[key]]),
);
Object.assign(env, {
  NODE_ENV: "production",
  NEXT_TELEMETRY_DISABLED: "1",
  WRANGLER_SEND_METRICS: "false",
  DEPLOYMENT_ENV: target === "local" ? "development" : target,
  APP_ORIGIN:
    target === "production"
      ? "https://odyssey.soralives.xyz"
      : target === "staging"
        ? "https://odyssey-staging.soralives.xyz"
        : "http://127.0.0.1:43219",
  SITE_INDEXING_ENABLED: String(
    target === "production" &&
      process.env.WAITLIST_ENABLED === "true" &&
      process.env.SITE_INDEXING_ENABLED === "true",
  ),
  WAITLIST_ENABLED: "false",
  DATABASE_URL: "",
  RESEND_API_KEY: "",
  RESEND_WEBHOOK_SECRET: "",
  WAITLIST_TOKEN_SECRET: "",
  CRON_SECRET: "",
});
const args = ["exec", "opennextjs-cloudflare", "build"];
if (target !== "local") args.push("--config", ".cloudflare-build/landing.json");
const build = spawnSync("pnpm", args, { env, stdio: "inherit" });
if (build.status !== 0) process.exit(build.status ?? 1);
// Asset-first delivery avoids running the Next server for ordinary public visits.
// This explicit allowlist must never include private waitlist pages or APIs.
for (const [source, destination] of [
  ["index.html", "index.html"],
  ["privacy.html", "privacy.html"],
  ["robots.txt.body", "robots.txt"],
  ["sitemap.xml.body", "sitemap.xml"],
]) {
  await access(`.next/server/app/${source}`);
  await copyFile(
    `.next/server/app/${source}`,
    `.open-next/assets/${destination}`,
  );
}
console.log("Prepared public static pages; private routes remain dynamic.");
