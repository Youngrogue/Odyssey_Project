import { Client as PostgresClient } from "pg";
import { databaseConnectionString } from "./connection";
import { isNeonDatabaseUrl } from "./database-url.mjs";
import type { Queryable } from "./store";

export async function connectWaitlist(): Promise<
  Queryable & { release(): Promise<void> }
> {
  const connectionString = databaseConnectionString();
  if (!connectionString) throw new Error("Database unavailable");
  let client: PostgresClient | NeonClient | undefined;
  try {
    const hostname = new URL(connectionString).hostname;
    const Client =
      isNeonDatabaseUrl(connectionString) ||
      ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
        ? PostgresClient
        : undefined;
    if (!Client) throw new Error("Database unavailable");
    // EXPERIMENT: Neon over TLS/TCP (Workers sockets) instead of WebSockets.
    client = new Client({ connectionString, connectionTimeoutMillis: 5000 });
    await client.connect();
  } catch {
    await client?.end().catch(() => {});
    throw new Error("Database unavailable");
  }
  const connected = client;
  return Object.assign(connected, { release: () => connected.end() });
}
