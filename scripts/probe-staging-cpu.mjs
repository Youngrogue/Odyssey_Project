// Staging-only CPU probe that sends no email and changes no subscriber rows.
// Resend for a never-subscribed reserved address runs signup's validation,
// rate-limit, lock and suppression path but queues nothing; an unknown token
// runs the confirmation lookup. Only rate-limit counters are written.
import { randomBytes } from "node:crypto";
import { stagingHeaders, STAGING_ORIGIN } from "./release-access.mjs";

const rounds = Number(process.env.PROBE_ROUNDS ?? 10);
const email = `cpu-probe-${randomBytes(6).toString("hex")}@example.com`;
const probes = [
  ["/api/waitlist/status", "GET"],
  ["/api/waitlist/resend", "POST", { email, website: "" }],
  ["/api/waitlist/confirm", "POST", { token: randomBytes(32).toString("base64url") }],
];
const statuses = {};
for (let round = 0; round < rounds; round++)
  for (const [path, method, body] of probes) {
    const response = await fetch(`${STAGING_ORIGIN}${path}`, {
      method,
      headers: {
        ...stagingHeaders("staging", process.env, true),
        Origin: STAGING_ORIGIN,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      redirect: "manual",
      signal: AbortSignal.timeout(25000),
    });
    await response.body?.cancel();
    const key = `${method} ${path} ${response.status}`;
    statuses[key] = (statuses[key] ?? 0) + 1;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
console.log(JSON.stringify(statuses));
