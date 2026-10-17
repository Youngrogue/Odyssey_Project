import { boundedText } from "../email/handlers";
import { getWaitlistActionConfig } from "./config";
import { connectWaitlist } from "./db";
import { getInviteProgress, inviteCookie, validInviteToken } from "./referrals";
import { getRateLimitClientIp, isAllowedOrigin } from "./validation";

export async function inviteAccessHandler(request: Request) {
  const respond = (error?: string, cookie?: string) =>
    new Response(null, {
      status: 303,
      headers: {
        Location: `/waitlist/invite${error ? `?error=${error}` : ""}`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
        "X-Robots-Tag": "noindex, nofollow",
        ...(cookie ? { "Set-Cookie": cookie } : {}),
      },
    });
  const config = getWaitlistActionConfig();
  if (!config) return respond("unavailable");
  if (
    !isAllowedOrigin(
      request.headers.get("origin"),
      request.headers.get("referer"),
      config.origin,
    )
  )
    return respond("invalid");
  let token: string | null;
  try {
    if (
      !request.headers
        .get("content-type")
        ?.startsWith("application/x-www-form-urlencoded")
    )
      return respond("invalid");
    token = new URLSearchParams(await boundedText(request, 2048)).get("token");
    if (!validInviteToken(token)) return respond("invalid");
  } catch {
    return respond("invalid");
  }
  try {
    const db = await connectWaitlist();
    try {
      const progress = await getInviteProgress(db, {
        token,
        secret: config.tokenSecret,
        ip: getRateLimitClientIp(request.headers, config.trustedIpHeader),
      });
      return progress
        ? respond(undefined, inviteCookie(token, config.origin))
        : respond("invalid");
    } finally {
      await db.release();
    }
  } catch (error) {
    return respond(
      error instanceof Error && "kind" in error ? "limited" : "unavailable",
    );
  }
}
