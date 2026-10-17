# Odyssey landing launch — implementation record

17 October 2026. Implements the owner's approved GitHub → Cloudflare Free landing-page plan. **Status: in progress; production collection and indexing remain closed.** No deployed SHA or working public waitlist is claimed yet.

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
- [ ] Cloudflare token, Hyperdrive bindings/cache-off verification, staging access protection, GitHub environment secrets and first closed deployment.
- [ ] Resend sender/DNS/webhooks, live confirmation/welcome/referrals/unsubscribe and scheduled recovery.
- [ ] Deployed Free-plan CPU/resource acceptance and sustainable Neon compute usage.
- [ ] Completion-stage security readiness audit and final public launch.

## Provisioning actually completed

- Cloudflare Sora account and `soralives.xyz` zone are accessible.
- Exact `odyssey@soralives.xyz` forwarding rule is **Active**, using the already verified owner Gmail destination. Other routes/catch-all were preserved. Cloudflare recorded controlled test `ODY-20261017-01` as **Forwarded**. Gmail's separately received copy has not been verified. The test originated from the destination account; repeat from the configured sender or another authorised account, following [Cloudflare's testing guidance](https://developers.cloudflare.com/email-service/get-started/route-emails/#test-your-routing-rule).
- Free Neon project **Odyssey** (`flat-dawn-95458128`), PostgreSQL17, AWS London; database `odyssey`.
- Production branch `br-little-shadow-zaermx0o`; isolated staging branch `br-cold-sound-zabiwosm`, created before subscriber data. Neither has app migrations or configured application credentials yet.
- Resend signup was opened in Chrome; the owner must complete the account/terms step. No password/API key was requested in chat.
- Source commits `e51cf5a` and correction `1a982ee` are on GitHub `main`. Environments `staging` and `production` exist with `main`-only deployment policies; `CLOUDFLARE_DEPLOY_ENABLED=false`. No deployment credentials have been installed.
- A temporary deployment-token request is awaiting owner confirmation. Automatic approval review rejected expanding token scope to the whole account; no token was created. Keep existing unrelated Workers outside any permanent deployment permission.
- No public Worker/domain deployment, Resend DNS record, paid upgrade or sender has been activated.

## Verification evidence and limits

- Next production build and typecheck pass. Main, privacy, robots and sitemap are pre-rendered.
- Cloudflare/OpenNext build passes. Dry-run upload: **1,140.80 KiB gzip** (before later bounded-cleanup changes), below the Workers Free 3 MiB compressed limit. Recheck the final bundle; this is not a CPU measurement.
- Local Workers runtime smoke passes: public assets/status, private response headers, closed signup rejection and video asset response.
- [GitHub run 39034989540](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39034989540) passed **all 31 browser scenarios**, including 320/390/768/1440 layouts, keyboard, reduced motion, enlarged text, media and local Bucket lists. It fixes the first run's 2px enlarged-text overflow by wrapping long labels and moving mobile scores below names. Control-level overflow is also checked; the assertion was not relaxed. Live-provider scenarios remain outstanding.
- The same run passed **72 unit/SQL tests**, including both real-PostgreSQL concurrency cases against PostgreSQL17.11; migration application and immediate repeat application; type generation/typecheck; Next production build; OpenNext build; and the closed local Worker smoke check. This is disposable-database/local-runtime evidence; Neon migration and deployed transaction checks remain open.
- No existing local test proves production mail delivery, destination forwarding, scheduled invocation, provider logging configuration or deployed CPU limits.

## Free-plan acceptance: open risks

1. Workers Free permits 10ms CPU per request. The 1.1 MiB bundle and local runtime pass do not prove dynamic signup/private-page flows meet it. Measure warm/cold deployed essential journeys. If they fail, stop public opening and report a concrete alternative; no silent upgrade or removed security control. [Workers limits](https://developers.cloudflare.com/workers/platform/limits/)
2. Neon suspends after five idle minutes. Querying on every five-minute recovery tick can keep compute active continuously. At 0.25 CU, 30 continuous days is about **180 CU-hours**, exceeding the documented 100 CU-hour free project allowance, before staging. This is a documented usage risk, not a measured deployed bill. Resolve with a validated durable idle-aware wake-up design or a separately agreed operational change before collection. Moving hosting to Vercel alone does not change this. [Neon compute behaviour](https://neon.com/docs/manage/endpoints/), [Neon free allowance](https://neon.com/pricing)
3. Resend allowance is shared at account level. Confirm the available daily/monthly quota and other usage; 80/day is an application ceiling, not a reserved provider allowance.

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
| Provider setup | Engineering + owner account steps | In progress | Neon branches/routing created; finish credentials, Resend and real journeys |
| Free-tier acceptance | Engineering | Incomplete | Bundle/local runtime pass; deployed CPU and idle-recovery budget unresolved |
| Security readiness | Engineering | Incomplete | Completion-stage audit not yet run; ordinary tests are not the audit |
| Production opening | Engineering | Blocked by release evidence | Collection/indexing false; no deployed commit recorded |

Verified source commit: **`1a982eeafc6885c2fc7a1e4e8d9110a4225d49f7`**. Passing GitHub check run: [39034989540](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39034989540). Deployed commit: **not deployed**. Worker version: **not created**. Subsequent documentation-only commits record these results and do not change the tested runtime source.
