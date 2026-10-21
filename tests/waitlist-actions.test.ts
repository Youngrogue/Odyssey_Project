import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it, vi } from "vitest";
const fixture = vi.hoisted(() => ({
  db: undefined as unknown,
  secret: "http-actions-test-secret-at-least-32-characters",
}));
vi.mock("../src/lib/waitlist/db", () => ({
  connectWaitlist: async () => ({
    query: (sql: string, params?: unknown[]) =>
      (fixture.db as PGlite).query(sql, params),
    release: async () => {},
  }),
}));
vi.mock("../src/lib/waitlist/config", () => ({
  getWaitlistRuntimeConfig: () => ({
    origin: "https://example.com",
    tokenSecret: fixture.secret,
    trustedIpHeader: null,
    retentionDays: 90,
  }),
  getWaitlistActionConfig: () => ({
    origin: "https://example.com",
    tokenSecret: fixture.secret,
    trustedIpHeader: null,
    retentionDays: 90,
  }),
}));
import { actionHandler } from "../src/lib/email/handlers";
import { saveSignup } from "../src/lib/waitlist/store";
import { unseal } from "../src/lib/email/security";
const request = (token: string, origin = "https://example.com") =>
  new Request("https://example.com/api/waitlist/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", origin },
    body: new URLSearchParams({ token }),
  });
describe("confirmation HTTP truthfulness", () => {
  it("rejects cross-origin, distinguishes valid confirmation from replay, expiry and guesses", async () => {
    const db = new PGlite();
    fixture.db = db;
    try {
      for (const file of readdirSync("db")
        .filter((f) => /^\d+.*\.sql$/.test(f))
        .sort())
        await db.exec(readFileSync(`db/${file}`, "utf8"));
      await saveSignup(db, {
        email: "person@example.com",
        secret: fixture.secret,
        ip: "127.0.0.1",
        retentionDays: 90,
      });
      const row = (
        await db.query<{ sealed_tokens: string }>(
          "SELECT sealed_tokens FROM waitlist_outbox",
        )
      ).rows[0];
      const { token } = unseal<{ token: string }>(
        row.sealed_tokens,
        fixture.secret,
      );
      expect(
        (
          await actionHandler(
            request(token, "https://untrusted.example"),
            "confirm",
          )
        ).headers.get("location"),
      ).toBe("/waitlist/confirm?error=invalid");
      expect(
        (await actionHandler(request("x".repeat(43)), "confirm")).headers.get(
          "location",
        ),
      ).toBe("/waitlist/confirm?error=expired");
      await db.query(
        "UPDATE waitlist_signups SET confirmation_expires_at=now()-interval '1 minute'",
      );
      expect(
        (await actionHandler(request(token), "confirm")).headers.get(
          "location",
        ),
      ).toBe("/waitlist/confirm?error=expired");
      await db.query(
        "UPDATE waitlist_signups SET confirmation_expires_at=now()+interval '1 day'",
      );
      const success = await actionHandler(request(token), "confirm");
      expect(success.headers.get("location")).toBe("/waitlist/confirm?done=1");
      expect(success.headers.has("set-cookie")).toBe(false);
      expect(
        (await actionHandler(request(token), "confirm")).headers.get(
          "location",
        ),
      ).toBe("/waitlist/confirm?error=expired");
      const json = await actionHandler(
        new Request("https://example.com/api/waitlist/confirm", {
          method: "POST",
          headers: {
            origin: "https://example.com",
            "content-type": "application/json",
          },
          body: JSON.stringify({ token: "x".repeat(43) }),
        }),
        "confirm",
      );
      expect(json.status).toBe(410);
      expect(await json.json()).toEqual({ ok: false });
    } finally {
      await db.close();
    }
  });
});
