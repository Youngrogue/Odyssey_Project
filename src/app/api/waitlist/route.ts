import { after } from "next/server";
import { drain } from "../../../lib/email/worker";
import { getWaitlistRuntimeConfig } from "../../../lib/waitlist/config";
import { waitlistPool } from "../../../lib/waitlist/db";
import { readBoundedJson } from "../../../lib/waitlist/http";
import {
  saveSignup,
  WaitlistRateLimitError,
} from "../../../lib/waitlist/store";
import {
  getRateLimitClientIp,
  isAllowedOrigin,
  parseSignup,
} from "../../../lib/waitlist/validation";

export const runtime = "nodejs";

function response(status: number, error?: string): Response {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request): Promise<Response> {
  const config = getWaitlistRuntimeConfig();
  if (!config) return response(503, "Signups are not open yet");
  if (
    !isAllowedOrigin(
      request.headers.get("origin"),
      request.headers.get("referer"),
      config.origin,
    )
  )
    return response(403, "Request origin is not allowed");

  let parsed: ReturnType<typeof parseSignup>;
  try {
    parsed = parseSignup(await readBoundedJson(request));
  } catch {
    return response(400, "Enter a valid email");
  }
  if (parsed.honeypot) return response(400, "Invalid request");

  try {
    const client = await waitlistPool().connect();
    let token: string;
    try {
      ({ token } = await saveSignup(client, {
        email: parsed.email,
        ip: getRateLimitClientIp(request.headers, config.trustedIpHeader),
        secret: config.tokenSecret,
        retentionDays: config.retentionDays,
      }));
    } finally {
      client.release();
    }
    try {
      after(async () => {
        try {
          const worker = await waitlistPool().connect();
          try {
            await drain(worker, config, fetch, 1);
          } finally {
            worker.release();
          }
        } catch {
          /* Cron recovers committed jobs. */
        }
      });
    } catch {
      /* Scheduling failure does not undo committed intake; cron recovers. */
    }
    const result = response(200);
    result.headers.set(
      "Set-Cookie",
      `odyssey_waitlist_cap=${token}; Max-Age=86400; Path=/api/waitlist/preferences; HttpOnly; SameSite=Strict${config.origin.startsWith("https:") ? "; Secure" : ""}`,
    );
    return result;
  } catch (error) {
    if (error instanceof WaitlistRateLimitError)
      return response(429, "Too many attempts. Try again later");
    return response(503, "Signups are temporarily unavailable");
  }
}
