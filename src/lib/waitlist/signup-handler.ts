import { drain } from "../email/worker";
import { getWaitlistRuntimeConfig } from "./config";
import { connectWaitlist } from "./db";
import { readBoundedJson } from "./http";
import { saveSignup, WaitlistRateLimitError } from "./store";
import {
  getRateLimitClientIp,
  isAllowedOrigin,
  parseSignup,
} from "./validation";

function response(status: number, error?: string): Response {
  return Response.json(error ? { ok: false, error } : { ok: true }, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function signupHandler(
  request: Request,
  schedule: (work: () => Promise<void>) => void,
): Promise<Response> {
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
    const client = await connectWaitlist();
    try {
      await saveSignup(client, {
        email: parsed.email,
        ip: getRateLimitClientIp(request.headers, config.trustedIpHeader),
        secret: config.tokenSecret,
        retentionDays: config.retentionDays,
      });
    } finally {
      await client.release();
    }
    try {
      schedule(async () => {
        try {
          const worker = await connectWaitlist();
          try {
            await drain(worker, config, fetch, 1);
          } finally {
            await worker.release();
          }
        } catch {
          /* Cron recovers committed jobs. */
        }
      });
    } catch {
      /* Scheduling failure does not undo committed intake; cron recovers. */
    }
    return response(200);
  } catch (error) {
    if (error instanceof WaitlistRateLimitError)
      return response(429, "Too many attempts. Try again later");
    return response(503, "Signups are temporarily unavailable");
  }
}
