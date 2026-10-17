import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { getWaitlistActionConfig } from "../../../lib/waitlist/config";
import { connectWaitlist } from "../../../lib/waitlist/db";
import { getRateLimitClientIp } from "../../../lib/waitlist/validation";
import {
  getInviteProgress,
  INVITE_COOKIE,
  inviteShareUrl,
  validInviteToken,
  type InviteProgress,
} from "../../../lib/waitlist/referrals";
import ShareLink from "./share-link";
import { FoundingExplorerBadge } from "../../../components/founding-explorer-badge";
import "./invite.css";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Bring your people · Odyssey",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};
export default async function Invite({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  // Email scanners may open this URL. No data or cookie is exposed until the
  // person explicitly opens their private page with the bearer capability.
  if (validInviteToken(params.token))
    return (
      <main className="privacy-page invite-page">
        <a href="/">Odyssey</a>
        <h1>Your next adventure has company.</h1>
        <p>
          Open your private invitation page to get your public invite link and
          check your progress.
        </p>
        <form action="/waitlist/invite/access" method="post">
          <input type="hidden" name="token" value={params.token} />
          <button className="button button-primary" type="submit">
            Open my invitation page
          </button>
        </form>
        <p>
          Keep this email link private. You'll find a separate link to share
          inside.
        </p>
      </main>
    );
  const config = getWaitlistActionConfig();
  let progress: InviteProgress | null = null;
  let unavailable = false;
  const token = (await cookies()).get(INVITE_COOKIE)?.value;
  if (config && validInviteToken(token)) {
    try {
      const db = await connectWaitlist();
      try {
        progress = await getInviteProgress(db, {
          token,
          secret: config.tokenSecret,
          ip: getRateLimitClientIp(await headers(), config.trustedIpHeader),
        });
      } finally {
        await db.release();
      }
    } catch {
      unavailable = true;
    }
  }
  return (
    <main className="privacy-page invite-page">
      <a href="/">Odyssey</a>
      {progress && config ? (
        <>
          <p className="invite-eyebrow">You're on the list</p>
          <h1>Good things are better with your people.</h1>
          <p>
            Share your link with a friend who'd love a new cuisine, a games
            night, a dance floor or a little adventure.
          </p>
          {progress.founderRecognition && <FoundingExplorerBadge />}
          <div className="invite-count">
            <strong>{progress.qualifiedReferrals}</strong>
            <span>
              {progress.qualifiedReferrals === 1
                ? "confirmed friend"
                : "confirmed friends"}
            </span>
          </div>
          <ShareLink
            url={inviteShareUrl(config.origin, progress.referralCode)}
            code={progress.referralCode}
          />
          <h2>How your invitations count</h2>
          <p>
            A friend joins through your link or enters your code, then confirms
            a new email address. Each address counts once. Existing signups,
            your own address and unconfirmed entries don't count. Your total
            updates if someone unsubscribes or their entry expires.
          </p>
          <p>
            Only you can see this total. Your friends' email addresses and
            activity stay private. Invitations don't award app XP or change
            activity standings.
          </p>
          <p>
            We send no invitations for you. Copy your link or open your own
            email app when you're ready.
          </p>
        </>
      ) : (
        <>
          <h1>Your invitation page</h1>
          <p role={params.error || unavailable ? "alert" : undefined}>
            {unavailable || params.error === "unavailable"
              ? "We couldn't load your page just now. Please try again later."
              : params.error === "limited"
                ? "You've opened this page a few times. Please try again later."
                : "Use the private link in your welcome email to open this page. A public invite code cannot open anyone's private page."}
          </p>
          <a className="button button-primary" href="/#waitlist">
            Back to Odyssey
          </a>
        </>
      )}
      <p>
        <a href="/privacy">Privacy notice</a>
      </p>
    </main>
  );
}
