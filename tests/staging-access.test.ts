import { describe, expect, it, vi } from "vitest";
import { spawnSync } from "node:child_process";
import {
  STAGING_ORIGIN,
  stagingHeaders,
  verifyStagingAccess,
} from "../scripts/release-access.mjs";

const env = {
  NODE_ENV: "test" as const,
  CF_ACCESS_CLIENT_ID: "dummy-staging-client.access",
  CF_ACCESS_CLIENT_SECRET: "dummy-local-only-service-secret",
  CF_ACCESS_TEAM_DOMAIN: "odyssey-test.cloudflareaccess.com",
};
const privateHeaders = {
  "cache-control": "private, no-store",
  "referrer-policy": "no-referrer",
  "x-robots-tag": "noindex",
};
function fixture(
  input: string | URL | Request,
  init?: RequestInit,
): Promise<Response> {
  const path = new URL(String(input)).pathname;
  const headers = new Headers(init?.headers);
  if (path === "/api/waitlist/webhook") {
    return Promise.resolve(
      Response.json({ ok: false }, { status: 401, headers: privateHeaders }),
    );
  }
  if (headers.get("CF-Access-Client-Secret") !== env.CF_ACCESS_CLIENT_SECRET) {
    return Promise.resolve(
      new Response(null, {
        status: 302,
        headers: {
          Location: `https://${env.CF_ACCESS_TEAM_DOMAIN}/cdn-cgi/access/login/odyssey-staging.soralives.xyz`,
        },
      }),
    );
  }
  if (path === "/") return Promise.resolve(new Response("A lot more life"));
  if (path === "/api/waitlist/status")
    return Promise.resolve(
      Response.json({ enabled: false }, { headers: privateHeaders }),
    );
  if (path.startsWith("/api/") || path.endsWith("/access"))
    return Promise.resolve(new Response(null, { status: 405 }));
  return Promise.resolve(
    new Response("Private journey", { headers: privateHeaders }),
  );
}

describe("staging release access checks", () => {
  it("does not log malformed credentials", () => {
    const secret = "dummy-secret-do-not-print\r\nbad-header";
    const child = spawnSync(
      process.execPath,
      ["scripts/smoke-deployment.mjs", "staging"],
      {
        env: {
          ...env,
          CF_ACCESS_CLIENT_SECRET: secret,
          WAITLIST_ENABLED: "false",
        },
        encoding: "utf8",
        timeout: 5000,
      },
    );
    expect(child.status).toBe(1);
    expect(child.stderr).toContain("Deployment smoke check failed");
    expect(child.stderr + child.stdout).not.toContain(
      "dummy-secret-do-not-print",
    );
    expect(child.stderr + child.stdout).not.toContain(env.CF_ACCESS_CLIENT_ID);
  });
  it("rejects publicly accessible staging even while collection is paused", () => {
    const child = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `
      globalThis.fetch = async (input) => {
        const path = new URL(input).pathname;
        const headers = {"cache-control":"no-store","referrer-policy":"no-referrer","x-robots-tag":"noindex"};
        if (path === "/api/waitlist/status") return Response.json({enabled:false},{headers});
        return new Response(path === "/" ? "A lot more life" : "Private journey",{headers});
      };
      process.argv[2] = "staging";
      await import("./scripts/smoke-deployment.mjs");
    `,
      ],
      {
        env: { ...env, WAITLIST_ENABLED: "false" },
        encoding: "utf8",
        timeout: 5000,
      },
    );
    expect(child.status).toBe(1);
    expect(child.stderr).toContain("Deployment smoke check failed");
    expect(child.stdout).not.toContain("verified");
  });
  it("checks negative and positive paths without following redirects or sending operational mutations", async () => {
    const fetcher = vi.fn(fixture);
    await verifyStagingAccess({ env, fetcher });
    expect(fetcher).toHaveBeenCalledTimes(34);
    for (const [input, init] of fetcher.mock.calls) {
      expect(new URL(String(input)).origin).toBe(STAGING_ORIGIN);
      expect(init?.redirect).toBe("manual");
      expect(String(input)).not.toMatch(/\/(cron|purge)/);
      if (init?.method === "POST") {
        expect(String(input)).toBe(`${STAGING_ORIGIN}/api/waitlist/webhook`);
        expect(init.body).toBe("{}");
        expect(new Headers(init.headers).has("CF-Access-Client-Secret")).toBe(
          false,
        );
      }
    }
  });

  it("never sends staging credentials to production or arbitrary URLs", () => {
    expect(stagingHeaders("production", env)).toEqual({});
    expect(stagingHeaders("https://example.com", env)).toEqual({});
    expect(() =>
      stagingHeaders("staging", { CF_ACCESS_CLIENT_ID: "partial" }),
    ).toThrow();
    expect(() => stagingHeaders("staging", {}, true)).toThrow();
  });

  it.each([200, 404, 405, 429, 500])(
    "does not count anonymous HTTP %s as protection",
    async (status) => {
      await expect(
        verifyStagingAccess({
          env,
          fetcher: async () => new Response(null, { status }),
        }),
      ).rejects.toThrow();
    },
  );

  it.each([
    "https://other.cloudflareaccess.com/cdn-cgi/access/login/staging",
    "https://odyssey-test.cloudflareaccess.com.evil.test/cdn-cgi/access/login/staging",
    "http://odyssey-test.cloudflareaccess.com/cdn-cgi/access/login/staging",
    "https://odyssey-test.cloudflareaccess.com/unrelated",
    "/login",
  ])(
    "rejects a redirect that does not establish the configured Access boundary: %s",
    async (location) => {
      await expect(
        verifyStagingAccess({
          env,
          fetcher: async () =>
            new Response(null, { status: 302, headers: { location } }),
        }),
      ).rejects.toThrow();
    },
  );

  it("rejects invalid-token bypass even when anonymous access is denied", async () => {
    const fetcher = async (
      input: string | URL | Request,
      init?: RequestInit,
    ) => {
      if (
        new Headers(init?.headers).get("CF-Access-Client-Secret") ===
        "odyssey-invalid-access-probe"
      )
        return new Response("A lot more life");
      return fixture(input, init);
    };
    await expect(verifyStagingAccess({ env, fetcher })).rejects.toThrow();
  });

  it("requires authenticated success, not an unavailable site that denies everyone", async () => {
    await expect(
      verifyStagingAccess({
        env,
        fetcher: async () => new Response(null, { status: 403 }),
      }),
    ).rejects.toThrow();
  });

  it.each([401, 503])(
    "does not accept a generic webhook HTTP %s as application signature validation",
    async (status) => {
      const fetcher = async (
        input: string | URL | Request,
        init?: RequestInit,
      ) =>
        String(input).endsWith("/webhook")
          ? new Response("provider error", { status })
          : fixture(input, init);
      await expect(verifyStagingAccess({ env, fetcher })).rejects.toThrow();
    },
  );
});
