import { getCloudflareContext } from "@opennextjs/cloudflare";
import { isNeonDatabaseUrl } from "./database-url.mjs";

export function databaseConnectionString(): string | undefined {
  try {
    // Obtain bindings for this invocation; never retain sockets across requests.
    const { env } = getCloudflareContext();
    const value = (env as { DATABASE_URL?: string }).DATABASE_URL;
    return isNeonDatabaseUrl(value) ? value : undefined;
  } catch {
    // next dev/start and local tests use ordinary PostgreSQL directly.
    return process.env.DATABASE_URL;
  }
}

export function hasDatabaseConnection(): boolean {
  try {
    const url = new URL(databaseConnectionString() ?? "");
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      Boolean(url.hostname && url.username && url.pathname.slice(1))
    );
  } catch {
    return false;
  }
}
