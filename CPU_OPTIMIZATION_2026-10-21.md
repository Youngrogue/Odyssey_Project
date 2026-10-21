# Waitlist Free CPU investigation — 21 October 2026

## Approved objective and constraints

Owner approved profiling and reducing the waitlist runtime cost before opening collection. Keep Cloudflare Free, Neon, Resend, GitHub deployment, the marketing design and all safeguards. No paid upgrade, data migration or main-app work.

## Evidence and bounded implementation

- Baseline deployed staging version `199a596f`: aggregate median CPU originally105.19ms and later110.77ms, with zero CPU-limit errors. Cloudflare documents10ms per Free HTTP request. Aggregates do not establish the cost of an individual signup.
- Local workerd CPU profiles show substantial Next/OpenNext module initialization even for the availability endpoint, which uses no database. First local status response218ms elapsed; first confirmation page154ms and subsequent pages25–33ms. These elapsed measurements and sampled local profiles are diagnostic evidence, not Cloudflare billed CPU acceptance.
- Native entrypoint bundle459,105bytes versus prior bundled runtime5,577,578bytes (~92% reduction). Local confirmation responses4–6ms elapsed. Deployment measurements remain mandatory.
- The Cloudflare dashboard profiler twice returned no recent executions despite a bounded series of harmless staging webhook requests returning401. No database or email writes were triggered. Do not present those captures as completed profiles.

The deployment now uses `cloudflare/landing.ts` on the existing Worker identity. Next/OpenNext remain build tools for the unchanged static marketing assets; framework request initialization is removed from waitlist APIs and private action pages. No new domain, Worker credential or paid service is needed.

Shared signup, transaction, rate-limit, encryption, provider, unsubscribe and recovery logic is retained. Only scheduling is injected (`after` in local Next, `waitUntil` in the native Worker). AsyncLocalStorage supplies per-invocation database/recovery bindings; Wrangler aliases the context accessor only for the native bundle. Private paths always run the Worker, never static assets. Native action pages preserve explicit POST, no-store/no-referrer/noindex, safe token rendering, and add a restrictive CSP.

## Verification and remaining gates

- Regression suite114 passed/6 skipped locally; real PostgreSQL concurrency runs in CI. Native boundary tests cover closed configuration, scanner-safe pages, malicious token rejection, method/HEAD handling, retired capabilities, unknown private paths and concurrent binding isolation.
- Types and Next/OpenNext build pass. Fresh local native Worker smoke passes; rebuilding assets while a dev server runs requires restarting that server to refresh its manifest.
- Full protected staging deployment, real email acceptance, new-version CPU measurements, idle recovery, production activation and security readiness remain open.
- Product clarity and discovery remains open until the enabled public journey is verified.

Profiles are stored outside Git at `../outputs/odyssey-cpu-2026-10-21/`. Security review is recorded separately at `../outputs/security-audit/odyssey-cpu-runtime-2026-10-21/`.

### Native staging result

- Runtime source `c4d51632acc5e81b5ec4aeed7c62ac7668259259` passed the full checked release [39596118788](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39596118788), including real PostgreSQL, browser, recovery Worker and native Worker checks. Deployment followed by secret installation produced active version `6e0f0c00` (the initial deploy printed `a8860efd-31a3-4461-8cb5-92be1758eb42`). Automatic deployments were disabled again.
- Controlled acceptance [39596906629](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39596906629), harness `b5aecbd`, passed: signup, branded email and signed delivery acknowledgement, replacement-link delivery by the idle scheduler without another signup, scanner-safe GET, explicit confirmation, replay rejection, duplicate no-extra-mail, and original-link unsubscribe after replacement/confirmation. Two messages went to one owner-controlled staging alias; it was unsubscribed in cleanup.
- Both messages independently appeared in the owner's Gmail inbox at 12:07:30 and 12:10:12 UTC. The first branded message passed SPF/DKIM, had the Odyssey logo/public website, direct first-party links, the correct Reply-To and one-click unsubscribe header. Its only image was the public logo; no tracking image appeared.
- Fresh scoped source security audit: 12 covered units, one excluded, zero findings; independent critic and both validators passed. All 37 reviewed hashes remain unchanged at `b5aecbd`. Runtime evidence is the separate integration result above, not part of the source-only audit.
- After the complete flow, active-version metrics showed 34 invocations, median CPU **0.93ms**, P90 **22.86ms**, P99/P999 **40.48ms**, memory P99 **5.75MB**, and zero invocation/CPU-limit errors. These are mixed-route aggregate measurements, not per-endpoint measurements. Smoke-only traffic had P50 0.48ms/P99 1.2ms. The remaining high CPU appears with database/mail traffic; the exact cause is still being isolated.
- **Free CPU acceptance remains open.** Cloudflare documents occasional rollover allowance, but zero errors or a low mixed-traffic median does not establish that essential database flows reliably fit the Free allowance. Production stays closed. A SELECT-only diagnostic compares Neon transports in local workerd inside protected CI; it makes no application writes, sends no mail, changes no provider plan, and is diagnostic rather than deployed CPU acceptance.

## Rollout and rollback

Deploy through the existing checked GitHub workflow to protected staging first. Keep production collection closed. Reuse the controlled owner inbox acceptance, verify the scheduler still recovers committed work and compare the exact new active Worker version's CPU. Open production only after all required gates pass; otherwise record the remaining blocker without upgrading or stripping safeguards. Rollback uses the prior reviewed release via GitHub, preserving Neon records and signing keys.
