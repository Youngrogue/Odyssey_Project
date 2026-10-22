import { lockAddress, isSuppressed } from "./locking";
import {
  charge,
  hash,
  WaitlistRateLimitError,
  type Queryable,
} from "../waitlist/store";
import { digest, seal, token } from "./security";
import { waitlistNotice } from "../waitlist/notice";
import { armMailRecovery, beginMailTransaction } from "./recovery";
export async function daily(db: Queryable, key: string, limit: number) {
  const r = await db.query(
    `INSERT INTO waitlist_daily_counts(key_hash) VALUES($1) ON CONFLICT(key_hash,day) DO UPDATE SET attempts=waitlist_daily_counts.attempts+1 RETURNING attempts`,
    [key],
  );
  return Number(r.rows[0]?.attempts) <= limit;
}
export async function enroll(
  db: Queryable,
  input: {
    email: string;
    secret: string;
    retentionDays: number;
    referralCode?: string;
  },
  cap: string,
): Promise<boolean> {
  await lockAddress(db, input.secret, input.email);
  if (await isSuppressed(db, input.secret, input.email)) return false;
  const confirm = token(),
    unsub = token();
  const r = await db.query(
    `INSERT INTO waitlist_signups(email,notice_version,expires_at,token_hash,token_expires_at,confirmation_hash,confirmation_expires_at,unsubscribe_hash,referral_code,referred_by,suppression_hash)
 VALUES($1,$6,now()+$2::int*interval '1 day',$3,now()+interval '1 day',$4,now()+interval '1 day',$5,$7,$8,$9)
 ON CONFLICT(email) DO UPDATE SET state='pending',generation=waitlist_signups.generation+1,confirmed_at=NULL,collected_at=now(),expires_at=EXCLUDED.expires_at,token_hash=EXCLUDED.token_hash,token_expires_at=EXCLUDED.token_expires_at,confirmation_hash=EXCLUDED.confirmation_hash,confirmation_expires_at=EXCLUDED.confirmation_expires_at,unsubscribe_hash=EXCLUDED.unsubscribe_hash,city=NULL,interests='{}'::text[],notice_version=EXCLUDED.notice_version,invite_token_hash=NULL,suppression_hash=EXCLUDED.suppression_hash
 WHERE waitlist_signups.expires_at<=now() AND waitlist_signups.state IN ('pending','confirmed','expired') RETURNING id,generation`,
    [
      input.email,
      Math.min(
        input.retentionDays,
        Number(process.env.WAITLIST_PENDING_RETENTION_DAYS) || 7,
      ),
      hash(input.secret, "capability", cap),
      digest(input.secret, "confirm", confirm),
      digest(input.secret, "unsubscribe", unsub),
      waitlistNotice.version,
      null,
      null,
      digest(input.secret, "suppression", input.email),
    ],
  );
  return Boolean(
    r.rows[0] &&
      (await queueConfirmation(
        db,
        r.rows[0],
        input.email,
        input.secret,
        confirm,
        unsub,
      )),
  );
}
async function queueConfirmation(
  db: Queryable,
  row: Record<string, unknown>,
  email: string,
  secret: string,
  confirm: string,
  unsub: string,
) {
  if (!(await daily(db, digest(secret, "confirmation-day", email), 3)))
    return false;
  await armMailRecovery(db);
  await db.query(
    `INSERT INTO waitlist_unsubscribe_tokens(token_hash,signup_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
    [digest(secret, "unsubscribe", unsub), row.id],
  );
  await db.query(
    `UPDATE waitlist_outbox SET state='cancelled' WHERE signup_id=$1 AND state='queued'`,
    [row.id],
  );
  await db.query(
    `UPDATE waitlist_signups SET last_confirmation_at=now(),confirmation_hash=$2,confirmation_expires_at=now()+interval '1 day',unsubscribe_hash=$3 WHERE id=$1`,
    [
      row.id,
      digest(secret, "confirm", confirm),
      digest(secret, "unsubscribe", unsub),
    ],
  );
  await db.query(
    `INSERT INTO waitlist_outbox(signup_id,generation,kind,semantic_key,sealed_tokens) VALUES($1,$2,'confirmation',$3,$4) ON CONFLICT(semantic_key) DO NOTHING`,
    [
      row.id,
      row.generation,
      `${row.id}:${row.generation}:confirm:${digest(secret, "confirm", confirm)}`,
      seal({ token: confirm, unsubscribeToken: unsub }, secret),
    ],
  );
  return true;
}
export async function resend(
  db: Queryable,
  input: { email: string; secret: string; ip: string },
) {
  await beginMailTransaction(db);
  try {
    const a = await charge(db, hash(input.secret, "rate-ip", input.ip), 20),
      b = await charge(db, hash(input.secret, "rate-email", input.email), 5);
    if (!a || !b) {
      await db.query("COMMIT");
      throw new WaitlistRateLimitError();
    }
    await lockAddress(db, input.secret, input.email);
    if (await isSuppressed(db, input.secret, input.email)) {
      await db.query("COMMIT");
      return;
    }
    const r = await db.query(
      `SELECT id,generation FROM waitlist_signups WHERE email=$1 AND state='pending' AND expires_at>now() AND (last_confirmation_at IS NULL OR last_confirmation_at<now()-interval '60 seconds') FOR UPDATE`,
      [input.email],
    );
    if (r.rows[0])
      await queueConfirmation(
        db,
        r.rows[0],
        input.email,
        input.secret,
        token(),
        token(),
      );
    await db.query("COMMIT");
  } catch (e) {
    if (!(e instanceof WaitlistRateLimitError)) await db.query("ROLLBACK");
    throw e;
  }
}
export async function act(
  db: Queryable,
  input: {
    token: string;
    secret: string;
    ip: string;
    kind: "confirm" | "unsubscribe";
    retentionDays: number;
  },
) {
  let confirmed = false;
  await beginMailTransaction(db);
  try {
    if (!(await charge(db, hash(input.secret, "rate-action", input.ip), 40))) {
      await db.query("COMMIT");
      throw new WaitlistRateLimitError();
    }
    const lookup =
      input.kind === "confirm"
        ? "SELECT s.* FROM waitlist_signups s WHERE s.confirmation_hash=$1"
        : "SELECT s.* FROM waitlist_signups s JOIN waitlist_unsubscribe_tokens u ON u.signup_id=s.id WHERE u.token_hash=$1";
    const tokenHash = digest(input.secret, input.kind, input.token);
    const candidate = (await db.query(lookup, [tokenHash])).rows[0];
    if (!candidate) {
      await db.query("COMMIT");
      return { confirmed: false };
    }
    await lockAddress(db, input.secret, String(candidate.email));
    const row = (await db.query(`${lookup} FOR UPDATE OF s`, [tokenHash]))
      .rows[0];
    if (row && input.kind === "unsubscribe") {
      await db.query(
        `UPDATE waitlist_signups SET state=CASE WHEN state='suppressed' THEN 'suppressed' ELSE 'unsubscribed' END, token_expires_at=now(),confirmation_expires_at=now() WHERE id=$1`,
        [row.id],
      );
      await db.query(
        `INSERT INTO waitlist_suppressions(email_hash) VALUES($1) ON CONFLICT DO NOTHING`,
        [digest(input.secret, "suppression", String(row.email))],
      );
      await db.query(
        `UPDATE waitlist_outbox SET state='cancelled' WHERE signup_id=$1 AND state='queued'`,
        [row.id],
      );
    } else if (
      row &&
      row.state === "pending" &&
      !(await isSuppressed(db, input.secret, String(row.email))) &&
      new Date(String(row.confirmation_expires_at)).getTime() > Date.now() &&
      new Date(String(row.expires_at)).getTime() > Date.now()
    ) {
      confirmed = true;
      await db.query(
        `UPDATE waitlist_signups SET state='confirmed',confirmed_at=now(),expires_at=now()+$2::int*interval '1 day' WHERE id=$1`,
        [row.id, input.retentionDays],
      );
      await db.query(
        `UPDATE waitlist_outbox SET state='cancelled' WHERE signup_id=$1 AND state='queued'`,
        [row.id],
      );
    }
    await db.query("COMMIT");
    return { confirmed };
  } catch (e) {
    if (!(e instanceof WaitlistRateLimitError)) await db.query("ROLLBACK");
    throw e;
  }
}
export async function purge(db: Queryable, batchSize = 500) {
  if (!Number.isInteger(batchSize) || batchSize < 1 || batchSize > 500)
    throw new Error("Invalid cleanup batch size");
  await beginMailTransaction(db);
  try {
    await db.query(
      `DELETE FROM waitlist_signups WHERE id IN (
        SELECT id FROM waitlist_signups WHERE expires_at<=now()
        ORDER BY expires_at,id LIMIT $1 FOR UPDATE SKIP LOCKED
      )`,
      [batchSize],
    );
    await db.query(
      `DELETE FROM waitlist_rate_limits WHERE (key_hash,bucket_start) IN (
        SELECT key_hash,bucket_start FROM waitlist_rate_limits
        WHERE bucket_start<now()-interval '2 days'
        ORDER BY bucket_start LIMIT $1 FOR UPDATE SKIP LOCKED
      )`,
      [batchSize],
    );
    await db.query(
      `DELETE FROM waitlist_daily_counts WHERE (key_hash,day) IN (
        SELECT key_hash,day FROM waitlist_daily_counts WHERE day<CURRENT_DATE-2
        ORDER BY day LIMIT $1 FOR UPDATE SKIP LOCKED
      )`,
      [batchSize],
    );
    await db.query(
      `DELETE FROM waitlist_outbox WHERE id IN (
        SELECT id FROM waitlist_outbox WHERE state IN ('sent','cancelled') AND created_at<now()-interval '30 days'
        ORDER BY created_at,id LIMIT $1 FOR UPDATE SKIP LOCKED
      )`,
      [batchSize],
    );
    await db.query(
      `DELETE FROM waitlist_provider_events WHERE id IN (
        SELECT id FROM waitlist_provider_events WHERE received_at<now()-interval '30 days'
        ORDER BY received_at,id LIMIT $1 FOR UPDATE SKIP LOCKED
      )`,
      [batchSize],
    );
    const pending = await db.query(`SELECT
      EXISTS(SELECT 1 FROM waitlist_signups WHERE expires_at<=now()) OR
      EXISTS(SELECT 1 FROM waitlist_rate_limits WHERE bucket_start<now()-interval '2 days') OR
      EXISTS(SELECT 1 FROM waitlist_daily_counts WHERE day<CURRENT_DATE-2) OR
      EXISTS(SELECT 1 FROM waitlist_outbox WHERE state IN ('sent','cancelled') AND created_at<now()-interval '30 days') OR
      EXISTS(SELECT 1 FROM waitlist_provider_events WHERE received_at<now()-interval '30 days') AS remaining`);
    await db.query("COMMIT");
    return pending.rows[0]?.remaining === true;
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}
