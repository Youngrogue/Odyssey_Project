# Email-only waitlist release — 21 October 2026

## Current scope

**22 October owner handoff:** [Claude implementation prompt](CLAUDE_WAITLIST_LAUNCH_HANDOFF_2026-10-22.md) records the narrowed finish line (working email collection and private counts), current access/deployment evidence, unverified reporting drafts and remaining CPU work. The owner requested Claude take over; Codex stopped implementation without deploying or enabling collection. Broader optimization remains deferred. The first draft stats test timed out at the default five-second test limit; it has not passed validation.

**Review follow-up:** [21 October deployment and optimisation recommendations](OPTIMISATION_REVIEW_2026-10-21.md) records additional confirmation-state, recovery, release-control and monitoring work. These are open recommendations, not implemented corrections. Product clarity and discovery remains open.

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

## 22 October production release

**Collection is open at https://odyssey.soralives.xyz.** Release [39833526489](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39833526489) deployed source `190589b46ff402fdd54ddc1224f297203728b2fe` to production with `open_waitlist=true` after full checks. Its first attempt stopped before deployment on one browser assertion (focus on the success heading) that passed on the same SHA in the preceding staging run and locally; the failed job was re-run and passed. Public status returned `{"enabled":true}`; `robots.txt` allows `/` and disallows `/api/` and `/waitlist/`.

What changed since the native staging release, all through GitHub with full CI:

- Fewer database round trips; no post-response send for no-op signups; one request-owned connection for a queued signup's own send ([CPU evidence](CPU_OPTIMIZATION_2026-10-21.md)).
- Confirmation and unsubscribe pages never show success together with an error. A hand-edited `?done=1` URL can still display success text without changing membership (L03 remainder, deferred).
- The signup success state links to the existing resend page (L04) and to the optional survey.
- Optional anonymous interest survey on Tally (`https://tally.so/r/J19WzR`, tagged `?source=site` or `?source=signup`). It is separate from the waitlist and collects no contact details; the privacy notice names Tally (EU-hosted).
- Read-only aggregate count query `scripts/waitlist-stats.sql`, with tests, and local CLI `scripts/waitlist-stats.mjs`. The draft GitHub report workflow was removed because this public repository's Actions logs are public.

Provider state on 22 October:

- Resend: domain `soralives.xyz` verified, no open/click tracking; usage 4/100 daily and 8/3,000 monthly before the production release. The single webhook (bounced, complained, delivered) was edited from staging to `https://odyssey.soralives.xyz/api/waitlist/webhook`, keeping its signing secret, which the production `RESEND_WEBHOOK_SECRET` was saved from on 21 October. The account also sends for `delphiatlas.com`; quotas are shared.
- Staging collection was paused first (release [39832493557](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39832493557), same SHA, `open_waitlist=false`).
- GitHub: production `RELEASE_CHECKS_PASSED=true`, `SITE_INDEXING_ENABLED=true`; repository `CLOUDFLARE_DEPLOY_ENABLED=false` again after each release.
- Neon: project Odyssey (`flat-dawn-95458128`), production branch, 0.27 CU-hours used since 1 October. Another project in the same organisation (Delphi) is paused at its monthly Free limit; Odyssey is unaffected but shares the organisation.
- Production baseline before any public signup, 19:03 UTC: 0 retained records, 0 confirmed, 0 pending, 0 queued or parked mail.

Security review: a scoped source review of the changes above (signup connection hand-off, timeout statement, page states, survey links, count/trace/probe scripts) found no new trust-boundary issue. Connections stay within one invocation; the timeout statement is a constant; links are static with `rel="noopener noreferrer"`; tracing and probes print only route labels, statuses and timings; the count query returns aggregates only inside a read-only transaction. This is scoped evidence, not a full audit. The single opt-in follow-up below records the owner's production test.

## Operations

**Check counts (private).** Neon Console → project **Odyssey** → branch **production** → SQL Editor → database `odyssey` → Saved → **Odyssey waitlist counts** → Run. Read:

- `confirmed_members`: the people on the waitlist (joined, unexpired, not unsubscribed or suppressed; each email counted once).
- `pending_confirmations`: legacy double opt-in rows only; should stay 0 (deleted after 7 days, or upgraded if the person joins again).
- `active_members_confirmed_today` (Africa/Lagos day) and `active_members_confirmed_last_7_days` (rolling).
- `queued_emails` (welcome and any legacy confirmation mail) should return to 0 within minutes; a growing number means mail is stuck. `emails_needing_attention` counts parked messages.
- Delivery columns count messages, not people. These are current retained figures, not lifetime totals.

Never use the staging branch for real counts.

**See who joined (private).** Same SQL Editor → Saved → **Odyssey waitlist members** → Run (source: `scripts/waitlist-members.sql`). It lists each active member's email and join time (Lagos), newest first; unsubscribed, suppressed and expired addresses are excluded. Use the editor's download button for a CSV if needed, and keep exports private.

**Monitor Free CPU.** Cloudflare dashboard → Workers → `odyssey-landing` → Metrics → Errors: any "Exceeded CPU Time Limits" means pause and decide (Workers Paid or the database-function rewrite).

**Pause collection.** Run the release workflow for production with `open_waitlist=false` (set `CLOUDFLARE_DEPLOY_ENABLED=true` first, then back to `false`). Unsubscribe, suppression and cleanup keep working.

**Roll back.** Re-run the release workflow from a reviewed earlier commit. Keep Neon records and signing keys. The webhook stays on production unless staging collection is deliberately reopened; point it back first in that case.

**Credentials to renew.** The Cloudflare deployment token expires on 24 October 2026; the staging Access service token was issued on 18 October for seven days. Renew both with the same scope before the next deployment.

## 22 October follow-up: single opt-in and the action-button fix

**Defect found in the owner's production test.** Pressing **Confirm my email** redirected to `/waitlist/confirm?error=invalid`. The action pages send `Referrer-Policy: no-referrer`, so Chromium posts their native forms with `Origin: null`, and the origin check refused it (HTTP 403, shown as "invalid"). The same defect affected **Unsubscribe me** and **Request a new link**. Earlier acceptance posted JSON with an explicit `Origin` header and never pressed the buttons. Fix: confirm and unsubscribe accept `Origin: null` because the secret token, as with one-click unsubscribe, is what authorizes them; explicit foreign origins are still refused, and signup keeps the strict check. A browser test now presses both buttons and checks the headers Chromium really sends.

**Owner decision: single opt-in.** Submitting the form, with the note "By joining, you agree to get Odyssey emails about our launch. Unsubscribe anytime.", stores a member immediately and queues one branded welcome email. The email explains the idea, says members will be first to know at launch, and links to the survey (`?source=welcome`), the ideas section and the FAQ. A repeat join sends nothing. Only outbox jobs whose semantic key ends in `:welcome-v2` are sendable, so referral-era welcome payloads stay cancelled. Pending rows from the retired flow expire after 7 days unless the person joins again, which upgrades them and sends the welcome. Confirmation links already sent still work; resend requests are inert but rate-limited. Validation, rate limits (20 per hour per IP, 5 per hour per email), the 80-per-day send budget, suppression, signed webhooks and encrypted queue payloads are unchanged.

**Retention.** Members are kept until 30 days after the launch announcement, capped at 730 days (`WAITLIST_RETENTION_DAYS=730`), or until they unsubscribe. Notice version `2026-10-23-single-opt-in`. After the launch announcement, run a bounded deletion of members 30 days later; it is an operational step, not automatic.

**Release.** Source `86a6d56f803a20797afab747ba1d844b3221063e`, production release [39850040031](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39850040031) with full checks, including real PostgreSQL concurrency and 36 browser tests. Status `{"enabled":true}`; the consent note is live. The staging acceptance harness was updated for the new flow but not run, because the shared webhook targets production.

**Owner production test, 22 October (UTC).**

| Step | Evidence |
| --- | --- |
| New alias joins (21:02:45) | Member immediately; welcome sent and delivered |
| Old pending address re-joins (21:04:17) | Upgraded to member (generation 2); its old confirmation job kept, new welcome sent and delivered |
| Resend delivery webhooks | All calls to `https://odyssey.soralives.xyz/api/waitlist/webhook` show Success; three messages marked delivered |
| Unsubscribe button from a welcome email | Page showed "Request processed"; the address is excluded from members |
| Counts at 21:09:24 | 2 retained records, 1 member, 0 pending, 0 queued, 0 needing attention, 3 sent, 3 delivered |

The saved Neon query **Odyssey waitlist counts** was updated to include welcome mail (`queued_emails`).

Readiness for the landing waitlist: **ready**, with the remaining items below kept visible:

- Free-plan CPU tolerance: monitor (see [CPU evidence](CPU_OPTIMIZATION_2026-10-21.md)).
- The Cloudflare deployment token expires on 24 October 2026; the staging Access token around 25 October.
- A hand-edited `?done=1` URL can still show success text without changing membership.
- Contact forwarding for `odyssey@soralives.xyz` was not re-tested in this release.

Product clarity and discovery: **verified** for the landing waitlist journey (public signup, welcome email, survey link, FAQ, privacy notice and unsubscribe observed live). Re-open it when the main app is planned.
