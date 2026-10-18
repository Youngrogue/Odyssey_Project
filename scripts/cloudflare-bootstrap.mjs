import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export function schedulerBootstrapRequired(status, result, collectionEnabled) {
  if (status >= 200 && status < 300 && result?.success === true) {
    if (
      !Array.isArray(result.result?.bindings) ||
      !result.result.bindings.some(
        (binding) =>
          binding.name === "MAIL_RECOVERY" &&
          binding.type === "durable_object_namespace",
      )
    )
      throw new Error(
        "Existing scheduler lacks its coordinator; preserve it and review migration",
      );
    return false;
  }
  if (
    status !== 404 ||
    !Array.isArray(result?.errors) ||
    !result.errors.some((error) => [10007, 10222].includes(error.code))
  )
    throw new Error("Cannot verify scheduler deployment; bootstrap refused");
  if (collectionEnabled)
    throw new Error("First deployment must keep collection closed");
  return true;
}

async function main() {
  const config = JSON.parse(
    await readFile(".cloudflare-build/scheduler.json", "utf8"),
  );
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  if (!/^[a-f0-9]{32}$/.test(account ?? "") || !token)
    throw new Error("Deployment credentials are missing");
  if (
    !/^odyssey-landing(?:-staging)?-scheduler$/.test(config.name) ||
    config.account_id !== account
  )
    throw new Error("Unexpected scheduler target");
  // Inspect only this script. Authentication/network failures must not trigger a
  // bootstrap that would disable an already-live recovery scheduler.
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${config.name}/settings`,
    {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15000),
    },
  );
  const result = await response.json().catch(() => null);
  // Wrangler: 10007 means no Worker; 10222 means an existing Worker has no
  // versions. Authentication and legacy-environment failures never bootstrap.
  if (
    !schedulerBootstrapRequired(
      response.status,
      result,
      process.env.WAITLIST_ENABLED === "true",
    )
  ) {
    console.log("Existing scheduler preserved; bootstrap skipped.");
    return;
  }
  const child = spawnSync(
    "pnpm",
    [
      "exec",
      "wrangler",
      "deploy",
      "--config",
      ".cloudflare-build/scheduler-bootstrap.json",
    ],
    { stdio: "inherit" },
  );
  if (child.status !== 0) throw new Error("Scheduler bootstrap failed");
  console.log("Initial recovery coordinator deployed with schedules disabled.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  await main();
