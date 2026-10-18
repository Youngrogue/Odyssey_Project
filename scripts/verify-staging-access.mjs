import { verifyStagingAccess } from "./release-access.mjs";

try {
  await verifyStagingAccess();
  console.log(
    "Staging denied anonymous/invalid access, accepted the scoped service token, and rejected the unsigned webhook. Signed delivery remains a separate release check.",
  );
} catch {
  // Do not print request objects, credentials, provider responses or their redirect URLs.
  console.error(
    "Staging Access preflight failed. Review the protected paths, service-token policy and exact webhook exception privately.",
  );
  process.exitCode = 1;
}
