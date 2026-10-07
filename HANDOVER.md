# Odyssey landing — owner handover

1 October 2026. Code and local preview are prepared. **Live signup collection is closed.** No repository, Vercel project, sender or production database was created; no real email was sent. This file is deliberately self-contained so it can travel with a standalone web repository.

## 1. Review what is working

Run `pnpm dev`, then open `http://127.0.0.1:3000`.

- Explore activity categories, open an idea, and add it to the preview Bucket list.
- Add a custom idea, choose once/daily/weekly/monthly, check it off, reload and download the list. Progress is local to this browser. Recurring checkmarks reset for the next device-local calendar period; previous periods remain in the local data. Weeks begin Monday. There is no account sync, reminder scheduler, booking, XP or trophy award.
- Open community examples. Their research status is visible; no current dates, prices or partnership claims are invented.
- Play the 20-second Odyssey film and the original 40-second Break the Loop teaser. The players pause each other. Review the portrait film's sound and music/footage rights before publication; audio is non-silent but a listening review is still needed.
- Use “Try the waitlist preview” to inspect confirmation and welcome emails. It uses `reader@example.com`, sends nothing and creates no waitlist entry.
- Prepare a partnership introduction. It can be copied/downloaded locally. An “Open email draft” option appears only when a genuine public inbox is configured; the visitor must review/send it in their email app.

The first release can show the page with signups closed while accounts are connected. Do not describe that preview as a working public waitlist.

## 2. Exact inputs needed from the owner

Provide non-secret destinations in the project conversation. Put credentials directly in `.env.local` or Vercel's server environment settings, never in chat or Git.

| Input | Specifically provide or decide | Recommendation |
|---|---|---|
| GitHub | Owner/organisation and new or existing private repository URL | An owner-controlled standalone web repo is the simplest initial deployment; keep project docs and editable source media in a separate backed-up project repository/storage |
| Vercel | Team/account, project destination and approved hosting plan | Pro for this commercial project and the checked-in five-minute recovery schedule; no plan purchased |
| Neon | Selected account/project and separate staging/production branch connection details | Start with the selected Neon plan and pooled runtime URL; check its current quotas and recovery options |
| Email provider | Resend account, a domain/subdomain you own, DNS access and chosen sender address | Verified sender subdomain; the website may still use a `.vercel.app` address |
| Public operator | Real responsible person/business name and monitored privacy/support email | The same monitored address is used as email Reply-To; do not invent a legal entity |
| Retention | Unconfirmed and confirmed retention, and suppression handling | Proposed 7 days pending and 180 days confirmed; these are recommendations, not accepted policy |
| Email budget | Actual provider allowance, other senders sharing it, desired daily budget | An initial 80 attempts/day only if the provider allows 100/day and the remaining headroom is adequate; two onboarding emails per confirmed subscriber, plus resends/retries |
| Partners | Monitored partnership email and any confirmed relationships/permissions | Configure the inbox first; keep named leads separate from verified partners |
| Launch identity | Keep the tentative Odyssey project name or supply the final name | No custom website domain is required to get a Vercel link |

No full-app authentication service, Apple account, Google Sheet OAuth, finished catalogue or trophy-threshold decision is required for this landing page. The Google Sheet remains the editorial content planner, not a waitlist database.

**Policy requiring an explicit operational decision:** unsubscribe/bounce/complaint suppression currently keeps a keyed address hash without automatic expiry so it survives deletion of the full signup. Rejoining a suppressed address is not automatic. Review the published privacy wording and approve a retention/rejoin procedure before opening collection. Rotating `WAITLIST_TOKEN_SECRET` without a migration breaks existing capabilities, encrypted jobs and suppression matching; keep it stable and rotate through a planned data migration.

## 3. Move the app to GitHub

The local workspace had no Git repository when this build began. Do not overwrite a repository or remote that has since been added.

For a **new standalone web repository**, start inside this `web` folder, inspect the files, then initialise and commit:

```sh
git init -b main
git add .
git status --short
git diff --cached --stat
git commit -m "Build Odyssey landing and waitlist preview"
```

Inspect the staged files before the commit. `.gitignore` excludes `.env*` except `.env.example`, dependencies, builds, tests/traces and `.vercel`. It does not inspect arbitrary files for secrets. Then create an empty private GitHub repository in your account, add its actual URL as `origin`, and push `main`. These commands have not been run for you; the owner/repository destination is still missing.

If you choose a repository containing the whole project instead, use a deliberate root `.gitignore` and review large source media, private notes and exports before adding files. Set Vercel's root directory to `web`. For a standalone web repository, the root is `.`. Do not blindly commit the whole Downloads project. Separately back up `V2`, research, Stitch exports and editable video originals; ignoring them in Git does not back them up.

## 4. Create a closed Vercel preview first

1. Import the chosen GitHub repository into the chosen Vercel team. Select Next.js, Node **24.x**, the correct root directory, `pnpm install --frozen-lockfile` and `pnpm build`. Leave framework output settings at their Next.js defaults. Runtime is pinned to the locally tested major version. [Supported Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
2. Leave `WAITLIST_ENABLED=false`. Scope all values separately for preview and production. Never connect arbitrary preview branches to production subscribers or sending credentials.
3. Deploy to obtain the actual `.vercel.app` URL, then put that exact HTTPS origin (no path) in `APP_ORIGIN` for that environment. Redeploy after environment changes.
4. Share the closed preview for visual review. The site intentionally remains `noindex, nofollow` in `src/app/layout.tsx`. After the production URL and final launch copy are accepted, add its canonical/social metadata and enable indexing for production only. Email-action pages must stay noindex and no-referrer.

**Hosting constraint:** `vercel.json` schedules mail recovery every five minutes and cleanup daily at 03:00 UTC. Hobby permits daily-only cron; more frequent schedules fail deployment. Use Pro for this configuration. A static/closed preview could use a no-cron configuration only where the plan's use terms permit it; do not weaken the live email recovery schedule silently. [Cron limits](https://vercel.com/docs/cron-jobs/usage-and-pricing), [Hobby conditions](https://vercel.com/docs/plans/hobby).

## 5. Connect Neon and email

1. Create isolated Neon environments and copy the correct pooled connection URL into `DATABASE_URL`. Keep TLS enabled. Choose hosting/database regions compatibly. Back up any existing database before applying changes.
2. Copy `.env.example` to `.env.local` for local/staging setup. Fill the settings below. `pnpm setup:check` reports only missing/present names and does not test providers or reveal values.
3. Apply additive schemas once per environment with `pnpm db:migrate`. This is a controlled deployment step, not part of page requests or every build. The migration does not send email to old intake records.
4. Add the owned sender domain/subdomain in Resend and apply its supplied DNS verification records. Verify actual sender readiness in its dashboard. You cannot verify `vercel.app` as your sending domain. [Resend domains](https://resend.com/docs/dashboard/domains/introduction).
5. Disable provider open and click tracking. Add `/api/waitlist/webhook` as the HTTPS webhook URL and subscribe to `email.delivered`, `email.bounced`, and `email.complained`. Store its signing secret separately from the sending API key. [Resend webhooks](https://resend.com/docs/webhooks/introduction).
6. Configure the protected scheduled worker and purge using `CRON_SECRET`. Vercel supplies the bearer header for configured cron calls. Confirm the schedules run on the intended deployment. Do not put secret query parameters in the URLs.
7. Verify the host overwrites the selected client-IP header before setting `WAITLIST_TRUSTED_IP_HEADER`. Without it the fallback source bucket is shared; never trust arbitrary client headers. Retest if a CDN/proxy is added.
8. Enable only in an isolated, controlled staging environment for the live smoke test below. Enable production only after the real sender, contact, privacy, retention and acceptance checks pass.

### Environment reference

| Variable | Meaning |
|---|---|
| `WAITLIST_ENABLED` | Explicit switch; stays `false` until ready. Missing/invalid required settings also keep collection closed. |
| `DATABASE_URL` | Secret PostgreSQL URL for the correct Neon environment. |
| `APP_ORIGIN` | Exact public HTTPS origin; loopback HTTP is allowed for local tests. |
| `PRIVACY_OPERATOR_NAME` | Public responsible name, up to 120 characters. |
| `PRIVACY_CONTACT_EMAIL` | Monitored public contact; also email Reply-To. |
| `WAITLIST_RETENTION_DAYS` | Confirmed retention, integer 1–365. |
| `WAITLIST_PENDING_RETENTION_DAYS` | Pending retention, integer 1–30; defaults to 7, bounded by overall retention. |
| `WAITLIST_TOKEN_SECRET` | At least 32 random characters. Stable secret used for keyed hashes and encrypted job material. |
| `RESEND_API_KEY` | Server-only provider sending credential. |
| `RESEND_WEBHOOK_SECRET` | Endpoint-specific `whsec_…` signing secret. |
| `WAITLIST_EMAIL_FROM` | Verified bare email address, not a display-name string. |
| `CRON_SECRET` | At least 32 random characters, distinct from the token secret. |
| `WAITLIST_DAILY_SEND_BUDGET` | Positive integer attempt budget. Retries consume attempts; no unlimited free sending assumption. |
| `WAITLIST_TRUSTED_IP_HEADER` | Blank until verified; one of `x-real-ip`, `x-forwarded-for`, `cf-connecting-ip`. |
| `PARTNERS_CONTACT_EMAIL` | Optional valid public inbox; enables a visitor-reviewed email draft. No server partner intake. |

No value is exposed through a `NEXT_PUBLIC_` variable. Generate secrets locally using a cryptographic generator and save them directly in the secret store. The runtime validates configuration shape, not DNS ownership, account quota or actual provider readiness.

## 6. Live acceptance before opening the public waitlist

Use only controlled inboxes and disposable test records. Record the environment, date, deployment revision and result, without addresses, tokens or credentials in public logs.

- [ ] Migrations run successfully on the intended database. A signup and pending confirmation job commit together; unavailable storage shows an honest retry message.
- [ ] A confirmation email arrives. Merely opening its link does not confirm; clicking Confirm does. Confirming twice produces one welcome job. Check HTML/plain text, Reply-To, unsubscribe headers and mobile email rendering.
- [ ] An active duplicate does not reveal membership, overwrite preferences or resend welcome mail. Resend cooldown and daily budget behave as documented.
- [ ] Unsubscribe using an older delivered email after requesting a new confirmation; it still revokes the subscription and cancels queued jobs. Test unsubscribe with new collection paused too.
- [ ] Signed delivery/bounce/complaint events are processed; forged signatures are rejected. Test delivery arriving before the sender's provider-ID write. Suppression blocks new enrolment and sending, including concurrent enrolment/webhook attempts.
- [ ] Worker recovery after a simulated timeout uses the same provider idempotency key. Quota exhaustion defers rather than loses mail. The five-minute recovery job and daily purge have run successfully with authentication.
- [ ] Verify the selected proxy header, source/address limits, no token/PII logging, provider open/click tracking disabled and hosting access-log redaction/retention. The application does not log tokens, but URLs may appear in infrastructure logs unless those are configured.
- [ ] Expired test records and associated jobs disappear on purge; minimal suppression remains according to the accepted policy. Verify backups/provider logs under the chosen account settings.
- [ ] Review `/privacy` with the real operator/contact/retention values, test the monitored inbox and document the correction/deletion/rejoin process.
- [ ] Both videos, mobile layout, keyboard, text zoom, reduced motion, download/copy behavior and the current community wording work on the public URL. Listen to the video and confirm media usage rights.
- [ ] Remove synthetic records, enable production collection, verify one controlled end-to-end signup, and record the release.

The local test suite and screenshots support the code handoff. They cannot substitute for these live-provider checks. The landing has no bulk campaign scheduler: future build/launch announcements need a separate reviewed send workflow that uses confirmed, unsuppressed recipients and respects unsubscribe/budget limits.

### Optional local PostgreSQL concurrency check

`tests/waitlist-concurrency.test.ts` runs only when `WAITLIST_TEST_POSTGRES_URL` is explicitly set to a disposable **loopback** PostgreSQL database. It never uses `DATABASE_URL`, creates a random test schema, and removes that schema afterwards. Set that test-only URL in your shell and run:

```sh
pnpm exec vitest run tests/waitlist-concurrency.test.ts --no-file-parallelism --testTimeout=30000
```

This test is supplied but was skipped locally because no PostgreSQL server was installed. The PGlite tests exercise SQL behavior, but do not establish PostgreSQL cross-connection advisory locking. Run this test and the isolated staging concurrency check before live collection.

## 7. Operation, pauses and rollback

A successful form submission means a pending record was committed. It does not mean email arrived. Confirmation, provider acceptance and inbox delivery are separate states. No public queue position or subscriber count is fabricated.

The outbox keeps encrypted token/request material, stable idempotency keys, bounded timeouts, backoff and a retry ceiling. Ambiguous sends are parked before the provider idempotency window expires; investigate parked jobs using provider IDs and approved operational access, not by blindly replaying them. Logs should contain identifiers/statuses rather than addresses or capabilities.

To pause collection/sending, set `WAITLIST_ENABLED=false` and redeploy. Keep database, origin, token secret and cron secret available so unsubscribe and retention cleanup continue. A message already being sent can still arrive. Roll back to a compatible app build; do not drop tables or run destructive schema reversals. If a release introduces a schema migration, record it with the release before rolling back code.

For account changes, data removal or rejoining a suppressed address, use a reviewed operator procedure with identity confirmation. There is no admin dashboard yet. Do not delete suppression records casually or rotate secrets just to make a failed job send.
