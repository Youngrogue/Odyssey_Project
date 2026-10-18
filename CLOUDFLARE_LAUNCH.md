# Odyssey landing launch — implementation record

Updated 18 October 2026. Implements the owner's approved GitHub → Cloudflare Free landing-page plan. **Status: in progress; production collection and indexing remain closed.** No deployed SHA or working public waitlist is claimed yet.

## Approved release

| Item | Decision |
|---|---|
| Name | Odyssey; full name Odyssey Project |
| URL | https://odyssey.soralives.xyz |
| Source | https://github.com/Youngrogue/Odyssey_Project |
| Hosting | Cloudflare Workers Free and static assets; every deployment from GitHub |
| Database / outbound mail | Neon / Resend |
| Operator / replies | Tobi Arogunmati / odyssey@soralives.xyz |
| Incoming mail | Forward Odyssey address to the owner's Gmail |
| Retention | Pending 7 days; confirmed 180 days after confirmation |
| Sending budget | 80 attempts/day, subject to actual provider allowance |
| Release scope | Landing, existing interactive discovery/local lists, waitlist and referrals |

The main app, Google Sheet ingestion, catalogue publication and Quest World stay in their separate plans. No new app reward thresholds or referral-tier promises are introduced. The owner permits Vercel as a fallback if needed; that is not approval for a paid plan or weaker safeguards.

## Implementation

- [x] Consistent public name and approved privacy/contact/retention details.
- [x] Preserve the white/yellow/ink identity, ISO-GLOW communities, isometric ideas, 3D trophy graphics, four-city/home inclusion, portraits and thousands-based illustrated standings.
- [x] Manual mobile activity carousel with position, previous/next controls, reduced-motion handling and View all; existing Bucket list remains directly accessible.
- [x] Static public page/privacy/assets; client referral parsing; retryable availability endpoint exposing only `enabled`.
- [x] Pinned OpenNext/Workers configuration; Next16.4.2; no framework replacement. Explicit tracing includes the PostgreSQL Cloudflare socket module.
- [x] Per-invocation PostgreSQL clients through Hyperdrive, preserving transactions and locks; direct local connection supported only outside Workers.
- [x] Private routes remain no-store/noindex/no-referrer; build strips runtime secrets; Cloudflare client-IP setting prepared for deployed verification.
- [x] Service-bound scheduler, authenticated recovery and cleanup, with sending paused separately from cleanup. Cleanup is bounded and reports remaining backlog.
- [x] GitHub check/release workflow, isolated deployment environments, serialized deployment, migration checksum ledger and closed defaults.
- [x] Push reviewed source to the existing GitHub repository; run real PostgreSQL concurrency and repeatable migration checks successfully in CI.
- [x] Complete the entire GitHub check job: [run 39034989540](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39034989540) passed on `1a982eeafc6885c2fc7a1e4e8d9110a4225d49f7`. Deployment remained disabled.
- [x] Create empty Odyssey Worker records and store separate, seven-day Worker-scoped deployment tokens in the matching GitHub environments.
- [ ] Verify token capabilities during the first closed GitHub deployment; finish Hyperdrive bindings/cache-off verification, staging access protection and remaining environment secrets. Rotate tokens before 24 October 2026.
- [ ] Resend sender/DNS/webhooks, live confirmation/welcome/referrals/unsubscribe and scheduled recovery.
- [ ] Deployed Free-plan CPU/resource acceptance and sustainable Neon compute usage.
- [ ] Completion-stage security readiness audit and final public launch.

## Provisioning actually completed

- Cloudflare Sora account and `soralives.xyz` zone are accessible.
- Exact `odyssey@soralives.xyz` forwarding rule is **Active**, using the already verified owner Gmail destination. Other routes/catch-all were preserved. Cloudflare recorded controlled test `ODY-20261017-01` as **Forwarded**. Gmail's separately received copy has not been verified. The test originated from the destination account; repeat from the configured sender or another authorised account, following [Cloudflare's testing guidance](https://developers.cloudflare.com/email-service/get-started/route-emails/#test-your-routing-rule).
- Free Neon project **Odyssey** (`flat-dawn-95458128`), PostgreSQL17, AWS London; database `odyssey`.
- Production branch `br-little-shadow-zaermx0o`; isolated staging branch `br-cold-sound-zabiwosm`, created before subscriber data. Neither has app migrations or configured application credentials yet.
- On 17 October, four **empty Worker records** were created through the existing login: `odyssey-landing`, `odyssey-landing-staging`, `odyssey-landing-scheduler` and `odyssey-landing-staging-scheduler`. Their public `workers.dev` endpoints and previews are disabled. No code version, deployment or website DNS route has been created.
- Two seven-day **Individual Workers Editor** tokens were created, each restricted to its environment's landing and scheduler Workers. Each is stored as `CLOUDFLARE_API_TOKEN` in the matching GitHub `staging` or `production` environment. Both expire **24 October 2026**; rotate before expiry and verify the replacements through GitHub. No token value belongs in source, documentation or logs.
- Source commits `e51cf5a` and correction `1a982ee` are on GitHub `main`. Environments `staging` and `production` retain `main`-only deployment policies; `CLOUDFLARE_DEPLOY_ENABLED=false`. Database and email secrets remain pending; separate application signing secrets were stored on 18 October as recorded below. Actual deployment has not yet verified the tokens' sufficient capabilities.
- On 18 October, separate random `WAITLIST_TOKEN_SECRET` and `CRON_SECRET` values were created directly in each GitHub environment. Existing secrets were preserved; values were not printed, written to local files or committed. Secret names and timestamps were read back. These have not yet been applied to Workers.
- On 18 October, both GitHub environments received `CLOUDFLARE_ACCOUNT_ID` plus explicit `RELEASE_CHECKS_PASSED=false`, `STAGING_ACCESS_VERIFIED=false` and `SITE_INDEXING_ENABLED=false`. Values were read back; this did not trigger deployment.
- The owner connected the existing Resend account. Sender domain `soralives.xyz` was added in Ireland (`eu-west-1`), domain ID `3738a12d-5de1-4148-a235-a64bfca3ba78`. The existing TXT at `resend._domainkey` is retained. Both DNS-only CNAMEs were added and read back on 18 October: `rsend` → `rsend-euw1.forge.rmta.net` and `send` → `send.forge.rmta.net`. Resend shows a DNS-verified event, but the domain status remains **Pending** with verification in progress; a verified sender is not yet established. Tracking setup is unconfigured and current domain API flags still need confirmation. Sending keys and signed webhook setup remain pending. Incoming Cloudflare routing is unchanged.
- The Resend account snapshot on 18 October shows **Transactional Free**, **0/100** daily sends, **0/3,000** monthly sends, **2/3** domains and pay-as-you-go **disabled**. Its Webhooks page says **No webhooks yet**. These are shared account allowances at the time of inspection, not reserved Odyssey capacity; no paid settings were changed.
- The earlier account-wide-token restriction was resolved by using individual Worker resources; no account-wide grant or paid-plan change was made. After the usage-limit interruption and temporary tab-control failures, browser access recovered on 18 October in both the in-app Cloudflare browser and Chrome Resend. There is no current reconnection blocker or new token-consent requirement.
- No public website deployment, verified Resend sender or paid upgrade has been activated. Empty resources and stored credentials are provisioning progress, not release evidence.

## 18 October source continuation

- Idle-aware mail recovery preserves five-minute retries, crash recovery, transaction locking, idempotency, daily budgets, unsubscribe and cleanup. Failed coordination rolls back a new enqueue rather than accepting untracked mail.
- Bounce/complaint suppression now requires an exact provider-message match in the current environment outbox. Recipient text from another project cannot suppress Odyssey subscribers. Unmatched events return a retryable failure; provider-side scope/available endpoint still needs review.
- Staging checks exercise anonymous, invalid-token and valid-token access, including paused collection. Only the exact signed webhook path is public; unsigned payloads must be rejected by the application before database access. Errors do not log credentials or provider responses.
- Initial coordinator bootstrap handles the actually observed empty-Worker response (HTTP 404 / Cloudflare 10222), keeps collection and schedules closed, and preserves an existing coordinator. No live code deployment has occurred.
- Independent Ponytail review found and resolved exhausted-budget polling, skipped paused-staging protection and unsafe error logging. The separate completion-stage security audit remains incomplete.

## Verification evidence and limits

- Final local checks for the 18 October recovery/access changes: **102 tests passed; five real-PostgreSQL tests across three files skipped** because no disposable local PostgreSQL service was available. Typecheck, the workerd cross-script SQLite Durable Object check and whitespace/diff checks pass. The new GitHub CI run is pending; skipped PostgreSQL checks are not claimed as passed.
- Next production build and typecheck pass. Main, privacy, robots and sitemap are pre-rendered.
- Cloudflare/OpenNext build passes. Dry-run upload: **1,140.80 KiB gzip** (before later bounded-cleanup changes), below the Workers Free 3 MiB compressed limit. Recheck the final bundle; this is not a CPU measurement.
- Local Workers runtime smoke passes: public assets/status, private response headers, closed signup rejection and video asset response.
- [GitHub run 39034989540](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39034989540) passed **all 31 browser scenarios**, including 320/390/768/1440 layouts, keyboard, reduced motion, enlarged text, media and local Bucket lists. It fixes the first run's 2px enlarged-text overflow by wrapping long labels and moving mobile scores below names. Control-level overflow is also checked; the assertion was not relaxed. Live-provider scenarios remain outstanding.
- The same run passed **72 unit/SQL tests**, including both real-PostgreSQL concurrency cases against PostgreSQL17.11; migration application and immediate repeat application; type generation/typecheck; Next production build; OpenNext build; and the closed local Worker smoke check. This is disposable-database/local-runtime evidence; Neon migration and deployed transaction checks remain open.
- No existing local test proves production mail delivery, destination forwarding, scheduled invocation, provider logging configuration or deployed CPU limits.

## Free-plan acceptance: open risks

1. Workers Free permits 10ms CPU per request. The 1.1 MiB bundle and local runtime pass do not prove dynamic signup/private-page flows meet it. Measure warm/cold deployed essential journeys. If they fail, stop public opening and report a concrete alternative; no silent upgrade or removed security control. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
2. Neon suspends after five idle minutes. Querying on every five-minute recovery tick can keep compute active continuously. At 0.25 CU, 30 continuous days is about **180 CU-hours**, exceeding the documented 100 CU-hour free project allowance, before staging. This is a documented usage risk, not a measured deployed bill. The 18 October source now uses a SQLite Durable Object containing only a revision and next-due time. Shared PostgreSQL transaction locks and revision comparisons prevent lost recovery signals; idle ticks and exhausted-budget periods skip Neon. Local workerd persistence/concurrency checks pass. Actual deployed Neon suspension and Free usage remain unverified and are required before collection. Moving hosting to Vercel alone does not change this. [Neon compute behaviour](https://neon.com/docs/manage/endpoints/), [Neon free allowance](https://neon.com/pricing)
3. Resend allowance is shared at account level. The 18 October snapshot shows Transactional Free with 0/100 daily and 0/3,000 monthly sends, 2/3 domains and pay-as-you-go off. Recheck before sending; 80/day is an application ceiling, not reserved provider capacity.
4. Resend's [current Free pricing](https://resend.com/pricing) lists **one webhook endpoint**. The account's Webhooks page is empty at the 18 October read. Recheck before creating it, then test staging first, pause staging sends and settle its queued test mail, move the endpoint to production and verify its signing secret before production sending. Do not assume two concurrent free endpoints, overwrite an unrelated project's endpoint, or upgrade.

## Release sequence and stop conditions

1. Complete source checks and push the reviewed commit without secrets/generated files.
2. Configure GitHub environment secrets and closed staging. Verify Neon migrations and Hyperdrive cache-disabled transactions.
3. Protect staging, configure sending/DNS, and execute real controlled email/referral/revocation journeys. Preserve private logs and test data isolation.
4. Verify fixed recovery without another signup, daily bounded cleanup/backlog handling, inbox forwarding, asset delivery and Free resource limits. Resolve the Neon idle-polling risk.
5. Run the workspace-required full security readiness audit on the completed release revision. Missing validation remains **incomplete**.
6. Enable production collection/indexing only with passing evidence. Verify the URL and record SHA, GitHub run, Worker version and release time below. The user's launch authorisation already exists; these are evidence gates, not a repeated permission request.
7. Hand over monitoring, pause, rollback and secret-rotation procedures in [HANDOVER](HANDOVER.md).

## Required tracked review items

| Item | Owner | State | Evidence / next action |
|---|---|---|---|
| Product clarity and discovery | Unassigned | Open | Local visitor journeys tested; verify actual deployed page and working waitlist before closing |
| Provider setup | Engineering + owner account steps | In progress | Browser access recovered; Resend DNS records added/read back, domain Pending and webhook inventory empty; finish sender/tracking verification, remaining credentials and real journeys |
| Deployment-token rotation | Engineering | Due before 24 October 2026 | Replace both environment tokens with equally restricted access; verify actual deployment capability without widening scope |
| Free-tier acceptance | Engineering | Incomplete | Idle-aware source/local runtime checked; deployed CPU, Neon suspension and quota usage still required |
| Security readiness | Engineering | Incomplete | Completion-stage audit not yet run; ordinary tests are not the audit |
| Production opening | Engineering | Blocked by release evidence | Collection/indexing false; no deployed commit recorded |

Verified source commit: **`1a982eeafc6885c2fc7a1e4e8d9110a4225d49f7`**. Passing GitHub check run: [39034989540](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39034989540). Deployed commit: **not deployed**. Worker version: **not created**. The 18 October runtime changes are awaiting their new GitHub check run; the earlier passing source is historical evidence, not validation of those changes.
