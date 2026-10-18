import { describe, expect, it, vi } from "vitest";
import type { spawnSync } from "node:child_process";
import { compileRecoveryWorker } from "../scripts/test-recovery-worker.mjs";

describe("isolated recovery runtime build", () => {
  it("uses the installed CLI without package-manager repair or ambient credentials", () => {
    const spawn = vi.fn(() => ({ status: 0, stdout: "compiled", stderr: "" }));
    const scratch = "/tmp/closed-recovery-test";
    compileRecoveryWorker(
      scratch,
      {
        PATH: "/test/bin",
        HOME: "/real-owner-home",
        CI: "false",
        PNPM_HOME: "/installer/bin",
        CLOUDFLARE_API_TOKEN: "must-not-reach-child",
        DATABASE_URL: "must-not-reach-child",
        NODE_OPTIONS: "must-not-reach-child",
      },
      spawn as unknown as typeof spawnSync,
    );
    const [command, args, options] = spawn.mock.calls[0] as unknown as [
      string,
      string[],
      { env: Record<string, string>; timeout: number },
    ];
    expect(command).toBe(process.execPath);
    expect(args[0]).toMatch(/wrangler\/bin\/wrangler\.js$/);
    expect(args).toContain("--dry-run");
    expect(args).not.toContain("exec");
    expect(options.env).toEqual({
      PATH: "/test/bin",
      CI: "true",
      HOME: scratch,
      XDG_CONFIG_HOME: `${scratch}/config`,
      XDG_CACHE_HOME: `${scratch}/cache`,
      WRANGLER_SEND_METRICS: "false",
      WRANGLER_LOG_PATH: `${scratch}/logs`,
      CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false",
      CLOUDFLARE_INCLUDE_PROCESS_ENV: "false",
    });
    expect(options.timeout).toBe(60000);
  });

  it("fails compilation loudly with bounded compiler diagnostics instead of hiding the cause", () => {
    const spawn = vi.fn(() => ({
      status: 1,
      stdout: "x".repeat(10000),
      stderr: "\u001b[31mCompiler failure fixture\u001b[0m",
    }));
    let failure: unknown;
    try {
      compileRecoveryWorker(
        "/tmp/closed-recovery-test",
        {},
        spawn as unknown as typeof spawnSync,
      );
    } catch (error) {
      failure = error;
    }
    expect(failure).toBeInstanceOf(Error);
    const message = (failure as Error).message;
    expect(message).toContain("Closed scheduler must compile for workerd");
    expect(message).toContain("Compiler failure fixture");
    expect(message).not.toContain("\u001b");
    expect(message.length).toBeLessThan(6200);
  });
});
