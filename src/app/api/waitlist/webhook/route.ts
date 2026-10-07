import { boundedText, result } from "../../../../lib/email/handlers";
import { verifyWebhook } from "../../../../lib/email/security";
import { applyEvent } from "../../../../lib/email/webhook";
import { waitlistPool } from "../../../../lib/waitlist/db";
export const runtime = "nodejs";
export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET,
    tokenSecret = process.env.WAITLIST_TOKEN_SECRET;
  if (!secret || !tokenSecret) return result(503);
  let body: string;
  try {
    body = await boundedText(request, 65536);
  } catch {
    return result(400);
  }
  if (!verifyWebhook(body, request.headers, secret)) return result(401);
  try {
    const event = JSON.parse(body);
    if (
      typeof event.type !== "string" ||
      !event.data ||
      (event.data.to !== undefined &&
        (!Array.isArray(event.data.to) ||
          event.data.to.some((v: unknown) => typeof v !== "string")))
    )
      return result(400);
    const db = await waitlistPool().connect();
    try {
      await applyEvent(db, request.headers.get("svix-id")!, event, tokenSecret);
    } finally {
      db.release();
    }
    return result();
  } catch {
    return result(503);
  }
}
