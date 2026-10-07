# Odyssey project — landing page

A functional prelaunch preview: isometric activity illustrations, 18 explorable ideas, a browser-local Bucket list, recurring checklists, community examples, two playable films, a partnership draft and a sample signup/email journey. The real waitlist backend is implemented and stays closed until configured.

**Start with [HANDOVER.md](HANDOVER.md)** for owner inputs, GitHub/Vercel setup, environment variables, live checks and rollback. No public deployment, Neon project or email sender has been connected by this build.

## Run and check

Use Node **24.x** and pnpm **11.20.0** (pinned in `package.json`). From this folder:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open `http://127.0.0.1:3000`. Without secrets, the real email form is disabled. “Try the waitlist preview” walks through the actual email templates with a fixed sample address and no network submission.

```sh
pnpm setup:check
pnpm test
pnpm build
pnpm typecheck
pnpm test:e2e
```

Browser tests use installed Google Chrome and two isolated local production servers on ports 43217/43218. Build first. UI success responses are mocked inside the tests; the genuine unavailable-database path is also tested. PGlite tests exercise SQL/schema and mail lifecycle with a fake provider. These do not prove live Neon, Resend or Vercel behavior. The optional two-connection PostgreSQL test has separate setup instructions in the handover.

## Where to edit

| Change | Location |
|---|---|
| Tentative name, title, description | `src/lib/brand.ts` |
| Sections, FAQs and calls to action | `src/app/page.tsx` |
| Activity examples, category labels and first steps | `src/lib/preview/ideas.ts` |
| Bucket-list behavior and recurrence | `src/components/discovery-playground.tsx`, `src/lib/preview/bucket.ts` |
| Community research examples | `src/components/community-preview.tsx` |
| Isometric activity drawings | `src/components/idea-illustration.tsx` |
| Hero illustration | `public/illustrations/`, `src/components/isometric-world.tsx` |
| Layout and styles | `src/app/globals.css`, `src/app/landing-expansion.css` |
| Waitlist form and local walkthrough | `src/components/waitlist-form.tsx`, `src/components/signup-preview.tsx` |
| Actual HTML/plain-text email copy | `src/lib/email/templates.ts` |
| Privacy notice | `src/app/privacy/page.tsx` |
| Database schema, outbox and mail lifecycle | `db/`, `src/lib/waitlist/`, `src/lib/email/` |
| Video sources, posters and text tracks | `public/media/`, `src/components/teaser.tsx` |

Keep the distinction between preview actions and the future app. The preview awards no XP or trophies and makes no bookings. Named communities are research leads, not confirmed partners or current event listings. The six activity groupings are navigation for this landing page, not new approved top-level app categories.

## Media and source preservation

The 20-second portrait Odyssey film is a corrected derivative of the supplied Launch film; the 40-second Break the Loop teaser is retained. Both load only after Play, use native controls/text tracks and pause the other player. The isometric hero is an original generated illustration; individual activity scenes are editable SVG components. Fonts are self-hosted, with OFL licences in `public/fonts`.

The surrounding project contains the editable Tesseract video and image master under `outputs/odyssey-launch-2026-10-01/` and `outputs/odyssey-landing-2026-10-01/`. Original videos, Stitch exports, research and V2 documentation are preserved. They are outside a standalone `web` repository: back them up separately. Local archives are recovery copies, not off-device backups.

The wider project build/review record is `V2/design/ODYSSEY_LANDING_EXPANSION_BUILD_2026-10-01.md` in the parent workspace.
