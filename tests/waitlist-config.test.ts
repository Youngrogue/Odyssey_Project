import { afterEach, describe, expect, it } from "vitest";
import { execFileSync } from "node:child_process";
import {
  getPublicPrivacyConfig,
  isWaitlistEnabled,
} from "../src/lib/waitlist/config";

const original = { ...process.env };
afterEach(() => {
  process.env = { ...original };
});

describe("waitlist configuration", () => {
  it("fails closed without every required setting", () => {
    process.env = { NODE_ENV: "test", WAITLIST_ENABLED: "true" };
    expect(isWaitlistEnabled()).toBe(false);
  });

  it("accepts complete public origin and privacy settings without exposing the secret", () => {
    process.env = {
      NODE_ENV: "test",
      WAITLIST_ENABLED: "true",
      RESEND_API_KEY: "re_test",
      RESEND_WEBHOOK_SECRET: "whsec_test",
      WAITLIST_EMAIL_FROM: "hello@odyssey.example",
      CRON_SECRET: "test-cron-secret-at-least-32-characters",
      WAITLIST_DAILY_SEND_BUDGET: "100",
      DATABASE_URL: "postgresql://user:password@host/db",
      APP_ORIGIN: "https://odyssey.example",
      PRIVACY_CONTACT_EMAIL: "privacy@odyssey.example",
      PRIVACY_OPERATOR_NAME: "Odyssey Project",
      WAITLIST_RETENTION_DAYS: "90",
      WAITLIST_TOKEN_SECRET: "a-secret-with-at-least-32-characters",
      WAITLIST_TRUSTED_IP_HEADER: "x-real-ip",
    };
    expect(isWaitlistEnabled()).toBe(true);
    delete process.env.WAITLIST_TRUSTED_IP_HEADER;
    expect(isWaitlistEnabled()).toBe(false);
    expect(() =>
      execFileSync(process.execPath, ["scripts/check-setup.mjs"], {
        env: process.env,
        stdio: "pipe",
      }),
    ).toThrow();
    process.env.APP_ORIGIN = "http://127.0.0.1:3000";
    expect(isWaitlistEnabled()).toBe(true);
    expect(() =>
      execFileSync(process.execPath, ["scripts/check-setup.mjs"], {
        env: process.env,
        stdio: "pipe",
      }),
    ).not.toThrow();
    expect(getPublicPrivacyConfig()).toEqual({
      operatorName: "Odyssey Project",
      contactEmail: "privacy@odyssey.example",
      retentionDays: 90,
    });
  });

  it("rejects HTTP public origins and malformed retention", () => {
    process.env = {
      NODE_ENV: "test",
      WAITLIST_ENABLED: "true",
      RESEND_API_KEY: "re_test",
      RESEND_WEBHOOK_SECRET: "whsec_test",
      WAITLIST_EMAIL_FROM: "hello@odyssey.example",
      CRON_SECRET: "test-cron-secret-at-least-32-characters",
      WAITLIST_DAILY_SEND_BUDGET: "100",
      DATABASE_URL: "postgresql://user:password@host/db",
      APP_ORIGIN: "http://odyssey.example",
      PRIVACY_CONTACT_EMAIL: "privacy@odyssey.example",
      PRIVACY_OPERATOR_NAME: "Odyssey Project",
      WAITLIST_RETENTION_DAYS: "abc",
      WAITLIST_TOKEN_SECRET: "a-secret-with-at-least-32-characters",
    };
    expect(isWaitlistEnabled()).toBe(false);
  });

  it("fails closed for an unknown trusted IP header", () => {
    process.env = {
      NODE_ENV: "test",
      WAITLIST_ENABLED: "true",
      RESEND_API_KEY: "re_test",
      RESEND_WEBHOOK_SECRET: "whsec_test",
      WAITLIST_EMAIL_FROM: "hello@odyssey.example",
      CRON_SECRET: "test-cron-secret-at-least-32-characters",
      WAITLIST_DAILY_SEND_BUDGET: "100",
      DATABASE_URL: "postgresql://user:password@host/db",
      APP_ORIGIN: "https://odyssey.example",
      PRIVACY_CONTACT_EMAIL: "privacy@odyssey.example",
      PRIVACY_OPERATOR_NAME: "Odyssey Project",
      WAITLIST_RETENTION_DAYS: "90",
      WAITLIST_TOKEN_SECRET: "a-secret-with-at-least-32-characters",
      WAITLIST_TRUSTED_IP_HEADER: "x-user-ip",
    };
    expect(isWaitlistEnabled()).toBe(false);
    process.env.WAITLIST_TRUSTED_IP_HEADER = "x-real-ip";
    expect(isWaitlistEnabled()).toBe(true);
  });
});
