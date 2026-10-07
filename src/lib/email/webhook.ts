import { lockAddress } from "./locking";
import type { Queryable } from "../waitlist/store";
import { digest } from "./security";
export async function applyEvent(
  db: Queryable,
  id: string,
  event: { type: string; data: { email_id?: string; to?: string[] } },
  secret: string,
) {
  await db.query("BEGIN");
  try {
    const inserted = await db.query(
      `INSERT INTO waitlist_provider_events(id,provider_id,event_type) VALUES($1,$2,$3) ON CONFLICT DO NOTHING RETURNING id`,
      [id, event.data.email_id ?? null, event.type],
    );
    if (!inserted.rows.length) {
      await db.query("COMMIT");
      return;
    }
    if (["email.bounced", "email.complained"].includes(event.type)) {
      const mapped = await db.query(
        `SELECT s.email FROM waitlist_signups s JOIN waitlist_outbox o ON o.signup_id=s.id WHERE o.provider_id=$1`,
        [event.data.email_id ?? ""],
      );
      const emails = new Set([
        ...(event.data.to ?? []),
        ...mapped.rows.map((r) => String(r.email)),
      ]);
      if (!emails.size)
        throw new Error("Unmapped provider event; retry after send commit");
      const normalizedEmails = [
        ...new Set([...emails].map((email) => email.trim().toLowerCase())),
      ].sort();
      for (const email of normalizedEmails)
        await lockAddress(db, secret, email);
      for (const normalized of normalizedEmails) {
        await db.query(
          `INSERT INTO waitlist_suppressions(email_hash) VALUES($1) ON CONFLICT DO NOTHING`,
          [digest(secret, "suppression", normalized)],
        );
        const rows = await db.query(
          `UPDATE waitlist_signups SET state='suppressed',token_expires_at=now(),confirmation_expires_at=now() WHERE email=$1 RETURNING id`,
          [normalized],
        );
        for (const row of rows.rows)
          await db.query(
            `UPDATE waitlist_outbox SET state='cancelled' WHERE signup_id=$1 AND state='queued'`,
            [row.id],
          );
      }
    } else if (event.type === "email.delivered")
      await db.query(
        `UPDATE waitlist_outbox SET delivered_at=now() WHERE provider_id=$1`,
        [event.data.email_id ?? ""],
      );
    await db.query("COMMIT");
  } catch (e) {
    await db.query("ROLLBACK");
    throw e;
  }
}

// Unmatched provider IDs remain metadata-only events for 30 days. They neither
// block acknowledgement nor affect membership; each cron pass reconciles them.
export async function reconcileDeliveries(db: Queryable) {
  await db.query(`UPDATE waitlist_outbox o SET delivered_at=e.delivered_at FROM
 (SELECT provider_id,min(received_at) AS delivered_at FROM waitlist_provider_events WHERE event_type='email.delivered' AND provider_id IS NOT NULL GROUP BY provider_id) e
 WHERE o.provider_id=e.provider_id AND o.delivered_at IS NULL`);
}
