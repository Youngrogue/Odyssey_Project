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

## Rollout and rollback

Deploy through the existing checked GitHub workflow to protected staging first. Keep production collection closed. Reuse the controlled owner inbox acceptance, verify the scheduler still recovers committed work and compare the exact new active Worker version's CPU. Open production only after all required gates pass; otherwise record the remaining blocker without upgrading or stripping safeguards. Rollback uses the prior reviewed release via GitHub, preserving Neon records and signing keys.
