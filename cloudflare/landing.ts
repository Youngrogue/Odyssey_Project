import { withRequestContext, type WaitlistBindings } from "./request-context";
import { signupHandler } from "../src/lib/waitlist/signup-handler";
import { actionHandler, operatorHandler } from "../src/lib/email/handlers";
import { isWaitlistEnabled } from "../src/lib/waitlist/config";
import { POST as webhook } from "../src/app/api/waitlist/webhook/route";
import { PATCH as preferences } from "../src/app/api/waitlist/preferences/route";
import { inviteAccessHandler } from "../src/lib/waitlist/invite-handler";
import { renderWaitlistPage } from "./waitlist-pages";
interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
}
const privatePages = new Set([
  "/waitlist/confirm",
  "/waitlist/unsubscribe",
  "/waitlist/invite",
]);
function secured(response: Response, privateResponse: boolean) {
  const result = new Response(response.body, response);
  result.headers.set("X-Content-Type-Options", "nosniff");
  result.headers.set("X-Frame-Options", "DENY");
  result.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
  result.headers.set(
    "Referrer-Policy",
    privateResponse ? "no-referrer" : "strict-origin-when-cross-origin",
  );
  if (privateResponse) {
    result.headers.set("Cache-Control", "no-store");
    result.headers.set("X-Robots-Tag", "noindex, nofollow");
    result.headers.set(
      "Content-Security-Policy",
      "default-src 'none'; style-src 'self'; img-src 'self'; form-action 'self'; base-uri 'none'; frame-ancestors 'none'",
    );
  }
  return result;
}
async function route(
  request: Request,
  env: WaitlistBindings,
  ctx: ExecutionContext,
): Promise<Response> {
  const url = new URL(request.url),
    path = url.pathname;
  const privateResponse =
    path === "/waitlist" ||
    path.startsWith("/waitlist/") ||
    path === "/api" ||
    path.startsWith("/api/");
  const handlers: Record<
    string,
    { method: string; run: () => Promise<Response> | Response }
  > = {
    "/api/waitlist": {
      method: "POST",
      run: () => signupHandler(request, (work) => ctx.waitUntil(work())),
    },
    "/api/waitlist/status": {
      method: "GET",
      run: () => Response.json({ enabled: isWaitlistEnabled() }),
    },
    "/api/waitlist/confirm": {
      method: "POST",
      run: () => actionHandler(request, "confirm"),
    },
    "/api/waitlist/unsubscribe": {
      method: "POST",
      run: () => actionHandler(request, "unsubscribe"),
    },
    "/api/waitlist/resend": {
      method: "POST",
      run: () => actionHandler(request, "resend"),
    },
    "/api/waitlist/webhook": { method: "POST", run: () => webhook(request) },
    "/api/waitlist/cron": {
      method: "GET",
      run: () => operatorHandler(request, "drain"),
    },
    "/api/waitlist/purge": {
      method: "GET",
      run: () => operatorHandler(request, "purge"),
    },
    "/api/waitlist/preferences": {
      method: "PATCH",
      run: () => preferences(request),
    },
    "/waitlist/invite/access": {
      method: "POST",
      run: () => inviteAccessHandler(request),
    },
  };
  const handler = handlers[path];
  let response: Response;
  if (handler || privatePages.has(path)) {
    const method = handler?.method ?? "GET";
    const allow =
      method === "GET" ? "GET, HEAD, OPTIONS" : `${method}, OPTIONS`;
    if (request.method === "OPTIONS")
      response = new Response(null, { status: 204, headers: { Allow: allow } });
    else if (
      request.method !== method &&
      !(method === "GET" && request.method === "HEAD")
    )
      response = new Response(null, { status: 405, headers: { Allow: allow } });
    else
      response = handler
        ? await handler.run()
        : new Response(renderWaitlistPage(url), {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          });
  } else if (privateResponse)
    response = new Response("Not found", { status: 404 });
  else if (!["GET", "HEAD"].includes(request.method))
    response = new Response(null, {
      status: 405,
      headers: { Allow: "GET, HEAD" },
    });
  else response = await env.ASSETS.fetch(request);
  if (request.method === "HEAD") response = new Response(null, response);
  return secured(response, privateResponse);
}
export default {
  fetch(request: Request, env: WaitlistBindings, ctx: ExecutionContext) {
    return withRequestContext(env, async () => {
      try {
        return await route(request, env, ctx);
      } catch {
        return secured(
          new Response("Temporarily unavailable", { status: 503 }),
          true,
        );
      }
    });
  },
};
