ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS state text NOT NULL DEFAULT 'pending' CHECK (state IN ('pending','confirmed','unsubscribed','suppressed','expired'));
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS confirmed_at timestamptz;
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS generation integer NOT NULL DEFAULT 1;
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS confirmation_hash text;
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS confirmation_expires_at timestamptz;
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS unsubscribe_hash text;
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS last_confirmation_at timestamptz;
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_confirmation_hash ON waitlist_signups(confirmation_hash);
CREATE UNIQUE INDEX IF NOT EXISTS waitlist_unsubscribe_hash ON waitlist_signups(unsubscribe_hash);
CREATE TABLE IF NOT EXISTS waitlist_outbox (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 signup_id bigint NOT NULL REFERENCES waitlist_signups(id) ON DELETE CASCADE,
 generation integer NOT NULL, kind text NOT NULL CHECK(kind IN ('confirmation','welcome')),
 semantic_key text NOT NULL UNIQUE, sealed_tokens text NOT NULL, sealed_request text,
 state text NOT NULL DEFAULT 'queued' CHECK(state IN ('queued','sent','cancelled','parked')),
 attempts integer NOT NULL DEFAULT 0, available_at timestamptz NOT NULL DEFAULT now(),
 first_attempt_at timestamptz, lease_until timestamptz, provider_id text UNIQUE,
 created_at timestamptz NOT NULL DEFAULT now(), delivered_at timestamptz
);
CREATE INDEX IF NOT EXISTS waitlist_outbox_due ON waitlist_outbox(state,available_at);
CREATE TABLE IF NOT EXISTS waitlist_daily_counts(key_hash text NOT NULL, day date NOT NULL DEFAULT CURRENT_DATE, attempts integer NOT NULL DEFAULT 1, PRIMARY KEY(key_hash,day));
CREATE TABLE IF NOT EXISTS waitlist_provider_events(id text PRIMARY KEY, received_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE IF NOT EXISTS waitlist_suppressions(email_hash text PRIMARY KEY, created_at timestamptz NOT NULL DEFAULT now());
