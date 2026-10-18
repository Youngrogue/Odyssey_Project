// Shared by runtime readiness and deployment; never include credentials in errors.
export function isNeonDatabaseUrl(value) {
  try {
    const url = new URL(value ?? "");
    // pg query parameters can override the URL host or TLS settings.
    const keys = [...url.searchParams.keys()];
    return (
      ["postgres:", "postgresql:"].includes(url.protocol) &&
      url.hostname.endsWith(".neon.tech") &&
      Boolean(url.username && url.password && url.pathname.slice(1)) &&
      (!url.port || url.port === "5432") &&
      keys.every((key) => ["sslmode", "channel_binding"].includes(key)) &&
      new Set(keys).size === keys.length &&
      ["require", "verify-full"].includes(url.searchParams.get("sslmode"))
    );
  } catch {
    return false;
  }
}
