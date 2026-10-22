import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { describe, it, expect } from "vitest";
import { enroll } from "../src/lib/email/lifecycle";
import { saveSignup } from "../src/lib/waitlist/store";
import { token } from "../src/lib/email/security";
const url = process.env.WAITLIST_TEST_POSTGRES_URL;

// Real competing transactions require two database connections. This never
// connects to DATABASE_URL; operators must supply an explicit disposable local DB.
describe.skipIf(!url)("two-connection legacy referral intake", () => {
  it("serializes duplicate signup without creating referral attribution", async () => {
    if (!["127.0.0.1", "localhost", "[::1]"].includes(new URL(url!).hostname))
      throw Error("Use a disposable loopback PostgreSQL database only");
    const a = new Client({ connectionString: url }),
      b = new Client({ connectionString: url });
    const schema = `referrals_test_${randomUUID().replaceAll("-", "")}`;
    await a.connect();
    await b.connect();
    const common = {
      secret: "referral-race-test-at-least-32-characters",
      ip: "127.0.0.1",
      retentionDays: 90,
    };
    try {
      await a.query(`CREATE SCHEMA ${schema}`);
      await a.query(`SET search_path TO ${schema}`);
      await b.query(`SET search_path TO ${schema}`);
      for (const file of readdirSync("db")
        .filter((f) => /^\d+.*\.sql$/.test(f))
        .sort())
        await a.query(readFileSync(`db/${file}`, "utf8"));
      async function owner(email: string) {
        // Joining confirms immediately under single opt-in.
        await saveSignup(a, { ...common, email });
        return (
          await a.query(
            "SELECT id,referral_code FROM waitlist_signups WHERE email=$1",
            [email],
          )
        ).rows[0];
      }
      const first = await owner("first@example.com"),
        second = await owner("second@example.com");
      const pid = (await b.query("SELECT pg_backend_pid() AS pid")).rows[0].pid;
      await a.query("BEGIN");
      await enroll(
        a,
        {
          ...common,
          email: "friend@example.com",
          referralCode: first.referral_code,
        },
        token(),
      );
      const competing = saveSignup(b, {
        ...common,
        email: "friend@example.com",
        referralCode: second.referral_code,
      });
      try {
        let blocked = false;
        for (let i = 0; i < 100; i++) {
          const row = (
            await a.query(
              "SELECT wait_event FROM pg_stat_activity WHERE pid=$1",
              [pid],
            )
          ).rows[0];
          if (row?.wait_event === "advisory") {
            blocked = true;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
        expect(blocked).toBe(true);
        await a.query("COMMIT");
      } catch (error) {
        await a.query("ROLLBACK");
        await competing;
        throw error;
      }
      await competing;
      const rows = (
        await a.query(
          "SELECT referred_by FROM waitlist_signups WHERE email='friend@example.com'",
        )
      ).rows;
      expect(rows).toEqual([{ referred_by: null }]);
      expect(
        (
          await a.query(
            "SELECT count(*)::int AS n FROM waitlist_outbox o JOIN waitlist_signups s ON s.id=o.signup_id WHERE s.email='friend@example.com'",
          )
        ).rows,
      ).toEqual([{ n: 1 }]);
    } finally {
      await a.query("ROLLBACK").catch(() => undefined);
      await b.query("ROLLBACK").catch(() => undefined);
      await a.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await a.end();
      await b.end();
    }
  }, 30000);
});
