# Email-only waitlist release — 21 October 2026

## Current scope

The owner approved implementing the simplified flow directly: email submission → one confirmation email → explicit confirmation → waitlist acceptance. The launch notification is a future campaign; this release does not send a second welcome email. No accounts, invitation codes, referral progress, Founding Explorer badge or preference questionnaire are offered in the landing signup journey. The existing discovery UI, videos, local Bucket list, activity/trophy illustrations and responsive improvements remain.

This supersedes older referral/welcome acceptance steps in the launch documents. Historical migrations, subscriber records and referral fields are preserved. New enrollments do not create referral attribution or recognition. Legacy invite routes no longer expose private progress; queued legacy welcome jobs are cancelled before quota reservation or provider dispatch. Existing sealed confirmation requests retain their original bytes for provider retry idempotency.

## Implementation and verification

Source commit: `808133167fd6ee1a68d60431165cdfbbf8cb97a0`, integrated from `codex/email-only-waitlist` and pushed to `main`. Baseline: `44f20ea`.

- Email-only form and launch-notification copy implemented.
- Confirmation does not generate another email or an invitation capability.
- Failed, expired and replayed confirmation returns an error rather than claiming acceptance.
- Original unsubscribe capability survives confirmation; confirmation messages include unsubscribe headers.
- Existing origin checks, rate limits, suppression, sealed queue payloads, retry budget, signed webhooks and retention remain.
- No database migration or deletion is required.
- Typecheck and Next production build pass locally. Unit suite: 108 passed, 6 skipped (real PostgreSQL requires CI). Browser suite: 33 passed initially; its sole stale button-label assertion was corrected and passed on targeted rerun, covering all 34 scenarios. Scoped source security audit complete: no confirmed findings; live readiness remains incomplete pending external acceptance.
- Prepared the staging acceptance workflow and harness for one owner-controlled inbox alias. It checks real delivery webhook acknowledgement, scanner-safe links, explicit confirmation, no extra mail on duplicate/replay and original-link unsubscribe. It does not by itself prove inbox appearance, tracking configuration, idle recovery or Free CPU limits.

## Provider checkpoint

Observed 21 October: Resend domain `soralives.xyz` Verified; Transactional Free, 0/100 daily and 0/3,000 monthly usage, paid overages off. One staging webhook exists. Sending keys are already stored in both GitHub environments. The owner approved production webhook signing-secret installation. `RESEND_WEBHOOK_SECRET` was saved in the production GitHub environment and its name/timestamp verified on 21 October at 07:48 UTC; no secret values are in this document. The single webhook still targets protected staging pending production activation.

Production collection and indexing remain closed. Automatic deployment remains disabled until the deliberate release. Staging/production use separate Neon configurations; no data merge or provider move.

Cloudflare's earlier production charts conflicted (overview 3ms vs active-version median ~125ms CPU). After the successful staged test, current staging version `199a596f` reports median CPU **105.19ms** (overview105ms), zero CPU-limit errors and memory P50~17.93MB. The [current Cloudflare limits](https://developers.cloudflare.com/workers/platform/limits/) specify 10ms CPU per Free HTTP request, 128MB memory and 100,000 requests/day (checked 21 October). Zero errors does not establish Free-limit compliance. This does not pass the Free-resource acceptance gate. Public collection stays closed until profiling/optimization establishes that essential flows operate within the Free allowance. No paid upgrade or weakened safeguard is authorized.

Deployment token expiry: 24 October 2026. Staging service access was created with a seven-day lifetime on 18 October; recheck before use.

## Release gates

| Item | Owner | Status / next action |
| --- | --- | --- |
| Source checks | Engineering | Passed for the simplified flow: full CI including PostgreSQL, browser and Worker checks. Branding release checks are recorded below. |
| Security readiness | Engineering | Source audit complete, zero findings for native runtime `c4d5163`; native binding/context, private headers, email and recovery integration pass separately. Overall launch readiness remains incomplete while resource/provider gates remain open. |
| Live email | Engineering | Native staged lifecycle, branded Gmail inbox receipt and signed delivery acknowledgement pass; production secret saved. Production activation and incoming reply forwarding remain to verify. |
| Recovery and suppression | Engineering | Deployed idle recovery and original-link unsubscribe pass. Source tests cover suppression/provider failure; live bounce/complaint/outage behavior remains separate and is not claimed here. |
| Free-tier acceptance | Engineering | Blocked after native optimisation: median0.93ms, P90 22.86ms, P99 40.48ms across34 invocations. Zero CPU errors does not establish reliable Free10ms compliance for database/mail flows. |
| Product clarity and discovery | Engineering | Open: verify the simplified deployed visitor journey before closing. |
| Public collection/indexing | Engineering | Closed until release gates pass. |

## Deployment and recovery

Use the existing GitHub release workflow with protected environment secrets. Open staging only after Access verification; keep production closed during configuration. Move the single Resend webhook from staging to production only after staged mail is finished and staging collection is paused. Do not run both at their full shared sending allowance. Preserve the application budget of 80 attempts/day and check actual shared provider usage.

For a collection pause, deploy with `open_waitlist=false`; retain unsubscribe, suppression and cleanup. Roll back only to a reviewed compatible commit through GitHub; retain additive database changes and historical records. Do not restore public referral promises when rolling back this scope. Never paste credentials into Git, logs or chat, and do not rotate the application signing key without its data-migration procedure.

## Final evidence

GitHub protected staging release: [39562727406](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39562727406), source `8081331`. The preceding check-only push run was cancelled in favour of this complete checks-and-staging run. Success: full CI, protected Access checks, deployment and smoke checks passed.

Audit artifacts are preserved in the parent workspace at `outputs/security-audit/odyssey-email-only-2026-10-21/`: `REPORT.md`, `SPEC-REVIEW.md`, `NEEDS-VALIDATION.md`, structured findings and coverage. Fourteen scoped units covered, one excluded, zero findings; independent critic and both validators pass. These parent artifacts are not in the standalone web Git repository.

Staged inbox delivery is verified below. This document does not claim an open public waitlist.

### Live email acceptance

[Acceptance39563829237](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39563829237) passed on 21 October: real email submission, signed delivery acknowledgement, scanner-safe GET, explicit POST confirmation with persisted state, replay rejection, duplicate no-extra-mail and original-link unsubscribe. Test aliases were unsubscribed during cleanup. Two controlled confirmation emails were sent across the initial and corrected harness runs; no welcome emails were sent.

The first run39563443644 stopped because its assertion rejected Cloudflare Access's perimeter cookie. The reviewed test-only correction770a7e1 allows only `CF_Authorization`, still rejects all application cookies and logs no values. Rerun recorded HTTP200, Access cookie present, zero unexpected cookies, then all remaining lifecycle assertions passed. App source did not change for this correction.

Gmail independently showed the confirmation in INBOX with passing SPF and DKIM, the correct Odyssey From/Reply-To, HTML and plain-text content, and one-click unsubscribe headers. Received HTML had no tracking pixel and used direct Odyssey links. This proves that delivered message's behavior, not perpetual provider configuration.

### Email branding follow-up

The owner requested the Odyssey logo and website URL. Source `f68195d` adds the existing ink logo as a publicly served PNG, linked header and visible `odyssey.soralives.xyz` link in HTML and plain text. Fixed production asset URL avoids staging Access blocking inbox images. No recipient identifier is included in the image URL. Targeted tests6/6 pass and the independent audit supplement found no blocking issue. Existing sealed retry payloads remain unchanged. Preview files with deliberately invalid tokens are in the parent workspace under `outputs/odyssey-email-only-2026-10-21/`.

Closed production release770a7e1 succeeded in [39564078012](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39564078012). Final branding release [39564959991](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39564959991) succeeded at source `f68195dc48adf03f6c3f10549cc45fc3e72ba48a`, including its full checks. The public logo endpoint returned HTTP200 with `image/png`; the standalone email preview renders the logo and website link. The revised branded email has not been separately sent to an inbox; the earlier email-only lifecycle inbox test is recorded above. Public status still returns `enabled: false`. Automatic deployments were paused again after the deliberate release started.

Recommended next engineering step: profile cold/warm requests and database setup separately, then optimize the API runtime while retaining Neon and the existing marketing design. If a smaller API Worker is required, record that bounded architecture change and rerun the safeguards/Free measurements. Do not enable a paid plan to bypass the gate. Main-app work remains separate.

### Approved CPU optimisation follow-up

That runtime investigation is now implemented at `c4d5163`: the existing Worker serves static Next-built marketing assets and runs lightweight native waitlist routes. The runtime bundle is about92% smaller. Public collection remains closed; production has not been switched to the native candidate or opened during this investigation.

[CPU evidence and remaining gate](CPU_OPTIMIZATION_2026-10-21.md) records the successful protected staging release, exact active version, full lifecycle acceptance, branded inbox evidence, idle recovery, independent source audit and CPU limits. Acceptance39596906629 passed using harness `b5aecbd`; no invitation or welcome email was created. The replacement confirmation arrived through scheduled recovery with no further signup. Test subscriptions were revoked.

SELECT-only diagnostic39598313852 compared WebSocket and direct TCP Neon connections in local workerd. Both worked. WebSocket elapsed responses were414–462ms versus TCP656–736ms in that runner; those include network waits and are not billed CPU. Sampling includes long inactive gaps, so summed profile time is not presented as request CPU. The evidence does not justify changing the tested production transport. Profiles are saved outside Git. No database writes, email sends, provider-plan changes or credential changes occurred in the diagnostic.

The next optimisation must address the complete transactional/database-and-mail path, with per-route deployed measurements and preserved locking, budgets, suppression and retries. A low mixed-traffic median alone is not the release criterion. No paid workaround has been enabled. Product clarity and discovery remains Open until the enabled public journey can be verified.
