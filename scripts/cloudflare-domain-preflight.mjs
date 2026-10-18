import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

// Report only fixed field names and numeric codes, never provider text or tokens.
export function domainResponseSummary(status, payload) {
  const keys = ["added", "removed", "updated", "conflicting"];
  return JSON.stringify({
    status: Number.isInteger(status) ? status : null,
    success: payload?.success === true,
    errorCodes: Array.isArray(payload?.errors)
      ? payload.errors
          .flatMap((error) =>
            Number.isSafeInteger(error?.code) ? [error.code] : [],
          )
          .slice(0, 10)
      : [],
    counts: Object.fromEntries(
      keys.map((key) => [
        key,
        Array.isArray(payload?.result?.[key])
          ? payload.result[key].length
          : null,
      ]),
    ),
  });
}

export function assertSafeDomainChangeset(payload, hostname) {
  const result = payload?.result;
  if (
    payload?.success !== true ||
    !["added", "removed", "updated", "conflicting"].every((key) =>
      Array.isArray(result?.[key]),
    ) ||
    result.removed.length ||
    result.conflicting.length ||
    result.added.some((item) => item.hostname !== hostname) ||
    result.updated.some(
      (item) => item.hostname !== hostname || item.modified !== false,
    )
  )
    throw Error(
      "Custom-domain changes are unknown or conflict with existing settings",
    );
}

async function main() {
  const config = JSON.parse(
    await readFile(".cloudflare-build/landing.json", "utf8"),
  );
  const account = process.env.CLOUDFLARE_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_API_TOKEN;
  const hostname = {
    "odyssey-landing": "odyssey.soralives.xyz",
    "odyssey-landing-staging": "odyssey-staging.soralives.xyz",
  }[config.name];
  if (
    !hostname ||
    !token ||
    !/^[a-f0-9]{32}$/.test(account ?? "") ||
    config.account_id !== account ||
    config.routes?.length !== 1 ||
    config.routes[0].pattern !== hostname ||
    config.routes[0].zone_name !== "soralives.xyz" ||
    config.routes[0].custom_domain !== true
  )
    throw Error("Unexpected custom-domain deployment target");

  // Wrangler may override conflicts in CI; refuse them before any deployment.
  // This previews changes only. It neither attaches a domain nor changes DNS.
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${account}/workers/scripts/${config.name}/domains/changeset?replace_state=true`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ hostname, zone_name: "soralives.xyz" }]),
      signal: AbortSignal.timeout(15000),
    },
  );
  const payload = await response.json().catch(() => null);
  try {
    if (!response.ok) throw Error("Provider rejected domain preview");
    assertSafeDomainChangeset(payload, hostname);
  } catch {
    console.error(
      `Domain preview: ${domainResponseSummary(response.status, payload)}`,
    );
    throw Error("Cannot verify custom-domain permissions or conflicts");
  }
  console.log(
    "Exact Odyssey domain changes verified; existing settings preserved.",
  );
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch(() => {
    console.error(
      "Custom-domain preflight failed; deployment stopped before mutation. Review domain permissions and conflicts privately.",
    );
    process.exitCode = 1;
  });
}
