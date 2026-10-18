# Odyssey — landing review and launch checklist

**18 October verified design release:** [Live Odyssey](https://odyssey.soralives.xyz) now serves `d6f616a` from [successful production run 39132258936](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39132258936). All 35 browser checks and the full release pipeline pass; desktop/mobile Chrome verification confirms the new actions and layout. Automatic deployment is paused again.

**18 October design follow-up:** [Design, copy and visitor-flow review](DESIGN_REVIEW_2026-10-18.md) records the responsive corrections, useful Bucket-list action, FAQ navigation and removal of visible generator credit. Protected staging now passes [run 39130578260](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39130578260), including the rotated CI credential and signed-webhook boundary. Collection/indexing remain closed; actual mail/forwarding/recovery and Free-resource acceptance remain open. This update supersedes older unfinished-staging statements below.

Updated 18 October 2026. Compare the rendered page against the approved Solar Play/isometric direction and the product decisions below. The Stitch app exports are references for the future app; this landing is a prelaunch landing page, not a copy of every app screen.

**Current state — page live, registration closed:** https://odyssey.soralives.xyz serves source `30be319` from successful GitHub production run [39127879045](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39127879045), attempt 2. The public page, private headers, signup availability notice, hero artwork and activity-to-trophy navigation were checked live. Source security review is complete with no confirmed findings. Staging credential verification/CI policy, live email/referral/suppression, recovery, forwarding and deployed Free-resource acceptance remain open. Read the [current result](LAUNCH_DEPENDENCY_REVIEW_2026-10-18.md#current-result--public-page-is-viewable); provisioning entries below are dated historical evidence.

## 1. Compare the design with the working page

The boxes are for the owner's final review, not claims of owner approval. Implementation/test evidence is separate below.

| Check | What to compare / try | Expected result |
|---|---|---|
| [ ] Brand | Header, footer, videos and emails | **Odyssey**, full name **Odyssey Project**, supplied open-loop logo, white/yellow/ink with violet/coral; no obsolete domain promise |
| [ ] First impression | Hero at desktop and phone size | Clear activity/community/Bucket-list purpose and signup action; isometric artwork supports readable text |
| [ ] Inclusion | City strip and idea filters | Lagos priority; Abuja, Ibadan and Port Harcourt visible; home, indoor, solo and low-cost ideas equally valid |
| [ ] Discovery | Open salsa, pottery, cuisine, chess and a community example | Activities, places and communities remain different concepts; no fabricated venue facts, availability or bookings |
| [ ] Quick capture | Add a listed idea; type your own; save | Simple add, no account or reward claim; defaults available without a long questionnaire |
| [ ] Bucket lists | Once/daily/weekly/monthly; tick, reload, remove, clear, download | On-device storage clearly explained; no server sync; checks reset by device calendar, weeks Monday |
| [ ] Trophy discovery | In any activity detail, choose “See trophies & leaderboards” | Matching activity selected and keyboard focus moves to the progress heading; all 18 ideas have a path |
| [ ] Family ranks | Inspect F → E → D → C → B → A → S | F is neutral Getting started; ranks differ by family; S is completion of a finite edition, not an infinite ladder |
| [ ] Foodie example | Select Trying a new cuisine and expand criteria | C at **any 5** countries, B15, A35, S full edition; illustrated progress has 7 countries and needs 8 more for B; E/D targets not silently approved |
| [ ] Other pursuits | Switch to dance, chess, making, games and home ideas | Different relevant trophy journeys; no copied country counts or invented Ultimate thresholds |
| [ ] Leaderboard storytelling | Switch activity, monthly/all-time, leaderboard/own pace | Original Mira/Tobi/Dee portraits, trophy art and requested Foodie titles; 2,543/2,218/1,864 monthly XP; prelaunch framing, no live-customer/social-proof claim; no account mutation |
| [ ] Progress boundaries | Tick a Bucket-list item while inspecting scores | No XP/trophy/board change; account level, family rank and competition position are distinct; Personal XP excluded from boards |
| [ ] Films | Play both, use controls/captions, read summaries, listen | Deliberate playback, one at a time, no initial MP4 download; owner confirms sound and publication rights |
| [ ] Community graphics | Tap/keyboard-select dance, games and reading scenes | ISO-GLOW lighting follows the open group; interests appear below; no unverified partner or dated-event claims |
| [ ] Email journey | Closed notice now; later controlled signup | Confirmation then welcome and distinctly labelled public/private invite links; no fabricated send, queue position or launch date |
| [ ] Invitations | Follow a public link, enter a code, confirm and share | First attribution only, unique confirmed active email counts, private aggregate page, copy fallback, no automatic invites or XP |
| [ ] Early-bird offer | Confirm and save the Founding Explorer badge | Recognition is awarded once on confirmation, separate from app rank/XP. Priority at 3 referrals and a feedback circle at 5 are still proposals, not public promises |
| [ ] Partner enquiry | Prepare, copy/download; email draft if inbox configured | Nothing silently submitted; visitor chooses whether to send; no claimed sponsorship agreement |
| [ ] Access and comfort | 320/390/768/1440px, keyboard, 200% text, reduced motion | No horizontal overflow or trapped focus; readable controls, labels and errors; animations not necessary to understand progress |
| [ ] Privacy and public identity | Footer notice and contact | Accurate operator/contact/retention once configured; no private schedules/notes/evidence in public previews |

## 2. Remaining setup and evidence

Approved operator/contact/retention/budget and destinations are recorded in [CLOUDFLARE_LAUNCH](CLOUDFLARE_LAUNCH.md); do not ask for them again.

- [x] Owner connects the Resend account; add the `soralives.xyz` sender-domain record and its DKIM TXT. Sending is not yet verified.
- [x] Create four empty Odyssey Worker records with public endpoints/previews disabled; store separate seven-day Individual Workers Editor tokens as `CLOUDFLARE_API_TOKEN` in matching `main`-restricted GitHub environments. No account-wide grant or paid-plan change.
- [ ] Verify token capabilities during actual closed deployment and rotate both tokens before **24 October 2026**. Complete the remaining database/application/email secrets; keep all credentials out of chat, Git and logs.
- [x] Recover browser access in the in-app Cloudflare browser and Chrome Resend. Chrome control later became unavailable again; the in-app Cloudflare browser is usable and setup pages are retained.
- [x] Add and read back Resend's DNS-only CNAMEs (`rsend` → `rsend-euw1.forge.rmta.net`, `send` → `send.forge.rmta.net`); retain DKIM and preserve incoming routing.
- [x] Inspect Resend account on 18 October: Transactional Free, 0/100 daily and 0/3,000 monthly sends, 2/3 domains, pay-as-you-go disabled; Webhooks says No webhooks yet. Recheck shared allowance before sending.
- [x] Verify Resend domain: **Verified at 03:22 on 18 October 2026 (Africa/Lagos)**; screenshot retained in parent workspace outputs.
- [x] Create separate **Odyssey staging** and **Odyssey production** sending-only keys restricted to `soralives.xyz`; securely store each as `RESEND_API_KEY` in the matching GitHub environment and verify names/timestamps. Existing keys and paid settings preserved; no live sends performed.
- [ ] Confirm domain API tracking flags and disable tracking; configure the single available webhook through staging-to-production acceptance.
- [x] Push reviewed source and verify GitHub's real PostgreSQL concurrency/migration checks (`e51cf5a`).
- [x] Complete the full check job after the enlarged-text layout correction: `1a982ee`, 72 unit/database and 31 browser tests, types, migrations, Next/OpenNext builds and local Worker check pass. See [current evidence](CLOUDFLARE_LAUNCH.md). Deployment is disabled.
- [x] Verify the 18 October recovery/access changes locally: 102 tests passed, five real-PostgreSQL tests across three files explicitly skipped; typecheck, workerd cross-script SQLite Durable Object and diff checks pass.
- [x] Runtime source `ee0ae29df0d3b098a66219f0756f8cd2586ea2aa` is pushed and [GitHub run 39091072260](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39091072260) is **fully passing**: 109 unit/database tests across 17 files (including all five real-PostgreSQL cases), 31 browser checks, typecheck, repeated migrations, Next/OpenNext builds, recovery-worker smoke and final Worker verification. Deployment was skipped because it remains disabled. The prior recovery-harness compile failure is corrected without removing its assertions.
- [x] Verify matching direct Neon endpoints, database `odyssey` and required TLS; securely store `DATABASE_URL` in both GitHub environments without exposing credential values.
- [x] Verify owner-activated Zero Trust Free in the account overview.
- [ ] Configure and verify staging Access policies and CI service access; activation alone does not protect staging.
- [ ] Recheck the strict zero-cost boundaries, shared mail budgets and provider Free/overage settings before release; see [the cost record](CLOUDFLARE_LAUNCH.md#strict-zero-cost-operating-rule--owner-reaffirmed-18-october).
- [x] Owner selects direct Neon serverless WebSocket connectivity; supersede Hyperdrive setup without moving databases.
- [x] Implement pinned `@neondatabase/serverless` 1.2.0 request-scoped clients, runtime `DATABASE_URL` configuration and removal of Hyperdrive bindings/requirements. Local targeted checks (11), types, Next/OpenNext builds and Worker smoke pass. URL-override review finding is fixed and re-reviewed.
- [x] Verify actual app `connectWaitlist` WebSocket commit/rollback, temporary session state and cross-connection advisory locks against staging; apply `db/001`–`004` and repeat successfully. Evidence: [staging verification 39115937313](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39115937313).
- [x] Record final [full CI 39115904292](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39115904292) outcome for `06655d9cd15d9f6a2d73a5b53bba61e2e50cef15` — **success**: 115 tests, 31 browser checks, types, repeated migrations, both builds and both Worker checks. The separate remote-Neon staging check also passed; deployment was skipped.
- [x] Apply production migrations `001`–`004` in closed run 39124560727; preserve staging isolation and existing data.
- [ ] Reconcile partial Worker/domain/scheduler state; complete the dependency review before another deployment.
- [ ] Verify deployed Worker secret delivery, database failure/retry handling and full signup/referral/suppression concurrency journeys before release.
- [ ] Deploy closed staging from GitHub, protect test signup access, connect sender/DNS and signed webhooks.
- [ ] Verify real forwarding to Gmail and confirmation → welcome → badge → referral → unsubscribe.
- [ ] Verify scheduled recovery without another signup, bounded cleanup and failures/retries.
- [ ] Verify deployed Neon suspension and idle-aware recovery under backlog/budget conditions; source and local workerd checks are implemented. Measure deployed Workers CPU/resources within Free limits.
- [ ] Verify production videos/captions, local lists, accessibility, copy and private cache/log behaviour.
- [ ] Complete the required security audit on the release revision.
- [ ] Enable collection/indexing only after the above; verify the URL and record deployed commit/run/version.

## 3. Release ownership

| Review item | Owner | State / close condition |
|---|---|---|
| Product clarity and discovery | Unassigned | **Open** until actual deployed visitor journeys are verified |
| Security readiness | Engineering | **Incomplete**; required completion-stage audit and deployment evidence outstanding |
| Free-tier acceptance | Engineering | **Incomplete**; local runtime/bundle pass, deployed CPU and Neon idle recovery unresolved |
| Provider accounts | Owner account steps + Engineering | Resend domain Verified; database and separate sending keys stored. Direct Neon source and staging transactions/migrations verified; full CI passed. Both environment schemas applied; webhook, tracking, Access and deployed Worker/provider/suppression checks outstanding; Zero Trust Free is active |
| Deployment-token rotation | Engineering | Due before **24 October 2026**; retain per-environment Worker scope and verify deployment capabilities |

Follow [the Cloudflare deployment sequence](HANDOVER.md#4-cloudflare-configuration-and-release). Vercel is a permitted fallback to assess if needed, not the current host or an approved purchase. Main-app authentication, Google Sheets import and Quest World remain outside this landing release.

## 4. What the local review does and does not prove

**Final local results, 8 October:** production build/typecheck and whitespace/link checks pass; **64 unit/SQL tests pass, two explicit real-PostgreSQL tests skipped; all 28 browser scenarios pass**. Coverage includes 320/390/768/1440px, automated accessibility, keyboard focus, reduced motion, 200% text across all 18 activity families, media, local list recovery, manual/link referral entry and safe unavailable-service states. Independent backend/privacy and visual reviews found no remaining actionable source issue after the documented fixes. Authenticated real-database badge download and provider delivery remain live acceptance checks.

The new UI has no backend leaderboard, award mutation or account opt-in. Its scores are illustrations. The real waitlist backend is implemented, but configuration presence, SQL tests and browser fixtures do not prove Neon reachability, domain ownership, inbox delivery, scheduled execution or provider logging settings.

The two-connection PostgreSQL tests remain release checks: no disposable local PostgreSQL service is available here. PGlite covers sequential SQL behavior, not independent connection locking. Bulk build/launch announcements need a reviewed campaign workflow before the first campaign; the current outbox handles confirmation and welcome.

## 5. After landing release

Resume the existing M0–M10 app plan: reconcile legacy data/scoring → schema/auth → planner/admin → catalogue/geography → Bucket lists/recurrence → completion ledgers → finite trophies/history → calendar/community → boards/sharing → full-app release. Carry the new canonical-activity leaderboard scope into this work and resolve its bonus attribution before real standings.

Keep open decisions visible: Foodie E/D; non-food finite scopes/thresholds; board ties, city attribution and activity bonus attribution; recurrence defaults; authentication implementation; planner worker cadence. No new catalogue or aggregate XP caps, blanket manual admissions or city exclusions have been added.

Back up the parent V2 documentation, research, Stitch exports and editable films separately. Pushing this standalone web repository does **not** back up those folders.

## 6. Latest graphics and invitation review

In the parent project, see `V2/design/ODYSSEY_LANDING_GROWTH_REVIEW_2026-10-08.md` for growth review and release evidence. This portable checklist and HANDOVER carry the actual deployment requirements with the web repository. The latest changes remove public sample/mockup wording, add consumer graphics and copy, remove the sample-email walkthrough, add secure invite codes/private progress and extend the consent notice. Founding Explorer recognition is the implemented early-bird benefit; optional 3/5-referral milestone perks still await owner preference. Public registration remains closed pending provider setup. Fresh verification results are recorded in the growth review.
