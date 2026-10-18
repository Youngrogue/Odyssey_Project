import { getCloudflareContext } from "@opennextjs/cloudflare";
import {
  recoveryStub,
  type RecoveryNamespace,
} from "../../../cloudflare/mail-recovery";
import type { Queryable } from "../waitlist/store";

function namespace(): RecoveryNamespace | null {
  let env: { MAIL_RECOVERY?: RecoveryNamespace };
  try {
    env = getCloudflareContext().env as { MAIL_RECOVERY?: RecoveryNamespace };
  } catch {
    // Local Next and PostgreSQL tests do not have a Cloudflare coordinator.
    return null;
  }
  if (!env.MAIL_RECOVERY) throw new Error("Mail recovery unavailable");
  return env.MAIL_RECOVERY;
}

export function hasMailRecovery() {
  try {
    namespace();
    return true;
  } catch {
    return false;
  }
}

async function setRecoveryTimeouts(db: Queryable) {
  // Bound lock waits and abandoned transactions on this request's connection.
  await db.query("SET LOCAL statement_timeout = '10s'");
  await db.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");
  await db.query("SET LOCAL transaction_timeout = '20s'");
}

export async function beginMailTransaction(db: Queryable) {
  await db.query("BEGIN");
  try {
    // Bound rate/address locks too, before a producer has reached arming.
    await setRecoveryTimeouts(db);
  } catch (error) {
    await db.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}

export async function armMailRecovery(db: Queryable) {
  await setRecoveryTimeouts(db);
  // The two-int key space is separate from the address locks' bigint keys.
  // Held until COMMIT: an empty-outbox projection must wait for this producer.
  await db.query("SELECT pg_advisory_xact_lock_shared(1329879379, 1)");
  const binding = namespace();
  if (!binding) return;
  const result = await recoveryStub(binding).fetch(
    new Request("https://mail-recovery.internal/arm", {
      method: "POST",
      signal: AbortSignal.timeout(3000),
    }),
  );
  if (!result.ok) throw new Error("Mail recovery unavailable");
}

export async function nextMailRecovery(
  db: Queryable,
  dailyBudget: number,
): Promise<number | null> {
  if (!Number.isInteger(dailyBudget) || dailyBudget < 1)
    throw new Error("Invalid mail budget");
  await beginMailTransaction(db);
  try {
    await db.query("SELECT pg_advisory_xact_lock(1329879379, 1)");
    // Keep this exclusive section read-only. Subscriber/outbox row locks here
    // would invert the producers' lock order and could deadlock.
    const result = await db.query(
      `WITH pending AS (
      SELECT min(GREATEST(available_at, COALESCE(lease_until,available_at))) AS due_at
      FROM waitlist_outbox WHERE state='queued'
    ) SELECT CASE WHEN EXISTS (
      SELECT 1 FROM waitlist_provider_events e
      JOIN waitlist_outbox o ON o.provider_id=e.provider_id
      WHERE e.event_type='email.delivered' AND o.delivered_at IS NULL
    ) THEN 0 WHEN pending.due_at IS NULL THEN NULL
      ELSE ceil(extract(epoch FROM GREATEST(pending.due_at, CASE WHEN EXISTS (
        SELECT 1 FROM waitlist_daily_counts
        WHERE key_hash='global-send-budget' AND day=CURRENT_DATE AND attempts >= $1
      ) THEN date_trunc('day',now())+interval '1 day' ELSE pending.due_at END))*1000)
    END AS due_at FROM pending`,
      [dailyBudget],
    );
    const raw = result.rows[0]?.due_at;
    const dueAt = raw === null ? null : Number(raw);
    if (dueAt !== null && (!Number.isSafeInteger(dueAt) || dueAt < 0))
      throw new Error("Invalid mail recovery schedule");
    await db.query("COMMIT");
    return dueAt;
  } catch (error) {
    await db.query("ROLLBACK").catch(() => undefined);
    throw error;
  }
}
