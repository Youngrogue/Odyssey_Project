import { TRUSTED_IP_HEADERS, type TrustedIpHeader } from "./validation";
import { hasDatabaseConnection } from "./connection";
import { hasMailRecovery } from "../email/recovery";

export type PublicPrivacyConfig = {
  operatorName: string;
  contactEmail: string;
  retentionDays: number;
};

function validOrigin(raw: string | undefined): string | null {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const local = url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (
      (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
      url.origin !== url.href.replace(/\/$/, "") ||
      url.username ||
      url.password
    )
      return null;
    return url.origin;
  } catch {
    return null;
  }
}

export function getPublicPrivacyConfig(): PublicPrivacyConfig | null {
  const operatorName = process.env.PRIVACY_OPERATOR_NAME?.trim();
  const contactEmail = process.env.PRIVACY_CONTACT_EMAIL?.trim();
  const retentionDays = Number(process.env.WAITLIST_RETENTION_DAYS);
  if (
    !operatorName ||
    operatorName.length > 120 ||
    !contactEmail ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) ||
    !Number.isInteger(retentionDays) ||
    retentionDays < 1 ||
    retentionDays > 730
  )
    return null;
  return { operatorName, contactEmail, retentionDays };
}

export function isWaitlistEnabled(): boolean {
  if (
    process.env.WAITLIST_ENABLED !== "true" ||
    !process.env.RESEND_API_KEY?.startsWith("re_") ||
    !process.env.RESEND_WEBHOOK_SECRET?.startsWith("whsec_") ||
    !process.env.WAITLIST_EMAIL_FROM ||
    /[\r\n]/.test(process.env.WAITLIST_EMAIL_FROM) ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(process.env.WAITLIST_EMAIL_FROM) ||
    (process.env.CRON_SECRET?.length ?? 0) < 32 ||
    !Number.isInteger(Number(process.env.WAITLIST_DAILY_SEND_BUDGET)) ||
    Number(process.env.WAITLIST_DAILY_SEND_BUDGET) < 1 ||
    (process.env.WAITLIST_PENDING_RETENTION_DAYS !== undefined &&
      (!Number.isInteger(Number(process.env.WAITLIST_PENDING_RETENTION_DAYS)) ||
        Number(process.env.WAITLIST_PENDING_RETENTION_DAYS) < 1 ||
        Number(process.env.WAITLIST_PENDING_RETENTION_DAYS) > 30)) ||
    !getPublicPrivacyConfig() ||
    !validOrigin(process.env.APP_ORIGIN) ||
    !process.env.WAITLIST_TOKEN_SECRET ||
    process.env.WAITLIST_TOKEN_SECRET.length < 32
  )
    return false;
  const trustedHeader = process.env.WAITLIST_TRUSTED_IP_HEADER;
  const hostname = new URL(validOrigin(process.env.APP_ORIGIN)!).hostname;
  if (!trustedHeader && hostname !== "localhost" && hostname !== "127.0.0.1")
    return false;
  if (
    trustedHeader &&
    !TRUSTED_IP_HEADERS.includes(trustedHeader as TrustedIpHeader)
  )
    return false;
  return hasDatabaseConnection() && hasMailRecovery();
}

export function getWaitlistRuntimeConfig() {
  if (!isWaitlistEnabled()) return null;
  return {
    origin: validOrigin(process.env.APP_ORIGIN)!,
    apiKey: process.env.RESEND_API_KEY!,
    from: process.env.WAITLIST_EMAIL_FROM!,
    contactEmail: getPublicPrivacyConfig()!.contactEmail,
    dailyBudget: Number(process.env.WAITLIST_DAILY_SEND_BUDGET),
    retentionDays: getPublicPrivacyConfig()!.retentionDays,
    tokenSecret: process.env.WAITLIST_TOKEN_SECRET!,
    trustedIpHeader: (process.env.WAITLIST_TRUSTED_IP_HEADER ||
      null) as TrustedIpHeader | null,
  };
}

// Revocation remains available when new collection or provider sending is paused.
export function getWaitlistActionConfig() {
  const origin = validOrigin(process.env.APP_ORIGIN);
  const tokenSecret = process.env.WAITLIST_TOKEN_SECRET;
  if (
    !origin ||
    !tokenSecret ||
    tokenSecret.length < 32 ||
    !hasDatabaseConnection()
  )
    return null;
  const candidate = process.env.WAITLIST_TRUSTED_IP_HEADER as TrustedIpHeader;
  return {
    origin,
    tokenSecret,
    retentionDays: getPublicPrivacyConfig()?.retentionDays ?? 1,
    trustedIpHeader: TRUSTED_IP_HEADERS.includes(candidate) ? candidate : null,
  };
}
