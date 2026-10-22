// Summarises `wrangler tail --format json` captures into per-route CPU figures.
// Prints only fixed route labels, method, status, outcome and timings: never
// query strings, headers, bodies, logs, exceptions or recipient data.
import { appendFile, readFile } from "node:fs/promises";

const routes = new Set([
  "/api/waitlist",
  "/api/waitlist/status",
  "/api/waitlist/confirm",
  "/api/waitlist/unsubscribe",
  "/api/waitlist/resend",
  "/api/waitlist/webhook",
  "/api/waitlist/cron",
  "/api/waitlist/purge",
  "/waitlist/confirm",
  "/waitlist/unsubscribe",
]);

function label(event) {
  if (event?.cron) return `cron ${event.cron}`;
  if (!event?.request?.url) return "other";
  try {
    const path = new URL(event.request.url).pathname;
    const route = routes.has(path) ? path : path.startsWith("/api/") || path.startsWith("/waitlist") ? "other private" : "static asset";
    return `${event.request.method ?? "?"} ${route}`;
  } catch {
    return "other";
  }
}

const rows = [];
for (const file of process.argv.slice(2)) {
  let text = "";
  try {
    text = await readFile(file, "utf8");
  } catch {
    continue;
  }
  // wrangler prints each message as indented JSON closed by a column-zero brace.
  for (const chunk of text.split(/^}$/m)) {
    const start = chunk.indexOf("{");
    if (start < 0) continue;
    let message;
    try {
      message = JSON.parse(`${chunk.slice(start)}}`);
    } catch {
      continue;
    }
    rows.push({
      at: message.eventTimestamp ?? 0,
      script: String(message.scriptName ?? "?").replace(/^odyssey-/, ""),
      version: String(message.scriptVersion?.id ?? "").slice(0, 8),
      route: label(message.event),
      status: message.event?.response?.status ?? "",
      outcome: message.outcome ?? "",
      cpu: typeof message.cpuTime === "number" ? message.cpuTime : null,
      wall: typeof message.wallTime === "number" ? message.wallTime : null,
    });
  }
}
rows.sort((a, b) => a.at - b.at);
const lines = [
  "| Time (UTC) | Script | Version | Route | Status | Outcome | CPU ms | Wall ms |",
  "| --- | --- | --- | --- | --- | --- | --- | --- |",
  ...rows.map(
    (r) =>
      `| ${r.at ? new Date(r.at).toISOString().slice(11, 19) : "?"} | ${r.script} | ${r.version} | ${r.route} | ${r.status} | ${r.outcome} | ${r.cpu ?? "n/a"} | ${r.wall ?? "n/a"} |`,
  ),
];
const groups = new Map();
for (const r of rows)
  if (r.cpu !== null) groups.set(`${r.script} ${r.route}`, [...(groups.get(`${r.script} ${r.route}`) ?? []), r.cpu]);
const summary = [
  "| Script and route | Invocations | Min CPU ms | Max CPU ms |",
  "| --- | --- | --- | --- |",
  ...[...groups].map(([key, cpu]) => `| ${key} | ${cpu.length} | ${Math.min(...cpu)} | ${Math.max(...cpu)} |`),
];
const report = `## Worker CPU by route\n\n${rows.length} traced invocations.\n\n${summary.join("\n")}\n\n${lines.join("\n")}\n`;
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report);
