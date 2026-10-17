# Odyssey landing — owner handover

Updated 17 October 2026. **Live signup collection remains closed; no public deployment is claimed.** The approved release is GitHub → Cloudflare Workers Free, with Neon and Resend. Public name: **Odyssey**; full name: **Odyssey Project**. Production destination: **https://odyssey.soralives.xyz**. Main-app development and Quest World remain separate.

The existing standalone repository is `Youngrogue/Odyssey_Project`. The parent V2 documents and editable media are outside it. See [launch plan and implementation record](CLOUDFLARE_LAUNCH.md) and [review checklist](LAUNCH_CHECKLIST.md).

Provisioned: free Neon project `Odyssey` with separate empty production/staging branches, and active Cloudflare forwarding from `odyssey@soralives.xyz` to the owner's Gmail. A controlled message is recorded as Forwarded by Cloudflare; a separately received Gmail copy is still unverified. Neon migrations, waitlist delivery and deployment are pending. Resend signup requires the owner's account/terms step. Provider-dashboard state is not proof of inbox delivery.

## 1. Review what is working

Run `pnpm dev`, then open `http://127.0.0.1:3000`.

- Explore activity categories, open an idea, and add it to the on-device Bucket list.
- Add a custom idea, choose once/daily/weekly/monthly, check it off, reload and download the list. Progress is local to this browser. Recurring checkmarks reset for the next device-local calendar period; previous periods remain in the local data. Weeks begin Monday. There is no account sync, reminder scheduler, booking, XP or trophy award.
- Select the ISO-GLOW dance floor, games lounge and reading garden. The active scene lights up and reveals activities. Research-only organiser names stay in the project catalogue, outside the public page.
- Open an activity’s “See trophies & leaderboards”, or the progress section. All 18 ideas connect to relevant trophy families. Switch monthly/all-time and “The leaderboard”/“My own pace”. Foodie characters show Mira/Tobi/Dee with requested titles and 2,543/2,218/1,864 monthly XP. These are original illustrated product characters, not customers or live standings; playful titles are not new approved trophy thresholds. F–S ranks, account levels and board position remain distinct. Local checkmarks never write rewards.
- Play the 20-second Odyssey film and the original 40-second Break the Loop teaser. The players pause each other. Review the portrait film's sound and music/footage rights before publication; audio is non-silent but a listening review is still needed.
- Join directly, through `/?ref=CODE#waitlist`, or with a manually entered 16-character code. Real collection remains closed until configuration passes. Confirming a valid email opens a private invite page; the welcome email includes both a public share link and a separately labelled private access link. The public sample-email walkthrough has been removed.
- Prepare a partnership introduction. It can be copied/downloaded locally. An “Open email draft” option appears only when a genuine public inbox is configured; the visitor must review/send it in their email app.

The first release can show the page with signups closed while accounts are connected. Do not describe that preview as a working public waitlist.

## 2. Confirmed setup and remaining access

| Item | Confirmed value / current state |
|---|---|
| GitHub | `Youngrogue/Odyssey_Project`; authenticated CLI; existing local Git, no reinitialisation |
| Hosting | Cloudflare Workers **Free** with static assets and OpenNext; no paid upgrade authorised |
| Domain | `odyssey.soralives.xyz`; bind only this new subdomain; preserve other DNS |
| Database | Neon project `flat-dawn-95458128`, AWS London, PostgreSQL 17, Free; staging and production branches created before any subscriber data |
| Public identity | Tobi Arogunmati; `odyssey@soralives.xyz` for contact and replies |
| Inbound email | Exact Odyssey forwarding rule active to the owner's verified Gmail destination; actual delivery still to test |
| Retention | Pending 7 days; confirmed 180 days after confirmation |
| Outbound email | Resend setup pending; tracking off; signed delivery/bounce/complaint webhook required |
| Send budget | 80 attempts/day, subject to provider allowance; retries count |
| Remaining credentials | Scoped Cloudflare deployment token in GitHub environment secrets; Neon URLs in the correct environment; Resend sending/webhook secrets |
| Optional referral perks | Founding Explorer recognition implemented; proposed 3/5-referral perks remain inactive |

Never paste credentials into chat or Git. The Google Sheet is an editorial planner, not a waitlist database. App authentication is unnecessary for this release.

The notice discloses separately retained keyed suppression hashes with no automatic expiry. Rejoining a suppressed address requires an operator procedure with identity confirmation. Do not remove suppression casually. Changing `WAITLIST_TOKEN_SECRET` without a data migration breaks existing capabilities, encrypted jobs and suppression matching.

## 3. GitHub and reproducible checks

Use the existing `web` repository, root `.`. Corrected source commit `1a982ee` is pushed to `main`; [its GitHub check run](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39034989540) passed 72 unit/database tests, 31 browser scenarios, repeatable migrations, types, both builds and the local Worker check. Follow [the launch record](CLOUDFLARE_LAUNCH.md) for the remaining live gates. Do not force-push or add the whole Downloads project. Review staged paths and scan for credentials before committing. `.env.local`, `.dev.vars`, build/cache directories and test traces are ignored; example files are intentionally tracked.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm build
pnpm test:e2e
pnpm cf:build
pnpm test:worker
```

Node24 and pnpm11.20.0 are pinned. OpenNext1.20.12 and Wrangler4.151.1 are pinned; Next16.4.2 satisfies the adapter's current peer requirement. `pnpm-workspace.yaml` explicitly allows only esbuild/workerd installation scripts and disables automatic optional peer installation. The unused storage-transfer peer is not installed.

`.github/workflows/release.yml` runs build/types/unit tests, disposable PostgreSQL17 concurrency tests, browser checks and a local Workers smoke test. PR checks receive no deployment credentials. Main releases use an explicit GitHub environment and serialize deployments; they cannot overlap.

The checked-in workflow defaults to **no deployment** until repository variable `CLOUDFLARE_DEPLOY_ENABLED=true`. After setup, main pushes deploy closed staging; production uses the workflow's manual `target=production`. Do not enable collection or indexing until the recorded checks pass. A successful GitHub run is the source of the deployed commit; do not deploy production from an uncommitted laptop checkout.

## 4. Cloudflare configuration and release

1. GitHub environments `staging` and `production` now exist and allow only `main`. Add scoped secrets per environment; none have been installed yet. Keep deployment and production collection disabled until their gates pass.
2. Create separate Hyperdrive configurations for the two Neon branches, with **query caching disabled**. Use the direct Neon endpoint with TLS; Hyperdrive provides transaction pooling. Verify the deployed pg connection and transaction behaviour.
3. Set environment variables `CLOUDFLARE_ACCOUNT_ID`, `HYPERDRIVE_ID`, and the secrets below. The deployment token must be limited to required Workers/deployment and domain permissions. Do not reuse a personal OAuth refresh token in CI.
4. `cloudflare-config.mjs` generates ignored deployment manifests. It binds the production Worker to `odyssey.soralives.xyz` and staging to `odyssey-staging.soralives.xyz`. No unrelated DNS record is replaced. GitHub deploys the landing, runtime secrets and separate scheduler Worker.
5. Public marketing/privacy HTML, JS, artwork and videos are static assets. Referral codes are parsed in the browser. `/api/waitlist/status` exposes only collection availability. Private email/invite routes and APIs stay dynamic, no-store/noindex/no-referrer. No R2, image-transformation or paid asset binding is required.
6. Protect staging with Cloudflare Access before enabling test signup. Set `STAGING_ACCESS_VERIFIED=true` only after testing the policy. Restrict Resend webhook delivery through that protection deliberately; never broadly bypass Access for private pages. Supply CI Access service-token headers securely if smoke tests need them.
7. Measure deployed CPU and startup/resource limits on the **Free** plan. Local success and bundle size do not prove the 10ms Free CPU budget. Keep collection closed if any essential flow fails; do not upgrade or remove safeguards silently.
8. Check Neon compute usage as well: five-minute database polling can prevent its five-minute idle suspension and exceed its free monthly compute allowance. The current fixed polling schedule is **not accepted as sustainably free**. Resolve this before collection; a durable, idle-aware recovery signal is a candidate, not an implemented feature. Changing to Vercel would not itself fix database polling costs.
9. Only after provider, free-tier and security checks, record `RELEASE_CHECKS_PASSED=true`; dispatch production with `open_waitlist=true`. Set `SITE_INDEXING_ENABLED=true` in production and rebuild once indexing is ready. Verify the real URL and record GitHub run/deployed SHA.

`vercel.json` is retained solely as the historical fallback. Vercel is not the active deployment path. The owner permits reconsidering it if Cloudflare proves unsuitable; no paid Vercel plan or weakened recovery schedule is authorised.

## 5. Neon, email and private configuration

- Apply `db/001`–`004` through the versioned GitHub workflow, separately per branch. The migration script records applied file checksums and holds a migration lock. No schema reset or copying live subscribers into staging is required. Existing confirmed rows are not silently re-mailed or backfilled.
- Complete Resend signup, add the owned sender, and apply its exact DNS records. Keep Cloudflare's incoming MX/SPF routing intact; sending return-path records belong on the provider-designated subdomain. Disable open/click tracking. Configure `/api/waitlist/webhook` for signed `email.delivered`, `email.bounced`, and `email.complained` events.
- The scheduler calls the landing through a private service binding plus bearer secret: recovery every five minutes, cleanup at 03:00 UTC. It has no public operational route. Keep cleanup enabled when mail/collection is paused. Each cleanup request processes at most 500 rows per table; a scheduled pass attempts up to three batches and reports an error if a backlog remains. Operators must clear/monitor that backlog. Suppression hashes are retained.
- Verify Cloudflare overwrites `cf-connecting-ip`, including forged input and distinct test sources. Disable raw URL/request logging for token-bearing routes, and review account-level logs independently. Configured shapes do not prove provider readiness.

### Configuration reference

| Name | Where / purpose |
|---|---|
| `CLOUDFLARE_API_TOKEN` | GitHub environment secret; deploy only; never client/runtime |
| `CLOUDFLARE_ACCOUNT_ID` | GitHub environment variable; Sora account |
| `HYPERDRIVE_ID` | GitHub environment variable; correct branch configuration; query cache off |
| `DATABASE_URL` | GitHub environment secret for migrations; local Next development only; Workers runtime uses the Hyperdrive binding |
| `WAITLIST_TOKEN_SECRET` | Separate per environment; random ≥32 characters; stable keyed hashing/encryption secret |
| `CRON_SECRET` | Separate random ≥32 characters; landing and scheduler binding authentication |
| `RESEND_API_KEY` | Environment secret; sending-only access to the verified domain where supported |
| `RESEND_WEBHOOK_SECRET` | Environment secret; endpoint-specific signing key |
| `WAITLIST_ENABLED` | Generated from release input; false until live checks |
| `DEPLOYMENT_ENV` | Build/runtime target: development, staging or production; replaces Vercel-specific checks |
| `APP_ORIGIN` | Exact generated HTTPS origin (local loopback for development) |
| `PRIVACY_OPERATOR_NAME` / `PRIVACY_CONTACT_EMAIL` | Approved public identity; must match static `public-site.ts` |
| `WAITLIST_RETENTION_DAYS` / `WAITLIST_PENDING_RETENTION_DAYS` | 180 / 7; must match the published notice |
| `WAITLIST_EMAIL_FROM` | Verified bare address `odyssey@soralives.xyz` |
| `WAITLIST_DAILY_SEND_BUDGET` | Initial 80 provider attempts/day, including retries |
| `WAITLIST_TRUSTED_IP_HEADER` | `cf-connecting-ip` after deployed proxy verification |
| `SITE_INDEXING_ENABLED` | Explicit production-only build setting; requires enabled production collection in the release script |
| `RELEASE_CHECKS_PASSED` | Production environment variable; set only with recorded live and security evidence |
| `STAGING_ACCESS_VERIFIED` | Staging environment variable; actual access-control verification required |

`pnpm setup:check` is a local presence report only. It cannot inspect Hyperdrive, DNS, provider quotas, token scopes or real delivery. No runtime secret is exposed with a `NEXT_PUBLIC_` prefix; the build script blanks runtime secrets before static generation. Keep secrets out of screenshots, traces and public workflow logs.

## 6. Live acceptance before opening the public waitlist

Use only controlled inboxes and disposable test records. Record the environment, date, deployment revision and result, without addresses, tokens or credentials in public logs.

- [ ] Migrations run successfully on the intended database. A signup and pending confirmation job commit together; unavailable storage shows an honest retry message.
- [ ] A confirmation email arrives. Merely opening its link does not confirm; clicking Confirm does. Confirming twice produces one welcome job. Check HTML/plain text, Reply-To, unsubscribe headers and mobile email rendering.
- [ ] Welcome and resend arrive without another signup occurring. These jobs rely on the scheduled worker, so test actual cron execution; no instant-delivery guarantee is made.
- [ ] An active duplicate does not reveal membership, overwrite preferences or resend welcome mail. Resend cooldown and daily budget behave as documented.
- [ ] Founding Explorer is recorded only after valid confirmation, not on pending signup or an expired link. Replays keep the original recognition; PNG download works and contains no email/private capability. Old records are not silently emailed or migrated.
- [ ] Referral signup, manual code and link attribution work end to end. Confirming opens the private page and counts once; duplicate/self/unconfirmed/suppressed/expired addresses do not increase qualified totals. Invalid or deleted codes do not prevent joining. Replays issue no second welcome.
- [ ] Public share codes cannot access private progress. Welcome links are distinctly labelled; private capability opens only after explicit POST, with a one-day HttpOnly cookie. Copy failure leaves a selectable link; sharing never auto-sends. Unsubscribe immediately denies access and removes that address from referral totals.
- [ ] Unsubscribe using an older delivered email after requesting a new confirmation; it still revokes the subscription and cancels queued jobs. Test unsubscribe with new collection paused too.
- [ ] Signed delivery/bounce/complaint events are processed; forged signatures are rejected. Test delivery arriving before the sender's provider-ID write. Suppression blocks new enrolment and sending, including concurrent enrolment/webhook attempts.
- [ ] Worker recovery after a simulated timeout uses the same provider idempotency key. Quota exhaustion defers rather than loses mail. The five-minute recovery job and daily purge have run successfully with authentication.
- [ ] Verify the selected proxy header, source/address limits, no token/PII logging, provider open/click tracking disabled and hosting access-log redaction/retention. The application does not log tokens, but URLs may appear in infrastructure logs unless those are configured.
- [ ] Expired test records and associated jobs disappear on purge; minimal suppression remains according to the accepted policy. Verify backups/provider logs under the chosen account settings.
- [ ] Review `/privacy` with the real operator/contact/retention values, test the monitored inbox and document the correction/deletion/rejoin process.
- [ ] Both videos, mobile layout, keyboard, text zoom, reduced motion, download/copy behavior and the current community wording work on the public URL. Listen to the video and confirm media usage rights.
- [ ] Remove synthetic records, enable production collection, verify one controlled end-to-end signup, and record the release.

The local test suite and screenshots support the code handoff. They cannot substitute for these live-provider checks. The landing has no bulk campaign scheduler: future build/launch announcements need a separate reviewed send workflow that uses confirmed, unsuppressed recipients and respects unsubscribe/budget limits.

### Required pre-release PostgreSQL concurrency checks

`tests/waitlist-concurrency.test.ts` and `tests/waitlist-referral-concurrency.test.ts` run only when `WAITLIST_TEST_POSTGRES_URL` is explicitly set to a disposable **loopback** PostgreSQL database. It never uses `DATABASE_URL`, creates a random test schema, and removes that schema afterwards. Set that test-only URL in your shell and run:

```sh
pnpm exec vitest run tests/waitlist-concurrency.test.ts tests/waitlist-referral-concurrency.test.ts --no-file-parallelism --testTimeout=30000
```

These tests remain skipped locally without a disposable PostgreSQL server. Both passed against GitHub CI's PostgreSQL17.11 service on commit `e51cf5a`; CI repeats them on each release revision. The PGlite tests exercise SQL behavior, but do not establish PostgreSQL cross-connection advisory locking. Isolated staging concurrency checks through Hyperdrive are still required before live collection. They cover suppression/enrollment, first referral attribution, and concurrent referrer deletion.

## 7. Operation, pauses and rollback

A successful form submission means a pending record was committed. It does not mean email arrived. Confirmation, provider acceptance and inbox delivery are separate states. No public queue position or subscriber count is fabricated.

The outbox keeps encrypted token/request material, stable idempotency keys, bounded timeouts, backoff and a retry ceiling. Ambiguous sends are parked before the provider idempotency window expires; investigate parked jobs using provider IDs and approved operational access, not by blindly replaying them. Logs should contain identifiers/statuses rather than addresses or capabilities.

To pause collection/sending, set `WAITLIST_ENABLED=false` and redeploy. Keep database, origin, token secret and cron secret available so unsubscribe and retention cleanup continue. A message already being sent can still arrive. Roll back to a compatible app build; do not drop tables or run destructive schema reversals. If a release introduces a schema migration, record it with the release before rolling back code.

For account changes, data removal or rejoining a suppressed address, use a reviewed operator procedure with identity confirmation. There is no admin dashboard yet. Do not delete suppression records casually or rotate secrets just to make a failed job send.


## 8. Referral operations and benefit policy

The referral relationship is attached only on a subscriber’s first valid new signup and cannot be reassigned by repeat forms. Codes are random 96-bit identifiers. Separate 256-bit dashboard capabilities are HMAC-stored and encrypted in the durable email job; a public code is never a login. Invite pages are noindex/no-referrer and show aggregate confirmed counts only. Consent version for new records is `2026-10-17-cloudflare`; old records retain their captured version.

Qualified totals represent unique confirmed email addresses, not independently verified humans. There is no device/person identity verification; aliases or separately controlled mailboxes remain a growth-abuse consideration before valuable referral benefits are offered. No cash, discounts, XP or paid entitlement is currently attached to counts.

The access cookie lasts one day; the private email link lasts while its retained signup remains confirmed, unexpired and unsuppressed. Counts can decrease after unsubscribe, suppression or expiry. Purge deletes relationships with their rows and clears orphan attribution via `ON DELETE SET NULL`; no separate permanent referral history exists. Never publish private invite links in analytics, screenshots or shared support logs. Existing source limits and send budgets remain active; invite dashboard reads are limited to 60/source/hour.

**Implemented benefit, chosen under the user’s request for early-bird recognition:** successful explicit waitlist confirmation records a stable Founding Explorer timestamp. Confirmed members can save a PNG badge from their private invitation page. It contains no private link or email. It is waitlist recognition, not an F–S trophy, XP payout, app account or automatic promise of account migration. Existing old confirmed records are not silently backfilled or re-mailed. Delete the retained record to remove stored recognition; saved image copies remain with their holders. Review/change the waitlist award policy when opening full app registration.

**Optional recommendations awaiting choice:** invitation priority at 3 qualified referrals and a product-feedback circle at 5. Confirm exact eligibility, end date, fulfillment and what happens when counts decrease before activating these. Nothing in the current UI or mail promises those thresholds, dates or a monetary benefit. Keep invitation benefits separate from app activity XP and leaderboards.
