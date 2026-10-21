import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { memoryRecovery } from "./helpers/recovery";
import { runScheduled } from "../cloudflare/scheduler";
import type {
  RecoveryNamespace,
  RecoveryState,
} from "../cloudflare/mail-recovery";

const bindings = vi.hoisted(() => ({
  value: undefined as undefined | { MAIL_RECOVERY?: RecoveryNamespace },
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => {
    if (!bindings.value) throw new Error("Local Next runtime");
    return { env: bindings.value };
  },
}));
import {
  beginMailTransaction,
  nextMailRecovery,
} from "../src/lib/email/recovery";
import { saveSignup } from "../src/lib/waitlist/store";
import { act, resend } from "../src/lib/email/lifecycle";
import { applyEvent, reconcileDeliveries } from "../src/lib/email/webhook";
import { drain } from "../src/lib/email/worker";
import { unseal } from "../src/lib/email/security";

afterEach(() => {
  bindings.value = undefined;
});

function scheduler(recovery = memoryRecovery()) {
  const fetch = vi.fn(async (_request: Request) =>
    Response.json({ ok: true, dueAt: null }),
  );
  return {
    recovery,
    fetch,
    env: {
      MAIL_RECOVERY: recovery.namespace,
      LANDING: { fetch },
      CRON_SECRET: "x".repeat(32),
      SCHEDULER_ENABLED: "true",
      MAIL_ENABLED: "true",
    },
  };
}

const input = {
  email: "recovery@example.com",
  ip: "127.0.0.1",
  secret: "a-testing-secret-of-at-least-32-characters",
  retentionDays: 180,
};
async function database() {
  const db = new PGlite();
  for (const filename of [
    "001_waitlist.sql",
    "002_waitlist_email.sql",
    "003_waitlist_review_fixes.sql",
    "004_waitlist_referrals.sql",
  ])
    await db.exec(readFileSync(`db/${filename}`, "utf8"));
  return db;
}
const cron = { cron: "*/5 * * * *" };

describe("durable idle-aware recovery", () => {
  it("sets transaction-local deadlines before application queries and rolls back failed setup", async () => {
    const calls: string[] = [];
    const query = vi.fn(async (sql: string) => {
      calls.push(sql);
      return { rows: [] };
    });
    await beginMailTransaction({ query });
    expect(calls).toEqual([
      "BEGIN",
      "SET LOCAL statement_timeout = '10s'",
      "SET LOCAL idle_in_transaction_session_timeout = '15s'",
      "SET LOCAL transaction_timeout = '20s'",
    ]);
    calls.length = 0;
    query.mockImplementation(async (sql: string) => {
      calls.push(sql);
      if (sql.includes("idle_in_transaction"))
        throw new Error("Timeout setup failed");
      return { rows: [] };
    });
    await expect(saveSignup({ query }, input)).rejects.toThrow(
      "Timeout setup failed",
    );
    expect(calls).toEqual([
      "BEGIN",
      "SET LOCAL statement_timeout = '10s'",
      "SET LOCAL idle_in_transaction_session_timeout = '15s'",
      "ROLLBACK",
    ]);
  });

  it("reconciles a new namespace once, preserves state on restart, and never connects to Neon while idle", async () => {
    const { recovery, fetch, env } = scheduler();
    await runScheduled(cron, env);
    recovery.restart();
    await runScheduled(cron, env);
    expect(fetch).toHaveBeenCalledOnce();
    expect(await (await recovery.request("/state")).json()).toEqual({
      revision: 1,
      dueAt: null,
    });
  });

  it("rejects stale projections and recovers a new committed signup on the next tick", async () => {
    const { recovery, fetch, env } = scheduler();
    fetch.mockImplementationOnce(async () => {
      await recovery.request("/arm", {});
      return Response.json({ ok: true, dueAt: null });
    });
    await runScheduled(cron, env);
    expect(await (await recovery.request("/state")).json()).toEqual({
      revision: 1,
      dueAt: 0,
    });
    await runScheduled(cron, env);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(await (await recovery.request("/state")).json()).toEqual({
      revision: 2,
      dueAt: null,
    });
    const stale = await recovery.request("/project", { revision: 1, dueAt: 0 });
    expect(await stale.json()).toEqual({ updated: false });
  });

  it("skips future work and paused mail, while cleanup remains active", async () => {
    const { recovery, fetch, env } = scheduler(
      memoryRecovery({ revision: 8, dueAt: Date.now() + 86400000 }),
    );
    await runScheduled(cron, env);
    expect(fetch).not.toHaveBeenCalled();
    await recovery.request("/arm", {});
    env.MAIL_ENABLED = "false";
    await runScheduled(cron, env);
    expect(fetch).not.toHaveBeenCalled();
    await runScheduled({ cron: "0 3 * * *" }, env);
    expect(fetch).toHaveBeenCalledOnce();
    expect((await (await recovery.request("/state")).json()).dueAt).toBe(0);
  });

  it.each(["failure", "malformed"])(
    "never clears dirty state on %s recovery",
    async (kind) => {
      const { recovery, fetch, env } = scheduler();
      fetch.mockImplementation(async () =>
        kind === "failure"
          ? new Response(null, { status: 503 })
          : Response.json({ ok: true }),
      );
      await expect(runScheduled(cron, env)).rejects.toThrow();
      expect(await (await recovery.request("/state")).json()).toEqual({
        revision: 0,
        dueAt: 0,
      });
    },
  );

  it("rolls back signup when durable arming is unavailable, but an uncertain acknowledgement only leaves a harmless wake", async () => {
    const db = await database();
    const recovery = memoryRecovery();
    bindings.value = {
      MAIL_RECOVERY: {
        ...recovery.namespace,
        get: () => ({
          fetch: async (request: Request) => {
            await recovery.namespace.get().fetch(request);
            throw new Error("Acknowledgement lost");
          },
        }),
      },
    };
    try {
      await expect(saveSignup(db, input)).rejects.toThrow(
        "Acknowledgement lost",
      );
      expect(
        (await db.query("SELECT count(*)::int AS count FROM waitlist_signups"))
          .rows,
      ).toEqual([{ count: 0 }]);
      expect(
        (await db.query("SELECT count(*)::int AS count FROM waitlist_outbox"))
          .rows,
      ).toEqual([{ count: 0 }]);
      bindings.value = { MAIL_RECOVERY: recovery.namespace };
      const harness = scheduler(recovery);
      harness.fetch.mockImplementation(async () =>
        Response.json({ ok: true, dueAt: await nextMailRecovery(db, 80) }),
      );
      await runScheduled(cron, harness.env);
      expect(
        (await (await recovery.request("/state")).json()).dueAt,
      ).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("arms signup and resend while confirmation queues no further mail, without requiring another request after their commit", async () => {
    const db = await database();
    const recovery = memoryRecovery();
    bindings.value = { MAIL_RECOVERY: recovery.namespace };
    const state = async () =>
      (await (await recovery.request("/state")).json()) as RecoveryState;
    try {
      await saveSignup(db, input);
      expect((await state()).revision).toBe(1);
      await saveSignup(db, input);
      await resend(db, input); // Cooldown: no new job.
      expect((await state()).revision).toBe(1);
      await db.query(
        "UPDATE waitlist_signups SET last_confirmation_at=now()-interval '2 minutes'",
      );
      await resend(db, input);
      expect((await state()).revision).toBe(2);
      const row = (
        await db.query<{ sealed_tokens: string }>(
          "SELECT sealed_tokens FROM waitlist_outbox WHERE state='queued'",
        )
      ).rows[0];
      const tokens = unseal<{ token: string }>(row.sealed_tokens, input.secret);
      await act(db, { ...input, token: tokens.token, kind: "confirm" });
      expect((await state()).revision).toBe(2);
      await act(db, { ...input, token: tokens.token, kind: "confirm" });
      expect((await state()).revision).toBe(2);
      const send = vi.fn(async () => Response.json({ id: "sent-welcome" }));
      const harness = scheduler(recovery);
      harness.fetch.mockImplementation(async () => {
        await drain(
          db,
          {
            origin: "https://example.com",
            tokenSecret: input.secret,
            apiKey: "re_test",
            from: "hello@example.com",
            contactEmail: "help@example.com",
            dailyBudget: 80,
          },
          send,
        );
        return Response.json({
          ok: true,
          dueAt: await nextMailRecovery(db, 80),
        });
      });
      await runScheduled(cron, harness.env);
      expect(send).not.toHaveBeenCalled();
      expect((await state()).dueAt).toBeNull();
    } finally {
      await db.close();
    }
  });

  it("projects the later of a job's availability and send lease", async () => {
    const db = await database();
    try {
      await saveSignup(db, input);
      await db.query(
        "UPDATE waitlist_outbox SET available_at='2030-01-01 00:00:00Z',lease_until='2030-01-02 00:00:00Z'",
      );
      expect(await nextMailRecovery(db, 80)).toBe(
        Date.parse("2030-01-02T00:00:00Z"),
      );
      await db.query(
        "UPDATE waitlist_outbox SET available_at='2030-01-03 00:00:00Z'",
      );
      expect(await nextMailRecovery(db, 80)).toBe(
        Date.parse("2030-01-03T00:00:00Z"),
      );
    } finally {
      await db.close();
    }
  });

  it("sleeps until budget rollover even when several queued jobs remain immediately available", async () => {
    const db = await database();
    const recovery = memoryRecovery();
    bindings.value = { MAIL_RECOVERY: recovery.namespace };
    try {
      await saveSignup(db, input);
      await saveSignup(db, { ...input, email: "another@example.com" });
      await db.query(
        "INSERT INTO waitlist_daily_counts(key_hash,attempts) VALUES('global-send-budget',80)",
      );
      const send = vi.fn(async () => Response.json({ id: "must-not-send" }));
      const harness = scheduler(recovery);
      harness.fetch.mockImplementation(async () => {
        await drain(
          db,
          {
            origin: "https://example.com",
            tokenSecret: input.secret,
            apiKey: "re_test",
            from: "hello@example.com",
            contactEmail: "help@example.com",
            dailyBudget: 80,
          },
          send,
        );
        return Response.json({
          ok: true,
          dueAt: await nextMailRecovery(db, 80),
        });
      });
      await runScheduled(cron, harness.env);
      expect(send).not.toHaveBeenCalled();
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS count FROM waitlist_outbox WHERE state='queued' AND available_at<=now()",
          )
        ).rows,
      ).toEqual([{ count: 1 }]);
      const state = await (await recovery.request("/state")).json();
      expect(state.dueAt).toBeGreaterThan(Date.now());
      await runScheduled(cron, harness.env);
      expect(harness.fetch).toHaveBeenCalledOnce();
    } finally {
      await db.close();
    }
  });

  it("keeps a late matched delivery due, while unmatched events and duplicate IDs do not cause continuous polling", async () => {
    const db = await database();
    const recovery = memoryRecovery();
    bindings.value = { MAIL_RECOVERY: recovery.namespace };
    try {
      await saveSignup(db, input);
      await db.query(
        "UPDATE waitlist_outbox SET state='sent',provider_id='provider-1'",
      );
      await reconcileDeliveries(db);
      await applyEvent(
        db,
        "late-delivery",
        { type: "email.delivered", data: { email_id: "provider-1" } },
        input.secret,
      );
      // Model a delivery's initial UPDATE running before sender provider_id is
      // visible, then its event COMMIT landing after the sender's reconciliation.
      await db.query("UPDATE waitlist_outbox SET delivered_at=NULL");
      await db.query(
        "INSERT INTO waitlist_daily_counts(key_hash,attempts) VALUES('global-send-budget',80)",
      );
      expect(await nextMailRecovery(db, 80)).toBe(0);
      await reconcileDeliveries(db);
      await applyEvent(
        db,
        "unknown-delivery",
        { type: "email.delivered", data: { email_id: "unrelated" } },
        input.secret,
      );
      const before = await (await recovery.request("/state")).json();
      await applyEvent(
        db,
        "unknown-delivery",
        { type: "email.delivered", data: { email_id: "unrelated" } },
        input.secret,
      );
      expect(await (await recovery.request("/state")).json()).toEqual(before);
      expect(await nextMailRecovery(db, 80)).toBeNull();
    } finally {
      await db.close();
    }
  });
});
