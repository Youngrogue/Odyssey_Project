export type RecoveryState = { revision: number; dueAt: number | null };

interface Storage {
  get<T>(key: string): Promise<T | undefined>;
  put(key: string, value: unknown): Promise<void>;
  transaction<T>(operation: (storage: Storage) => Promise<T>): Promise<T>;
}

export interface RecoveryNamespace {
  idFromName(name: string): unknown;
  get(id: unknown): { fetch(request: Request): Promise<Response> };
}

export function recoveryStub(namespace: RecoveryNamespace) {
  return namespace.get(namespace.idFromName("outbox"));
}

export function validDueAt(value: unknown): value is number | null {
  return value === null || (Number.isSafeInteger(value) && Number(value) >= 0);
}

export function validRecoveryState(value: unknown): value is RecoveryState {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<RecoveryState>;
  return (
    Number.isSafeInteger(candidate.revision) &&
    Number(candidate.revision) >= 0 &&
    validDueAt(candidate.dueAt)
  );
}

// SQLite-backed storage, shared by the landing Worker and its scheduler. It
// contains scheduling metadata only; PostgreSQL remains the authoritative outbox.
export class MailRecovery {
  constructor(private readonly ctx: { storage: Storage }) {}

  async fetch(request: Request) {
    const path = new URL(request.url).pathname;
    if (path === "/state" && request.method === "GET") {
      const state = await this.ctx.storage.get<RecoveryState>("state");
      // Reconcile once on first deployment, including any pre-existing jobs.
      return Response.json(state ?? { revision: 0, dueAt: 0 });
    }
    if (path === "/arm" && request.method === "POST") {
      await this.ctx.storage.transaction(async (storage) => {
        const state = await storage.get<RecoveryState>("state");
        await storage.put("state", {
          revision: (state?.revision ?? 0) + 1,
          dueAt: 0,
        });
      });
      return Response.json({ ok: true });
    }
    if (path === "/project" && request.method === "POST") {
      let projection: unknown;
      try {
        const body = await request.text();
        if (body.length > 128) return new Response(null, { status: 400 });
        projection = JSON.parse(body);
      } catch {
        return new Response(null, { status: 400 });
      }
      if (!validRecoveryState(projection))
        return new Response(null, { status: 400 });
      const expected = projection;
      const updated = await this.ctx.storage.transaction(async (storage) => {
        const state = (await storage.get<RecoveryState>("state")) ?? {
          revision: 0,
          dueAt: 0,
        };
        if (state.revision !== expected.revision) return false;
        await storage.put("state", {
          revision: state.revision + 1,
          dueAt: expected.dueAt,
        });
        return true;
      });
      return Response.json({ updated });
    }
    return new Response(null, { status: 404 });
  }
}
