import { it, expect } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";

it("counts active unique members separately from pending and message deliveries", async () => {
  const db = new PGlite();
  try {
    for (const file of ["001_waitlist.sql", "002_waitlist_email.sql", "003_waitlist_review_fixes.sql", "004_waitlist_referrals.sql"])
      await db.exec(readFileSync(`db/${file}`, "utf8"));
    await db.exec(`INSERT INTO waitlist_signups(email,notice_version,expires_at,token_hash,token_expires_at,state,confirmed_at,suppression_hash)
      SELECT n||'@example.com','test',now()+CASE WHEN n=3 THEN interval '-1 day' ELSE interval '1 day' END,n::text,now()+interval '1 day',
      CASE WHEN n=2 THEN 'pending' WHEN n=4 THEN 'unsubscribed' WHEN n=5 THEN 'suppressed' ELSE 'confirmed' END,
      now(),n::text FROM generate_series(1,6) n;
      INSERT INTO waitlist_suppressions(email_hash) VALUES ('6');
      INSERT INTO waitlist_outbox(signup_id,generation,kind,semantic_key,sealed_tokens,state,delivered_at)
      SELECT 2,1,'confirmation',n::text,'fixture','sent',now() FROM generate_series(1,2) n;
      INSERT INTO waitlist_outbox(signup_id,generation,kind,semantic_key,sealed_tokens,state)
      VALUES (2,1,'confirmation','queued','fixture','queued'),(2,1,'confirmation','parked','fixture','parked');
      -- An older active member counts in total membership but not the recent windows.
      INSERT INTO waitlist_signups(email,notice_version,expires_at,token_hash,token_expires_at,state,confirmed_at,suppression_hash)
      VALUES ('7@example.com','test',now()+interval '170 days','7',now(),'confirmed',now()-interval '8 days','7');`);
    // Same email cannot inflate membership.
    await db.exec(`INSERT INTO waitlist_signups(email,notice_version,expires_at,token_hash,token_expires_at)
      VALUES ('1@example.com','test',now()+interval '1 day','duplicate',now()) ON CONFLICT(email) DO NOTHING;`);
    const { rows } = await db.query(readFileSync("scripts/waitlist-stats.sql", "utf8"));
    expect(rows[0]).toMatchObject({
      retained_subscriber_records: 7,
      confirmed_members: 2,
      pending_confirmations: 1,
      active_members_confirmed_today: 1,
      active_members_confirmed_last_7_days: 1,
      delivered_emails_retained: 2,
      provider_accepted_emails_retained: 2,
      queued_confirmation_emails: 1,
      emails_needing_attention: 1,
    });
    expect(JSON.stringify(rows)).not.toContain("example.com");
  } finally { await db.close(); }
});
