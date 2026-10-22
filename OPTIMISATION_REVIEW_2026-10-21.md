# Odyssey — landing deployment and simplification review

21 October 2026 · Reviewed source `62a21e18822ea366c9cc146e3726813209a1f8a7` · Recommendations, not implemented changes.

## Recommendation

Keep the existing landing design, Cloudflare hosting, Neon database and Resend email. Finish a small, evidence-driven reliability pass before adding features or changing platforms. The principal launch obstacle remains the Free CPU acceptance gate. The most useful additional work is truthful confirmation states, easier email recovery, release controls and operational visibility.

Do not rebuild the landing in another framework, migrate the database, add account authentication or reactivate referrals to complete this release. Main-app work and Quest World remain separate.

## Evidence and limits

- Used the existing Graphify map to locate modules, then inspected the current source. Graph relationships are navigation aids, not proof of runtime performance or deployed configuration.
- Read the public site in Chrome. At the inspected 1440×662 desktop viewport, the hero, artwork, email form and secondary CTA fit; FAQ is in the navigation. The form visibly reports **Signups are opening soon**. No real signup or email was submitted.
- Direct read-only HTTP probes received Cloudflare 403 / error 1010, while Chrome loaded the site. This is a monitoring/automated-client compatibility issue to investigate, not evidence that the site is unavailable to ordinary visitors. No firewall changes were made.
- Reproduced a misleading confirmation state directly against `renderWaitlistPage`: `?done=1` claims acceptance without a confirmed result; `?done=1&error=expired` shows success and failure together. This does not write to the database or bypass confirmation.
- Focused existing regression checks passed: **17 tests across lightweight-worker and mail-recovery suites**. These tests do not cover the misleading-success issue. No full build, new PostgreSQL concurrency test, fresh mobile matrix, provider-dashboard audit or new live CPU measurement was performed in this review.
- Latest saved staging evidence records median CPU 0.93ms, P90 22.86ms and P99 40.48ms over 34 mixed-route invocations. Treat these as historical measurements for the recorded version, not current per-route results. See [CPU evidence](CPU_OPTIMIZATION_2026-10-21.md).
- Consulted current official Cloudflare, Neon and Resend documentation listed below. No provider, credential, DNS, paid-plan or production configuration changed.

## Before opening the waitlist

All items below are recommendations/open work. Engineering owns implementation unless indicated; owner participation is limited to access/credential actions and final release decisions.

| ID / priority | Finding and source evidence | Recommended action | Acceptance |
| --- | --- | --- | --- |
| L01 — release gate | Mixed-route CPU tails exceed the documented Free allowance; median and zero errors are insufficient evidence. `CPU_OPTIMIZATION_2026-10-21.md`. | Measure cold/warm signup, duplicate, confirm, resend, unsubscribe, webhook, drain and purge separately on the exact deployed candidate. Record route, outcome and CPU distributions, without tokens/recipients. Separate network elapsed time from CPU. | Essential routes fit the agreed Free-resource gate with credible headroom; no paid upgrade. Record sample size, version and failures. If not achievable, report a bounded architecture decision instead of endless speculative tuning. |
| L02 — high | `signup-handler.ts:43` saves using one connection; `:57` opens another to drain mail. Duplicates/suppressed attempts also schedule a drain after a successful generic response. | Profile connection/setup, transaction, crypto and mail work first. Consider an internal `queuedNewWork` result so no-op enrollments do not trigger needless dispatch, while preserving the same public response. Evaluate one request-owned connection for sequential intake and bounded background work only if its lifecycle is provably safe. | Fewer connections/work for equivalent flows; same privacy, duplicate handling, unsubscribe ordering and idle recovery. Measure CPU as well as latency. Never reuse WebSocket clients across Worker invocations. |
| L03 — high | `cloudflare/waitlist-pages.ts:31` trusts a `done` query parameter; the Next page repeats it at `src/app/waitlist/confirm/page.tsx:42`. Conflicting query flags can display contradictory outcomes. | Render definitive acceptance only from a valid successful action outcome, e.g. a short-lived, purpose-bound signed receipt with no email/PII, or an equivalent response design. Make error/success states mutually exclusive. Keep GET read-only. | Editing URL flags cannot claim enrollment. Genuine POST success shows acceptance; invalid/expired/replayed links do not. Scanner GET still performs no mutation. This is a user-trust defect, not an account compromise. |
| L04 — high | The landing success state (`waitlist-form.tsx:105–120`) offers browsing but no visible recovery link if mail is missing. A resend form already exists on `/waitlist/confirm`. | Link “Didn't receive the email?” to the existing recovery page; include checking spam and correcting a mistyped address. Do not add a second automatic welcome message. | A visitor who never receives the first email can find recovery without knowing a hidden URL. Keep generic responses, cooldowns and send limits. |
| L05 — high | Saved records say production mail activation/forwarding and resource acceptance remain open. Deployment tokens are recorded to expire 24 October; staging service access needs rechecking around 25 October. | Reconcile provider state and expiry before release; renew only necessary equivalent-scope credentials. Verify production sender/webhook destination, signed delivery, genuine inbox receipt, reply forwarding, suppression, unsubscribe and scheduler recovery with a controlled test. | Dated evidence for the exact production candidate, no broad credentials or keys in chat/source. Owner/access work only where required. |
| L06 — high | Wrangler configurations disable observability; signup recovery errors are swallowed (`signup-handler.ts:63`), and operator errors become generic 503 (`email/handlers.ts:191`). This protects privacy but leaves weak operational diagnosis. | Add minimal, redacted operational signals: route label, release SHA, outcome code, queued/parked counts, oldest due age, scheduler/cleanup success and quota remaining. Verify logging configuration will not capture token-bearing URLs, bodies, recipients or secrets. | An operator can distinguish saved, queued, provider-accepted, delivered and failed. Alert on parked mail or overdue recovery without sending a new signup to discover the fault. Keep within verified Free quotas. |
| L07 — high | Opening relies on a reusable `RELEASE_CHECKS_PASSED=true` variable (`scripts/cloudflare-config.mjs:25`). It is not bound to the reviewed SHA or runtime version. | Replace/augment the boolean with release evidence tied to the candidate SHA, schema version, environment and resource/provider checks. Record deployed Worker version IDs alongside SHA. | Old approval cannot silently approve changed code. Production opening references the candidate that passed staging; rollback target is recorded. |
| L08 — medium | Public HTTP automation received Cloudflare 1010; normal Chrome succeeded. Existing smoke checks depend on HTTP clients. | Inspect the relevant security event and supported CI/monitor client behavior. Distinguish blocked automated traffic from origin failure. Any exception must be narrow; do not disable zone-wide protection. | The approved deployment smoke client and legitimate visitors can reach the intended endpoints; staging protection and signed-webhook verification remain intact. |

### CPU optimisation order

1. Instrument the existing implementation before changing transport or service boundaries. `performance.now()` measures elapsed time, not billed Worker CPU; use deployed CPU evidence for the release decision.
2. Remove demonstrably unnecessary work on no-op paths, and measure connection/setup costs. Preserve constant public success semantics to avoid revealing subscription state.
3. `beginMailTransaction` sends three `SET LOCAL` statements, and `armMailRecovery` repeats them (`email/recovery.ts:29–48`). Explore consolidating settings into one safe statement or applying them once per transaction. This primarily removes network round trips; CPU savings are a hypothesis to test. Preserve all transaction/lock timeouts.
4. Profile dispatch separately. `drain` intentionally persists intent, reacquires locks, rechecks suppression and bounds provider requests (`email/worker.ts:127–175`). Do not delete those steps to make the benchmark look better. Its 23-hour retry horizon is conservative against Resend's 24-hour idempotency window; retain that boundary and exact retry payloads.
5. If still necessary, benchmark a contained database-side operation or another transport in staging. Neon HTTP supports non-interactive transactions; the current branch-dependent transactions and locks are not a drop-in HTTP conversion. Do not change to TCP because of wall-time-only measurements.
6. Moving work into `waitUntil` improves response timing but does not provide a separate CPU allowance. A separate dispatcher is a later measured option, not the default answer; it adds another deployment boundary. Retain the durable outbox/recovery safety net.

## Consolidation and streamlining

These can follow the launch-critical pass. Do not delay launch for a broad reorganisation unless a change directly resolves a release issue.

| ID / priority | Current condition | Recommendation and boundary |
| --- | --- | --- |
| C01 — medium | Native Worker pages/routes and Next development pages/routes maintain overlapping behavior; security headers also appear in native routing, Next configuration and `public/_headers`. | Keep thin runtime adapters over shared domain handlers. Share action-state/copy definitions and define a route contract tested against both runtimes. Add parity tests for status, redirects, methods, no-store/no-referrer, invalid tokens and paused collection. A renderer rewrite is unnecessary. |
| C02 — medium | `store.ts` imports lifecycle while lifecycle imports `store.ts`; `hash()` and `digest()` implement equivalent purpose-separated HMAC patterns. | Move database interfaces, rate-limit primitives and token/hash primitives into small shared modules with one dependency direction. Preserve every purpose string and token format. This improves maintainability; it is not a claim of a current runtime failure. |
| C03 — medium | Historical referral modules, preferences, badge UI, types and `vercel.json` remain. Retired endpoints already fail closed. | Identify truly unreachable runtime code, remove unused imports/components and move fallback configuration into a clearly documented archive if needed. Keep migrations, subscriber records, suppression, queued-payload compatibility and safe retired routes. Do not remove third-party licence files. |
| C04 — medium | Multiple launch/handover documents contain superseding notices and outdated steps lower down. | Create one concise current runbook with current topology, pause/resume, provider destinations, deployed versions, credential expiry, rollback and known blockers. Move historical narrative into dated records; have README/HANDOVER point to the runbook. Preserve audit history. |
| C05 — medium | Privacy facts are in `public-site.ts`, while runtime environment values and generated Wrangler configuration repeat them. | Generate approved non-secret deployment facts from one module and assert runtime/privacy parity in CI. Keep secrets separate. Bind consent notice version to meaningful copy/purpose changes; never rewrite historical consent rows. |
| C06 — medium | CI runs a Next build, an OpenNext build, then a target deployment build. Deployment mutates Worker code before installing secrets and updating the scheduler. | Cache dependencies/compilation and review which builds can safely be reused. Preserve target-specific origin/indexing output. Keep full release checks, but use change-aware check tiers for docs/assets. Add a staged, resumable release manifest covering migrations, coordinator, landing, secrets, scheduler and smoke checks; where supported, validate version-upload/promotion before replacing live code. Do not assume multi-Worker deployment is atomic. |
| C07 — medium | GitHub actions use moving major tags; workflow concurrency serializes the entire workflow by ref. | Pin actions to reviewed commit SHAs with a repeatable update process. Separate cancellable checks from non-cancellable, environment-serialized deployment mutations. Include acceptance/migration workflows in the environment coordination design. |
| C08 — low | Graphify output and parser/cache files are untracked in the application repository. | Decide explicitly which graph artifacts belong in Git or private build artifacts. Exclude caches, installed parser dependencies and temporary extraction prompts; retain a reproducible scope and source SHA. Keep internal graph/report files out of `public/` and deployed assets. |

## Visitor performance and conversion

| ID | Evidence / opportunity | Recommendation and verification |
| --- | --- | --- |
| U01 | Desktop hero now fits the inspected viewport. Graphics and explanatory copy already work together. | Keep the visual identity and the current main CTA. Recheck 320/390/768/1440px, 200% text, mobile keyboard and landscape after fixes. Do not impose a fixed-height hero that clips content to force one-screen presentation. |
| U02 | Five global CSS files total 5,327 source lines, including a final refinement override layer. This is a maintenance signal, not a measured loading bottleneck. | Consolidate tokens and duplicate selectors section by section with screenshot comparisons. Give landing-only styles a clear boundary before adding app pages. Avoid a wholesale Tailwind migration. |
| U03 | Discovery/reward/community sections use client components; the local-list component refreshes date state every minute even when hidden. | Measure shipped JS and hydration first. Lazy-load genuinely heavy below-fold interactions where it preserves accessible HTML. Pause unnecessary hidden-tab work and refresh on visibility/focus and relevant date boundaries. Keep storage synchronization and recurrence correct. |
| U04 | Videos are about 2.5MB and 4.3MB; posters are about 110KB each. Video sources mount after explicit play, posters lazy-load, and the hero has responsive WebP sources/high fetch priority. | Preserve those good loading choices. Measure real mobile transfer/LCP/INP/CLS before compression work. Optional smaller encodes must preserve readability/captions. Do not add paid streaming or image transformations without a demonstrated need. |
| U05 | Typography uses local Outfit TTF plus a font package imported globally. | Inspect actual downloaded font files/subsets before changing anything. Prefer licensed WOFF2/subset delivery if it measurably helps; retain necessary glyph coverage and licence records. |
| U06 | Every waitlist CTA ultimately reaches a disabled form while collection is paused. | Once release gates pass, verify the entire open journey rather than only the status flag. During a prolonged pause, prioritise the already useful local Bucket-list action and clearly communicate availability; do not claim enrollment or imply a live app. |
| U07 | Partnership form explicitly prepares a local draft rather than submitting it. Rewards are illustrated future-app capabilities. | Preserve those truthful boundaries. Keep simple contact/draft actions discoverable; do not add another backend lead-capture form before the email-only waitlist works. Measure conversion later with minimal aggregated events only after deciding privacy/retention needs. |
| U08 | No new enabled-production search/share check was performed. Indexing is currently gated on release configuration. | At launch verify generated robots, sitemap, canonical URL, page metadata/social preview and all private routes. Add clear performance budgets and a small mobile test matrix to CI. Budgets are proposals until baseline measurements are recorded. |

## Data and cost operations to retain

- Keep Neon as the authoritative database and the Durable Object as scheduling metadata only. Do not merge staging/production or create a second subscriber database for convenience.
- Keep recovery idle-aware so five-minute cron checks do not automatically wake Neon. Verify actual idle suspension/compute usage; source logic alone does not prove the provider bill.
- Keep bounded cleanup, persistent suppression and unsubscribe available during collection pauses. Surface backlog after the scheduler's maximum cleanup batches rather than silently ignoring it.
- Reconcile the shared Resend allowance across staging and production; independent 80-attempt budgets must not be mistaken for two independent provider quotas. Avoid active test campaigns competing with live enrollment.
- Check runtime database role permissions separately from migrations; the current workflow supplies the same database URL setting to both paths. Actual role grants were not inspected, so this is a least-privilege review item, not a confirmed over-permission finding.
- Document and rehearse restoration/rollback in non-production with synthetic data and secure backups. Do not copy live subscriber data into development without a justified access/privacy process.
- Preserve the existing replay/concurrency, optional double-opt-in action, payload encryption, signed webhook and suppression protections. A simplified product can still need robust delivery internals.

## Suggested execution batches

| Batch | Scope | Exit condition |
| --- | --- | --- |
| 1 — launch correctness | L03/L04, route parity tests, release/credential inventory | Truthful confirmation, discoverable recovery, compatible old links and a current readiness record. |
| 2 — measured runtime | L01/L02, redacted diagnostics, smallest justified transaction/connection changes | Per-route evidence demonstrates Free readiness, or a concrete remaining architecture decision is documented. No speculative provider migration. |
| 3 — controlled release | L05–L08, exact-SHA release evidence, production lifecycle and rollback | Verified public signup/confirmation/unsubscribe/recovery, provider and forwarding evidence, indexing and cost controls. |
| 4 — small maintenance pass | C01–C08 and measured U improvements | Less duplication, one operational runbook and stable visual/function regression checks. Only needed items should precede launch. |

Keep **Product clarity and discovery** open. Engineering owns verification; the owner remains the product decision-maker. Next evidence needed: enabled public signup and recovery, accurate post-confirmation state, mobile journey checks and launch metadata. The existing design is not a reason to redesign the site.

## Main-app follow-on review queue — not landing scope

After landing acceptance, review the main-app plan in this order:

1. Reconcile the approved stack and current Cloudflare runtime limits with Better Auth, private pages, media and scheduled work. The landing optimisation does not prove that full-app authentication/rendering fits the same Free resource envelope.
2. Start with a modular application and clear catalogue, identity, Bucket-list, completion/reward and community/event boundaries. Avoid splitting into microservices before workload evidence requires it.
3. Keep one Neon system of record with isolated environments and additive migrations. Waitlist consent does not create an app account; app auth must not reuse the waitlist signing key.
4. Treat Google Sheets as editorial intake. Validate/version/publish into Neon, use stable IDs and publish snapshots; account requests and reward transactions must not depend on a live Sheet call.
5. Implement one canonical completion event and idempotent reward transaction. Separate Official XP, Personal XP, history recognition, family rank and competition period. Rebuild leaderboard projections from ledger records rather than awarding XP in several UI flows.
6. Reconcile the reference catalogue and finite trophy editions before importing production data. Preserve all four cities, geographical clusters, home/indoor options and automatic public discovery with the agreed top-level-category exception.
7. Share components/tokens rather than duplicate Stitch screens. Mobile checklist, guest return-to-save, privacy and meaningful empty/error states come before extra animation.
8. Build Quest World later as a view of the same catalogue/completions, not a separate quest database or prerequisite for ordinary discovery.

These are architectural review priorities; this document does not replace the accepted product decisions or authorise the main-app build.

## Official references checked

- [Cloudflare Workers limits](https://developers.cloudflare.com/workers/platform/limits/): Free HTTP and cron CPU allowance; network waiting is distinct from CPU; occasional flexibility is not dependable capacity.
- [Cloudflare waitUntil](https://developers.cloudflare.com/workers/runtime-apis/context/#waituntil): extends invocation lifetime for bounded background work; HTTP post-response work has a 30-second limit.
- [Neon serverless driver](https://neon.com/docs/serverless/serverless-driver): HTTP non-interactive transactions versus WebSocket sessions; request-scoped connection lifecycle in Workers.
- [Resend idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys): 24-hour key retention; retries must preserve request identity/content.
- [Cloudflare Workers Logs](https://developers.cloudflare.com/workers/observability/logs/workers-logs/): sampling and current included Free allowance; pricing documentation announces a December 2026 change, so recheck before enabling or expanding telemetry.
- [Cloudflare error 1010](https://developers.cloudflare.com/support/troubleshooting/http-status-codes/cloudflare-1xxx-errors/error-1010/): automated-client/browser-signature denial, distinct from a proven origin outage.

## What was deliberately not changed

No application code, schema, provider configuration, deployment, firewall rule, credentials, billing or product scope. This review and its documentation links are the deliverables. Source security readiness from the earlier audit remains scoped to its revision; this review is not a new full security audit or launch approval.
