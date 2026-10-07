CREATE TABLE IF NOT EXISTS waitlist_signups (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email text NOT NULL UNIQUE,
  consent_purpose text NOT NULL DEFAULT 'waitlist_intake' CHECK (consent_purpose = 'waitlist_intake'),
  notice_version text NOT NULL,
  collected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  token_hash text NOT NULL UNIQUE,
  token_expires_at timestamptz NOT NULL,
  city text CHECK (city IN ('lagos', 'abuja', 'ibadan', 'port-harcourt', 'elsewhere', 'prefer-not-to-say')),
  interests text[] NOT NULL DEFAULT '{}',
  CONSTRAINT waitlist_email_size CHECK (length(email) BETWEEN 3 AND 254),
  CONSTRAINT waitlist_interests_allowed CHECK (interests <@ ARRAY['food', 'dance', 'games', 'arts', 'movement', 'communities', 'home']::text[])
);

CREATE TABLE IF NOT EXISTS waitlist_rate_limits (
  key_hash text NOT NULL,
  bucket_start timestamptz NOT NULL,
  attempts integer NOT NULL CHECK (attempts > 0),
  PRIMARY KEY (key_hash, bucket_start)
);

CREATE INDEX IF NOT EXISTS waitlist_signups_expiry ON waitlist_signups (expires_at);
CREATE INDEX IF NOT EXISTS waitlist_rate_limits_expiry ON waitlist_rate_limits (bucket_start);
