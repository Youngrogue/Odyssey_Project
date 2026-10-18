# Odyssey landing launch — implementation record

Updated 18 October 2026. Implements the owner's approved GitHub → Cloudflare Free landing-page plan. **Status: in progress; production collection and indexing remain closed.** No deployed SHA or working public waitlist is claimed yet.

## Approved release

| Item | Decision |
|---|---|
| Name | Odyssey; full name Odyssey Project |
| URL | https://odyssey.soralives.xyz |
| Source | https://github.com/Youngrogue/Odyssey_Project |
| Hosting | Cloudflare Workers Free and static assets; every deployment from GitHub |
| Database / outbound mail | Direct Neon serverless WebSocket connection / Resend |
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
- [x] Pinned OpenNext/Workers configuration; Next16.4.2; no framework replacement.
- [ ] Finish and verify the owner-approved direct Neon transport: pinned `@neondatabase/serverless` 1.2.0 WebSocket `Client`, one connection per invocation, preserving interactive transactions/advisory locks. `pg` remains for loopback development/tests and migration tooling. Hyperdrive setup is superseded.
- [x] Private routes remain no-store/noindex/no-referrer; build strips runtime secrets; Cloudflare client-IP setting prepared for deployed verification.
- [x] Service-bound scheduler, authenticated recovery and cleanup, with sending paused separately from cleanup. Cleanup is bounded and reports remaining backlog.
- [x] GitHub check/release workflow, isolated deployment environments, serialized deployment, migration checksum ledger and closed defaults.
- [x] Push reviewed source to the existing GitHub repository; run real PostgreSQL concurrency and repeatable migration checks successfully in CI.
- [x] Complete the entire GitHub check job: [run 39034989540](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39034989540) passed on `1a982eeafc6885c2fc7a1e4e8d9110a4225d49f7`. Deployment remained disabled.
- [x] Create empty Odyssey Worker records and store separate, seven-day Worker-scoped deployment tokens in the matching GitHub environments.
- [ ] Verify token capabilities during the first closed GitHub deployment; verify direct Neon runtime secret delivery and transactions, staging access protection and remaining environment secrets. Rotate tokens before 24 October 2026.
- [ ] Resend sender/DNS/webhooks, live confirmation/welcome/referrals/unsubscribe and scheduled recovery.
- [ ] Deployed Free-plan CPU/resource acceptance and sustainable Neon compute usage.
- [ ] Completion-stage security readiness audit and final public launch.

## Provisioning actually completed

- Cloudflare Sora account and `soralives.xyz` zone are accessible.
- Exact `odyssey@soralives.xyz` forwarding rule is **Active**, using the already verified owner Gmail destination. Other routes/catch-all were preserved. Cloudflare recorded controlled test `ODY-20261017-01` as **Forwarded**. Gmail's separately received copy has not been verified. The test originated from the destination account; repeat from the configured sender or another authorised account, following [Cloudflare's testing guidance](https://developers.cloudflare.com/email-service/get-started/route-emails/#test-your-routing-rule).
- Free Neon project **Odyssey** (`flat-dawn-95458128`), PostgreSQL17, AWS London; database `odyssey`.
- Production branch `br-little-shadow-zaermx0o`; isolated staging branch `br-cold-sound-zabiwosm`, created before subscriber data. `DATABASE_URL` is securely stored in each matching GitHub environment after verifying its direct Neon endpoint, database `odyssey` and required TLS. Neither branch has app migrations yet. Hyperdrive was never created; its prepared form is superseded by the owner-approved direct Neon connection. No connection-string or password values are recorded here.
- On 17 October, four **empty Worker records** were created through the existing login: `odyssey-landing`, `odyssey-landing-staging`, `odyssey-landing-scheduler` and `odyssey-landing-staging-scheduler`. Their public `workers.dev` endpoints and previews are disabled. No code version, deployment or website DNS route has been created.
- Two seven-day **Individual Workers Editor** tokens were created, each restricted to its environment's landing and scheduler Workers. Each is stored as `CLOUDFLARE_API_TOKEN` in the matching GitHub `staging` or `production` environment. Both expire **24 October 2026**; rotate before expiry and verify the replacements through GitHub. No token value belongs in source, documentation or logs.
- Runtime source `ee0ae29df0d3b098a66219f0756f8cd2586ea2aa` is pushed to GitHub `main`, following recovery/access revision `fa27313` and the earlier checkpoints. Environments `staging` and `production` retain `main`-only deployment policies; `CLOUDFLARE_DEPLOY_ENABLED=false`. Database, application signing and separate Resend sending secrets are stored; webhook signing secrets remain pending. Actual deployment has not yet verified the tokens' sufficient capabilities.
- On 18 October, separate random `WAITLIST_TOKEN_SECRET` and `CRON_SECRET` values were created directly in each GitHub environment. Existing secrets were preserved; values were not printed, written to local files or committed. Secret names and timestamps were read back. These have not yet been applied to Workers.
- On 18 October, both GitHub environments received `CLOUDFLARE_ACCOUNT_ID` plus explicit `RELEASE_CHECKS_PASSED=false`, `STAGING_ACCESS_VERIFIED=false` and `SITE_INDEXING_ENABLED=false`. Values were read back; this did not trigger deployment.
- The owner connected the existing Resend account. Sender domain `soralives.xyz` was added in Ireland (`eu-west-1`), domain ID `3738a12d-5de1-4148-a235-a64bfca3ba78`. The existing TXT at `resend._domainkey` is retained. Both DNS-only CNAMEs were added and read back on 18 October: `rsend` → `rsend-euw1.forge.rmta.net` and `send` → `send.forge.rmta.net`. The domain became **Verified at 03:22 on 18 October 2026 (Africa/Lagos)**; the earlier Pending state is superseded. Evidence is saved in the parent workspace at `outputs/odyssey-launch-2026-10-18/resend-domain-verified.png`. Tracking setup is unconfigured and current domain API flags still need confirmation. Following the owner’s request to work on the keys, separate **Odyssey staging** and **Odyssey production** sending-only keys restricted to `soralives.xyz` were created on 18 October and stored as `RESEND_API_KEY` in the matching GitHub environments. Names/timestamps were read back; values were not printed, saved in local files or committed. No webhook has been created and no delivery test has run. No paid setting changed. Incoming Cloudflare routing is unchanged.
- The Resend account snapshot on 18 October shows **Transactional Free**, **0/100** daily sends, **0/3,000** monthly sends, **2/3** domains and pay-as-you-go **disabled**. Its Webhooks page says **No webhooks yet**. These are shared account allowances at the time of inspection, not reserved Odyssey capacity; no paid settings were changed.
- The earlier account-wide-token restriction was resolved by using individual Worker resources; no account-wide grant or paid-plan change was made. Browser access recovered on 18 October. Chrome control was interrupted again, then recovered through a fresh Resend tab for the two-key setup. The prepared Hyperdrive setup is superseded; Odyssey Access setup remains unfinished. No new broad-token consent is requested.
- No public website deployment or paid upgrade has occurred. The Resend domain is verified, but sending configuration and actual delivery are unverified. Empty resources and stored credentials are provisioning progress, not release evidence.

**Staging Access setup, updated after owner action:** the owner activated Zero Trust; the Cloudflare account overview now displays **Zero Trust Free**, independently verified on 18 October. Evidence: `outputs/odyssey-launch-2026-10-18/zero-trust-free-active.png` in the parent workspace. The earlier plan-activation approval block is resolved. Activation alone does not create or verify an Odyssey Access application, allow policy or CI service token. Those remain to configure. Resend sending-key approval and storage are complete. The owner has selected direct Neon; no Hyperdrive instance, access grant or binding is needed.

## Direct Neon connection approved — 18 October

The owner selected **Cloudflare Worker → Neon serverless driver → the existing Neon database** and authorized implementation. This supersedes the earlier recommendation to retain Hyperdrive. No database is moved or recreated: the existing staging/production branches, schema migrations, outbox, referral rules and retention policies remain authoritative. Zero Trust Access remains a separate staging-protection service.

The runtime uses pinned `@neondatabase/serverless` **1.2.0**, with a WebSocket `Client` created, connected and closed within each Worker invocation. Its transaction-capable interface preserves the app's multi-step transactions and advisory locks. The HTTP single-query interface is not used as a substitute. `pg` remains for loopback development/tests and migration tooling. Neon documents request-scoped WebSocket clients for Cloudflare. [Neon driver documentation](https://neon.com/docs/serverless/serverless-driver)

Each GitHub environment's existing `DATABASE_URL` secret is delivered to the matching landing Worker as runtime `env.DATABASE_URL`, and is also used by that environment's migration step. It must not appear in static assets, deployment manifest variables, browser code or logs. **No `HYPERDRIVE_ID`, Hyperdrive binding, object or access grant is required.** Existing stored credentials remain valid; there is no provider-to-provider migration. The scheduler reaches the database only through the landing service, so does not need a database secret of its own.

**Source verification:** the request-scoped driver and deployment change is implemented. Targeted runtime/deployment checks pass (11 tests), typecheck passes, and the Next/OpenNext production bundle builds. The earlier full local run passed 106 tests with six explicit database checks skipped before the new deployment tests were added. Independent Ponytail review found one URL-parameter override issue; the validator now rejects host overrides/duplicate parameters, regression cases cover it, and focused re-review found no remaining actionable issue. Fresh full CI, manual isolated-Neon staging verification/migrations, local Worker smoke and deployed CPU/idle/Free acceptance remain pending. The staging verification workflow uses existing protected database credentials, temporary test data and additive migrations; it does not deploy or send email. Collection, indexing and deployment remain closed. No paid upgrade is authorized.

### Godmode / Ponytail component map

| Component | Scope and preserved contract | Verification / review handoff |
|---|---|---|
| Database transport | Request-scoped Neon WebSocket client; keep transaction boundaries, locks, timeout/error handling and guaranteed close; local loopback/migration `pg` retained | Driver selection/lifecycle tests; real PostgreSQL concurrency; deployed Neon failure/retry and idle checks; Ponytail review completed; URL guard finding fixed and re-reviewed |
| Deployment and secrets | Replace Hyperdrive requirements with each environment's `DATABASE_URL` runtime secret; keep static build secret stripping, staging isolation and closed defaults | Generated manifest/workflow checks; no database URLs in assets/logs; closed staging secret delivery pending |
| Verification and release | Preserve existing outbox, referrals, suppression, cron and privacy safeguards; no schema reset or database move | Fresh full CI and Worker evidence pending; final scoped security audit and Free-plan acceptance still incomplete |

Resend key creation is complete and independent of the transport change. Names-only GitHub proof screenshots are in the parent workspace: `outputs/odyssey-launch-2026-10-18/github-staging-resend-secret.png` and `outputs/odyssey-launch-2026-10-18/github-production-resend-secret.png`. Keys are stored for deployment, not yet applied to Workers; no live mail success is claimed. Signed webhook, tracking verification and actual delivery remain open.

## 18 October source continuation

- Idle-aware mail recovery preserves five-minute retries, crash recovery, transaction locking, idempotency, daily budgets, unsubscribe and cleanup. Failed coordination rolls back a new enqueue rather than accepting untracked mail.
- Bounce/complaint suppression now requires an exact provider-message match in the current environment outbox. Recipient text from another project cannot suppress Odyssey subscribers. Unmatched events return a retryable failure; provider-side scope/available endpoint still needs review.
- Staging checks exercise anonymous, invalid-token and valid-token access, including paused collection. Only the exact signed webhook path is public; unsigned payloads must be rejected by the application before database access. Errors do not log credentials or provider responses.
- Initial coordinator bootstrap handles the actually observed empty-Worker response (HTTP 404 / Cloudflare 10222), keeps collection and schedules closed, and preserves an existing coordinator. No live code deployment has occurred.
- Independent Ponytail review found and resolved exhausted-budget polling, skipped paused-staging protection and unsafe error logging. The separate completion-stage security audit remains incomplete.

## Verification evidence and limits

- Final local checks for the 18 October recovery/access changes: **102 tests passed; five real-PostgreSQL tests across three files skipped** because no disposable local PostgreSQL service was available. Typecheck, the workerd cross-script SQLite Durable Object check and whitespace/diff checks pass. These local results are separate from the following CI outcome.
- [GitHub run 39090040020](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39090040020), source `fa27313bc85fcc60c7c19516b94552dd446e036a`: real-PostgreSQL/unit tests, typecheck, repeated migrations, Next/OpenNext builds and **31 browser checks passed**. The recovery-worker harness failed during compile setup, so the final Worker check was skipped. That historical run did not fully pass. The corrected harness and fresh passing CI evidence follow; no deployment occurred.
- The isolated recovery harness now invokes the installed pinned Wrangler CLI directly, avoiding package-manager repair, and reports bounded compiler diagnostics. Its scratch home and credential-excluding environment are covered by two regression tests; the runtime assertions are preserved. Independent review found no blocking issue.
- Runtime source `ee0ae29df0d3b098a66219f0756f8cd2586ea2aa` is pushed and [GitHub run 39091072260](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39091072260) is **fully passing**: 109 unit/database tests across 17 files (including all five real-PostgreSQL cases), 31 browser checks, typecheck, repeated migrations, Next/OpenNext builds, recovery-worker smoke and final Worker verification. Deployment was skipped because it remains disabled.
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

## Strict zero-cost operating rule — owner reaffirmed 18 October

- Keep Zero Trust, Workers, Neon and Resend on their actual Free plans. Do not activate paid subscriptions, trials that convert to paid, pay-as-you-go overages or paid add-ons. Quota exhaustion is an availability issue to report, never permission to upgrade. No new charge is authorized.
- Zero Trust Access protects `odyssey-staging.soralives.xyz` for the owner and explicit testers/CI. Public visitors to `odyssey.soralives.xyz` do not enroll as Access users. The Free option displayed during setup was $0 for up to 50 seats. Do not broaden the staging allow list or enable paid protection features.
- [Workers Free](https://developers.cloudflare.com/workers/platform/pricing/) allows 100,000 dynamic requests/day and 10ms CPU per invocation. Static assets are served separately; deployed CPU/resource acceptance remains required. The mail coordinator uses SQLite Durable Objects within the Workers Free allowances. We have not activated paid Workers, R2 storage, Stream or Images services.
- Hyperdrive is no longer a dependency and no object was created. The direct Neon driver does not add a separate hosting subscription or remove Neon/Workers quotas. Recheck both providers' actual Free settings and measure the direct connection before release; no paid fallback is authorized.
- [Neon Free](https://neon.com/docs/introduction/plans) currently provides 100 CU-hours/project/month, 1 GB/project Postgres storage and 5 GB/project/month public transfer. Production and staging share the project's allowance. Exhausted compute/transfer suspends compute; storage growth beyond the cap fails. Keep five-minute scale-to-zero, idle-aware recovery, bounded cleanup and test staging only when needed. Actual suspension/usage must still be verified after deployment.
- [Resend Free](https://resend.com/pricing) allows 100 messages/day and 3,000/month across the account. Transactional pay-as-you-go was verified disabled on 18 October and must remain off. The code's 80-attempt daily budget is per database, so do not run two environments at 80 concurrently: pause staging sending before production opening and account for other projects' usage. Confirmation plus welcome means roughly 40 newly confirmed subscribers/day at 80 attempts before retries/other messages; it is not an 80-signup allowance. Existing committed mail is deferred at the application budget; provider failures are retryable/visible under the existing bounded-retry policy.
- Free quotas provide the billing boundary; usage monitoring and rate limits help preserve availability. Alerts are not spending caps, and automated provider-quota monitoring has not been configured. Recheck account plans/overage settings at release. Do not claim unlimited traffic, guaranteed no interruptions or completed live quota validation.

## Release sequence and stop conditions

1. Complete source checks and push the reviewed commit without secrets/generated files.
2. Configure GitHub environment secrets and closed staging. Verify Neon migrations and direct WebSocket transactions, with runtime `DATABASE_URL` delivered only to the matching environment.
3. Protect staging, configure sending/DNS, and execute real controlled email/referral/revocation journeys. Preserve private logs and test data isolation.
4. Verify fixed recovery without another signup, daily bounded cleanup/backlog handling, inbox forwarding, asset delivery and Free resource limits. Resolve the Neon idle-polling risk.
5. Run the workspace-required full security readiness audit on the completed release revision. Missing validation remains **incomplete**.
6. Enable production collection/indexing only with passing evidence. Verify the URL and record SHA, GitHub run, Worker version and release time below. The user's launch authorisation already exists; these are evidence gates, not a repeated permission request.
7. Hand over monitoring, pause, rollback and secret-rotation procedures in [HANDOVER](HANDOVER.md).

## Required tracked review items

| Item | Owner | State | Evidence / next action |
|---|---|---|---|
| Product clarity and discovery | Unassigned | Open | Local visitor journeys tested; verify actual deployed page and working waitlist before closing |
| Provider setup | Engineering + owner account steps | In progress | Resend domain Verified; database, application and separate sending secrets stored in GitHub. Webhook, direct Neon validation, Access, tracking and live journeys remain. Zero Trust Free is active; direct Neon is owner-approved and implementation/verification is in progress |
| Deployment-token rotation | Engineering | Due before 24 October 2026 | Replace both environment tokens with equally restricted access; verify actual deployment capability without widening scope |
| Free-tier acceptance | Engineering | Incomplete | Idle-aware source/local runtime checked; deployed CPU, Neon suspension and quota usage still required |
| Security readiness | Engineering | Incomplete | Completion-stage audit not yet run; ordinary tests are not the audit |
| Production opening | Engineering | Blocked by release evidence | Collection/indexing false; no deployed commit recorded |

Latest checked runtime source: **`ee0ae29df0d3b098a66219f0756f8cd2586ea2aa`**. [GitHub run 39091072260](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39091072260) passed all checks. Deployed commit: **not deployed**. Worker version: **not created**. Subsequent documentation-only commits do not change this runtime evidence. The direct Neon revision and its new verification results are pending and must be recorded separately before release.
