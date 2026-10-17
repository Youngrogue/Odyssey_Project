import { readFileSync, readdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { describe, it, expect } from "vitest";
import { act, enroll } from "../src/lib/email/lifecycle";
import { saveSignup } from "../src/lib/waitlist/store";
import { token, unseal } from "../src/lib/email/security";
const url = process.env.WAITLIST_TEST_POSTGRES_URL;

// Real competing transactions require two database connections. This never
// connects to DATABASE_URL; operators must supply an explicit disposable local DB.
describe.skipIf(!url)("two-connection referral attribution", () => {
  it("serializes first attribution and keeps signup valid during referrer deletion", async () => {
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
        await saveSignup(a, { ...common, email });
        const job = (
          await a.query(
            "SELECT sealed_tokens FROM waitlist_outbox o JOIN waitlist_signups s ON s.id=o.signup_id WHERE s.email=$1 AND o.kind='confirmation'",
            [email],
          )
        ).rows[0];
        await act(a, {
          ...common,
          kind: "confirm",
          token: unseal<{ token: string }>(job.sealed_tokens, common.secret)
            .token,
        });
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
      expect(rows).toEqual([{ referred_by: first.id }]);
      expect(
        (
          await a.query(
            "SELECT count(*)::int AS n FROM waitlist_outbox o JOIN waitlist_signups s ON s.id=o.signup_id WHERE s.email='friend@example.com'",
          )
        ).rows,
      ).toEqual([{ n: 1 }]);

      // Pause after the referrer lookup and before signup insertion. Deletion
      // must block on the lookup's KEY SHARE lock, not reach the FK gap.
      const removed = await owner("removed@example.com");
      let deleting: Promise<unknown> | undefined;
      const lockedLookup = {
        query: async (sql: string, params?: unknown[]) => {
          const result = await a.query(sql, params);
          if (sql.includes("FOR KEY SHARE OF s")) {
            deleting = b.query("DELETE FROM waitlist_signups WHERE id=$1", [
              removed.id,
            ]);
            let blocked = false;
            for (let i = 0; i < 100; i++) {
              const waiting = (
                await a.query(
                  "SELECT wait_event_type FROM pg_stat_activity WHERE pid=$1",
                  [pid],
                )
              ).rows[0];
              if (waiting?.wait_event_type === "Lock") {
                blocked = true;
                break;
              }
              await new Promise((resolve) => setTimeout(resolve, 10));
            }
            expect(blocked).toBe(true);
          }
          return result;
        },
      };
      await a.query("BEGIN");
      try {
        await enroll(
          lockedLookup,
          {
            ...common,
            email: "during-delete@example.com",
            referralCode: removed.referral_code,
          },
          token(),
        );
        expect(deleting).toBeDefined();
        await a.query("COMMIT");
      } catch (error) {
        await a.query("ROLLBACK");
        await deleting;
        throw error;
      }
      await deleting;
      expect(
        (
          await a.query(
            "SELECT state,referred_by FROM waitlist_signups WHERE email='during-delete@example.com'",
          )
        ).rows,
      ).toEqual([{ state: "pending", referred_by: null }]);
      expect(
        (
          await a.query(
            "SELECT count(*)::int AS n FROM waitlist_outbox o JOIN waitlist_signups s ON s.id=o.signup_id WHERE s.email='during-delete@example.com' AND kind='confirmation'",
          )
        ).rows,
      ).toEqual([{ n: 1 }]);
      // If deletion commits first, the same obsolete code is simply ignored.
      await saveSignup(a, {
        ...common,
        email: "after-delete@example.com",
        referralCode: removed.referral_code,
      });
      expect(
        (
          await a.query(
            "SELECT state,referred_by FROM waitlist_signups WHERE email='after-delete@example.com'",
          )
        ).rows,
      ).toEqual([{ state: "pending", referred_by: null }]);
    } finally {
      await a.query("ROLLBACK").catch(() => undefined);
      await b.query("ROLLBACK").catch(() => undefined);
      await a.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await a.end();
      await b.end();
    }
  }, 30000);
});
