import { readFileSync, readdirSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ client: null as unknown, connections: 0 }));
vi.mock("../src/lib/waitlist/db", () => ({
  connectWaitlist: async () => {
    state.connections++;
    return state.client;
  },
}));
vi.mock("../src/lib/waitlist/config", () => {
  const config = {
    origin: "https://example.com",
    tokenSecret: "test-referral-http-secret-at-least-32-characters",
    trustedIpHeader: null,
    retentionDays: 90,
  };
  return {
    getWaitlistRuntimeConfig: () => config,
    getWaitlistActionConfig: () => config,
  };
});
import { inviteAccessHandler } from "../src/lib/waitlist/invite-handler";
import { actionHandler } from "../src/lib/email/handlers";
import { saveSignup } from "../src/lib/waitlist/store";
import { unseal } from "../src/lib/email/security";
import Invite from "../src/app/waitlist/invite/page";

const secret = "test-referral-http-secret-at-least-32-characters";
function post(path: string, token: string, origin = "https://example.com") {
  return new Request(`https://example.com${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ token }).toString(),
  });
}
async function setup() {
  const db = new PGlite();
  for (const file of readdirSync("db")
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort())
    await db.exec(readFileSync(`db/${file}`, "utf8"));
  state.client = { query: db.query.bind(db), release() {} };
  state.connections = 0;
  await saveSignup(db, {
    email: "owner@example.com",
    secret,
    ip: "unknown",
    retentionDays: 90,
  });
  const tokens = unseal<{ token: string }>(
    String(
      (
        await db.query<Record<string, unknown>>(
          "SELECT sealed_tokens FROM waitlist_outbox",
        )
      ).rows[0].sealed_tokens,
    ),
    secret,
  );
  return { db, confirmationToken: tokens.token };
}
describe("private invitation HTTP authorization", () => {
  it("confirmation issues private cookie only after a valid transition; replay reveals no capability", async () => {
    const { db, confirmationToken } = await setup();
    try {
      const first = await actionHandler(
        post("/api/waitlist/confirm", confirmationToken),
        "confirm",
      );
      expect(first.status).toBe(303);
      expect(first.headers.get("Location")).toBe("/waitlist/invite");
      expect(first.headers.get("Set-Cookie")).toMatch(
        /odyssey_invite_access=[\w-]{43}; Max-Age=86400; Path=\/waitlist\/invite; HttpOnly; SameSite=Strict; Secure/,
      );
      expect(first.headers.get("Cache-Control")).toBe("no-store");
      const replay = await actionHandler(
        post("/api/waitlist/confirm", confirmationToken),
        "confirm",
      );
      expect(replay.headers.get("Location")).toBe("/waitlist/confirm?done=1");
      expect(replay.headers.get("Set-Cookie")).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("private email link GET has no side effect or counts; explicit same-origin POST opens a clean URL", async () => {
    const { db, confirmationToken } = await setup();
    try {
      await actionHandler(
        post("/api/waitlist/confirm", confirmationToken),
        "confirm",
      );
      const tokens = unseal<{ inviteToken: string }>(
        String(
          (
            await db.query<Record<string, unknown>>(
              "SELECT sealed_tokens FROM waitlist_outbox WHERE kind='welcome'",
            )
          ).rows[0].sealed_tokens,
        ),
        secret,
      );
      const before = state.connections;
      const html = renderToStaticMarkup(
        await Invite({
          searchParams: Promise.resolve({ token: tokens.inviteToken }),
        }),
      );
      expect(state.connections).toBe(before);
      expect(html).toContain("Open my invitation page");
      expect(html).not.toContain("confirmed friends");
      const wrongOrigin = await inviteAccessHandler(
        post(
          "/waitlist/invite/access",
          tokens.inviteToken,
          "https://attacker.example",
        ),
      );
      expect(wrongOrigin.headers.get("Location")).toBe(
        "/waitlist/invite?error=invalid",
      );
      expect(wrongOrigin.headers.get("Set-Cookie")).toBeNull();
      const valid = await inviteAccessHandler(
        post("/waitlist/invite/access", tokens.inviteToken),
      );
      expect(valid.headers.get("Location")).toBe("/waitlist/invite");
      expect(valid.headers.get("Set-Cookie")).toContain(tokens.inviteToken);
      expect(valid.headers.get("Referrer-Policy")).toBe("no-referrer");
      expect(valid.headers.get("X-Robots-Tag")).toBe("noindex, nofollow");
    } finally {
      await db.close();
    }
  });

  it("public codes, guesses, revoked capabilities and oversized requests cannot retrieve private progress", async () => {
    const { db, confirmationToken } = await setup();
    try {
      await actionHandler(
        post("/api/waitlist/confirm", confirmationToken),
        "confirm",
      );
      const row = (
        await db.query<Record<string, unknown>>(
          "SELECT referral_code FROM waitlist_signups",
        )
      ).rows[0];
      const token = unseal<{ inviteToken: string }>(
        String(
          (
            await db.query<Record<string, unknown>>(
              "SELECT sealed_tokens FROM waitlist_outbox WHERE kind='welcome'",
            )
          ).rows[0].sealed_tokens,
        ),
        secret,
      ).inviteToken;
      await db.query<Record<string, unknown>>(
        "UPDATE waitlist_signups SET state='unsubscribed'",
      );
      for (const invalid of [
        String(row.referral_code),
        "x".repeat(43),
        token,
        "x".repeat(5000),
      ]) {
        const response = await inviteAccessHandler(
          post("/waitlist/invite/access", invalid),
        );
        expect(response.headers.get("Location")).toBe(
          "/waitlist/invite?error=invalid",
        );
        expect(response.headers.get("Set-Cookie")).toBeNull();
        expect(await response.text()).toBe("");
      }
    } finally {
      await db.close();
    }
  });
});
