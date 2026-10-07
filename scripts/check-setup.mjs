// Presence-only report: never print credentials and never contact providers.
const required = [
  "DATABASE_URL",
  "APP_ORIGIN",
  "PRIVACY_OPERATOR_NAME",
  "PRIVACY_CONTACT_EMAIL",
  "WAITLIST_RETENTION_DAYS",
  "WAITLIST_TOKEN_SECRET",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "WAITLIST_EMAIL_FROM",
  "CRON_SECRET",
  "WAITLIST_DAILY_SEND_BUDGET",
];
const missing = required.filter((name) => !process.env[name]?.trim());
const enabled = process.env.WAITLIST_ENABLED === "true";
console.log(
  `Real collection requested: ${enabled ? "YES" : "NO — preview only"}`,
);
for (const name of required)
  console.log(`${missing.includes(name) ? "MISSING" : "PRESENT"} ${name}`);
console.log(
  `Partner email draft: ${process.env.PARTNERS_CONTACT_EMAIL ? "configured" : "local download/copy only"}`,
);
console.log(
  "This report checks presence only. Runtime validation may still keep collection closed.",
);
console.log(
  "It does not prove database migrations, DNS, mail delivery, webhooks, cron or proxy setup.",
);
console.log(
  "Use HANDOVER.md for the live acceptance checks. No provider requests were made.",
);
if (enabled && missing.length) process.exitCode = 1;
