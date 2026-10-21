// Explicit live acceptance: one owner-controlled inbox alias on staging only.
// Never prints credentials, recipient addresses, private links or provider payloads.
import { Client } from "@neondatabase/serverless";
import { randomBytes } from "node:crypto";
import { unseal } from "../src/lib/email/security.ts";
import {
  stagingHeaders,
  STAGING_ORIGIN,
  verifyStagingAccess,
} from "./release-access.mjs";

let checkpoint = "configuration";
let client;
const subscriptions = [];
function requireThat(condition) {
  if (!condition) throw new Error("Acceptance assertion failed");
}
function passed(name) {
  console.log(`PASS: ${name}`);
}
async function request(path, { method = "GET", body, cookie } = {}) {
  requireThat(path.startsWith("/") && !path.startsWith("//"));
  const response = await fetch(`${STAGING_ORIGIN}${path}`, {
    method,
    headers: {
      ...stagingHeaders("staging", process.env, true),
      Origin: STAGING_ORIGIN,
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
    redirect: "manual",
    signal: AbortSignal.timeout(25000),
  });
  if (response.status >= 500)
    console.log(`Service response at ${checkpoint}: HTTP ${response.status}`);
  return response;
}
async function rowFor(email) {
  return (
    await client.query("SELECT * FROM waitlist_signups WHERE email=$1", [email])
  ).rows[0];
}
async function mailFor(id, kind) {
  return (
    await client.query(
      "SELECT * FROM waitlist_outbox WHERE signup_id=$1 AND kind=$2 ORDER BY id DESC LIMIT 1",
      [id, kind],
    )
  ).rows[0];
}
async function delivered(id, kind) {
  const deadline = Date.now() + 7 * 60 * 1000;
  while (Date.now() < deadline) {
    const mail = await mailFor(id, kind);
    requireThat(mail && !["parked", "cancelled"].includes(mail.state));
    if (mail.state === "sent" && mail.delivered_at) return mail;
    await new Promise((resolve) => setTimeout(resolve, 15000));
  }
  throw new Error("Delivery not established within acceptance window");
}
async function confirm(email) {
  checkpoint = "email-only signup";
  const signup = await request("/api/waitlist", {
    method: "POST",
    body: { email, website: "" },
  });
  requireThat(signup.status === 200);
  await signup.body?.cancel();
  const record = await rowFor(email);
  requireThat(
    record?.state === "pending" &&
      !record.founder_recognized_at &&
      !record.referred_by,
  );
  const queued = await mailFor(record.id, "confirmation");
  requireThat(queued);
  const tokens = unseal(
    queued.sealed_tokens,
    process.env.WAITLIST_TOKEN_SECRET,
  );
  subscriptions.push({ email, id: record.id, tokens });
  passed(checkpoint);

  checkpoint = "confirmation delivery and signed acknowledgement";
  const confirmation = await delivered(record.id, "confirmation");
  const envelope = unseal(
    confirmation.sealed_request,
    process.env.WAITLIST_TOKEN_SECRET,
  );
  requireThat(
    envelope.reply_to === "odyssey@soralives.xyz" &&
      envelope.html &&
      envelope.text,
  );
  requireThat(
    envelope.subject === "Confirm your place on the Odyssey waitlist",
  );
  requireThat(!/Founding Explorer|invite code|referral/i.test(envelope.html));
  requireThat(
    envelope.headers?.["List-Unsubscribe-Post"] ===
      "List-Unsubscribe=One-Click",
  );
  passed(checkpoint);

  checkpoint = "scanner-safe confirmation link";
  const link = await request(
    `/waitlist/confirm?token=${encodeURIComponent(tokens.token)}`,
  );
  requireThat(
    link.status === 200 &&
      /no-store/.test(link.headers.get("cache-control") ?? ""),
  );
  await link.body?.cancel();
  requireThat((await rowFor(email)).state === "pending");
  passed(checkpoint);

  checkpoint = "explicit confirmation without app rewards";
  const confirmed = await request("/api/waitlist/confirm", {
    method: "POST",
    body: { token: tokens.token },
  });
  // Cloudflare Access may renew its perimeter cookie on authenticated staging
  // requests. The app must still issue no signup/invitation capability cookie.
  const cookieNames = confirmed.headers
    .getSetCookie()
    .map((value) => value.split("=", 1)[0]);
  console.log(
    `Confirmation response: HTTP ${confirmed.status}; Access cookie: ${cookieNames.includes("CF_Authorization")}; unexpected cookie count: ${cookieNames.filter((name) => name !== "CF_Authorization").length}`,
  );
  requireThat(confirmed.status === 200);
  requireThat(cookieNames.every((name) => name === "CF_Authorization"));
  await confirmed.body?.cancel();
  const updated = await rowFor(email);
  requireThat(
    updated.state === "confirmed" &&
      !updated.founder_recognized_at &&
      !updated.invite_token_hash &&
      !updated.referred_by,
  );
  passed(checkpoint);

  checkpoint = "confirmation replay and duplicate signup create no extra mail";
  const replay = await request("/api/waitlist/confirm", {
    method: "POST",
    body: { token: tokens.token },
  });
  requireThat(replay.status === 410);
  await replay.body?.cancel();
  const duplicate = await request("/api/waitlist", {
    method: "POST",
    body: { email, website: "" },
  });
  requireThat(duplicate.status === 200);
  await duplicate.body?.cancel();
  const count = await client.query(
    "SELECT count(*)::int AS count FROM waitlist_outbox WHERE signup_id=$1",
    [record.id],
  );
  requireThat(count.rows[0].count === 1);
  passed(checkpoint);

  checkpoint = "original confirmation email can unsubscribe after confirmation";
  const unsub = await request("/api/waitlist/unsubscribe", {
    method: "POST",
    body: { token: tokens.unsubscribeToken },
  });
  requireThat(unsub.status === 200);
  await unsub.body?.cancel();
  requireThat((await rowFor(email)).state === "unsubscribed");
  passed(checkpoint);
}

try {
  requireThat(process.env.LAUNCH_ACCEPTANCE === "staging-owner-inboxes");
  const url = new URL(process.env.DATABASE_URL);
  requireThat(
    url.hostname === "ep-ancient-dawn-zacmh8ub.c-2.eu-west-2.aws.neon.tech" &&
      url.pathname === "/odyssey",
  );
  requireThat((process.env.WAITLIST_TOKEN_SECRET?.length ?? 0) >= 32);
  const owner = process.env.LAUNCH_TEST_EMAIL?.trim().toLowerCase();
  requireThat(/^[a-z0-9.]+@gmail\.com$/.test(owner ?? ""));
  const suffix = randomBytes(5).toString("hex");
  const [local, domain] = owner.split("@");
  const firstEmail = `${local}+odyssey-${suffix}-a@${domain}`;
  checkpoint = "live staging access";
  await verifyStagingAccess({ expectedEnabled: true });
  passed(checkpoint);
  client = new Client({
    connectionString: url.href,
    connectionTimeoutMillis: 10000,
  });
  await client.connect();
  // Read-only DB inspection; all lifecycle writes go through the deployed site.
  await client.query("SET default_transaction_read_only = on");
  await client.query("SET statement_timeout = '10s'");
  await confirm(firstEmail);
  console.log(
    "PASS: deployed staging email-only lifecycle and delivery webhook. Inbox appearance, tracking, idle recovery, outage/suppression and resource acceptance remain separate checks.",
  );
} catch {
  console.error(
    `FAIL: ${checkpoint}. Sensitive diagnostics intentionally omitted.`,
  );
  process.exitCode = 1;
} finally {
  // Revoke only this run's controlled subscriptions; preserve evidence/retention.
  for (const record of subscriptions) {
    try {
      const response = await request("/api/waitlist/unsubscribe", {
        method: "POST",
        body: { token: record.tokens.unsubscribeToken },
      });
      if (response.status !== 200) process.exitCode = 1;
      await response.body?.cancel();
    } catch {
      process.exitCode = 1;
    }
  }
  if (client)
    await client.end().catch(() => {
      process.exitCode = 1;
    });
}
