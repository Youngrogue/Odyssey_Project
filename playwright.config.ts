import { defineConfig } from "@playwright/test";

// A local-only enabled form harness. API responses are intercepted in the UI
// tests; the real SQL contract is verified separately in waitlist-sql.test.ts.
const baseURL = "http://127.0.0.1:43218";
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  workers: 1,
  timeout: 30000,
  use: {
    baseURL,
    channel: "chrome",
    headless: true,
    trace: "retain-on-failure",
  },
  reporter: "list",
  webServer: [
    {
      command: "pnpm start --port 43218",
      url: baseURL,
      reuseExistingServer: false,
      env: {
        DATABASE_URL: "postgresql://test:test@127.0.0.1:65432/test",
        WAITLIST_ENABLED: "true",
        RESEND_API_KEY: "re_local_ui_fixture",
        RESEND_WEBHOOK_SECRET: "whsec_bG9jYWwtdWktZml4dHVyZQ==",
        WAITLIST_EMAIL_FROM: "updates@example.com",
        CRON_SECRET: "local-ui-cron-only-not-for-deployment-12345",
        WAITLIST_DAILY_SEND_BUDGET: "80",
        APP_ORIGIN: baseURL,
        PRIVACY_OPERATOR_NAME: "Local test operator",
        PRIVACY_CONTACT_EMAIL: "test@example.com",
        WAITLIST_RETENTION_DAYS: "30",
        WAITLIST_TOKEN_SECRET:
          "local-ui-test-only-secret-not-for-deployment-12345",
      },
    },
    {
      command: "pnpm start --port 43217",
      url: "http://127.0.0.1:43217",
      reuseExistingServer: false,
      env: { WAITLIST_ENABLED: "false" },
    },
  ],
});
