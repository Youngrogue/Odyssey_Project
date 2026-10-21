import { hasDatabaseConnection } from "../waitlist/connection";
import { timingSafeEqual } from "node:crypto";
import {
  getWaitlistRuntimeConfig,
  getWaitlistActionConfig,
} from "../waitlist/config";
import { connectWaitlist } from "../waitlist/db";
import { readBoundedJson } from "../waitlist/http";
import {
  getRateLimitClientIp,
  isAllowedOrigin,
  parseSignup,
} from "../waitlist/validation";
import { act, resend, purge } from "./lifecycle";
import { drain } from "./worker";
import { nextMailRecovery } from "./recovery";
export const result = (status = 200) =>
  Response.json(
    { ok: status === 200 },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    },
  );
export async function actionHandler(
  request: Request,
  kind: "confirm" | "unsubscribe" | "resend",
) {
  const oneClick =
    kind === "unsubscribe" && new URL(request.url).searchParams.has("token");
  const nativeForm =
    request.headers
      .get("content-type")
      ?.startsWith("application/x-www-form-urlencoded") && !oneClick;
  const respond = (status = 200) => {
    if (!nativeForm) {
      const response = result(status);
      return response;
    }
    const code =
      status === 200
        ? kind === "resend"
          ? "resent=1"
          : "done=1"
        : `error=${status === 429 ? "limited" : status === 503 ? "unavailable" : status === 410 ? "expired" : "invalid"}`;
    return new Response(null, {
      status: 303,
      headers: {
        Location: `/waitlist/${kind === "resend" ? "confirm" : kind}?${code}`,
        "Cache-Control": "no-store",
        "Referrer-Policy": "no-referrer",
      },
    });
  };
  const config =
    kind === "unsubscribe"
      ? getWaitlistActionConfig()
      : getWaitlistRuntimeConfig();
  if (!config) return respond(503);
  if (
    !oneClick &&
    !isAllowedOrigin(
      request.headers.get("origin"),
      request.headers.get("referer"),
      config.origin,
    )
  )
    return respond(403);
  let data: Record<string, unknown>;
  try {
    if (oneClick) {
      data = { token: new URL(request.url).searchParams.get("token") };
    } else if (
      request.headers
        .get("content-type")
        ?.startsWith("application/x-www-form-urlencoded")
    ) {
      const raw = await boundedText(request, 2048);
      data = Object.fromEntries(new URLSearchParams(raw));
    } else data = (await readBoundedJson(request)) as Record<string, unknown>;
  } catch {
    return respond(400);
  }
  const ip = getRateLimitClientIp(request.headers, config.trustedIpHeader);
  try {
    if (kind === "resend") {
      const parsed = parseSignup(data);
      if (parsed.honeypot) return respond(400);
      data = parsed;
    } else if (
      typeof data.token !== "string" ||
      !/^[A-Za-z0-9_-]{43}$/.test(data.token)
    )
      return respond(400);
  } catch {
    return respond(400);
  }
  try {
    const db = await connectWaitlist();
    try {
      if (kind === "resend")
        await resend(db, {
          email: String(data.email),
          secret: config.tokenSecret,
          ip,
        });
      else {
        const outcome = await act(db, {
          token: String(data.token),
          secret: config.tokenSecret,
          ip,
          kind,
          retentionDays: config.retentionDays,
        });
        if (kind === "confirm" && !outcome?.confirmed) return respond(410);
      }
    } finally {
      await db.release();
    }
    return respond();
  } catch (e) {
    return respond(e instanceof Error && "kind" in e ? 429 : 503);
  }
}
export async function boundedText(request: Request, max: number) {
  const reader = request.body?.getReader();
  if (!reader) throw Error("body");
  let length = 0;
  const chunks: Uint8Array[] = [];
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.length;
      if (length > max) throw Error("size");
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks).toString("utf8");
}
export async function operatorHandler(
  request: Request,
  kind: "drain" | "purge",
) {
  const config = getWaitlistRuntimeConfig();
  if (
    (!config && kind === "drain") ||
    !hasDatabaseConnection() ||
    (process.env.CRON_SECRET?.length ?? 0) < 32
  )
    return result(503);
  const expected = Buffer.from(`Bearer ${process.env.CRON_SECRET}`),
    got = Buffer.from(request.headers.get("authorization") ?? "");
  if (got.length !== expected.length || !timingSafeEqual(got, expected))
    return result(401);
  try {
    const db = await connectWaitlist();
    try {
      if (kind === "purge") {
        const remaining = await purge(db);
        return Response.json(
          { ok: true, remaining },
          {
            headers: {
              "Cache-Control": "no-store",
              "Referrer-Policy": "no-referrer",
            },
          },
        );
      } else {
        await drain(db, config!);
        const dueAt = await nextMailRecovery(db, config!.dailyBudget);
        return Response.json(
          { ok: true, dueAt },
          {
            headers: {
              "Cache-Control": "no-store",
              "Referrer-Policy": "no-referrer",
            },
          },
        );
      }
    } finally {
      await db.release();
    }
  } catch {
    return result(503);
  }
}
