import {
  recoveryStub,
  validDueAt,
  validRecoveryState,
  type RecoveryNamespace,
} from "./mail-recovery";
export { MailRecovery } from "./mail-recovery";
export interface SchedulerEnv {
  LANDING: { fetch(request: Request): Promise<Response> };
  MAIL_RECOVERY: RecoveryNamespace;
  CRON_SECRET?: string;
  SCHEDULER_ENABLED?: string;
  MAIL_ENABLED?: string;
}
export interface Schedule {
  cron: string;
}

export async function runScheduled(event: Schedule, env: SchedulerEnv) {
  if (env.SCHEDULER_ENABLED !== "true") return;
  if (!env.CRON_SECRET || env.CRON_SECRET.length < 32)
    throw new Error("Scheduler configuration missing");
  const path =
    event.cron === "0 3 * * *"
      ? "purge"
      : event.cron === "*/5 * * * *"
        ? "cron"
        : null;
  if (!path) throw new Error("Unknown schedule");
  if (path === "cron" && env.MAIL_ENABLED !== "true") return;
  const recovery = path === "cron" ? recoveryStub(env.MAIL_RECOVERY) : null;
  let revision: number | undefined;
  if (recovery) {
    const response = await recovery.fetch(
      new Request("https://mail-recovery.internal/state", {
        signal: AbortSignal.timeout(3000),
      }),
    );
    if (!response.ok) throw new Error("Mail recovery unavailable");
    const state: unknown = await response.json();
    if (!validRecoveryState(state))
      throw new Error("Invalid mail recovery state");
    if (state.dueAt === null || state.dueAt > Date.now()) return;
    revision = state.revision;
  }
  for (let batch = 0; batch < (path === "purge" ? 3 : 1); batch++) {
    const response = await env.LANDING.fetch(
      new Request(`https://odyssey.internal/api/waitlist/${path}`, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
        signal: AbortSignal.timeout(25000),
      }),
    );
    if (!response.ok)
      throw new Error(`Scheduled ${path} failed (${response.status})`);
    if (path === "cron") {
      const result = (await response.json()) as { dueAt?: unknown };
      if (!validDueAt(result.dueAt))
        throw new Error("Invalid mail recovery result");
      // Use the original revision. A producer committed after the SQL projection
      // must win over this stale result, including a delayed retry of this RPC.
      const projected = await recovery!.fetch(
        new Request("https://mail-recovery.internal/project", {
          method: "POST",
          body: JSON.stringify({ revision, dueAt: result.dueAt }),
          signal: AbortSignal.timeout(3000),
        }),
      );
      if (!projected.ok) throw new Error("Mail recovery projection failed");
      return;
    }
    const result = (await response.json()) as { remaining?: boolean };
    if (!result.remaining) return;
  }
  throw new Error("Cleanup backlog remains; run another bounded cleanup pass");
}

export default {
  scheduled(
    event: Schedule,
    env: SchedulerEnv,
    ctx: { waitUntil(promise: Promise<unknown>): void },
  ) {
    ctx.waitUntil(runScheduled(event, env));
  },
  fetch() {
    return new Response("Not found", { status: 404 });
  },
};
