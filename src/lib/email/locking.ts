import type { Queryable } from "../waitlist/store";
import { digest } from "./security";
// Transaction-scoped, shared by every address-state mutation and send phase.
// Unlike row locks this also serializes an address with no current signup row.
export async function lockAddress(
  db: Queryable,
  secret: string,
  email: string,
) {
  const key = BigInt.asIntN(
    64,
    BigInt(
      `0x${digest(secret, "address-lock", email.trim().toLowerCase()).slice(0, 16)}`,
    ),
  ).toString();
  await db.query("SELECT pg_advisory_xact_lock($1::bigint)", [key]);
}
export async function isSuppressed(
  db: Queryable,
  secret: string,
  email: string,
) {
  return (
    (
      await db.query(
        "SELECT 1 FROM waitlist_suppressions WHERE email_hash=$1",
        [digest(secret, "suppression", email)],
      )
    ).rows.length > 0
  );
}
