import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Client } from "pg";

if (!process.env.DATABASE_URL) {
  process.stderr.write("DATABASE_URL is required\n");
  process.exitCode = 1;
} else {
  const db = new Client({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 5000,
  });
  try {
    await db.connect();
    if (process.argv.includes("--purge")) {
      await db.query("DELETE FROM waitlist_signups WHERE expires_at <= now()");
      await db.query(
        "DELETE FROM waitlist_rate_limits WHERE bucket_start < now() - interval '2 days'",
      );
      process.stdout.write("Expired waitlist data purged.\n");
    } else {
      await db.query("BEGIN");
      await db.query("SELECT pg_advisory_xact_lock(67021941)");
      await db.query(`CREATE TABLE IF NOT EXISTS odyssey_schema_migrations (
        name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now()
      )`);
      const directory = new URL("../db/", import.meta.url);
      for (const file of (await readdir(directory))
        .filter((f) => /^\d+.*\.sql$/.test(f))
        .sort()) {
        const sql = await readFile(new URL(file, directory), "utf8");
        const checksum = createHash("sha256").update(sql).digest("hex");
        const previous = await db.query(
          "SELECT checksum FROM odyssey_schema_migrations WHERE name=$1",
          [file],
        );
        if (previous.rows[0]) {
          if (previous.rows[0].checksum !== checksum)
            throw new Error("Applied migration changed");
          continue;
        }
        await db.query(sql);
        await db.query(
          "INSERT INTO odyssey_schema_migrations(name,checksum) VALUES($1,$2)",
          [file, checksum],
        );
      }
      await db.query("COMMIT");
      process.stdout.write("Waitlist schema ready.\n");
    }
  } catch {
    await db.query("ROLLBACK").catch(() => {});
    process.stderr.write("Waitlist database operation failed.\n");
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}
