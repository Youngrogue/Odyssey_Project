import { Pool } from "pg";

let pool: Pool | undefined;

export function waitlistPool(): Pool {
  if (!pool)
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 4,
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    });
  return pool;
}
