-- Public invitation codes are not authentication. Private dashboard capabilities
-- are purpose-separated hashes; raw capabilities only live in encrypted mail jobs.
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS referral_code text UNIQUE
  CHECK (referral_code IS NULL OR referral_code ~ '^[A-Za-z0-9_-]{16}$');
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS referred_by bigint
  REFERENCES waitlist_signups(id) ON DELETE SET NULL
  CHECK (referred_by IS NULL OR referred_by <> id);
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS invite_token_hash text UNIQUE;
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS suppression_hash text;
-- Recognition is granted by an explicit confirmation, not the migration.
ALTER TABLE waitlist_signups ADD COLUMN IF NOT EXISTS founder_recognized_at timestamptz;
CREATE INDEX IF NOT EXISTS waitlist_referral_qualification
  ON waitlist_signups(referred_by, state, expires_at) WHERE referred_by IS NOT NULL;
