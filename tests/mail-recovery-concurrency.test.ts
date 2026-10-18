import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { afterEach, describe, expect, it, vi } from "vitest";
import type {
  RecoveryNamespace,
  RecoveryState,
} from "../cloudflare/mail-recovery";
import { memoryRecovery } from "./helpers/recovery";
const bindings = vi.hoisted(() => ({
  value: undefined as RecoveryNamespace | undefined,
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => {
    if (!bindings.value) throw new Error("Local Next runtime");
    return { env: { MAIL_RECOVERY: bindings.value } };
  },
}));
import { nextMailRecovery } from "../src/lib/email/recovery";
import { enroll } from "../src/lib/email/lifecycle";
import { saveSignup } from "../src/lib/waitlist/store";
import { applyEvent, reconcileDeliveries } from "../src/lib/email/webhook";
import { token } from "../src/lib/email/security";
import { lockAddress } from "../src/lib/email/locking";

const url = process.env.WAITLIST_TEST_POSTGRES_URL;
const input = {
  email: "recovery-race@example.com",
  ip: "127.0.0.1",
  secret: "a-testing-secret-of-at-least-32-characters",
  retentionDays: 180,
};
afterEach(() => {
  bindings.value = undefined;
});

async function setup() {
  if (
    !url ||
    !["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname)
  )
    throw new Error(
      "Use an explicitly supplied disposable loopback PostgreSQL database",
    );
  const a = new Client({ connectionString: url }),
    b = new Client({ connectionString: url });
  await a.connect();
  await b.connect();
  const schema = `recovery_${randomUUID().replaceAll("-", "")}`;
  await a.query(`CREATE SCHEMA ${schema}`);
  await a.query(`SET search_path TO ${schema}`);
  await b.query(`SET search_path TO ${schema}`);
  for (const filename of [
    "001_waitlist.sql",
    "002_waitlist_email.sql",
    "003_waitlist_review_fixes.sql",
    "004_waitlist_referrals.sql",
  ])
    await a.query(readFileSync(`db/${filename}`, "utf8"));
  const aPid = Number(
    (await a.query("SELECT pg_backend_pid() AS pid")).rows[0].pid,
  );
  const bPid = Number(
    (await b.query("SELECT pg_backend_pid() AS pid")).rows[0].pid,
  );
  return {
    a,
    b,
    aPid,
    bPid,
    close: async () => {
      await a.query("ROLLBACK").catch(() => undefined);
      await b.query("ROLLBACK").catch(() => undefined);
      await a.query(`DROP SCHEMA ${schema} CASCADE`);
      await a.end();
      await b.end();
    },
  };
}

async function waitForLock(observer: Client, pid: number) {
  for (let attempt = 0; attempt < 300; attempt++) {
    const row = (
      await observer.query(
        "SELECT wait_event FROM pg_stat_activity WHERE pid=$1",
        [pid],
      )
    ).rows[0];
    if (row?.wait_event === "advisory") return;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("Projection did not wait for the producer transaction");
}

describe.skipIf(!url)("PostgreSQL recovery commit races", () => {
  it("times out address-lock waits before durable arming and rolls back the producer", async () => {
    const { a, b, bPid, close } = await setup();
    const recovery = memoryRecovery();
    bindings.value = recovery.namespace;
    try {
      await a.query("BEGIN");
      await lockAddress(a, input.secret, input.email);
      const blocked = saveSignup(b, input);
      const rejected = expect(blocked).rejects.toMatchObject({ code: "57014" });
      await waitForLock(a, bPid);
      expect(await (await recovery.request("/state")).json()).toEqual({
        revision: 0,
        dueAt: 0,
      });
      await rejected;
      expect(
        (await b.query("SELECT count(*)::int AS count FROM waitlist_signups"))
          .rows,
      ).toEqual([{ count: 0 }]);
      expect(
        (
          await b.query(
            "SELECT count(*)::int AS count FROM waitlist_rate_limits",
          )
        ).rows,
      ).toEqual([{ count: 0 }]);
    } finally {
      await a.query("ROLLBACK").catch(() => undefined);
      await close();
    }
  }, 20000);

  it("waits for armed producers to commit or roll back, and cannot clear a newer producer", async () => {
    const { a, b, bPid, close } = await setup();
    const recovery = memoryRecovery();
    bindings.value = recovery.namespace;
    try {
      for (const commit of [true, false]) {
        await a.query("UPDATE waitlist_outbox SET state='cancelled'");
        await a.query("BEGIN");
        await enroll(a, { ...input, email: `${commit}@example.com` }, token());
        const state = (await (
          await recovery.request("/state")
        ).json()) as RecoveryState;
        expect(
          (
            await b.query(
              "SELECT count(*)::int AS count FROM waitlist_outbox WHERE state='queued'",
            )
          ).rows,
        ).toEqual([{ count: 0 }]);
        const projection = nextMailRecovery(b, 80);
        try {
          await waitForLock(a, bPid);
          await a.query(commit ? "COMMIT" : "ROLLBACK");
        } catch (error) {
          await a.query("ROLLBACK");
          await projection;
          throw error;
        }
        const dueAt = await projection;
        if (commit) {
          expect(dueAt).not.toBeNull();
          // The exclusive lock is now released, but projection still uses the
          // old revision. A later committed signup must win the CAS.
          await saveSignup(a, { ...input, email: "later@example.com" });
          expect(
            await (
              await recovery.request("/project", {
                revision: state.revision,
                dueAt,
              })
            ).json(),
          ).toEqual({ updated: false });
          expect((await (await recovery.request("/state")).json()).dueAt).toBe(
            0,
          );
        } else {
          expect(dueAt).toBeNull();
          expect(
            await (
              await recovery.request("/project", {
                revision: state.revision,
                dueAt,
              })
            ).json(),
          ).toEqual({ updated: true });
        }
      }
    } finally {
      await close();
    }
  }, 30000);

  it("keeps delivery reconciliation awake when webhook commit follows sender reconciliation", async () => {
    const { a, b, aPid, close } = await setup();
    const recovery = memoryRecovery();
    bindings.value = recovery.namespace;
    let finishWebhook: (() => void) | undefined;
    try {
      await saveSignup(a, input);
      await a.query("BEGIN");
      await a.query(
        "UPDATE waitlist_outbox SET state='sent',provider_id='delivery-race'",
      );
      let reachedCommit!: () => void;
      const beforeCommit = new Promise<void>((resolve) => {
        reachedCommit = resolve;
      });
      const commitGate = new Promise<void>((resolve) => {
        finishWebhook = resolve;
      });
      const webhook = applyEvent(
        {
          query: async (sql, params) => {
            if (sql === "COMMIT") {
              reachedCommit();
              await commitGate;
            }
            return b.query(sql, params);
          },
        },
        "delivery-event",
        { type: "email.delivered", data: { email_id: "delivery-race" } },
        input.secret,
      );
      await Promise.race([
        beforeCommit,
        webhook.then(() => {
          throw new Error("Webhook did not pause before commit");
        }),
      ]);
      await a.query("COMMIT");
      await reconcileDeliveries(a); // Event is not committed yet.
      const projection = nextMailRecovery(a, 80);
      try {
        await waitForLock(b, aPid);
        finishWebhook!();
        await webhook;
      } catch (error) {
        finishWebhook!();
        await webhook;
        await projection;
        throw error;
      }
      expect(await projection).toBe(0);
      await reconcileDeliveries(a);
      expect(await nextMailRecovery(a, 80)).toBeNull();
      expect(
        (
          await a.query(
            "SELECT delivered_at IS NOT NULL AS delivered FROM waitlist_outbox",
          )
        ).rows,
      ).toEqual([{ delivered: true }]);
    } finally {
      finishWebhook?.();
      await close();
    }
  }, 30000);
});
