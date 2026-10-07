import { readFile, readdir } from "node:fs/promises";
import { Pool } from "pg";

if (!process.env.DATABASE_URL) {
  process.stderr.write("DATABASE_URL is required\n");
  process.exitCode = 1;
} else {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  try {
    if (process.argv.includes("--purge")) {
      await pool.query(
        "DELETE FROM waitlist_signups WHERE expires_at <= now()",
      );
      await pool.query(
        "DELETE FROM waitlist_rate_limits WHERE bucket_start < now() - interval '2 days'",
      );
      process.stdout.write("Expired waitlist data purged.\n");
    } else {
      const directory = new URL("../db/", import.meta.url);
      for (const file of (await readdir(directory))
        .filter((f) => /^\d+.*\.sql$/.test(f))
        .sort()) {
        await pool.query(await readFile(new URL(file, directory), "utf8"));
      }
      process.stdout.write("Waitlist schema ready.\n");
    }
  } catch {
    process.stderr.write("Waitlist database operation failed.\n");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
