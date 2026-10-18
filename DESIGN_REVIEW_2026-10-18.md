# Odyssey landing page — design, copy and visitor-flow review

18 October 2026. Scope: deployed landing page and its existing email action pages. Implements the owner’s desktop-density, mobile, FAQ navigation, visible-credit removal and marketing-flow requests. The main application and game-map plan remain separate.

## Result

Preserve the white/yellow/ink identity, isometric scenes, original illustrated leaderboard characters and both films. Improve the density and useful actions without rebuilding the site or changing reward policy. The page can be reviewed while registrations remain closed. Email/provider and Free-resource acceptance remain launch gates, not design approvals.

## Findings and implemented corrections

| Priority | Finding | Correction |
| --- | --- | --- |
| High | The desktop hero exceeded a short laptop viewport; its secondary action was below the fold. | Two-line heading, shorter value proposition, height-aware spacing, bounded illustration and more compact form spacing. No fixed-height clipping. Both initial actions are tested at 1440×606, 1366×768 and 1440×900, including the longer open-signup notice. Expanded invite/preferences/error states may naturally grow. |
| High | “Find something you’d love to try” only moved to the next heading. | Hero now offers **Start my Bucket list**, targeting and focusing the actual idea field. The user can enter, save and track an idea immediately without an account. Post-signup discovery links to actual activity cards. |
| High | FAQ was absent from the main navigation; mobile navigation could not expose all useful destinations cleanly. | Desktop Activities / Communities / FAQ / Join the waitlist; compact mobile Menu with the same destinations. Selection closes the menu. Escape closes it and restores focus. |
| Medium | Excessive section padding, large artwork and open community detail made the page slow to scan. | Smaller section gaps, cards, trophy art, avatars and portrait film. Community details start closed and expand on demand. All content remains available. |
| Medium | Community actions suggested browsing a live directory but revealed shared-interest descriptions. | Label disclosures **See shared interests**; accessible scene labels describe the same action. Follow-up links browse available activity ideas. Copy explains that community discovery comes with the app launch. |
| Medium | Public “CONCEPT FILM” and generator credit interrupted the Odyssey story. | Changed film label to **ODYSSEY FILM**; removed visible **Made with ISO-GLOW** and its styling. Source/rendered-copy scan found no other public maker/platform attribution. Retained bundled font licence files and accurate provider/privacy disclosures. |
| Medium | Mobile cards, headings, controls and private action pages were oversized. | Responsive type and artwork bounds; 48px mobile menu targets; 16px editable controls to avoid iOS input zoom; compact private-page padding; bounded, scrollable dialogs. No horizontal page overflow at tested widths. |
| Medium | Generic confirmation page referred to a button even when no usable token was present. | Missing/malformed-link state now directs visitors to their email or the resend form. Preserved explicit confirmation and non-enumerating success/error language. |
| Low | Hero messaging did not immediately connect interests to a useful first action. | Concrete examples, a clear Bucket-list purpose, “No account needed” by the local-list action, and concise email expectations. No invented launch date, customer count, referral perk or live competition. |

## Visitor journeys checked

1. Understand what Odyssey offers → start a local list → add, check, reload, download or remove an idea.
2. Browse/filter activity cards → open an accessible detail dialog → save → inspect the matching trophy family and activity leaderboard.
3. Switch monthly/all-time or personal pace without claiming actual competition or awarding local XP.
4. Open a community interest group → browse actual activity ideas. Unverified organiser/venue claims remain outside the public page.
5. Play either film deliberately with native controls/captions; no MP4 download before playback; playing one pauses the other.
6. Navigate to FAQ on desktop or through the keyboard-operable mobile menu; expand answers.
7. Prepare and copy/download a partner introduction locally; sending remains the visitor’s choice.
8. Closed/loading/error signup availability; enabled form validation, failed-submit recovery, optional preferences and skip. Local form tests intercept mail responses and do not prove real delivery.
9. Confirmation, missing-link, unsubscribe and private-invite entry pages: readable at 320px, no mutation just from opening a link, privacy preserved.

## Measurements and verification

Chrome at 1440×606, default closed form, collapsed community details and loaded fonts:

| Measure | Before | Revised |
| --- | ---: | ---: |
| Header | 108px | 80px |
| Hero section | 874px | 515px |
| Hero secondary action bottom from viewport top | Below the first screen | 577px |
| Default whole page height | About 10,404px | 8,618px |
| Community section | 1,316px | 847px |

These measurements describe one viewport/state, not a promise that every expanded form or enlarged-text layout fits one screen. Content is allowed to grow and scroll.

- Typecheck and production build pass.
- **35 browser scenarios pass**: 320/390/768/1440px; short desktop first-screen checks; keyboard FAQ/menu and direct Bucket-list capture; activity carousel and View all; saved-list sync/recurrence; partner draft; film playback; reward switching; closed/failed signup and email action routes.
- Automated WCAG A/AA scans pass on the tested base and modal/action states; reduced-motion and 200% text tests pass, including every trophy family at 320px. This is test coverage, not certification of every assistive technology.
- Manual Chrome inspection: 390px hero and focused list input, 320px trophy/standing cards, 1440×606 hero. Reviewed against owner screenshots.
- Browser screenshot evidence is generated under `test-results/landing-evidence/` (ignored). Selected owner-review captures are retained in the parent workspace’s `outputs/odyssey-design-review-2026-10-18/`.
- No database, reward, email-delivery, DNS or provider-budget logic is altered by this design change. Existing safeguards remain intact.

## Remaining items and recommendations

- **Launch gate:** actual confirmation/welcome/referral/suppression delivery, scheduled recovery, Gmail receipt, production webhook and deployed Free-resource acceptance remain incomplete. Keep collection/indexing closed until accepted. The static page’s appeal does not establish a working public waitlist.
- **Resource question:** the Cloudflare overview showed 9ms CPU while its last-24-hour CPU chart showed higher percentiles (P50 65.53ms, P90 162ms, P99 221ms). Resolve the measurement/flow attribution before asserting Free-tier suitability; do not upgrade or remove safeguards.
- **Owner review:** check the new desktop density and mobile layout on personal devices. Sound/footage publication rights and real-device screen-reader/keyboard behaviour still need their respective owner/manual acceptance.
- **Future optimisation recommendation:** after legitimate traffic exists, compare activity saves and successful confirmations; do not invent conversion lift or add third-party analytics without a privacy decision.
- **Product clarity and discovery: Open.** The landing’s local discovery path is verified; the full deployed email and upcoming application journeys are not yet accepted. Main-app planning is unchanged.
