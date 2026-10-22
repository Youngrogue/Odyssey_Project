-- Read-only aggregate snapshot. Use the production branch for real members.
-- Retention deletes old records: these are retained/current counts, not lifetime analytics.
WITH eligible AS (
  SELECT s.* FROM waitlist_signups s
  WHERE expires_at > now()
    AND NOT EXISTS (SELECT 1 FROM waitlist_suppressions x WHERE x.email_hash=s.suppression_hash)
), members AS (
  SELECT
    count(*) FILTER (WHERE state='confirmed') AS confirmed_members,
    count(*) FILTER (WHERE state='pending') AS pending_confirmations,
    count(*) FILTER (WHERE state='confirmed' AND confirmed_at >=
      (date_trunc('day', now() AT TIME ZONE 'Africa/Lagos') AT TIME ZONE 'Africa/Lagos')) AS active_members_confirmed_today,
    count(*) FILTER (WHERE state='confirmed' AND confirmed_at >= now()-interval '7 days') AS active_members_confirmed_last_7_days
  FROM eligible
), delivery AS (
  SELECT
    count(*) FILTER (WHERE o.state='queued') AS queued_emails,
    count(*) FILTER (WHERE o.state='parked') AS emails_needing_attention,
    count(*) FILTER (WHERE o.state='sent') AS provider_accepted_emails_retained,
    count(*) FILTER (WHERE o.delivered_at IS NOT NULL) AS delivered_emails_retained
  FROM waitlist_outbox o WHERE o.kind IN ('confirmation','welcome')
)
SELECT now() AS snapshot_at,
  (SELECT count(*) FROM waitlist_signups) AS retained_subscriber_records,
  members.*, delivery.* FROM members CROSS JOIN delivery;
