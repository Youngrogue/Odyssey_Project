import { isIP } from "node:net";

export const CITY_IDS = [
  "lagos",
  "abuja",
  "ibadan",
  "port-harcourt",
  "elsewhere",
  "prefer-not-to-say",
] as const;
export const INTEREST_IDS = [
  "food",
  "dance",
  "games",
  "arts",
  "movement",
  "communities",
  "home",
] as const;
export const TRUSTED_IP_HEADERS = [
  "x-real-ip",
  "x-forwarded-for",
  "cf-connecting-ip",
] as const;

export type CityId = (typeof CITY_IDS)[number];
export type InterestId = (typeof INTEREST_IDS)[number];
export type TrustedIpHeader = (typeof TRUSTED_IP_HEADERS)[number];

function objectWithKeys(
  value: unknown,
  keys: string[],
): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid request");
  const record = value as Record<string, unknown>;
  if (Object.keys(record).some((key) => !keys.includes(key)))
    throw new Error("Invalid request");
  return record;
}

export function parseSignup(value: unknown): {
  email: string;
  honeypot: boolean;
} {
  const record = objectWithKeys(value, ["email", "website"]);
  if (
    typeof record.email !== "string" ||
    typeof record.website !== "string" ||
    record.website.length > 512
  )
    throw new Error("Invalid request");
  if (/[\x00-\x1f\x7f]/.test(record.email)) throw new Error("Invalid email");
  const email = record.email.trim().toLowerCase();
  const parts = email.split("@");
  if (
    email.length > 254 ||
    parts.length !== 2 ||
    parts[0].length > 64 ||
    !/^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/.test(
      parts[0],
    )
  )
    throw new Error("Invalid email");
  const labels = parts[1].split(".");
  if (
    labels.length < 2 ||
    labels.some(
      (label) =>
        label.length > 63 || !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(label),
    ) ||
    !/^(?:[a-z]{2,63}|xn--[a-z0-9-]{2,59})$/.test(labels.at(-1)!)
  )
    throw new Error("Invalid email");
  return { email, honeypot: record.website.trim().length > 0 };
}

export function getRateLimitClientIp(
  headers: Headers,
  trustedHeader: TrustedIpHeader | null,
): string {
  if (!trustedHeader) return "unknown";
  const candidate = headers.get(trustedHeader)?.trim();
  return candidate && isIP(candidate) ? candidate : "unknown";
}

export function parsePreferences(value: unknown): {
  city: CityId;
  interests: InterestId[];
} {
  const record = objectWithKeys(value, ["city", "interests"]);
  if (
    !CITY_IDS.includes(record.city as CityId) ||
    !Array.isArray(record.interests) ||
    record.interests.length > INTEREST_IDS.length ||
    record.interests.some(
      (item) => !INTEREST_IDS.includes(item as InterestId),
    ) ||
    new Set(record.interests).size !== record.interests.length
  ) {
    throw new Error("Invalid preferences");
  }
  return {
    city: record.city as CityId,
    interests: record.interests as InterestId[],
  };
}

export function isAllowedOrigin(
  origin: string | null,
  referer: string | null,
  appOrigin: string,
): boolean {
  try {
    const configured = new URL(appOrigin).origin;
    if (origin !== null) return origin === configured;
    return referer !== null && new URL(referer).origin === configured;
  } catch {
    return false;
  }
}
