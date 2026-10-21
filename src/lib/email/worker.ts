import { beginMailTransaction } from "./recovery";
import { lockAddress, isSuppressed } from "./locking";
import { reconcileDeliveries } from "./webhook";
import type { Queryable } from "../waitlist/store";
import { daily } from "./lifecycle";
import { seal, unseal } from "./security";
import { renderWaitlistEmail, type EmailKind } from "./templates";
export type MailConfig = {
  origin: string;
  tokenSecret: string;
  apiKey: string;
  from: string;
  contactEmail: string;
  dailyBudget: number;
};
export async function drain(
  db: Queryable,
  config: MailConfig,
  send: typeof fetch = fetch,
  limit = 3,
) {
  await reconcileDeliveries(db);
  let processed = 0;
  for (let i = 0; i < limit; i++) {
    const candidate = await db.query(
      `SELECT o.id,o.signup_id,s.email FROM waitlist_outbox o JOIN waitlist_signups s ON s.id=o.signup_id WHERE o.state='queued' AND o.available_at<=now() AND (o.lease_until IS NULL OR o.lease_until<now()) ORDER BY o.id LIMIT 1`,
    );
    if (!candidate.rows[0]) break;
    const jobId = candidate.rows[0].id;
    // Lock subscription before job throughout the bounded send. Unsubscribe/suppress serializes on this lock.
    await beginMailTransaction(db);
    try {
      await lockAddress(
        db,
        config.tokenSecret,
        String(candidate.rows[0].email),
      );
      const subscriber = (
        await db.query(
          `SELECT * FROM waitlist_signups WHERE id=$1 FOR UPDATE SKIP LOCKED`,
          [candidate.rows[0].signup_id],
        )
      ).rows[0];
      if (!subscriber) {
        await db.query("ROLLBACK");
        break;
      }
      const job = (
        await db.query(
          `SELECT * FROM waitlist_outbox WHERE id=$1 AND state='queued' AND available_at<=now() AND (lease_until IS NULL OR lease_until<now()) FOR UPDATE`,
          [jobId],
        )
      ).rows[0];
      if (!job) {
        await db.query("ROLLBACK");
        continue;
      }
      if (
        job.kind !== "confirmation" ||
        (await isSuppressed(
          db,
          config.tokenSecret,
          String(subscriber.email),
        )) ||
        subscriber.generation !== job.generation ||
        subscriber.state !==
          (job.kind === "confirmation" ? "pending" : "confirmed") ||
        new Date(String(subscriber.expires_at)).getTime() <= Date.now() ||
        (job.kind === "confirmation" &&
          new Date(String(subscriber.confirmation_expires_at)).getTime() <=
            Date.now())
      ) {
        await db.query(
          `UPDATE waitlist_outbox SET state='cancelled' WHERE id=$1`,
          [jobId],
        );
        await db.query("COMMIT");
        continue;
      }
      if (
        Number(job.attempts) >= 5 ||
        (job.first_attempt_at &&
          Date.now() - new Date(String(job.first_attempt_at)).getTime() >=
            23 * 60 * 60 * 1000)
      ) {
        await db.query(
          `UPDATE waitlist_outbox SET state='parked' WHERE id=$1`,
          [jobId],
        );
        await db.query("COMMIT");
        continue;
      }
      if (!(await daily(db, "global-send-budget", config.dailyBudget))) {
        await db.query(
          `UPDATE waitlist_outbox SET available_at=date_trunc('day',now())+interval '1 day' WHERE id=$1`,
          [jobId],
        );
        await db.query("COMMIT");
        break;
      }
      const tokens = unseal<{
        token: string;
        unsubscribeToken: string;
        inviteToken?: string;
      }>(String(job.sealed_tokens), config.tokenSecret);
      const rendered = renderWaitlistEmail(job.kind as EmailKind, {
        ...tokens,
        origin: config.origin,
        contactEmail: config.contactEmail,
        referralCode:
          typeof subscriber.referral_code === "string"
            ? subscriber.referral_code
            : undefined,
      });
      const payload = job.sealed_request
        ? unseal<object>(String(job.sealed_request), config.tokenSecret)
        : {
            from: config.from,
            to: [subscriber.email],
            reply_to: config.contactEmail,
            ...rendered,
            headers: {
              "List-Unsubscribe": `<${config.origin}/api/waitlist/unsubscribe?token=${tokens.unsubscribeToken}>`,
              "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
            },
          };
      // Persist intent BEFORE network. If process dies after acceptance, retry uses the same exact payload and key.
      await db.query(
        `UPDATE waitlist_outbox SET attempts=attempts+1,first_attempt_at=COALESCE(first_attempt_at,now()),lease_until=now()+interval '60 seconds',sealed_request=COALESCE(sealed_request,$2) WHERE id=$1`,
        [jobId, seal(payload, config.tokenSecret)],
      );
      await db.query("COMMIT");
      // Reacquire subscriber then job: revocation between intent and send cancels safely.
      await beginMailTransaction(db);
      await lockAddress(db, config.tokenSecret, String(subscriber.email));
      const current = (
        await db.query(
          `SELECT state FROM waitlist_signups WHERE id=$1 FOR UPDATE`,
          [subscriber.id],
        )
      ).rows[0];
      const active = (
        await db.query(
          `SELECT state FROM waitlist_outbox WHERE id=$1 FOR UPDATE`,
          [jobId],
        )
      ).rows[0];
      if (
        (await isSuppressed(
          db,
          config.tokenSecret,
          String(subscriber.email),
        )) ||
        current?.state !== subscriber.state ||
        active?.state !== "queued"
      ) {
        await db.query(
          `UPDATE waitlist_outbox SET state='cancelled' WHERE id=$1 AND state='queued'`,
          [jobId],
        );
        await db.query("COMMIT");
        continue;
      }
      let providerId: string | undefined;
      let permanent = false;
      try {
        const response = await send("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.apiKey}`,
            "Content-Type": "application/json",
            "Idempotency-Key": `odyssey/${job.semantic_key}`,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(8000),
        });
        if (response.ok) {
          const data = (await response.json()) as { id?: unknown };
          if (typeof data.id === "string") providerId = data.id;
        } else
          permanent =
            response.status >= 400 &&
            response.status < 500 &&
            ![408, 409, 429].includes(response.status);
      } catch {
        /* Ambiguous network failure: persist a bounded retry, never log recipient/token. */
      }
      if (providerId)
        await db.query(
          `UPDATE waitlist_outbox SET state='sent',provider_id=$2,lease_until=NULL WHERE id=$1`,
          [jobId, providerId],
        );
      else
        await db.query(
          `UPDATE waitlist_outbox SET state=$2,lease_until=NULL,available_at=now()+$3::int*interval '1 second' WHERE id=$1`,
          [
            jobId,
            permanent || Number(job.attempts) + 1 >= 5 ? "parked" : "queued",
            Math.min(3600, 60 * 2 ** Number(job.attempts)) +
              Math.floor(Math.random() * 30),
          ],
        );
      await db.query("COMMIT");
      processed++;
    } catch (e) {
      await db.query("ROLLBACK").catch(() => undefined);
      throw e;
    }
  }
  await reconcileDeliveries(db);
  return processed;
}
