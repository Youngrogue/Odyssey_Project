import { afterEach, describe, expect, it, vi } from "vitest";
const bindings = vi.hoisted(() => ({
  value: undefined as undefined | { DATABASE_URL?: string },
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
    transport: string;
  }[],
  fail: false,
}));
vi.mock("pg", () => ({
  Client: class {
    connect = vi.fn(async () => {
      if (clients.fail) throw Error("secret connection details");
    });
    end = vi.fn(async () => {});
    transport = "tcp";
    constructor() {
      clients.instances.push(this);
    }
  },
}));
vi.mock("@neondatabase/serverless", () => ({
  Client: class {
    transport = "websocket";
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
import { memoryRecovery } from "./helpers/recovery";
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
      DATABASE_URL:
        "postgresql://bound:secret@ep-test.neon.tech/db?sslmode=require",
    };
    expect(databaseConnectionString()).toContain("@ep-test.neon.tech/");
    expect(hasDatabaseConnection()).toBe(true);
    const one = await connectWaitlist();
    const two = await connectWaitlist();
    expect(one).not.toBe(two);
    expect(clients.instances.every((c) => c.transport === "tcp")).toBe(
      true,
    );
    await one.release();
    await two.release();
    expect(
      clients.instances.every((client) => client.end.mock.calls.length === 1),
    ).toBe(true);
    bindings.value = {};
    expect(hasDatabaseConnection()).toBe(false); // No ambient process fallback inside Workers.
    await expect(connectWaitlist()).rejects.toThrow("Database unavailable");
  });
  it("retains TCP only for local PostgreSQL development", async () => {
    vi.stubEnv("DATABASE_URL", "postgresql://local:secret@localhost/local");
    const client = await connectWaitlist();
    expect(clients.instances[0].transport).toBe("tcp");
    await client.release();
    expect(clients.instances[0].end).toHaveBeenCalledOnce();
  });
  it("fails closed for invalid or insecure Worker database settings", async () => {
    for (const value of [
      "not-a-url",
      "postgresql://user:secret@other.example/db?sslmode=require",
      "postgresql://user:secret@ep-test.neon.tech/db?sslmode=disable",
      "postgresql://user:secret@ep-test.neon.tech/db?sslmode=require&host=other.example",
      "postgresql://user:secret@ep-test.neon.tech/db?sslmode=require&sslmode=disable",
    ]) {
      bindings.value = { DATABASE_URL: value };
      expect(hasDatabaseConnection()).toBe(false);
      await expect(connectWaitlist()).rejects.toThrow("Database unavailable");
    }
    expect(clients.instances).toHaveLength(0);
  });
  it("cleans up Neon connection failures without exposing the URL", async () => {
    bindings.value = {
      DATABASE_URL:
        "postgresql://bound:secret@ep-test.neon.tech/db?sslmode=require",
    };
    clients.fail = true;
    await expect(connectWaitlist()).rejects.toThrow("Database unavailable");
    expect(clients.instances[0].end).toHaveBeenCalledOnce();
  });
});

describe("private scheduler", () => {
  it("surfaces a cleanup backlog after at most three committed batches", async () => {
    const fetch = vi.fn(async () =>
      Response.json({ ok: true, remaining: true }),
    );
    await expect(
      runScheduled(
        { cron: "0 3 * * *" },
        {
          LANDING: { fetch },
          MAIL_RECOVERY: memoryRecovery().namespace,
          CRON_SECRET: "x".repeat(32),
          SCHEDULER_ENABLED: "true",
          MAIL_ENABLED: "false",
        },
      ),
    ).rejects.toThrow("Cleanup backlog remains");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
  it("uses service-bound authentication and preserves cleanup while sending is paused", async () => {
    const fetch = vi.fn(async (_request: Request) => new Response("{}"));
    const env = {
      LANDING: { fetch },
      MAIL_RECOVERY: memoryRecovery().namespace,
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
      MAIL_RECOVERY: memoryRecovery().namespace,
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
