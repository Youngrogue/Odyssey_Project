import { describe, it, expect, vi } from "vitest";
const credentials = vi.hoisted(() => ({
  url: process.env.WAITLIST_TEST_NEON_URL,
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => ({ env: { DATABASE_URL: credentials.url } }),
}));
import { connectWaitlist } from "../src/lib/waitlist/db";

// Explicit isolated staging check only. Never falls back to DATABASE_URL.
describe.skipIf(!credentials.url)("direct Neon staging transport", () => {
  it("preserves rollback, session state and cross-connection transaction locks", async () => {
    let url: URL;
    try {
      url = new URL(credentials.url!);
    } catch {
      throw Error("Neon staging URL is invalid");
    }
    if (
      url.hostname !== "ep-ancient-dawn-zacmh8ub.c-2.eu-west-2.aws.neon.tech" ||
      url.pathname !== "/odyssey"
    )
      throw Error("Use the isolated Odyssey staging branch only");
    const a = await connectWaitlist();
    let b: Awaited<ReturnType<typeof connectWaitlist>> | undefined;
    try {
      b = await connectWaitlist();
      await a.query(
        "CREATE TEMP TABLE odyssey_transport_check (value integer)",
      );
      await a.query("BEGIN");
      await a.query("SET LOCAL statement_timeout = '10s'");
      await a.query("SET LOCAL idle_in_transaction_session_timeout = '15s'");
      await a.query("SET LOCAL transaction_timeout = '20s'");
      await a.query("INSERT INTO odyssey_transport_check VALUES ($1)", [42]);
      expect(
        (await a.query("SELECT value FROM odyssey_transport_check")).rows,
      ).toEqual([{ value: 42 }]);
      await a.query("ROLLBACK");
      expect(
        (await a.query("SELECT value FROM odyssey_transport_check")).rows,
      ).toEqual([]);
      await a.query("BEGIN");
      await a.query("INSERT INTO odyssey_transport_check VALUES ($1)", [7]);
      await a.query("COMMIT");
      expect(
        (await a.query("SELECT value FROM odyssey_transport_check")).rows,
      ).toEqual([{ value: 7 }]);
      await a.query("BEGIN");
      await b.query("BEGIN");
      await a.query("SELECT pg_advisory_xact_lock(1329879379, 9876)");
      expect(
        (
          await b.query(
            "SELECT pg_try_advisory_xact_lock(1329879379, 9876) AS acquired",
          )
        ).rows,
      ).toEqual([{ acquired: false }]);
      await a.query("ROLLBACK");
      expect(
        (
          await b.query(
            "SELECT pg_try_advisory_xact_lock(1329879379, 9876) AS acquired",
          )
        ).rows,
      ).toEqual([{ acquired: true }]);
      await b.query("COMMIT");
    } catch {
      // Provider/driver errors can include connection details. Keep CI logs generic.
      throw Error("Neon staging transaction verification failed");
    } finally {
      await Promise.all(
        [a, b]
          .filter((c) => c !== undefined)
          .map(async (c) => {
            await c.query("ROLLBACK").catch(() => undefined);
            await c.release().catch(() => {
              throw Error("Neon staging connection cleanup failed");
            });
          }),
      );
    }
  }, 30000);
});
