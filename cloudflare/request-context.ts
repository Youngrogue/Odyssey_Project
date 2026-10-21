import { AsyncLocalStorage } from "node:async_hooks";
import type { RecoveryNamespace } from "./mail-recovery";
export interface WaitlistBindings {
  DATABASE_URL?: string;
  MAIL_RECOVERY?: RecoveryNamespace;
  ASSETS: { fetch(request: Request): Promise<Response> };
}
const requests = new AsyncLocalStorage<{ env: WaitlistBindings }>();
// Wrangler aliases the OpenNext context accessor to this small adapter only for
// the native deployed entrypoint. Next development keeps its original accessor.
export function getCloudflareContext() {
  const context = requests.getStore();
  if (!context) throw new Error("Worker request context unavailable");
  return context;
}
export function withRequestContext<T>(env: WaitlistBindings, work: () => T): T {
  return requests.run({ env }, work);
}
