# Odyssey launch dependency review — 18 October 2026

## Resumed after owner approval

Later on 18 October, the owner asked to push and confirm when the site can be viewed. Implementation/deployment is authorized to resume within the existing Free-plan and release gates. The pause record below remains historical. The domain-conflict preflight and early secret checks are now implemented; seven targeted tests and typecheck pass. Public signup/indexing remain closed pending live acceptance. A closed public page may be deployed for review without claiming the email journey is live.

### Current result — public page is viewable

**https://odyssey.soralives.xyz is live with signup collection and indexing closed.** [GitHub run 39127879045, attempt 2](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39127879045), source `30be3190e007f641f1e36db1b4bc7b3daa4b3b47`, passed the complete check job and production deployment. The exact-domain preview passed, migrations reapplied, landing and scheduler deployed, four landing secrets and the scheduler signing secret installed, and live public/private-route smoke checks passed. A separate smoke run and Chrome inspection confirmed the public URL, closed signup notice, loaded hero artwork and activity → matching trophy navigation/focus.

The owner approved **Workers Routes Write on `soralives.xyz`** for both deployment tokens. Both grants are saved; the original Worker pairs and 24 October expiry remain unchanged. The source guard continues to restrict changes to the exact Odyssey hostname. This resolved the 403/10084 failure below without changing database transport, DNS for other sites, paid plans or application logic.

Staging owner access and the exact `/api/waitlist/webhook` exception are saved. The Resend staging webhook listens for delivered/bounced/complained events; its signing secret is stored in GitHub staging. `CF_ACCESS_TEAM_DOMAIN=tobiarogunmati.cloudflareaccess.com` is stored there. Staging CI access remains unfinished: the exposed credential was revoked immediately through the approved rotation, but GitHub requires fresh owner email verification before the replacement value can be saved. The token remains unattached to an Access policy and cannot yet access staging. The old GitHub value is therefore unusable. No public signup or test email journey is claimed.

Production schedules are installed (`*/5 * * * *`, `0 3 * * *`) with mail disabled and cleanup enabled; this is installation evidence, not evidence of actual scheduled recovery or cleanup execution. Logged upload versions before secret installation: landing `1cab295f-74b1-42f1-8d27-67a0cf2039a0`, scheduler `0e0ab75d-851b-48ca-81d4-42ce284bfa5e`. Secret installation can create later versions, so these IDs must not be described as verified final active versions. Startup measurements (33ms/1ms) are not per-request CPU acceptance.

**Remaining before accepting public registrations:** finish the rotated staging credential/CI policy and closed-staging smoke, verify tracking and real confirmation/welcome/referral/unsubscribe/suppression journeys, idle recovery and inbound Gmail receipt, measure deployed Free-plan resource use, pause staging mail and move the single webhook to production, then record production acceptance before enabling collection/indexing. Source security review is complete with no confirmed findings; runtime/provider acceptance remains open. Product clarity and discovery remains **Open** until the remaining deployed journeys are reviewed. Main app and game map remain separate.

Automatic deployments are disabled (`CLOUDFLARE_DEPLOY_ENABLED=false`) while staging verification is unfinished. This only stops new deployment jobs; the successful production page remains running. Re-enable deliberately when dispatching the next checked staging release.

### Earlier resumed checkpoint — superseded by the result above

- Source and deployment safeguards are pushed through `30be3190e007f641f1e36db1b4bc7b3daa4b3b47`. Its full GitHub check job passed in [39127879045](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39127879045); deployment stopped at the domain preview before migration/upload/DNS mutation.
- The bounded diagnostic reports HTTP **403**, Cloudflare error **10084**. Dashboard inspection confirms both deployment tokens currently grant only **Individual Workers Editor**. Cloudflare additionally requires **Workers Routes Write** for the affected zone. A change limited to `soralives.xyz`, retaining each Worker pair and the 24 October expiry, is prepared for owner approval. No broader grant or paid upgrade has been made. [Required permissions](https://developers.cloudflare.com/workers/authorization/workers/)
- Owner-only Access application `Odyssey staging` is saved for `odyssey-staging.soralives.xyz`. This is partial protection setup: CI policy and exact webhook exception still require completion and verification.
- A 168-hour staging CI credential was created and stored in GitHub staging. A browser response exposed its value in tool output; it is **not attached to any Access policy** and must be rotated and replaced before use. The rotation request is pending owner confirmation after automatic approval review rejected it.
- The source security audit is complete at `30be319`: all 52 units resolved, both independent critics clean, no confirmed vulnerability. The late-suppression hypothesis was independently rejected. This establishes no source blocker for a closed preview, **not** live-provider or Free-limit acceptance. The diagnostic-only follow-up was reviewed separately from full coverage at `40241af`.
- Automatic deployments are disabled after the diagnostic failure. Collection/indexing remain closed and no working public URL is claimed at this checkpoint.

## Outcome and pause (historical checkpoint)

The owner requested a pause to review whether the domain correction could disrupt other dependencies. Implementation and deployment are paused. This review changes documentation only; it does not authorize another deployment, provider change or paid service.

Keep the approved architecture: **GitHub → Cloudflare Workers Free → direct Neon**, with **Resend** for outgoing mail and Cloudflare Email Routing for incoming replies. No new database move, framework replacement or Hyperdrive setup is needed for the domain correction. Staging and production retain separate data and secrets.

The correction is narrow and passes source checks. Deployment remains unverified. The main issue is recovering safely from a partially completed release and making prerequisite checks explicit before trying again.

## Exact correction and its boundaries

Commit `d0e740e0180c6c55b2a8a5e1a0ac53a79f519511` adds `zone_name: "soralives.xyz"` to the generated Cloudflare custom-domain route, alongside the existing exact hostname and `custom_domain: true`. The regression test checks the staging route. It does not alter SQL, database URLs, application behavior, secret values, outgoing mail, inbound routing, reward policy or the landing design.

The preceding deployment error was Cloudflare `10084`: it looked for a zone named `odyssey-staging.soralives.xyz` or `odyssey.soralives.xyz`. The configured parent zone is `soralives.xyz`. Supplying that parent explicitly addresses the observed configuration ambiguity; it does **not** prove that the current token can complete custom-domain attachment. Distinguish a remaining permission error from a configuration error before changing token scope.

Cloudflare custom domains create their associated DNS record and certificate. This makes a conflict check necessary before retrying the domain operation. [Cloudflare custom-domain documentation](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/)

## State established by evidence

| Area | Verified state at pause | Still unverified |
| --- | --- | --- |
| Repository | `main` contains `d0e740e`; application runtime remains based on `06655d9` | No successful end-to-end live release |
| Automatic deployment | Repository variable `CLOUDFLARE_DEPLOY_ENABLED=false`, read back after cancellation | Must remain false during review |
| Correction run | [39124882746](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39124882746): all source check steps passed; deployment cancelled | Corrected custom-domain attachment was not attempted |
| Interrupted step | The repeat staging migration logged `Waitlist schema ready` before cancellation; build, bootstrap, upload, secrets and scheduler steps were skipped | Cancellation is not a rollback; inspect the schema ledger again before resuming |
| Neon schema | Staging and production migrations `001`–`004` completed in their earlier closed runs | Deployed Worker → Neon journeys remain to test |
| Data isolation | No subscriber/test data was copied between branches; no catalogue import occurred | Any later data import needs its own explicit mapping and validation |
| Workers | Earlier closed staging and production runs uploaded landing code/assets and bootstrapped private recovery coordinators | Actual provider versions/bindings must be reconciled before resuming; upload is not a working website |
| Website domains | Both earlier runs failed at custom-domain attachment with error `10084` | No working public URL or verified domain routing is claimed |
| Runtime secrets | Earlier runs skipped the runtime secret upload after domain failure; matching secrets are stored in GitHub | Worker secret installation and use remain unverified |
| Scheduler | Initial coordinator bootstrap completed; full scheduler deployment and scheduler-secret steps were skipped | Recovery and cleanup are not accepted as running |
| Staging Access | Zero Trust Free is active; application/policy setup is unfinished and its current form is unsaved | Owner policy, CI service token, team hostname and exact webhook exception |
| Resend | Sender domain verified; separate restricted sending keys stored in GitHub | Signed webhook, tracking flags, controlled delivery and suppression |
| Public opening | Waitlist and indexing remained false on every attempted deployment | No public waitlist release |

Closed attempt evidence: [staging 39124395066](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39124395066), [production 39124560727](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39124560727), both from `304b14a`. Both failed after upload at domain attachment. Later steps were skipped, not completed or rolled back. The production migration success supersedes older documentation saying it is pending.

## Dependencies to preserve

| Dependency | Review finding | Required action before its next mutation |
| --- | --- | --- |
| Hostnames and DNS | Generated routes remain the two exact Odyssey website hostnames. Mail DNS is separate. However, the installed Wrangler 4.151.1 custom-domain publisher enables existing-origin and DNS-record overrides in noninteractive mode; changeset errors can be swallowed before the write. | Read existing records/Worker assignments for the exact hosts and stop on conflicts. Add a fail-closed deployment preflight or an equivalently controlled attachment step before relying on unattended retries. Preserve unrelated DNS and existing mail records. No conflict or overwrite is claimed to have occurred. |
| Token capabilities | Worker/asset upload succeeded; domain attachment did not. Tokens expire 24 October 2026. | Verify the exact missing capability if the corrected route fails. Do not automatically widen access or replace working credentials. Rotate the two restricted tokens before expiry. |
| Environment separation | Each environment selects its own Neon URL, signing keys and Worker pair. The domain correction changes none of these. | Verify target names and secret presence without printing values. Continue schema convergence through migrations; never merge staging test records into production. |
| Schema consistency | Migration runner uses checksums, an advisory transaction lock and a transaction. Reapplying unchanged migrations is supported. | Read migration ledger/checksums, preserve data and existing migrations. Do not drop/recreate tables or copy a staging database over production. Cancellation does not undo already committed schema. |
| Staging access | `smoke-deployment.mjs` verifies Access even when collection is closed. Current Access setup is unfinished. | Finish owner/CI policies, provide `CF_ACCESS_CLIENT_ID`, `CF_ACCESS_CLIENT_SECRET` and exact `CF_ACCESS_TEAM_DOMAIN` before expecting a successful closed-staging smoke check. Do not weaken this test to turn the run green. |
| Webhook versus Access | Resend cannot send CI Access credentials. The application's exact webhook path must be reachable but reject unsigned requests. | Limit the Access exception to `/api/waitlist/webhook`. Verify ordinary/private routes reject anonymous and invalid credentials, valid CI access works, and unsigned webhook requests return the application's 401. |
| Closed first deployment | The bootstrap creates the scheduler's coordinator before the landing references it. Existing coordinators are preserved by the bootstrap check. | Inspect the partial bootstrap instead of resetting it. Complete closed landing, runtime secrets, full scheduler and scheduler secret before enabling collection. |
| Secrets before opening | Missing runtime configuration makes `isWaitlistEnabled()` return false. But the workflow currently validates required secret completeness in the secret-upload step, after the landing upload. | Prefer an early presence/format preflight before mutation as well as the existing runtime guard. Complete all closed installation steps first; do not use the guard as a substitute for deployment readiness. Recommendation only; no workflow edit made during this review. |
| Shared email resources | The account snapshot has one Free webhook and shared provider allowances. An 80-attempt budget in each database is not a shared account limit. | Test staging first; pause its sends and settle test mail before transferring webhook acceptance to production. Recheck other projects' usage and remaining allowance. Do not pay for a second endpoint or send from both environments at full budget. |
| Scheduler and pause behavior | Collection, mail sending and cleanup are distinct. A disabled GitHub deployment flag stops new deployments, not already-running schedules. | Verify actual schedule state after the failed runs. Preserve unsubscribe/retention cleanup when collection pauses; keep mail disabled until delivery and suppression are accepted. |
| Free operation | Source tests and the observed 19ms Worker startup do not establish per-request CPU or Neon idle suspension. | Measure deployed essential flows, idle-aware recovery and shared project/account usage before public opening. Keep the no-paid-upgrade rule. |
| Rollback | A failed workflow may leave an uploaded Worker and committed migrations. Reverting Git alone does not restore DNS, provider secrets or database state. | Record the working Worker versions, exact host assignments, secret version references and schema revision before changes. Roll back compatible code; preserve data and additive schema. No known-good public release exists yet. |

## Recommended order when the owner resumes implementation

1. Reconcile the two Worker pairs, domain assignments, disabled previews, scheduler state and Neon migration ledgers against the partial-run evidence. Keep collection/indexing closed.
2. Finish the narrowly scoped staging Access setup and its CI credentials. Prepare the exact webhook exception. Verify DNS conflicts and custom-domain token capability before changing website routing.
3. Add/review the small deployment preflight improvements above, with generated-route assertions for both exact staging and production hosts. Re-run affected checks; keep the existing security and privacy safeguards. Do not replace the application or transport.
4. Configure the staging Resend webhook and install its signing secret before expecting the closed-staging smoke check to pass. The webhook returns 503 without its signing/application secrets; the Access test correctly requires an unsigned request to reach the app and return 401. Preserve that assertion. Then run one closed staging release from an identified commit; confirm domain, HTTPS, runtime secrets, existing coordinator, scheduler installation and protected smoke checks. A separate closed production preview may be deployed earlier for owner design review, without opening collection.
5. Verify tracking settings and run controlled signup → confirmation → welcome → badge → referral → unsubscribe, duplicate/retry/outage/suppression tests. Verify recovery without another signup and actual incoming reply forwarding.
6. Complete deployed resource/idle acceptance and resolve the completion-stage security review. Keep Product clarity and discovery open until actual visitor journeys are verified.
7. Pause staging sending and settle its test mail; configure the production webhook/secret and perform a closed production release. Recheck exact environment separation, schema revision, private-page headers, recovery/cleanup and production asset delivery.
8. Only after recorded acceptance, enable production collection and indexing, verify the public URL and record the commit, Worker versions and deployment run. Preserve the documented pause/rollback procedures.

## Decisions, recommendations and unresolved items at the historical pause

**Confirmed:** review-only pause; Odyssey landing/waitlist/referrals remain the release scope; direct Neon without Hyperdrive; isolated staging/production; GitHub deployment; no paid services; approved contact, retention and existing product policies remain unchanged. The main application, content-planner ingestion and game map remain in their own plans.

**Recommendations awaiting implementation:** conflict-sensitive domain preflight, early secret checks and the resume order above. These are operational improvements, not new product requirements or permission to resume deployment.

**Unresolved:** corrected domain attachment/token sufficiency, applied staging protection, runtime secrets, email webhook/delivery/forwarding, deployed CPU and Neon idle usage, security readiness and the complete live visitor journeys. The read-only security audit remains **Incomplete**; absence of a confirmed finding is not a readiness pass.

The source-audit handoff contains 50 reviewed units, an unvalidated late-complaint/cleanup hypothesis, and two coverage gaps raised by its first critic: the adapter's implicit image handler and delivery-reconciliation SQL outside transaction-local deadlines. These are follow-up checks, not confirmed vulnerabilities. Further hunting/final critic/independent validation were stopped for this paused handoff; do not describe the full audit workflow as complete. Resend documents team-wide automatic bounce/complaint suppression, which counters an assumed delivered-mail impact but does not prove the app's own lifecycle behavior. [Resend suppression documentation](https://resend.com/changelog/suppression-list-support)

Security audit output is retained outside the Git repository at `../outputs/security-audit/odyssey-release-2026-10-18/`. Its unfinished checks and any resulting concrete correction must be reconciled before public opening; a source-review gap is not an instruction to change product policy. Product clarity and discovery: **Open**, owner unassigned; next action is the actual deployed visitor journey review.

No application code, dashboard setting, DNS record, email or deployment was changed by the original paused review. Its documentation was subsequently pushed in `40241af`. Later authorized changes and evidence are recorded in the resumed checkpoint above.
