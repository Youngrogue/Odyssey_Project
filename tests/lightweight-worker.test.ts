import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock(
  "@opennextjs/cloudflare",
  async () => import("../cloudflare/request-context"),
);
import worker from "../cloudflare/landing";
const ctx = { waitUntil: (_promise: Promise<unknown>) => {} };
const env = {
  ASSETS: { fetch: async () => new Response("static asset") },
  DATABASE_URL: undefined,
};
afterEach(() => vi.unstubAllEnvs());
async function request(path: string, method = "GET", body?: string) {
  return worker.fetch(
    new Request("https://odyssey.soralives.xyz" + path, {
      method,
      body,
      headers: body ? { "Content-Type": "application/json" } : {},
    }),
    env,
    ctx,
  );
}
describe("lightweight deployed waitlist boundary", () => {
  it("keeps collection closed without complete configuration and exposes only availability", async () => {
    const res = await request("/api/waitlist/status");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ enabled: false });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(
      (await request("/api/waitlist", "POST", '{"email":"test@example.com"}'))
        .status,
    ).toBe(503);
  });
  it("renders confirmation safely without confirming on GET or forwarding token URLs to static assets", async () => {
    const res = await request("/waitlist/confirm?token=" + "a".repeat(43));
    expect(res.status).toBe(200);
    expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
    expect(res.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    const html = await res.text();
    expect(html).toContain('method="post"');
    expect(html).toContain('action="/api/waitlist/confirm"');
    expect(html).not.toContain("static asset");
  });
  it("never reflects malformed tokens or unrecognized error text into HTML", async () => {
    const res = await request(
      "/waitlist/confirm?token=%22%3E%3Cscript%3Ealert(1)%3C/script%3E&error=%3Cscript%3E",
    );
    const html = await res.text();
    expect(html).not.toContain("<script>");
    expect(html).not.toContain('name="token"');
    expect(html).toContain("join again on the homepage");
  });
  it("never shows success alongside an error from conflicting query flags", async () => {
    for (const path of ["/waitlist/confirm", "/waitlist/unsubscribe"]) {
      const html = await (await request(`${path}?done=1&error=expired`)).text();
      expect(html).toContain('role="alert"');
      expect(html).not.toContain("You're on the list");
      expect(html).not.toContain("Request processed");
    }
  });
  it("preserves private HEAD semantics and rejects unsupported action methods", async () => {
    const head = await request("/waitlist/unsubscribe", "HEAD");
    expect(head.status).toBe(200);
    expect(await head.text()).toBe("");
    expect(head.headers.get("Cache-Control")).toBe("no-store");
    const get = await request("/api/waitlist/confirm");
    expect(get.status).toBe(405);
    expect(get.headers.get("Allow")).toContain("POST");
  });
  it("does not resurrect retired capabilities and prevents unknown API paths from falling through to public assets", async () => {
    expect(
      (await request("/api/waitlist/preferences", "PATCH", "{}")).status,
    ).toBe(410);
    const retired = await request("/waitlist/invite/access", "POST");
    expect(retired.status).toBe(303);
    expect(retired.headers.get("set-cookie")).toContain("Max-Age=0");
    const unknown = await request("/api/waitlist/not-a-route");
    expect(unknown.status).toBe(404);
    expect(unknown.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("request binding isolation", () => {
  it("keeps overlapping invocations and background work attached to their own bindings", async () => {
    const { withRequestContext, getCloudflareContext } =
      await import("../cloudflare/request-context");
    const a = { ...env, DATABASE_URL: "a" },
      b = { ...env, DATABASE_URL: "b" };
    const values = await Promise.all([
      withRequestContext(a, async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return getCloudflareContext().env.DATABASE_URL;
      }),
      withRequestContext(b, async () => {
        await Promise.resolve();
        return getCloudflareContext().env.DATABASE_URL;
      }),
    ]);
    expect(values).toEqual(["a", "b"]);
    expect(() => getCloudflareContext()).toThrow("context unavailable");
  });
});
