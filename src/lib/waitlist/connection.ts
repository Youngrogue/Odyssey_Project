import { getCloudflareContext } from "@opennextjs/cloudflare";

export function databaseConnectionString(): string | undefined {
  try {
    // Obtain bindings for this invocation; never retain sockets across requests.
    const { env } = getCloudflareContext();
    return (env as { HYPERDRIVE?: { connectionString: string } }).HYPERDRIVE
      ?.connectionString;
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
