import {
  MailRecovery,
  type RecoveryState,
} from "../../cloudflare/mail-recovery";

export function memoryRecovery(initial?: RecoveryState) {
  const data = new Map<string, unknown>(initial ? [["state", initial]] : []);
  let pending = Promise.resolve();
  const storage: ConstructorParameters<typeof MailRecovery>[0]["storage"] = {
    async get<T>(key: string) {
      return structuredClone(data.get(key)) as T | undefined;
    },
    async put(key: string, value: unknown) {
      data.set(key, structuredClone(value));
    },
    transaction<T>(operation: (store: typeof storage) => Promise<T>) {
      const result = pending.then(() => operation(storage));
      pending = result.then(
        () => undefined,
        () => undefined,
      );
      return result;
    },
  };
  let object = new MailRecovery({ storage });
  const namespace = {
    idFromName: (name: string) => name,
    get: () => ({ fetch: (request: Request) => object.fetch(request) }),
  };
  return {
    namespace,
    request: (path: string, body?: unknown) =>
      object.fetch(
        new Request(
          `https://mail-recovery.internal${path}`,
          body === undefined
            ? {}
            : { method: "POST", body: JSON.stringify(body) },
        ),
      ),
    restart: () => {
      object = new MailRecovery({ storage });
    },
  };
}
