-- Preserve all issued revocation capabilities until their signup is purged.
CREATE TABLE IF NOT EXISTS waitlist_unsubscribe_tokens (
 token_hash text PRIMARY KEY,
 signup_id bigint NOT NULL REFERENCES waitlist_signups(id) ON DELETE CASCADE
);
INSERT INTO waitlist_unsubscribe_tokens(token_hash,signup_id)
 SELECT unsubscribe_hash,id FROM waitlist_signups WHERE unsubscribe_hash IS NOT NULL
 ON CONFLICT DO NOTHING;
ALTER TABLE waitlist_provider_events ADD COLUMN IF NOT EXISTS provider_id text;
ALTER TABLE waitlist_provider_events ADD COLUMN IF NOT EXISTS event_type text;
CREATE INDEX IF NOT EXISTS waitlist_delivery_events ON waitlist_provider_events(provider_id) WHERE event_type='email.delivered';
