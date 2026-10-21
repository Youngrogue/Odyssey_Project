# Email-only waitlist release — 21 October 2026

## Current scope

The owner approved implementing the simplified flow directly: email submission → one confirmation email → explicit confirmation → waitlist acceptance. The launch notification is a future campaign; this release does not send a second welcome email. No accounts, invitation codes, referral progress, Founding Explorer badge or preference questionnaire are offered in the landing signup journey. The existing discovery UI, videos, local Bucket list, activity/trophy illustrations and responsive improvements remain.

This supersedes older referral/welcome acceptance steps in the launch documents. Historical migrations, subscriber records and referral fields are preserved. New enrollments do not create referral attribution or recognition. Legacy invite routes no longer expose private progress; queued legacy welcome jobs are cancelled before quota reservation or provider dispatch. Existing sealed confirmation requests retain their original bytes for provider retry idempotency.

## Implementation and verification

Work branch: `codex/email-only-waitlist`, starting at `44f20ea`.

- Email-only form and launch-notification copy implemented.
- Confirmation does not generate another email or an invitation capability.
- Failed, expired and replayed confirmation returns an error rather than claiming acceptance.
- Original unsubscribe capability survives confirmation; confirmation messages include unsubscribe headers.
- Existing origin checks, rate limits, suppression, sealed queue payloads, retry budget, signed webhooks and retention remain.
- No database migration or deletion is required.
- Typecheck and Next production build pass locally. Unit suite: 108 passed, 6 skipped (real PostgreSQL requires CI). Browser suite: 33 passed initially; its sole stale button-label assertion was corrected and passed on targeted rerun, covering all 34 scenarios. Independent review is being recorded below.
- Prepared the staging acceptance workflow and harness for one owner-controlled inbox alias. It checks real delivery webhook acknowledgement, scanner-safe links, explicit confirmation, no extra mail on duplicate/replay and original-link unsubscribe. It does not by itself prove inbox appearance, tracking configuration, idle recovery or Free CPU limits.

## Provider checkpoint

Observed 21 October: Resend domain `soralives.xyz` Verified; Transactional Free, 0/100 daily and 0/3,000 monthly usage, paid overages off. One staging webhook exists. Sending keys are already stored in both GitHub environments. Production webhook signing-secret installation requires a pending action-time approval; no secret values are in this document.

Production collection and indexing remain closed. Automatic deployment remains disabled until the deliberate release. Staging/production use separate Neon configurations; no data merge or provider move.

Cloudflare's existing production charts conflict (overview 3ms vs active-version median ~125ms CPU). The [current Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/) specify 10ms CPU per Free HTTP request, 128MB memory and 100,000 requests/day (checked 21 October). Zero errors does not establish Free-limit compliance. Essential flow measurements remain a release gate; no paid upgrade or weakened safeguard is authorized.

Deployment token expiry: 24 October 2026. Staging service access was created with a seven-day lifetime on 18 October; recheck before use.

## Release gates

| Item | Owner | Status / next action |
| --- | --- | --- |
| Source checks | Engineering | In progress: complete unit, browser and CI PostgreSQL/Worker checks. |
| Security readiness | Engineering | Incomplete: scoped completion audit in progress, then recheck fixes. |
| Live email | Engineering + owner approval | Pending production secret installation; test staged delivery, tracking and forwarding. |
| Recovery and suppression | Engineering | Pending deployed acceptance; preserve source safeguards. |
| Free-tier acceptance | Engineering | Incomplete: measure essential deployed flows; resolve inconsistent CPU charts. |
| Product clarity and discovery | Engineering | Open: verify the simplified deployed visitor journey before closing. |
| Public collection/indexing | Engineering | Closed until release gates pass. |

## Deployment and recovery

Use the existing GitHub release workflow with protected environment secrets. Open staging only after Access verification; keep production closed during configuration. Move the single Resend webhook from staging to production only after staged mail is finished and staging collection is paused. Do not run both at their full shared sending allowance. Preserve the application budget of 80 attempts/day and check actual shared provider usage.

For a collection pause, deploy with `open_waitlist=false`; retain unsubscribe, suppression and cleanup. Roll back only to a reviewed compatible commit through GitHub; retain additive database changes and historical records. Do not restore public referral promises when rolling back this scope. Never paste credentials into Git, logs or chat, and do not rotate the application signing key without its data-migration procedure.

## Final evidence

Pending. This document does not claim an open public waitlist or successful inbox delivery.
