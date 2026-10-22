import { beginMailTransaction } from "../email/recovery";
import { enroll } from "../email/lifecycle";
import { createHmac, randomBytes } from "node:crypto";
import type { CityId, InterestId } from "./validation";

type QueryResult = { rows: Record<string, unknown>[] };
export type Queryable = {
  query(sql: string, params?: unknown[]): Promise<QueryResult>;
};

export class WaitlistRateLimitError extends Error {
  readonly kind = "rate_limited";
  constructor() {
    super("Too many attempts");
  }
}

export function hash(secret: string, purpose: string, value: string): string {
  return createHmac("sha256", secret)
    .update(purpose)
    .update("\0")
    .update(value)
    .digest("hex");
}

export async function charge(
  db: Queryable,
  key: string,
  limit: number,
): Promise<boolean> {
  const result = await db.query(
    `INSERT INTO waitlist_rate_limits (key_hash, bucket_start, attempts)
     VALUES ($1, date_trunc('hour', now()), 1)
     ON CONFLICT (key_hash, bucket_start) DO UPDATE SET attempts = waitlist_rate_limits.attempts + 1
     RETURNING attempts`,
    [key],
  );
  return Number(result.rows[0]?.attempts) <= limit;
}

export async function saveSignup(
  db: Queryable,
  input: {
    email: string;
    ip: string;
    secret: string;
    retentionDays: number;
    referralCode?: string;
  },
): Promise<{ token: string; queued: boolean }> {
  const token = randomBytes(32).toString("base64url");
  await beginMailTransaction(db);
  try {
    const ipKey = hash(input.secret, "rate-ip", input.ip);
    const emailKey = hash(input.secret, "rate-email", input.email);
    // Always charge both buckets, including duplicates, before checking either result.
    const ipAllowed = await charge(db, ipKey, 20);
    const emailAllowed = await charge(db, emailKey, 5);
    if (!ipAllowed || !emailAllowed) {
      await db.query("COMMIT");
      throw new WaitlistRateLimitError();
    }
    const queued = await enroll(db, input, token);
    await db.query("COMMIT");
    return { token, queued };
  } catch (error) {
    if (!(error instanceof WaitlistRateLimitError))
      await db.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

export async function savePreferences(
  db: Queryable,
  input: {
    token: string;
    secret: string;
    ip: string;
    city: CityId;
    interests: InterestId[];
  },
): Promise<void> {
  await beginMailTransaction(db);
  try {
    const allowed = await charge(
      db,
      hash(input.secret, "rate-preferences-ip", input.ip),
      20,
    );
    if (!allowed) {
      await db.query("COMMIT");
      throw new WaitlistRateLimitError();
    }
    await db.query(
      `UPDATE waitlist_signups SET city = $2, interests = $3::text[]
       WHERE token_hash = $1 AND token_expires_at > now() AND expires_at > now() AND state IN ('pending','confirmed')`,
      [
        hash(input.secret, "capability", input.token),
        input.city,
        input.interests,
      ],
    );
    await db.query("COMMIT");
  } catch (error) {
    if (!(error instanceof WaitlistRateLimitError))
      await db.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}
