import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { describe, it, expect } from "vitest";
import { lockAddress, isSuppressed } from "../src/lib/email/locking";
import { enroll } from "../src/lib/email/lifecycle";
import { saveSignup } from "../src/lib/waitlist/store";
import { applyEvent } from "../src/lib/email/webhook";
import { digest, token } from "../src/lib/email/security";
const url = process.env.WAITLIST_TEST_POSTGRES_URL;
// Explicit opt-in ONLY: never uses DATABASE_URL or a remote/production database.
describe.skipIf(!url)(
  "two-connection local PostgreSQL suppression serialization",
  () => {
    it("serializes both absent-row interleavings without sending to a suppressed address", async () => {
      const parsed = new URL(url!);
      if (!["127.0.0.1", "localhost", "[::1]"].includes(parsed.hostname))
        throw Error("Use a disposable loopback PostgreSQL database only");
      const a = new Client({ connectionString: url }),
        b = new Client({ connectionString: url });
      const schema = `waitlist_test_${randomUUID().replaceAll("-", "")}`;
      await a.connect();
      await b.connect();
      try {
        await a.query(`CREATE SCHEMA ${schema}`);
        await a.query(`SET search_path TO ${schema}`);
        await b.query(`SET search_path TO ${schema}`);
        for (const f of [
          "001_waitlist.sql",
          "002_waitlist_email.sql",
          "003_waitlist_review_fixes.sql",
        ])
          await a.query(readFileSync(`db/${f}`, "utf8"));
        const pid = Number(
          (await b.query("SELECT pg_backend_pid() AS pid")).rows[0].pid,
        );
        async function waitForAddressLock() {
          for (let i = 0; i < 100; i++) {
            const row = (
              await a.query(
                "SELECT wait_event FROM pg_stat_activity WHERE pid=$1",
                [pid],
              )
            ).rows[0];
            if (row?.wait_event === "advisory") return;
            await new Promise((resolve) => setTimeout(resolve, 10));
          }
          throw Error(
            "Second connection did not block on the address advisory lock",
          );
        }
        const input = {
          email: "absent@example.com",
          secret: "test-secret-with-at-least-32-characters",
          ip: "127.0.0.1",
          retentionDays: 90,
        };
        await a.query("BEGIN");
        await lockAddress(a, input.secret, input.email);
        expect(await isSuppressed(a, input.secret, input.email)).toBe(false);
        const event = applyEvent(
          b,
          "race-1",
          {
            type: "email.complained",
            data: { to: [input.email], email_id: "old-message" },
          },
          input.secret,
        );
        try {
          await waitForAddressLock();
          await enroll(a, input, token());
          await a.query("COMMIT");
        } catch (e) {
          await a.query("ROLLBACK");
          await event;
          throw e;
        }
        await event;
        expect(
          (await a.query("SELECT state FROM waitlist_signups")).rows,
        ).toEqual([{ state: "suppressed" }]);
        expect(
          (
            await a.query(
              "SELECT count(*)::int AS n FROM waitlist_outbox WHERE state='queued'",
            )
          ).rows,
        ).toEqual([{ n: 0 }]);
        // Opposite ordering: suppression exists transactionally before absent enrollment.
        const other = { ...input, email: "other-absent@example.com" };
        await a.query("BEGIN");
        await lockAddress(a, other.secret, other.email);
        await a.query(
          "INSERT INTO waitlist_suppressions(email_hash) VALUES($1)",
          [digest(other.secret, "suppression", other.email)],
        );
        const signup = saveSignup(b, other);
        try {
          await waitForAddressLock();
          await a.query("COMMIT");
        } catch (e) {
          await a.query("ROLLBACK");
          await signup;
          throw e;
        }
        await signup;
        expect(
          (
            await a.query(
              "SELECT count(*)::int AS n FROM waitlist_signups WHERE email=$1",
              [other.email],
            )
          ).rows,
        ).toEqual([{ n: 0 }]);
      } finally {
        await a.query("ROLLBACK").catch(() => undefined);
        await b.query("ROLLBACK").catch(() => undefined);
        await a.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
        await a.end();
        await b.end();
      }
    }, 30000);
  },
);
