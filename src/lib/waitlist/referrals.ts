import { beginMailTransaction } from "../email/recovery";
import { digest } from "../email/security";
import { charge, hash, WaitlistRateLimitError, type Queryable } from "./store";

export const INVITE_COOKIE = "odyssey_invite_access";
export const validInviteToken = (value: unknown): value is string =>
  typeof value === "string" && /^[A-Za-z0-9_-]{43}$/.test(value);

export function inviteCookie(token: string, origin: string) {
  return `${INVITE_COOKIE}=${token}; Max-Age=86400; Path=/waitlist/invite; HttpOnly; SameSite=Strict${origin.startsWith("https:") ? "; Secure" : ""}`;
}

export type InviteProgress = {
  referralCode: string;
  qualifiedReferrals: number;
  founderRecognition: boolean;
};

// Authorization is always a private capability, never a public referral code.
// Query returns only the owner's public code and an aggregate; no invitee records.
export async function getInviteProgress(
  db: Queryable,
  input: { token: string; secret: string; ip: string },
): Promise<InviteProgress | null> {
  if (!validInviteToken(input.token)) return null;
  await beginMailTransaction(db);
  try {
    if (
      !(await charge(db, hash(input.secret, "rate-invite-read", input.ip), 60))
    ) {
      await db.query("COMMIT");
      throw new WaitlistRateLimitError();
    }
    const result = await db.query(
      `SELECT owner.referral_code, owner.founder_recognized_at IS NOT NULL AS founder_recognition,
       (SELECT count(*)::int FROM waitlist_signups invited
        WHERE invited.referred_by=owner.id AND invited.state='confirmed'
        AND invited.expires_at>now() AND invited.id<>owner.id
        AND NOT EXISTS (SELECT 1 FROM waitlist_suppressions x WHERE x.email_hash=invited.suppression_hash)) AS qualified
       FROM waitlist_signups owner
       WHERE owner.invite_token_hash=$1 AND owner.state='confirmed' AND owner.expires_at>now()
       AND owner.referral_code IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM waitlist_suppressions x WHERE x.email_hash=owner.suppression_hash)`,
      [digest(input.secret, "invite-dashboard", input.token)],
    );
    await db.query("COMMIT");
    const row = result.rows[0];
    return row
      ? {
          referralCode: String(row.referral_code),
          qualifiedReferrals: Number(row.qualified),
          founderRecognition: row.founder_recognition === true,
        }
      : null;
  } catch (error) {
    if (!(error instanceof WaitlistRateLimitError)) await db.query("ROLLBACK");
    throw error;
  }
}

export const inviteShareUrl = (origin: string, referralCode: string) =>
  `${origin}/?ref=${encodeURIComponent(referralCode)}#waitlist`;
