import { afterEach, describe, expect, it, vi } from "vitest";
const bindings = vi.hoisted(() => ({
  value: undefined as undefined | { HYPERDRIVE?: { connectionString: string } },
}));
vi.mock("@opennextjs/cloudflare", () => ({
  getCloudflareContext: () => {
    if (!bindings.value) throw Error("Local Next runtime");
    return { env: bindings.value };
  },
}));
const clients = vi.hoisted(() => ({
  instances: [] as {
    connect: ReturnType<typeof vi.fn>;
    end: ReturnType<typeof vi.fn>;
  }[],
  fail: false,
}));
vi.mock("pg", () => ({
  Client: class {
    connect = vi.fn(async () => {
      if (clients.fail) throw Error("secret connection details");
    });
    end = vi.fn(async () => {});
    constructor() {
      clients.instances.push(this);
    }
  },
}));
import { connectWaitlist } from "../src/lib/waitlist/db";
import {
  hasDatabaseConnection,
  databaseConnectionString,
} from "../src/lib/waitlist/connection";
import { runScheduled } from "../cloudflare/scheduler";
afterEach(() => {
  bindings.value = undefined;
  clients.instances = [];
  clients.fail = false;
  vi.unstubAllEnvs();
});

describe("Workers database transport", () => {
  it("uses the current binding and creates and closes a separate client per invocation", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://local:unused@localhost/local");
    bindings.value = {
      HYPERDRIVE: {
        connectionString: "postgresql://bound:secret@hyperdrive/db",
      },
    };
    expect(databaseConnectionString()).toContain("@hyperdrive/");
    expect(hasDatabaseConnection()).toBe(true);
    const one = await connectWaitlist();
    const two = await connectWaitlist();
    expect(one).not.toBe(two);
    await one.release();
    await two.release();
    expect(
      clients.instances.every((client) => client.end.mock.calls.length === 1),
    ).toBe(true);
    bindings.value = {};
    expect(hasDatabaseConnection()).toBe(false); // No direct DB fallback inside Workers.
  });
  it("cleans up connection failures without exposing the URL", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://local:secret@localhost/local");
    clients.fail = true;
    await expect(connectWaitlist()).rejects.toThrow("Database unavailable");
    expect(clients.instances[0].end).toHaveBeenCalledOnce();
  });
});

describe("private scheduler", () => {
  it("surfaces a cleanup backlog after at most three committed batches", async () => {
    const fetch = vi.fn(async () => Response.json({ ok: true, remaining: true }));
    await expect(runScheduled({ cron: "0 3 * * *" }, {
      LANDING: { fetch }, CRON_SECRET: "x".repeat(32), SCHEDULER_ENABLED: "true", MAIL_ENABLED: "false",
    })).rejects.toThrow("Cleanup backlog remains");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("uses service-bound authentication and preserves cleanup while sending is paused", async () => {
    const fetch = vi.fn(async (_request: Request) => new Response("{}"));
    const env = {
      LANDING: { fetch },
      CRON_SECRET: "x".repeat(32),
      SCHEDULER_ENABLED: "true",
      MAIL_ENABLED: "false",
    };
    await runScheduled({ cron: "*/5 * * * *" }, env);
    expect(fetch).not.toHaveBeenCalled();
    await runScheduled({ cron: "0 3 * * *" }, env);
    const request = fetch.mock.calls[0][0] as Request;
    expect(new URL(request.url).pathname).toBe("/api/waitlist/purge");
    expect(request.headers.get("authorization")).toBe(
      `Bearer ${env.CRON_SECRET}`,
    );
  });
  it("surfaces failed recovery and refuses unknown schedules", async () => {
    const env = {
      LANDING: { fetch: vi.fn(async () => new Response("", { status: 503 })) },
      CRON_SECRET: "x".repeat(32),
      SCHEDULER_ENABLED: "true",
      MAIL_ENABLED: "true",
    };
    await expect(runScheduled({ cron: "*/5 * * * *" }, env)).rejects.toThrow(
      "503",
    );
    await expect(runScheduled({ cron: "* * * * *" }, env)).rejects.toThrow(
      "Unknown schedule",
    );
  });
});
