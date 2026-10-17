import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PGlite } from "@electric-sql/pglite";
import { saveSignup, savePreferences } from "../src/lib/waitlist/store";
import { waitlistNotice } from "../src/lib/waitlist/notice";

async function database() {
  const db = new PGlite();
  await db.exec(
    readFileSync(resolve(process.cwd(), "db/001_waitlist.sql"), "utf8"),
  );
  await db.exec(
    readFileSync(resolve(process.cwd(), "db/002_waitlist_email.sql"), "utf8"),
  );
  await db.exec(
    readFileSync(
      resolve(process.cwd(), "db/003_waitlist_review_fixes.sql"),
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      resolve(process.cwd(), "db/004_waitlist_referrals.sql"),
      "utf8",
    ),
  );
  return db;
}

const secret = "test-secret-with-at-least-32-characters";
const args = {
  email: "person@example.com",
  ip: "203.0.113.5",
  secret,
  retentionDays: 90,
};

describe("waitlist SQL", () => {
  it("commits a new signup before issuing a working capability", async () => {
    const db = await database();
    const result = await saveSignup(db, args);
    expect(result.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(
      (
        await db.query(
          "SELECT email, consent_purpose, notice_version, expires_at > NOW() AS retained FROM waitlist_signups",
        )
      ).rows,
    ).toEqual([
      expect.objectContaining({
        email: "person@example.com",
        consent_purpose: "waitlist_intake",
        notice_version: waitlistNotice.version,
        retained: true,
      }),
    ]);
    await savePreferences(db, {
      token: result.token,
      secret,
      ip: args.ip,
      city: "lagos",
      interests: ["food", "arts"],
    });
    expect(
      (await db.query("SELECT city, interests FROM waitlist_signups")).rows,
    ).toEqual([{ city: "lagos", interests: ["food", "arts"] }]);
    await db.close();
  });

  it("returns a same-shape dummy token for duplicate signup without changing the existing record", async () => {
    const db = await database();
    const first = await saveSignup(db, args);
    await db.query("UPDATE waitlist_signups SET notice_version='2026-10-01'");
    const duplicate = await saveSignup(db, args);
    expect(
      (await db.query("SELECT notice_version FROM waitlist_signups")).rows,
    ).toEqual([{ notice_version: "2026-10-01" }]);
    expect(duplicate.token).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(duplicate.token).not.toBe(first.token);
    await savePreferences(db, {
      token: duplicate.token,
      secret,
      ip: args.ip,
      city: "abuja",
      interests: ["games"],
    });
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS total, max(city) AS city FROM waitlist_signups",
        )
      ).rows,
    ).toEqual([{ total: 1, city: null }]);
    await db.close();
  });

  it("replaces an expired signup with fresh consent and an active capability", async () => {
    const db = await database();
    const first = await saveSignup(db, args);
    await db.query(
      "UPDATE waitlist_signups SET expires_at = now() - interval '1 day', city = 'lagos', interests = ARRAY['food']::text[]",
    );
    const renewed = await saveSignup(db, { ...args, ip: "203.0.113.6" });
    await savePreferences(db, {
      token: renewed.token,
      secret,
      ip: args.ip,
      city: "abuja",
      interests: ["games"],
    });
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS total, city, interests, expires_at > now() AS retained FROM waitlist_signups GROUP BY city, interests, expires_at",
        )
      ).rows,
    ).toEqual([
      { total: 1, city: "abuja", interests: ["games"], retained: true },
    ]);
    await savePreferences(db, {
      token: first.token,
      secret,
      ip: "203.0.113.7",
      city: "ibadan",
      interests: ["dance"],
    });
    expect((await db.query("SELECT city FROM waitlist_signups")).rows).toEqual([
      { city: "abuja" },
    ]);
    await db.close();
  });

  it("rejects excess attempts using durable SQL counters", async () => {
    const db = await database();
    for (let i = 0; i < 20; i++)
      await saveSignup(db, { ...args, email: `person${i}@example.com` });
    await expect(
      saveSignup(db, { ...args, email: "next@example.com" }),
    ).rejects.toMatchObject({ kind: "rate_limited" });
    expect(
      (await db.query("SELECT count(*)::int AS total FROM waitlist_signups"))
        .rows,
    ).toEqual([{ total: 20 }]);
    await db.close();
  });

  it("blocks repeated requests for one email even when the caller changes IP", async () => {
    const db = await database();
    for (let i = 0; i < 5; i++)
      await saveSignup(db, { ...args, ip: `203.0.113.${i + 1}` });
    await expect(
      saveSignup(db, { ...args, ip: "203.0.113.99" }),
    ).rejects.toMatchObject({ kind: "rate_limited" });
    await db.close();
  });

  it("does not allow an expired capability to change preferences", async () => {
    const db = await database();
    const { token } = await saveSignup(db, args);
    await db.query(
      "UPDATE waitlist_signups SET token_expires_at = now() - interval '1 minute'",
    );
    await savePreferences(db, {
      token,
      secret,
      ip: args.ip,
      city: "lagos",
      interests: ["food"],
    });
    expect((await db.query("SELECT city FROM waitlist_signups")).rows).toEqual([
      { city: null },
    ]);
    await db.close();
  });

  it("rate limits preference writes by caller even with a valid capability", async () => {
    const db = await database();
    const { token } = await saveSignup(db, args);
    const update = {
      token,
      secret,
      ip: "203.0.113.5",
      city: "lagos" as const,
      interests: ["food" as const],
    };
    for (let i = 0; i < 20; i++) await savePreferences(db, update);
    await expect(savePreferences(db, update)).rejects.toMatchObject({
      kind: "rate_limited",
    });
    await db.close();
  });

  it("does not issue success when storage fails", async () => {
    const db = await database();
    await db.exec("DROP TABLE waitlist_signups CASCADE");
    await expect(saveSignup(db, args)).rejects.toThrow();
    await db.close();
  });
});
