import { getWaitlistRuntimeConfig } from "../../../../lib/waitlist/config";
import { waitlistPool } from "../../../../lib/waitlist/db";
import { readBoundedJson } from "../../../../lib/waitlist/http";
import {
  savePreferences,
  WaitlistRateLimitError,
} from "../../../../lib/waitlist/store";
import {
  getRateLimitClientIp,
  isAllowedOrigin,
  parsePreferences,
} from "../../../../lib/waitlist/validation";

export const runtime = "nodejs";

function response(status: number, error?: string): Response {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: Request): Promise<Response> {
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
  const token = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith("odyssey_waitlist_cap="))
    ?.slice("odyssey_waitlist_cap=".length);
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token))
    return response(403, "Preference access is unavailable");

  let parsed: ReturnType<typeof parsePreferences>;
  try {
    parsed = parsePreferences(await readBoundedJson(request));
  } catch {
    return response(400, "Choose valid preferences");
  }

  try {
    const ip = getRateLimitClientIp(request.headers, config.trustedIpHeader);
    const client = await waitlistPool().connect();
    try {
      await savePreferences(client, {
        token,
        secret: config.tokenSecret,
        ip,
        ...parsed,
      });
    } finally {
      client.release();
    }
    return response(200);
  } catch (error) {
    if (error instanceof WaitlistRateLimitError)
      return response(429, "Too many attempts. Try again later");
    return response(503, "Preferences are temporarily unavailable");
  }
}
