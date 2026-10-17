import assert from "node:assert/strict";
const target = process.argv[2];
const origin =
  target === "production"
    ? "https://odyssey.soralives.xyz"
    : target === "staging"
      ? "https://odyssey-staging.soralives.xyz"
      : target;
const url = new URL(origin);
if (!["https:", "http:"].includes(url.protocol))
  throw Error("Invalid smoke-test origin");
const request = (path) =>
  fetch(`${origin}${path}`, {
    redirect: "manual",
    signal: AbortSignal.timeout(20000),
  });
const home = await request("/");
assert.equal(home.status, 200, "Homepage");
assert.match(await home.text(), /A lot more life/);
const status = await request("/api/waitlist/status");
assert.equal(status.status, 200, "Status endpoint");
assert.match(status.headers.get("cache-control") ?? "", /no-store/);
const data = await status.json();
assert.deepEqual(Object.keys(data), ["enabled"]);
assert.equal(data.enabled, process.env.WAITLIST_ENABLED === "true");
for (const path of [
  "/waitlist/confirm",
  "/waitlist/unsubscribe",
  "/waitlist/invite",
]) {
  const result = await request(path);
  assert.equal(result.status, 200, path);
  assert.match(result.headers.get("cache-control") ?? "", /no-store/, path);
  assert.equal(result.headers.get("referrer-policy"), "no-referrer", path);
  assert.match(result.headers.get("x-robots-tag") ?? "", /noindex/, path);
}
console.log(
  "Public availability and private-route headers verified. This does not verify delivery or CPU limits.",
);
