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
import { digest, token as newToken } from "../src/lib/email/security";
const request = (
  token: string,
  origin = "https://example.com",
  path = "confirm",
) =>
  new Request(`https://example.com/api/waitlist/${path}`, {
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
      // A pending row from the retired double opt-in flow; its link still works.
      const token = newToken(),
        unsubscribe = newToken();
      const { id } = (
        await db.query<{ id: number }>(
          `INSERT INTO waitlist_signups(email,notice_version,expires_at,token_hash,token_expires_at,confirmation_hash,confirmation_expires_at,unsubscribe_hash,suppression_hash)
           VALUES('person@example.com','old',now()+interval '7 days','legacy',now()+interval '1 day',$1,now()+interval '1 day',$2,$3) RETURNING id`,
          [
            digest(fixture.secret, "confirm", token),
            digest(fixture.secret, "unsubscribe", unsubscribe),
            digest(fixture.secret, "suppression", "person@example.com"),
          ],
        )
      ).rows[0];
      await db.query(
        "INSERT INTO waitlist_unsubscribe_tokens(token_hash,signup_id) VALUES($1,$2)",
        [digest(fixture.secret, "unsubscribe", unsubscribe), id],
      );
      expect(
        (
          await actionHandler(
            request(token, "https://untrusted.example"),
            "confirm",
          )
        ).headers.get("location"),
      ).toBe("/waitlist/confirm?error=invalid");
      // No-referrer pages post `Origin: null`; the token authorizes the action.
      expect(
        (
          await actionHandler(request("x".repeat(43), "null"), "confirm")
        ).headers.get("location"),
      ).toBe("/waitlist/confirm?error=expired");
      // Resend carries no token, so an opaque origin is still refused.
      expect(
        (
          await actionHandler(
            new Request("https://example.com/api/waitlist/resend", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                origin: "null",
              },
              body: new URLSearchParams({
                email: "person@example.com",
                website: "",
              }),
            }),
            "resend",
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
      const success = await actionHandler(request(token, "null"), "confirm");
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
      // The unsubscribe page's native button works from a no-referrer page.
      expect(
        (
          await actionHandler(
            request(unsubscribe, "null", "unsubscribe"),
            "unsubscribe",
          )
        ).headers.get("location"),
      ).toBe("/waitlist/unsubscribe?done=1");
      expect(
        (await db.query("SELECT state FROM waitlist_signups")).rows[0],
      ).toEqual({ state: "unsubscribed" });
    } finally {
      await db.close();
    }
  });
});
