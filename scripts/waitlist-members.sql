-- Read-only list of active waitlist members for the operator. Run only in the
-- Neon production SQL editor; it returns email addresses, so never paste its
-- output into chat, Git, issues or public logs.
SELECT s.email,
  s.confirmed_at AT TIME ZONE 'Africa/Lagos' AS joined_lagos_time
FROM waitlist_signups s
WHERE s.state = 'confirmed'
  AND s.expires_at > now()
  AND NOT EXISTS (
    SELECT 1 FROM waitlist_suppressions x WHERE x.email_hash = s.suppression_hash
  )
ORDER BY s.confirmed_at DESC;
