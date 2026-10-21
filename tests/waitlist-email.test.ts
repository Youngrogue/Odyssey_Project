import { renderToStaticMarkup } from "react-dom/server";
import { actionHandler } from "../src/lib/email/handlers";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import { describe, it, expect, vi } from "vitest";
import { saveSignup } from "../src/lib/waitlist/store";
import { act, resend, purge } from "../src/lib/email/lifecycle";
import { drain } from "../src/lib/email/worker";
import { digest, unseal, verifyWebhook } from "../src/lib/email/security";
import { applyEvent } from "../src/lib/email/webhook";
import Confirm from "../src/app/waitlist/confirm/page";
const secret = "a-testing-secret-of-at-least-32-characters";
const input = {
  email: "person@example.com",
  ip: "127.0.0.1",
  secret,
  retentionDays: 90,
};
const config = {
  origin: "https://example.com",
  tokenSecret: secret,
  apiKey: "re_test",
  from: "hello@example.com",
  contactEmail: "help@example.com",
  dailyBudget: 100,
};
async function setup() {
  const db = new PGlite();
  for (const f of [
    "001_waitlist.sql",
    "002_waitlist_email.sql",
    "003_waitlist_review_fixes.sql",
    "004_waitlist_referrals.sql",
  ])
    await db.exec(readFileSync(`db/${f}`, "utf8"));
  await saveSignup(db, input);
  return db;
}
async function tokens(db: PGlite, kind = "confirmation") {
  const r = await db.query<{ sealed_tokens: string }>(
    `SELECT sealed_tokens FROM waitlist_outbox WHERE kind=$1 ORDER BY id DESC LIMIT 1`,
    [kind],
  );
  return unseal<{ token: string; unsubscribeToken: string }>(
    r.rows[0].sealed_tokens,
    secret,
  );
}
async function confirm(db: PGlite) {
  await act(db, { ...input, kind: "confirm", token: (await tokens(db)).token });
}
const accepted = () =>
  vi.fn<typeof fetch>().mockResolvedValue(Response.json({ id: "provider-1" }));
describe("durable email lifecycle", () => {
  it("cleanup resumes bounded batches without deleting live signups or suppressions", async () => {
    const db = await setup();
    await saveSignup(db, { ...input, email: "expired@example.com" });
    await saveSignup(db, { ...input, email: "live@example.com" });
    await db.query(
      "UPDATE waitlist_signups SET expires_at=now()-interval '1 day' WHERE email<>'live@example.com'",
    );
    await db.query(
      "INSERT INTO waitlist_suppressions(email_hash) VALUES('retained-test-hash')",
    );
    expect(await purge(db, 1)).toBe(true);
    expect(await purge(db, 1)).toBe(false);
    expect((await db.query("SELECT email FROM waitlist_signups")).rows).toEqual(
      [{ email: "live@example.com" }],
    );
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_suppressions"))
        .rows[0],
    ).toEqual({ n: 1 });
    await expect(purge(db, 501)).rejects.toThrow("Invalid cleanup batch size");
    await db.close();
  });
  it("native unavailable action returns a safe styled redirect and resend copy does not imply confirmation", async () => {
    const prior = process.env.WAITLIST_ENABLED;
    process.env.WAITLIST_ENABLED = "false";
    try {
      const response = await actionHandler(
        new Request("https://example.com/api/waitlist/confirm", {
          method: "POST",
          headers: { "content-type": "application/x-www-form-urlencoded" },
          body: "token=private-value",
        }),
        "confirm",
      );
      expect(response.status).toBe(303);
      expect(response.headers.get("location")).toBe(
        "/waitlist/confirm?error=unavailable",
      );
      const html = renderToStaticMarkup(
        await Confirm({ searchParams: Promise.resolve({ resent: "1" }) }),
      );
      expect(html).toContain("Request saved.");
      expect(html).not.toContain("now confirmed");
    } finally {
      if (prior === undefined) delete process.env.WAITLIST_ENABLED;
      else process.env.WAITLIST_ENABLED = prior;
    }
  });
  it("send-phase recheck cancels suppression arriving after durable intent", async () => {
    const db = await setup();
    let commits = 0;
    const wrapped = {
      query: async (sql: string, params?: unknown[]) => {
        const result = await db.query<Record<string, unknown>>(sql, params);
        if (sql === "COMMIT" && ++commits === 1)
          await db.query(
            "INSERT INTO waitlist_suppressions(email_hash) VALUES($1)",
            [digest(secret, "suppression", input.email)],
          );
        return result;
      },
    };
    const send = accepted();
    await drain(wrapped, config, send);
    expect(send).not.toHaveBeenCalled();
    expect((await db.query("SELECT state FROM waitlist_outbox")).rows).toEqual([
      { state: "cancelled" },
    ]);
    await db.close();
  });

  it.each(["resend", "confirmation"])(
    "original unsubscribe link survives %s",
    async (transition) => {
      const db = await setup();
      const original = await tokens(db);
      if (transition === "resend") {
        await db.query(
          "UPDATE waitlist_signups SET last_confirmation_at=now()-interval '2 minutes'",
        );
        await resend(db, input);
      } else await confirm(db);
      await act(db, {
        ...input,
        kind: "unsubscribe",
        token: original.unsubscribeToken,
      });
      expect(
        (await db.query("SELECT state FROM waitlist_signups")).rows,
      ).toEqual([{ state: "unsubscribed" }]);
      expect(
        (
          await db.query(
            "SELECT count(*)::int AS n FROM waitlist_outbox WHERE state='queued'",
          )
        ).rows,
      ).toEqual([{ n: 0 }]);
      expect(
        (await db.query("SELECT count(*)::int AS n FROM waitlist_suppressions"))
          .rows,
      ).toEqual([{ n: 1 }]);
      await db.close();
    },
  );
  it("worker and confirmation reject a suppression even if signup state is stale", async () => {
    const db = await setup();
    await db.query("INSERT INTO waitlist_suppressions(email_hash) VALUES($1)", [
      digest(secret, "suppression", input.email),
    ]);
    await confirm(db);
    const send = accepted();
    await drain(db, config, send);
    expect(send).not.toHaveBeenCalled();
    expect((await db.query("SELECT state FROM waitlist_signups")).rows).toEqual(
      [{ state: "pending" }],
    );
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM waitlist_outbox WHERE state='queued'",
        )
      ).rows,
    ).toEqual([{ n: 0 }]);
    await db.close();
  });
  it("delivery before provider mapping remains reconcilable and unrelated IDs stay metadata only", async () => {
    const db = await setup();
    await applyEvent(
      db,
      "early-delivery",
      { type: "email.delivered", data: { email_id: "provider-1" } },
      secret,
    );
    await applyEvent(
      db,
      "unrelated-delivery",
      {
        type: "email.delivered",
        data: { email_id: "another-provider-message" },
      },
      secret,
    );
    expect(
      (await db.query("SELECT delivered_at FROM waitlist_outbox")).rows,
    ).toEqual([{ delivered_at: null }]);
    await drain(db, config, accepted());
    expect(
      (
        await db.query(
          "SELECT delivered_at IS NOT NULL AS delivered FROM waitlist_outbox",
        )
      ).rows,
    ).toEqual([{ delivered: true }]);
    await applyEvent(
      db,
      "early-delivery",
      { type: "email.delivered", data: { email_id: "provider-1" } },
      secret,
    );
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM waitlist_provider_events",
        )
      ).rows,
    ).toEqual([{ n: 2 }]);
    expect((await db.query("SELECT state FROM waitlist_signups")).rows).toEqual(
      [{ state: "pending" }],
    );
    await db.close();
  });

  it("migration never confirms or emails old intake rows", async () => {
    const db = new PGlite();
    await db.exec(readFileSync("db/001_waitlist.sql", "utf8"));
    await db.query(
      "INSERT INTO waitlist_signups(email,notice_version,expires_at,token_hash,token_expires_at) VALUES('legacy@example.com','old',now()+interval '90 days','old-hash',now()+interval '1 day')",
    );
    await db.exec(readFileSync("db/002_waitlist_email.sql", "utf8"));
    expect(
      (await db.query("SELECT state,confirmed_at FROM waitlist_signups")).rows,
    ).toEqual([{ state: "pending", confirmed_at: null }]);
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_outbox")).rows,
    ).toEqual([{ n: 0 }]);
    await db.close();
  });
  it("reclaims abandoned leases and rolls back intake if durable queue insertion fails", async () => {
    const db = await setup();
    await db.query(
      "UPDATE waitlist_outbox SET lease_until=now()-interval '1 minute',first_attempt_at=now()-interval '2 minutes',attempts=1",
    );
    const send = accepted();
    await drain(db, config, send);
    expect(send).toHaveBeenCalledTimes(1);
    await db.exec("DROP TABLE waitlist_outbox");
    await expect(
      saveSignup(db, { ...input, email: "other@example.com" }),
    ).rejects.toThrow();
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_signups")).rows,
    ).toEqual([{ n: 1 }]);
    await db.close();
  });

  it("keeps migrated addresses pending and duplicates cannot enqueue mail or overwrite preferences", async () => {
    const db = await setup();
    await db.query("UPDATE waitlist_signups SET city='lagos'");
    await saveSignup(db, input);
    expect(
      (await db.query("SELECT state,city FROM waitlist_signups")).rows,
    ).toEqual([{ state: "pending", city: "lagos" }]);
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_outbox")).rows,
    ).toEqual([{ n: 1 }]);
    await db.close();
  });
  it("GET renders without confirming, explicit confirmation replay queues no welcome", async () => {
    const db = await setup();
    await Confirm({
      searchParams: Promise.resolve({ token: (await tokens(db)).token }),
    });
    expect(
      (await db.query("SELECT state FROM waitlist_signups")).rows[0],
    ).toEqual({ state: "pending" });
    await confirm(db);
    await confirm(db);
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM waitlist_outbox WHERE kind='welcome'",
        )
      ).rows,
    ).toEqual([{ n: 0 }]);
    await db.close();
  });
  it("expired confirmation cannot subscribe", async () => {
    const db = await setup();
    await db.query(
      "UPDATE waitlist_signups SET confirmation_expires_at=now()-interval '1 second'",
    );
    await confirm(db);
    expect(
      (await db.query("SELECT state FROM waitlist_signups")).rows[0],
    ).toEqual({ state: "pending" });
    await db.close();
  });
  it("resend cooldown and three per day are durable", async () => {
    const db = await setup();
    await resend(db, input);
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_outbox"))
        .rows[0],
    ).toEqual({ n: 1 });
    for (let i = 0; i < 3; i++) {
      await db.query(
        "UPDATE waitlist_signups SET last_confirmation_at=now()-interval '2 minutes'",
      );
      await resend(db, input);
    }
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_outbox"))
        .rows[0],
    ).toEqual({ n: 3 });
    await db.close();
  });
  it("unsubscribe retains original confirmation token and cancels mail, blocks capture after purge and late delivery cannot undo it", async () => {
    const db = await setup();
    await confirm(db);
    await act(db, {
      ...input,
      kind: "unsubscribe",
      token: (await tokens(db)).unsubscribeToken,
    });
    await applyEvent(
      db,
      "late-delivery",
      { type: "email.delivered", data: { email_id: "not-yet-sent" } },
      secret,
    );
    const send = accepted();
    await drain(db, config, send);
    expect(send).not.toHaveBeenCalled();
    expect(
      (await db.query("SELECT state FROM waitlist_signups")).rows[0],
    ).toEqual({ state: "unsubscribed" });
    await db.query(
      "UPDATE waitlist_signups SET expires_at=now()-interval '1 day'",
    );
    await purge(db);
    await saveSignup(db, input);
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_signups"))
        .rows[0],
    ).toEqual({ n: 0 });
    await db.close();
  });
  it("network failure retries same key/payload and sends once", async () => {
    const db = await setup();
    const send = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(Error("timeout"))
      .mockResolvedValueOnce(Response.json({ id: "provider-1" }));
    await drain(db, config, send, 1);
    await db.query(
      "UPDATE waitlist_outbox SET available_at=now()-interval '1 minute'",
    );
    await drain(db, { ...config, from: "changed@example.com" }, send, 1);
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[0][1]?.body).toBe(send.mock.calls[1][1]?.body);
    expect(send.mock.calls[0][1]?.headers).toEqual(
      send.mock.calls[1][1]?.headers,
    );
    await drain(db, config, send, 1);
    expect(send).toHaveBeenCalledTimes(2);
    await db.close();
  });
  it("parks ambiguous attempts beyond provider window and exhausted attempts", async () => {
    const db = await setup();
    await db.query(
      "UPDATE waitlist_outbox SET first_attempt_at=now()-interval '25 hours',attempts=1 WHERE kind='confirmation'",
    );
    const send = accepted();
    await drain(db, config, send);
    expect(send).not.toHaveBeenCalled();
    expect(
      (
        await db.query(
          "SELECT state FROM waitlist_outbox WHERE kind='confirmation'",
        )
      ).rows[0],
    ).toEqual({ state: "parked" });
    await db.close();
  });
  it("global budget cannot be exceeded and permanent provider errors park", async () => {
    const db = await setup();
    const send = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response("{}", { status: 401 }));
    await drain(db, { ...config, dailyBudget: 1 }, send);
    await confirm(db);
    await drain(db, { ...config, dailyBudget: 1 }, send);
    expect(send).toHaveBeenCalledTimes(1);
    expect(
      (
        await db.query(
          "SELECT state FROM waitlist_outbox WHERE kind='confirmation'",
        )
      ).rows[0],
    ).toEqual({ state: "parked" });
    await db.close();
  });
  it("unmapped bounces retry without trusting recipients, and mapped events dedupe after send commit", async () => {
    const db = await setup();
    const event = {
      type: "email.bounced",
      data: { email_id: "provider-1", to: [input.email] },
    };
    await expect(applyEvent(db, "event-1", event, secret)).rejects.toThrow(
      "Unmapped provider event",
    );
    expect(
      (await db.query("SELECT count(*)::int AS n FROM waitlist_suppressions"))
        .rows,
    ).toEqual([{ n: 0 }]);
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM waitlist_provider_events",
        )
      ).rows,
    ).toEqual([{ n: 0 }]);
    await db.query(
      "UPDATE waitlist_outbox SET state='sent',provider_id='provider-1'",
    );
    await applyEvent(db, "event-1", event, secret);
    await applyEvent(db, "event-1", event, secret);
    await applyEvent(
      db,
      "event-2",
      { type: "email.delivered", data: { email_id: "provider-1" } },
      secret,
    );
    expect(
      (await db.query("SELECT state FROM waitlist_signups")).rows[0],
    ).toEqual({ state: "suppressed" });
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM waitlist_provider_events",
        )
      ).rows[0],
    ).toEqual({ n: 2 });
    await saveSignup(db, input);
    expect(
      (
        await db.query(
          "SELECT count(*)::int AS n FROM waitlist_outbox WHERE state='queued'",
        )
      ).rows[0],
    ).toEqual({ n: 0 });
    await db.close();
  });
  it("foreign project events cannot suppress the same recipient and recipient fields cannot select another subscriber", async () => {
    const db = await setup();
    try {
      await saveSignup(db, { ...input, email: "other@example.com" });
      await expect(
        applyEvent(
          db,
          "foreign-event",
          {
            type: "email.complained",
            data: { email_id: "other-project-id", to: [input.email] },
          },
          secret,
        ),
      ).rejects.toThrow("Unmapped provider event");
      expect(
        (await db.query("SELECT count(*)::int AS n FROM waitlist_suppressions"))
          .rows,
      ).toEqual([{ n: 0 }]);
      await db.query(
        "UPDATE waitlist_outbox SET provider_id='owned-provider-id',state='sent' WHERE signup_id=(SELECT id FROM waitlist_signups WHERE email=$1)",
        [input.email],
      );
      await applyEvent(
        db,
        "owned-event",
        {
          type: "email.bounced",
          data: { email_id: "owned-provider-id", to: ["other@example.com"] },
        },
        secret,
      );
      expect(
        (
          await db.query(
            "SELECT email,state FROM waitlist_signups ORDER BY email",
          )
        ).rows,
      ).toEqual([
        { email: "other@example.com", state: "pending" },
        { email: input.email, state: "suppressed" },
      ]);
    } finally {
      await db.close();
    }
  });
  it("verifies raw signatures, rejects forgery and stale replay", () => {
    const webhookSecret = "whsec_" + Buffer.from(secret).toString("base64"),
      body = '{"type":"email.delivered"}',
      now = Date.now(),
      stamp = String(Math.floor(now / 1000));
    const signature = createHmac("sha256", Buffer.from(secret))
      .update(`evt.${stamp}.${body}`)
      .digest("base64");
    const headers = new Headers({
      "svix-id": "evt",
      "svix-timestamp": stamp,
      "svix-signature": `v1,${signature}`,
    });
    expect(verifyWebhook(body, headers, webhookSecret, now)).toBe(true);
    expect(verifyWebhook(body + " ", headers, webhookSecret, now)).toBe(false);
    expect(verifyWebhook(body, headers, webhookSecret, now + 301000)).toBe(
      false,
    );
  });
});
