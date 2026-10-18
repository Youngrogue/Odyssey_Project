# Odyssey — landing page

A prelaunch landing page: isometric activity illustrations and interactive ISO-GLOW community scenes, 18 explorable ideas, a browser-local Bucket list, recurring checklists, illustrated trophy/leaderboard storytelling, two playable films, a partnership draft and confirmed invitation referrals. The real waitlist backend is implemented and stays closed until configured.

**Start with [HANDOVER.md](HANDOVER.md). The landing page is live at https://odyssey.soralives.xyz with signups and indexing closed.** Source `30be319` deployed through [GitHub run 39127879045](https://github.com/Youngrogue/Odyssey_Project/actions/runs/39127879045), attempt 2; full checks, deployment, live route checks and Chrome inspection passed. Neon stays in place with isolated staging/production branches. See the [current deployment record](LAUNCH_DEPENDENCY_REVIEW_2026-10-18.md#current-result--public-page-is-viewable) for remaining email, staging, resource and visitor acceptance before registrations open.

Use [LAUNCH_CHECKLIST.md](LAUNCH_CHECKLIST.md) to review the visitor journeys, and [CLOUDFLARE_LAUNCH.md](CLOUDFLARE_LAUNCH.md) for the current implementation evidence and blockers.

## Run and check

Use Node **24.x** and pnpm **11.20.0** (pinned in `package.json`). From this folder:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:3000`. Without secrets, the real email form is disabled. The page says signups are opening soon; there is no fake success or public email walkthrough. Referral storage, confirmation and mail are exercised with isolated test fixtures until real providers are configured.

```sh
pnpm setup:check
pnpm test
pnpm build
pnpm typecheck
pnpm test:e2e
pnpm cf:build
pnpm test:worker
```

Cloudflare runtime uses pinned `@neondatabase/serverless` 1.2.0 with a WebSocket `Client` opened and closed per invocation, preserving interactive transactions. Its `DATABASE_URL` is a runtime secret supplied from the corresponding GitHub environment; no Hyperdrive object, ID or binding is required. `pg` remains for loopback development/tests and migration tooling. Never put the database URL in public environment variables or static assets.

Browser tests use installed Google Chrome (bundled Chromium in CI) and two local production servers on ports 43217/43218. Build first. UI success responses are fixtures; the unavailable-database path is also tested. PGlite covers sequential SQL/mail behaviour. CI separately provisions PostgreSQL17 for cross-connection locking tests. `test:worker` exercises a closed local Workers build. None substitutes for live delivery, deployed free-tier CPU measurements or the security readiness review.

## Where to edit

| Change | Location |
|---|---|
| Name, title, description | `src/lib/brand.ts` |
| Sections, FAQs and calls to action | `src/app/page.tsx` |
| Activity examples, category labels and first steps | `src/lib/preview/ideas.ts` |
| Bucket-list behavior and recurrence | `src/components/discovery-playground.tsx`, `src/lib/preview/bucket.ts` |
| Activity trophy/leaderboard concept mappings | `src/lib/preview/rewards.ts`, `src/components/rewards-preview.tsx`, `src/app/rewards-preview.css` |
| Production canonical/social metadata and explicit indexing | `src/lib/site-metadata.ts`, `src/app/robots.ts`, `src/app/sitemap.ts` |
| Community scenes and activity paths | `src/components/community-preview.tsx`, `src/components/community-islands.tsx`, `src/app/community-islands.css` |
| Isometric activity drawings | `src/components/idea-illustration.tsx` |
| Hero illustration | `public/illustrations/`, `src/components/isometric-world.tsx` |
| Layout and styles | `src/app/globals.css`, `src/app/landing-expansion.css` |
| Waitlist and optional invitation code | `src/components/waitlist-form.tsx` |
| Referral attribution/private page | `db/004_waitlist_referrals.sql`, `src/lib/waitlist/referrals.ts`, `src/app/waitlist/invite/` |
| Original portraits and trophy graphics | `src/components/explorer-portrait.tsx`, `src/components/achievement-art.tsx` |
| Actual HTML/plain-text email copy | `src/lib/email/templates.ts` |
| Privacy notice and consent version | `src/app/privacy/page.tsx`, `src/lib/waitlist/notice.ts` |
| Database schema, outbox and mail lifecycle | `db/`, `src/lib/waitlist/`, `src/lib/email/` |
| Video sources, posters and text tracks | `public/media/`, `src/components/teaser.tsx` |

Keep the distinction between preview actions and the future app. The preview awards no XP or trophies and makes no bookings. Unverified named communities remain in research documents, outside public landing copy. Illustrated character scores are not live standings. Confirmed early members receive a saveable Founding Explorer badge. Referral milestone perks remain an owner decision; no unapproved thresholds or XP rewards are active. The six activity groupings are navigation for this landing page, not new approved top-level app categories.

## Media and source preservation

The 20-second portrait Odyssey film is a corrected derivative of the supplied Launch film; the 40-second Break the Loop teaser is retained. Both load only after Play, use native controls/text tracks and pause the other player. The isometric hero is an original generated illustration; individual activity scenes are editable SVG components. Fonts are self-hosted, with OFL licences in `public/fonts`.

The surrounding project contains the editable Tesseract video and image master under `outputs/odyssey-launch-2026-10-01/` and `outputs/odyssey-landing-2026-10-01/`. Original videos, Stitch exports, research and V2 documentation are preserved. They are outside a standalone `web` repository: back them up separately. Local archives are recovery copies, not off-device backups.

The wider project build/review record is `V2/design/ODYSSEY_LANDING_EXPANSION_BUILD_2026-10-01.md` in the parent workspace.
