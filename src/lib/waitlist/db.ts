import { Client } from "pg";
import { databaseConnectionString } from "./connection";

export async function connectWaitlist() {
  const connectionString = databaseConnectionString();
  if (!connectionString) throw new Error("Database unavailable");
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 5000,
  });
  try {
    await client.connect();
  } catch {
    await client.end().catch(() => {});
    throw new Error("Database unavailable");
  }
  return Object.assign(client, { release: () => client.end() });
}
