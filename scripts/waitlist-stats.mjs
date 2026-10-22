import { readFile, appendFile } from "node:fs/promises";
import { Client } from "pg";
import { isNeonDatabaseUrl } from "../src/lib/waitlist/database-url.mjs";

const target = process.env.REPORT_TARGET;
if (!["staging", "production"].includes(target) || !isNeonDatabaseUrl(process.env.DATABASE_URL)) {
  console.error("Select staging/production and securely configure its Neon DATABASE_URL.");
  process.exitCode = 1;
} else {
  const db = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 5000 });
  try {
    await db.connect();
    await db.query("BEGIN READ ONLY");
    await db.query("SET LOCAL statement_timeout='10s'");
    const { rows } = await db.query(await readFile(new URL("waitlist-stats.sql", import.meta.url), "utf8"));
    await db.query("COMMIT");
    const row = rows[0];
    // Fixed query returns only timestamps and aggregate numbers, never recipients/tokens.
    const lines = Object.entries(row).map(([key, value]) => `| ${key} | ${value instanceof Date ? value.toISOString() : value} |`);
    const report = `# Odyssey ${target} waitlist\n\n| Metric | Value |\n| --- | --- |\n${lines.join("\n")}\n\nConfirmed members exclude expired, unsubscribed and suppressed records. Today uses Africa/Lagos; last 7 days is a rolling window. Delivery counts are messages, not people. Retention means these are not lifetime totals.\n`;
    console.log(report);
    if (process.env.GITHUB_STEP_SUMMARY) await appendFile(process.env.GITHUB_STEP_SUMMARY, report);
  } catch {
    await db.query("ROLLBACK").catch(() => {});
    console.error("Waitlist report failed; database diagnostics omitted to protect credentials.");
    process.exitCode = 1;
  } finally {
    await db.end().catch(() => {});
  }
}
