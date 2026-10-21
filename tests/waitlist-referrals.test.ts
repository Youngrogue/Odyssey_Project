import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it, vi } from "vitest";
import { saveSignup } from "../src/lib/waitlist/store";
import { act } from "../src/lib/email/lifecycle";
import { drain } from "../src/lib/email/worker";
import { unseal } from "../src/lib/email/security";
import { parseSignup } from "../src/lib/waitlist/validation";
import { renderWaitlistEmail } from "../src/lib/email/templates";
const secret = "test-referrals-secret-at-least-32-characters";
const input = {
  secret,
  ip: "127.0.0.1",
  retentionDays: 90,
  email: "person@example.com",
};
async function setup() {
  const db = new PGlite();
  for (const file of readdirSync("db")
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort())
    await db.exec(readFileSync(`db/${file}`, "utf8"));
  await saveSignup(db, { ...input, referralCode: "abcdefghijklmnop" });
  const job = (
    await db.query<{ sealed_tokens: string }>(
      "SELECT sealed_tokens FROM waitlist_outbox",
    )
  ).rows[0];
  return {
    db,
    tokens: unseal<{ token: string; unsubscribeToken: string }>(
      job.sealed_tokens,
      secret,
    ),
  };
}
describe("email-only waitlist", () => {
  it("ignores legacy referral fields while validating email", () => {
    expect(
      parseSignup({ email: input.email, website: "", referralCode: "legacy" }),
    ).toEqual({ email: input.email, honeypot: false });
  });
  it("confirms without referral, badge, dashboard or welcome and retains original unsubscribe", async () => {
    const { db, tokens } = await setup();
    try {
      expect(
        await act(db, { ...input, kind: "confirm", token: tokens.token }),
      ).toEqual({ confirmed: true });
      expect(
        (
          await db.query(
            "SELECT state, referred_by, referral_code, founder_recognized_at, invite_token_hash FROM waitlist_signups",
          )
        ).rows[0],
      ).toEqual({
        state: "confirmed",
        referred_by: null,
        referral_code: null,
        founder_recognized_at: null,
        invite_token_hash: null,
      });
      expect(
        (
          await db.query(
            "SELECT count(*)::int n FROM waitlist_outbox WHERE kind='welcome'",
          )
        ).rows,
      ).toEqual([{ n: 0 }]);
      expect(
        await act(db, { ...input, kind: "confirm", token: tokens.token }),
      ).toEqual({ confirmed: false });
      await act(db, {
        ...input,
        kind: "unsubscribe",
        token: tokens.unsubscribeToken,
      });
      expect(
        (await db.query("SELECT state FROM waitlist_signups")).rows[0],
      ).toEqual({ state: "unsubscribed" });
    } finally {
      await db.close();
    }
  });
  it("returns false for expired confirmation and retired queued welcome never reaches provider", async () => {
    const { db, tokens } = await setup();
    try {
      await db.query(
        "UPDATE waitlist_signups SET confirmation_expires_at=now()-interval '1 minute'",
      );
      expect(
        await act(db, { ...input, kind: "confirm", token: tokens.token }),
      ).toEqual({ confirmed: false });
      await db.query("UPDATE waitlist_signups SET state='confirmed'");
      await db.query(
        "UPDATE waitlist_outbox SET kind='welcome',state='queued'",
      );
      const send = vi.fn<typeof fetch>();
      await drain(
        db,
        {
          origin: "https://example.com",
          tokenSecret: secret,
          apiKey: "re_test",
          from: "hello@example.com",
          contactEmail: "help@example.com",
          dailyBudget: 100,
        },
        send,
      );
      expect(send).not.toHaveBeenCalled();
      expect(
        (await db.query("SELECT state FROM waitlist_outbox")).rows[0],
      ).toEqual({ state: "cancelled" });
    } finally {
      await db.close();
    }
  });
  it("renewal preserves historical recognition and referral records without issuing new rewards", async () => {
    const { db } = await setup();
    try {
      await db.query(
        "UPDATE waitlist_signups SET state='confirmed',referral_code='abcdefghijklmnop',founder_recognized_at='2026-01-01T00:00:00Z',expires_at=now()-interval '1 day'",
      );
      await saveSignup(db, { ...input, referralCode: "qrstuvwxyzABCDEF" });
      const job = (
        await db.query<{ sealed_tokens: string }>(
          "SELECT sealed_tokens FROM waitlist_outbox ORDER BY id DESC LIMIT 1",
        )
      ).rows[0];
      const tokens = unseal<{ token: string }>(job.sealed_tokens, secret);
      await act(db, { ...input, kind: "confirm", token: tokens.token });
      const row = (
        await db.query<{
          referral_code: string;
          founder_recognized_at: Date;
          invite_token_hash: string | null;
        }>(
          "SELECT referral_code,founder_recognized_at,invite_token_hash FROM waitlist_signups",
        )
      ).rows[0];
      expect(row.referral_code).toBe("abcdefghijklmnop");
      expect(row.founder_recognized_at.toISOString()).toBe(
        "2026-01-01T00:00:00.000Z",
      );
      expect(row.invite_token_hash).toBeNull();
    } finally {
      await db.close();
    }
  });
  it("confirmation delivery includes one-click unsubscribe with its original token", async () => {
    const { db, tokens } = await setup();
    try {
      const send = vi
        .fn<typeof fetch>()
        .mockResolvedValue(Response.json({ id: "confirmation-provider" }));
      await drain(
        db,
        {
          origin: "https://example.com",
          tokenSecret: secret,
          apiKey: "re_test",
          from: "hello@example.com",
          contactEmail: "help@example.com",
          dailyBudget: 100,
        },
        send,
      );
      const payload = JSON.parse(String(send.mock.calls[0][1]?.body));
      expect(payload.headers).toEqual({
        "List-Unsubscribe": `<https://example.com/api/waitlist/unsubscribe?token=${tokens.unsubscribeToken}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      });
    } finally {
      await db.close();
    }
  });
  it("renders one branded confirmation with privacy and unsubscribe links and retires welcome rendering", () => {
    const email = renderWaitlistEmail("confirmation", {
      origin: "https://example.com",
      token: "private",
      unsubscribeToken: "unsubscribe",
    });
    expect(email.subject).toBe("Confirm your place on the Odyssey waitlist");
    for (const body of [email.text, email.html]) {
      expect(body).toContain("Confirm my email");
      expect(body).toContain("/privacy");
      expect(body).toContain("/waitlist/unsubscribe?token=unsubscribe");
      expect(body).not.toMatch(/Founding Explorer|invite code|welcome email/);
    }
    expect(() =>
      renderWaitlistEmail("welcome", {
        origin: "https://example.com",
        token: "",
      }),
    ).toThrow("retired");
  });
});
