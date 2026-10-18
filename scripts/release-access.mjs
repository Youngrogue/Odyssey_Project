import assert from "node:assert/strict";

export const STAGING_ORIGIN = "https://odyssey-staging.soralives.xyz";
const privatePaths = [
  "/waitlist/confirm",
  "/waitlist/unsubscribe",
  "/waitlist/invite",
];
const mutationPaths = [
  "/api/waitlist",
  "/api/waitlist/confirm",
  "/api/waitlist/resend",
  "/api/waitlist/unsubscribe",
  "/api/waitlist/preferences",
  "/waitlist/invite/access",
];

/** @param {Record<string, string | undefined>} env */
export function stagingHeaders(target, env = process.env, required = false) {
  // Credentials are never attached to an arbitrary smoke-test URL or production.
  if (target !== "staging") return {};
  const id = env.CF_ACCESS_CLIENT_ID;
  const secret = env.CF_ACCESS_CLIENT_SECRET;
  if (!id && !secret && !required) return {};
  assert.ok(id && secret, "Staging Access credentials are incomplete");
  assert.ok(
    !/[^\x21-\x7e]/.test(id + secret),
    "Invalid staging Access credential format",
  );
  return { "CF-Access-Client-Id": id, "CF-Access-Client-Secret": secret };
}

export async function checkPublicResponse(response, path, expectedEnabled) {
  assert.equal(response.status, 200, `Authenticated route ${path}`);
  if (path === "/") assert.match(await response.text(), /A lot more life/);
  if (path === "/api/waitlist/status") {
    assert.match(response.headers.get("cache-control") ?? "", /no-store/);
    const data = await response.json();
    assert.deepEqual(Object.keys(data), ["enabled"]);
    assert.equal(typeof data.enabled, "boolean");
    if (expectedEnabled !== undefined)
      assert.equal(data.enabled, expectedEnabled);
  }
  if (privatePaths.includes(path)) {
    assert.match(response.headers.get("cache-control") ?? "", /no-store/, path);
    assert.equal(response.headers.get("referrer-policy"), "no-referrer", path);
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/, path);
  }
}

function assertDenied(response, path, teamDomain) {
  if ([401, 403].includes(response.status)) return;
  let location;
  try {
    location = new URL(response.headers.get("location") ?? "");
  } catch {
    /* rejected below */
  }
  assert.ok(
    response.status === 302 &&
      location?.protocol === "https:" &&
      location.host === teamDomain &&
      !location.username &&
      !location.password &&
      location.pathname.startsWith("/cdn-cgi/access/login/"),
    `Staging protection not established for ${path}`,
  );
}

/** @param {{env?: Record<string, string | undefined>, fetcher?: typeof fetch, expectedEnabled?: boolean}} options */
export async function verifyStagingAccess({
  env = process.env,
  fetcher = fetch,
  expectedEnabled,
} = {}) {
  const headers = stagingHeaders("staging", env, true);
  const teamDomain = env.CF_ACCESS_TEAM_DOMAIN ?? "";
  assert.match(
    teamDomain,
    /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.cloudflareaccess\.com$/,
    "Configure the reviewed Access team hostname",
  );
  const invalidHeaders = {
    ...headers,
    "CF-Access-Client-Secret": "odyssey-invalid-access-probe",
  };
  for (const path of [
    "/",
    "/api/waitlist/status",
    ...privatePaths,
    ...mutationPaths,
  ]) {
    for (const negativeHeaders of [{}, invalidHeaders]) {
      const response = await fetcher(`${STAGING_ORIGIN}${path}`, {
        headers: negativeHeaders,
        redirect: "manual",
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      assertDenied(response, path, teamDomain);
      await response.body?.cancel();
    }
    const allowed = await fetcher(`${STAGING_ORIGIN}${path}`, {
      headers,
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(20000),
    });
    if (mutationPaths.includes(path)) {
      // GET cannot trigger any of these mutation-only routes.
      assert.equal(allowed.status, 405, `Authenticated mutation route ${path}`);
    } else {
      await checkPublicResponse(allowed, path, expectedEnabled);
    }
    if (!allowed.bodyUsed) await allowed.body?.cancel();
  }

  // Resend cannot present Access credentials. Only this exact signed endpoint is public.
  const webhook = await fetcher(`${STAGING_ORIGIN}/api/waitlist/webhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
    redirect: "manual",
    cache: "no-store",
    signal: AbortSignal.timeout(20000),
  });
  assert.equal(
    webhook.status,
    401,
    "Unsigned webhook must reach the application's signature check",
  );
  assert.match(webhook.headers.get("cache-control") ?? "", /no-store/);
  assert.equal(webhook.headers.get("referrer-policy"), "no-referrer");
  assert.deepEqual(await webhook.json(), { ok: false });
}
