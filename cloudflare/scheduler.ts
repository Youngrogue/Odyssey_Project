interface SchedulerEnv {
  LANDING: { fetch(request: Request): Promise<Response> };
  CRON_SECRET?: string;
  SCHEDULER_ENABLED?: string;
  MAIL_ENABLED?: string;
}
interface Schedule {
  cron: string;
}
interface Context {
  waitUntil(promise: Promise<unknown>): void;
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
  for (let batch = 0; batch < (path === "purge" ? 3 : 1); batch++) {
    const response = await env.LANDING.fetch(
      new Request(`https://odyssey.internal/api/waitlist/${path}`, {
        headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
        signal: AbortSignal.timeout(25000),
      }),
    );
    if (!response.ok)
      throw new Error(`Scheduled ${path} failed (${response.status})`);
    if (path !== "purge") return;
    const result = (await response.json()) as { remaining?: boolean };
    if (!result.remaining) return;
  }
  throw new Error("Cleanup backlog remains; run another bounded cleanup pass");
}

export default {
  scheduled(event: Schedule, env: SchedulerEnv, ctx: Context) {
    ctx.waitUntil(runScheduled(event, env));
  },
  fetch() {
    return new Response("Not found", { status: 404 });
  },
};
