import { readFileSync, readdirSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { describe, expect, it } from "vitest";
import { saveSignup } from "../src/lib/waitlist/store";
import { act, purge } from "../src/lib/email/lifecycle";
import { applyEvent } from "../src/lib/email/webhook";
import { digest, unseal } from "../src/lib/email/security";
import {
  getInviteProgress,
  inviteCookie,
  inviteShareUrl,
} from "../src/lib/waitlist/referrals";
import { parseSignup } from "../src/lib/waitlist/validation";
import { renderWaitlistEmail } from "../src/lib/email/templates";

const secret = "test-referrals-secret-at-least-32-characters";
const common = { secret, ip: "127.0.0.1", retentionDays: 90 };
type MailTokens = {
  token: string;
  unsubscribeToken: string;
  inviteToken?: string;
};
async function database() {
  const db = new PGlite();
  for (const file of readdirSync("db")
    .filter((f) => /^\d+.*\.sql$/.test(f))
    .sort())
    await db.exec(readFileSync(`db/${file}`, "utf8"));
  return db;
}
async function mailTokens(db: PGlite, email: string, kind = "confirmation") {
  const row = (
    await db.query<{ sealed_tokens: string }>(
      "SELECT o.sealed_tokens FROM waitlist_outbox o JOIN waitlist_signups s ON s.id=o.signup_id WHERE s.email=$1 AND o.kind=$2 ORDER BY o.id DESC LIMIT 1",
      [email, kind],
    )
  ).rows[0];
  return unseal<MailTokens>(row.sealed_tokens, secret);
}
async function join(db: PGlite, email: string, referralCode?: string) {
  await saveSignup(db, { ...common, email, referralCode });
  const confirmation = await mailTokens(db, email);
  const outcome = await act(db, {
    ...common,
    kind: "confirm",
    token: confirmation.token,
  });
  const row = (
    await db.query<{ id: number; referral_code: string }>(
      "SELECT id,referral_code FROM waitlist_signups WHERE email=$1",
      [email],
    )
  ).rows[0];
  return { ...row, inviteToken: outcome!.inviteToken, confirmation };
}
const progress = (db: PGlite, token: string) =>
  getInviteProgress(db, { ...common, token });

describe("private waitlist referrals", () => {
  it("awards Founding Explorer only on confirmation and keeps the original award across replay and renewal", async () => {
    const db = await database();
    try {
      const email = "founder@example.com";
      await saveSignup(db, { ...common, email });
      const confirmation = await mailTokens(db, email);
      const award = async () =>
        (
          await db.query<{ founder_recognized_at: Date | null }>(
            "SELECT founder_recognized_at FROM waitlist_signups WHERE email=$1",
            [email],
          )
        ).rows[0]?.founder_recognized_at?.toISOString() ?? null;
      expect(await award()).toBeNull();
      await db.query(
        "UPDATE waitlist_signups SET confirmation_expires_at=now()-interval '1 second'",
      );
      await act(db, { ...common, kind: "confirm", token: confirmation.token });
      expect(await award()).toBeNull();
      await db.query(
        "UPDATE waitlist_signups SET confirmation_expires_at=now()+interval '1 day'",
      );
      const result = await act(db, {
        ...common,
        kind: "confirm",
        token: confirmation.token,
      });
      const awardedAt = await award();
      expect(awardedAt).not.toBeNull();
      expect(
        (await progress(db, result!.inviteToken))?.founderRecognition,
      ).toBe(true);
      await saveSignup(db, { ...common, email });
      await act(db, { ...common, kind: "confirm", token: confirmation.token });
      expect(await award()).toBe(awardedAt);
      expect(
        (await progress(db, result!.inviteToken))?.founderRecognition,
      ).toBe(true);
      await db.query(
        "UPDATE waitlist_signups SET expires_at=now()-interval '1 day'",
      );
      const renewed = await join(db, email);
      expect(await award()).toBe(awardedAt);
      expect(
        (await progress(db, renewed.inviteToken))?.founderRecognition,
      ).toBe(true);
      expect(await progress(db, result!.inviteToken)).toBeNull();
      await db.query(
        "UPDATE waitlist_signups SET expires_at=now()-interval '1 day'",
      );
      await purge(db);
      expect(await award()).toBeNull();
      expect(await progress(db, renewed.inviteToken)).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("adding the referral schema does not award or email historical confirmed rows", async () => {
    const db = new PGlite();
    try {
      for (const file of [
        "001_waitlist.sql",
        "002_waitlist_email.sql",
        "003_waitlist_review_fixes.sql",
      ])
        await db.exec(readFileSync(`db/${file}`, "utf8"));
      await db.query(
        "INSERT INTO waitlist_signups(email,notice_version,expires_at,token_hash,token_expires_at,state,confirmed_at) VALUES('legacy@example.com','old',now()+interval '90 days','old-hash',now()+interval '1 day','confirmed',now())",
      );
      await db.exec(readFileSync("db/004_waitlist_referrals.sql", "utf8"));
      expect(
        (
          await db.query(
            "SELECT state,founder_recognized_at,invite_token_hash FROM waitlist_signups",
          )
        ).rows,
      ).toEqual([
        {
          state: "confirmed",
          founder_recognized_at: null,
          invite_token_hash: null,
        },
      ]);
      expect(
        (await db.query("SELECT count(*)::int AS n FROM waitlist_outbox")).rows,
      ).toEqual([{ n: 0 }]);
    } finally {
      await db.close();
    }
  });

  it("keeps signup valid after a referrer is purged and skips reciprocal locks for existing subscribers", async () => {
    const db = await database();
    try {
      const owner = await join(db, "owner@example.com");
      const existing = await join(db, "existing@example.com");
      const duplicateOnly = {
        query: async (sql: string, params?: unknown[]) => {
          if (sql.includes("FOR KEY SHARE OF s"))
            throw Error("Existing signup must not lock another referrer");
          return db.query<Record<string, unknown>>(sql, params);
        },
      };
      await saveSignup(duplicateOnly, {
        ...common,
        email: "owner@example.com",
        referralCode: existing.referral_code,
      });
      await saveSignup(duplicateOnly, {
        ...common,
        email: "existing@example.com",
        referralCode: owner.referral_code,
      });
      await db.query(
        "UPDATE waitlist_signups SET expires_at=now()-interval '1 day' WHERE email='owner@example.com'",
      );
      await purge(db);
      await saveSignup(db, {
        ...common,
        email: "friend@example.com",
        referralCode: owner.referral_code,
      });
      expect(
        (
          await db.query<Record<string, unknown>>(
            "SELECT state,referred_by FROM waitlist_signups WHERE email='friend@example.com'",
          )
        ).rows,
      ).toEqual([{ state: "pending", referred_by: null }]);
      expect(
        (
          await db.query<Record<string, unknown>>(
            "SELECT count(*)::int AS n FROM waitlist_outbox o JOIN waitlist_signups s ON s.id=o.signup_id WHERE s.email='friend@example.com' AND o.kind='confirmation'",
          )
        ).rows,
      ).toEqual([{ n: 1 }]);
    } finally {
      await db.close();
    }
  });
  it("validates bounded optional public codes without changing old signup payloads", () => {
    expect(
      parseSignup({
        email: "A@Example.com",
        website: "",
        referralCode: "aB2_cD4-eF6gH8iJ",
      }),
    ).toEqual({
      email: "a@example.com",
      honeypot: false,
      referralCode: "aB2_cD4-eF6gH8iJ",
    });
    for (const referralCode of ["", "bad/code", "a".repeat(43), 123, null])
      expect(() =>
        parseSignup({ email: "a@example.com", website: "", referralCode }),
      ).toThrow();
  });

  it("counts only new confirmed subscriptions and returns no invitee identity", async () => {
    const db = await database();
    try {
      const owner = await join(db, "owner@example.com");
      expect(await progress(db, owner.inviteToken)).toEqual({
        referralCode: owner.referral_code,
        qualifiedReferrals: 0,
        founderRecognition: true,
      });
      await saveSignup(db, {
        ...common,
        email: "friend@example.com",
        referralCode: owner.referral_code,
      });
      expect((await progress(db, owner.inviteToken))?.qualifiedReferrals).toBe(
        0,
      );
      const friendToken = (await mailTokens(db, "friend@example.com")).token;
      await act(db, { ...common, kind: "confirm", token: friendToken });
      await act(db, { ...common, kind: "confirm", token: friendToken });
      const data = await progress(db, owner.inviteToken);
      expect(data).toEqual({
        referralCode: owner.referral_code,
        qualifiedReferrals: 1,
        founderRecognition: true,
      });
      expect(JSON.stringify(data)).not.toContain("friend");
      expect(
        (
          await db.query<Record<string, unknown>>(
            "SELECT count(*)::int AS n FROM waitlist_outbox WHERE kind='welcome'",
          )
        ).rows[0],
      ).toEqual({ n: 2 });
    } finally {
      await db.close();
    }
  });

  it("cannot rewrite first attribution through repeat signup, self referral or existing signup", async () => {
    const db = await database();
    try {
      const first = await join(db, "first@example.com");
      const second = await join(db, "second@example.com");
      await saveSignup(db, {
        ...common,
        email: "friend@example.com",
        referralCode: first.referral_code,
      });
      await saveSignup(db, {
        ...common,
        email: "friend@example.com",
        referralCode: second.referral_code,
      });
      await act(db, {
        ...common,
        kind: "confirm",
        token: (await mailTokens(db, "friend@example.com")).token,
      });
      await saveSignup(db, {
        ...common,
        email: "first@example.com",
        referralCode: first.referral_code,
      });
      await saveSignup(db, {
        ...common,
        email: "second@example.com",
        referralCode: first.referral_code,
      });
      expect((await progress(db, first.inviteToken))?.qualifiedReferrals).toBe(
        1,
      );
      expect((await progress(db, second.inviteToken))?.qualifiedReferrals).toBe(
        0,
      );
      expect(
        (
          await db.query<Record<string, unknown>>(
            "SELECT referred_by FROM waitlist_signups WHERE email='first@example.com'",
          )
        ).rows[0],
      ).toEqual({ referred_by: null });
      await expect(
        db.query<Record<string, unknown>>(
          "UPDATE waitlist_signups SET referred_by=id WHERE email='first@example.com'",
        ),
      ).rejects.toThrow();
    } finally {
      await db.close();
    }
  });

  it("expired renewal preserves attribution and invalidates the old dashboard capability", async () => {
    const db = await database();
    try {
      const first = await join(db, "first@example.com");
      const second = await join(db, "second@example.com");
      const friend = await join(db, "friend@example.com", first.referral_code);
      await db.query<Record<string, unknown>>(
        "UPDATE waitlist_signups SET expires_at=now()-interval '1 day' WHERE email='friend@example.com'",
      );
      expect((await progress(db, first.inviteToken))?.qualifiedReferrals).toBe(
        0,
      );
      const renewed = await join(
        db,
        "friend@example.com",
        second.referral_code,
      );
      expect(await progress(db, friend.inviteToken)).toBeNull();
      expect(await progress(db, renewed.inviteToken)).not.toBeNull();
      expect((await progress(db, first.inviteToken))?.qualifiedReferrals).toBe(
        1,
      );
      expect((await progress(db, second.inviteToken))?.qualifiedReferrals).toBe(
        0,
      );
    } finally {
      await db.close();
    }
  });

  it("rejects pending or unknown referrers without rejecting a valid signup", async () => {
    const db = await database();
    try {
      await saveSignup(db, { ...common, email: "pending@example.com" });
      const code = String(
        (
          await db.query<Record<string, unknown>>(
            "SELECT referral_code FROM waitlist_signups",
          )
        ).rows[0].referral_code,
      );
      await join(db, "friend@example.com", code);
      await join(db, "other@example.com", "abcdefghijklmnop");
      expect(
        (
          await db.query<Record<string, unknown>>(
            "SELECT count(*)::int AS n FROM waitlist_signups WHERE referred_by IS NOT NULL",
          )
        ).rows[0],
      ).toEqual({ n: 0 });
    } finally {
      await db.close();
    }
  });

  it("removes unsubscribed, suppressed and expired referrals without retaining an inflated counter", async () => {
    const db = await database();
    try {
      const owner = await join(db, "owner@example.com");
      await join(db, "friend1@example.com", owner.referral_code);
      await join(db, "friend2@example.com", owner.referral_code);
      await join(db, "friend3@example.com", owner.referral_code);
      expect((await progress(db, owner.inviteToken))?.qualifiedReferrals).toBe(
        3,
      );
      await act(db, {
        ...common,
        kind: "unsubscribe",
        token: (await mailTokens(db, "friend1@example.com", "welcome"))
          .unsubscribeToken,
      });
      await db.query(
        "UPDATE waitlist_outbox SET state='sent',provider_id='provider-friend' WHERE signup_id=(SELECT id FROM waitlist_signups WHERE email='friend2@example.com') AND kind='welcome'",
      );
      await applyEvent(
        db,
        "bounce-1",
        {
          type: "email.bounced",
          data: { to: ["friend2@example.com"], email_id: "provider-friend" },
        },
        secret,
      );
      await db.query<Record<string, unknown>>(
        "UPDATE waitlist_signups SET expires_at=now()-interval '1 day' WHERE email='friend3@example.com'",
      );
      expect((await progress(db, owner.inviteToken))?.qualifiedReferrals).toBe(
        0,
      );
      await purge(db);
      expect((await progress(db, owner.inviteToken))?.qualifiedReferrals).toBe(
        0,
      );
    } finally {
      await db.close();
    }
  });

  it("rejects a public code, unrelated capability, revoked owner and stale suppression", async () => {
    const db = await database();
    try {
      const owner = await join(db, "owner@example.com");
      expect(await progress(db, owner.referral_code)).toBeNull();
      expect(await progress(db, owner.confirmation.token)).toBeNull();
      expect(await progress(db, "x".repeat(43))).toBeNull();
      const friend = await join(db, "friend@example.com", owner.referral_code);
      await db.query<Record<string, unknown>>(
        "INSERT INTO waitlist_suppressions(email_hash) VALUES($1)",
        [digest(secret, "suppression", "friend@example.com")],
      );
      expect((await progress(db, owner.inviteToken))?.qualifiedReferrals).toBe(
        0,
      );
      expect(await progress(db, friend.inviteToken)).toBeNull();
      await act(db, {
        ...common,
        kind: "unsubscribe",
        token: (await mailTokens(db, "owner@example.com", "welcome"))
          .unsubscribeToken,
      });
      expect(await progress(db, owner.inviteToken)).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("stores a distinct hashed dashboard capability and encrypted welcome with separate public sharing URL", async () => {
    const db = await database();
    try {
      const owner = await join(db, "owner@example.com");
      const row = (
        await db.query<Record<string, unknown>>(
          "SELECT invite_token_hash FROM waitlist_signups",
        )
      ).rows[0];
      expect(row.invite_token_hash).toBe(
        digest(secret, "invite-dashboard", owner.inviteToken),
      );
      expect(owner.inviteToken).not.toBe(owner.referral_code);
      const sealed = String(
        (
          await db.query<Record<string, unknown>>(
            "SELECT sealed_tokens FROM waitlist_outbox WHERE kind='welcome'",
          )
        ).rows[0].sealed_tokens,
      );
      expect(sealed).not.toContain(owner.inviteToken);
      expect(
        (await mailTokens(db, "owner@example.com", "welcome")).inviteToken,
      ).toBe(owner.inviteToken);
      const mail = renderWaitlistEmail("welcome", {
        origin: "https://example.com",
        token: "",
        inviteToken: owner.inviteToken,
        referralCode: owner.referral_code,
      });
      expect(mail.text).toContain(
        `/waitlist/invite?token=${owner.inviteToken}`,
      );
      expect(mail.text).toContain(
        inviteShareUrl("https://example.com", owner.referral_code),
      );
      expect(
        inviteShareUrl("https://example.com", owner.referral_code),
      ).not.toContain(owner.inviteToken);
      expect(inviteCookie(owner.inviteToken, "https://example.com")).toContain(
        "HttpOnly; SameSite=Strict; Secure",
      );
      expect(
        await act(db, {
          ...common,
          kind: "confirm",
          token: owner.confirmation.token,
        }),
      ).toBeUndefined();
    } finally {
      await db.close();
    }
  });

  it("rate limits valid-shape dashboard guesses without disclosing whether a code exists", async () => {
    const db = await database();
    try {
      for (let i = 0; i < 60; i++)
        expect(await progress(db, "x".repeat(43))).toBeNull();
      await expect(progress(db, "x".repeat(43))).rejects.toMatchObject({
        kind: "rate_limited",
      });
    } finally {
      await db.close();
    }
  });
});
