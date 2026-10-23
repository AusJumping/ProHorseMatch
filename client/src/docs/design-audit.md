# ProHorseMatch — pre-edit design audit

## Scope and evidence

Task #9: one isolated proposal, not an application redesign. This document was written before the preview or App integration was edited.

**Evidence is source review, not rendered verification.** Reviewed the route declarations in `client/src/App.tsx`, each active page's imports, rendered JSX, style classes and conditional states, the shared components listed below, `index.css`, and the existing font declarations in `client/index.html`. Large forms/admin files were reviewed through source extracts covering presentation, imports, state branches, headings, controls and dialogs. This is not an execution audit of their API or mutation logic.

No authenticated session, production records, database, media provider, payment flow, email or push operation was used. No route was visually verified during this audit. In particular, authenticated, seller and admin screens and interaction-only dialogs are **code-reviewed, rendered-unverified**. The parent owns subsequent builds, screenshots, deployment and regression verification. Do not describe these findings as a visual audit.

## Current system: shared findings

These inherited findings apply to every page using the named primitives; individual rows below call out differences.

| Area | Source evidence | Inconsistency / proposed direction for review only |
| --- | --- | --- |
| Brand colours | `index.css` primary is 17% charcoal, accent is an HSL approximation of gold; literal `#2b2b2b`, `#cdac6e`, `#c9a96e`, `#e4e2dd`, `#e4e3dd` appear in pages. `.dark` primary is green. | Preserve the actual logos and approved exact charcoal, gold and warm neutral. Preview uses exact hex values, not edits to existing tokens. |
| Secondary colour | Global `--secondary` is brown, white foreground. Notification and help pages add `#8B7355` / `#6B5344`; profile uses brown. | Preview secondary means warm neutral with charcoal type, not the existing brown primitive. |
| Type | Global body Inter; h1–h6 and `font-display` Playfair Display; `font-accent` Montserrat. `font-serif` / `font-sans` also occur. | Current heading font depends on element, utility, and file. Preview explicitly proposes Montserrat 32/24/20px; Inter 16px / 24px. Logo artwork stays untouched. |
| Buttons | `ui/button.tsx`: 40px default/icon, 36px small, 44px large; 6px corners, 14px text, SVG force-sized to 16px. | Sizes below proposed 48px; pages override black, gold, brown and semantic colours. Preview uses two variants, 12px corners, 48px minimum height. |
| Overrides | `index.css` sidebar/like/info/reset hover rules force white on gold with `!important`; pass/info force black. | Small white on gold fails AA. Do not fix app globally before approval. Preview uses charcoal on gold and a charcoal focus ring. |
| Cards | `ui/card.tsx`: 8px rounding, border, small shadow, 24px inner padding. Horse cards add medium shadows and viewport-dependent heights. | Pages introduce 6/8/12/16/24px corners and different elevation/borders. Preview has one 16px photo card with subtle shadow and no heavy border. |
| Spacing | Primitives and pages mix 2/4/6/8/12/16/20/24/32px and larger values. Layout header is 16px; page containers vary. | Preview demonstrates 8/16/24/32px. Existing spacing remains unchanged. |
| Icons | Lucide is dominant. Button primitive enforces 16px while individual icons range from 12px to 64px; heart icons may be filled. Mobile menu uses 56px and 2.5 stroke. | Preview uses outline Lucide, 20px or 24px, stroke 1.75, with visible labels/accessibility names. |
| Inputs / dialogs | `ui/input.tsx` is 40px, 6px corners; desktop font becomes 14px. Radix dialog has dark overlay, 24px padding, 18px title and 16px close icon. | Separate from page heading and touch scale; custom modals also exist. Proposed preview avoids using shared primitives or portals. |
| Other primitives | `ui/badge.tsx` uses 12px pill labels; `ui/alert.tsx` uses bordered 8px cards and h5 titles. Forms/selects/tabs/checkboxes inherit global tokens, including forced white select options in `index.css`. | Not a consistent three-level heading system; defaults are not a future approved style system. |
| Loading / failure | Spinners, bare text, skeletons and null renders all exist. | Future rollout would need consistent loading, retry and empty-state composition. Static preview does not invent API states or connect APIs. |

## Page-by-page active route inventory

All rows below are **source reviewed only**. Access labels describe source intent, not a security certification. C = colour; T = typography; B = buttons; S = spacing; K = cards; I = icons. Where a row says “shared”, see exact inherited values above.

### Public entry, discovery and account access

| Route / source | Findings across C / T / B / S / K / I | Conditional states reviewed |
| --- | --- | --- |
| `/` — `pages/landing.tsx` | C: charcoal background, two gold literals and warm-neutral variants; white text on gold Sign In. T: Montserrat 20px heading, 24px offer, 18px controls. B: shared buttons with inline colours and custom padding. S: centered max-width layout, 16px action gap, 32px blocks. K: no listing card or horse photography. I: none in main actions. Existing `logo.jpg` is image artwork. | Loading logo + spinner; installed app redirects to filter; signed-in redirect; login and registration actions. |
| `/dashboard` — `pages/dashboard.tsx` | C: dark tile dashboard introduces many bespoke charcoal/gold shades. T: welcome adapts from 14–20px; tile title 15/17px, supporting copy 11/12px. B: full clickable tiles with gold focus ring. S: compact 8/10px grid, custom min heights; 2 mobile columns. K: 8/12/16px rounding, strong dark shadows. I: 16/20px menu icons, 12/16px arrows. Photo-free, chrome-led rather than horse-led. | Auth redirect, `null` loading/missing-user branch; seller-only Add Horse tile; buyer/seller welcome labels. |
| `/filter` — `pages/home.tsx` | C: shared Layout neutrals; white custom controls; filter/swipe colours inherited. T: shared Montserrat header but grid/swipe use mixed Montserrat/Playfair. B: shared plus compact badge/currency controls. S: custom panel, grid and swipe spacing; Layout mobile overflow rules. K: different browse/grid/swipe card systems. I: mixed compact filter/list/swipe icons. | Horse query loading/error/refetch logic, logged-out prompts, buyer matches/likes and dismissed horses, filtered results. No actual horse records inspected. |
| `/browse` — inline App route | No independent view or style. `window.location.replace('/filter')` redirects to discovery. | Redirect only; behavior must remain unchanged. |
| `/auth` — `pages/auth.tsx` | C: neutral-100 shell, white cards, gold/white action treatment. T: default CardTitle alongside inherited Playfair terms headings; body/form labels mostly 14px. B: shared controls, password toggle and link-style actions. S: 16px shell, compact 4/8px form gaps, 32px vertical space. K: shared bordered card, tabs. I: small password/loading/verification icons. Existing auth logo is not to be re-typeset. | Sign-in/register tabs, buyer/seller radio inputs, validation, submitting/disabled actions, reset request dialog, token reset form, terms and code-verification dialogs. No forms submitted. |
| `/verify-email/:token?` — `pages/verify-email.tsx` | C: amber/orange background, blue pending, green success, red failures. T: 24px CardTitle; gray body. B: shared resend and continue controls. S: 16px shell, 12/16px groups. K: centered shared max-width card and coloured alerts. I: 64px Mail/Check/X, small submit spinner. | Missing-token email form, pending, success, error/expired, resend busy state, phone vs desktop continuation. Tokens not exercised. |
| `/horse/:id` — `pages/horse-detail.tsx` | C: white/neutral panels, charcoal price, gold accents, red error/report. T: 20/24px Montserrat horse name, mobile 14px metadata, mixed inherited headings. B: primary/outline/message/favorite/report controls, some gold/white treatment. S: mobile 12px vs desktop 24px content; gallery 35/45vh. K: custom 12px shadowed panel instead of shared Card. I: varying 16px details/actions and spinner, MediaCarousel arrows. | Loading and unavailable/error, missing description/lineage, currency conversion, owner vs buyer messaging/favorite actions, report reason/details dialog. Listing/media not fetched for audit. |

### Buyer, seller and account workspaces

| Route / source | Findings across C / T / B / S / K / I | Conditional states reviewed |
| --- | --- | --- |
| `/profile` — `pages/profile.tsx` | C: brown `#8B7355` heading detail, neutral labels, red danger zone. T: default CardTitles and 14px labels; no unified Montserrat hierarchy. B: shared save/notification/delete variants. S: 16/24px groups, compact gaps. K: shared cards and tabs. I: 16/20px profile/settings icons; notification subsystem differs. | Loading spinner, read-only profile fields, password edits/validation, notification settings/reminder, delete-account confirmation/error/busy. No settings changed. |
| `/add-horse` — `pages/add-horse.tsx` | C: neutral surfaces, red validation, gray empty upload areas. T: default CardTitle; 18px upload headings, 14px labels. B: shared form/upload/navigation controls. S: gaps 4/8/12/16/24px and 32px groups, upload area 32px. K: shared Card; tabs, 6px upload borders and previews. I: compact upload/remove/loading glyphs. | User/constants loading, required-field validation, tabs, photo/video empty/error/upload branches, social promotion dialog and publish mutation errors. Legacy remote placeholder fallback identified; not invoked or changed. |
| `/my-horses` — `pages/my-horses.tsx` | C: white/charcoal, green edit and red deletion overrides. T: Montserrat 24px page and 20px empty/modal headings. B: shared add, 32px edit/delete overlays, custom questionnaire actions. S: 24px grid, 16px shell, empty 80px vertical padding. K: HorseCard plus 12px empty panel/custom modal. I: 16px overlays, 32px empty illustration. | Seller query loading, no-listings CTA, delete/sold questionnaire, confirmation/cancel/pending/error logic. No mutations executed. |
| `/edit-horse/:id` — `pages/edit-horse.tsx` | C: gray/white with red validation/upload failures. T: Montserrat CardTitle, 18px photo/video headings and 14px labels. B: shared controls plus reorder/delete/upload actions. S: 4/8/16/24px groups and 32px shell. K: shared card/tabs, 4/6px thumbnail rounding. I: compact reorder/delete/upload glyphs. | User/constants/horse loading, validation, existing/no-photo/video states, drag/reorder and upload failure branches, save failure toast/alert. Legacy remote error-image fallback present. |
| `/migrate-horses` — `pages/migrate-horses.tsx` | C: shared cards with green success/red error alerts. T: default titles, medium report labels. B: shared migrate/return actions. S: 16px action gaps. K: shared Card/Alert. I: loading/status glyphs. | Auth redirect/loading, non-seller Not Authorized, pending migration, transferred list, success/error. Not run: migration changes data. |
| `/favorites` — `pages/favorites.tsx` | C: neutral card list, gray empty heart, destructive Remove. T: Montserrat 30px title and 20px names; empty heading inherits serif. B: small outline Details / destructive Remove, unlike HorseCard. S: 16px container, 24px grid, 12px footer padding. K: shared bordered cards, 4:3 photos, skeleton cards. I: 16px actions, 64px empty heart. | Auth/local-storage checks, skeleton loading, no-favorites CTA, remove errors; no live shortlist inspected. |
| `/messages` — `pages/messages.tsx` | C: grays/white, amber prompts, accent avatar gradients with white text, red block/report states. T: `font-sans` title contrasts with inherited serif empty headings; body 12/14/16px. B: shared and custom rounded composer/send controls. S: 8/12/16/20/24/32px mixed. K: 24px message bubbles/composer, 12px panels, circles and shadows. I: compact menu/send/status glyphs and larger empty illustrations. | Signed-out sign-in prompt; conversation error/retry, loading and empty; no conversation selected; message skeletons/error/empty; blocked composer; block confirmation and report dialog; push prompts. Never opened a conversation or sent a message. |
| `/saved-searches` — `pages/SavedSearches.tsx` | C: neutral cards plus green success/amber alerts. T: inherited 30px page title, 18px card/empty headings, 14px criteria. B: shared create/edit/delete/toggle-notification and dialog controls. S: 8/12/16/24px groups, 32/48px shell. K: default cards and 8px notices, pill badges. I: 16px bell/edit/delete actions; larger empty search. | Text loading, no-searches CTA, create/edit form, criteria selectors, email alert success, push opt-in, mutation errors. No alerts enabled or subscriptions created. |

### Administration

| Route / source | Findings across C / T / B / S / K / I | Conditional states reviewed |
| --- | --- | --- |
| `/admin` — `pages/admin.tsx` | C: broad blue/green/amber/purple/red semantic and chart palette independent of brand. T: inherited 30px page title, mixed 14px CardTitles, 18px subheads and 24/30px metrics. B: many semantic overrides for moderation, export and bulk-email tools. S: 8–32px card grids, scroll areas/tables and long tab panels. K: shared bordered cards plus tinted notices; 8px panels and pill badges. I: chart/status/action icons at multiple sizes; existing decorative pictographs also occur. | Email allowlist access-denied view, auth/analytics loaders, overview/users/horses/revenue/engagement/deletion/report/notification panels, no-report/user/horse/analytics states; report moderation; password/email edit dialogs and bulk-email preview/send branches. All code-only. No admin access or action attempted. Existing pictographs left unchanged; none introduced by preview. |

### Payments and completion states

The payment wrappers select `PaymentsUnavailable` when `paymentsAvailable` is false. Enabled Stripe branches are source-reviewed alternatives, **not verified reachable on the sandbox**. No payment capability is enabled by this task.

| Route / source | Findings across C / T / B / S / K / I | Conditional states reviewed |
| --- | --- | --- |
| `/checkout/:horseId` — `pages/checkout.tsx` | C: white/neutral payment panel, green success. T: 24px Montserrat checkout title. B: shared full-width submit/retry. S: 24px panel and 40px shell. K: custom 12px panel with subtle shadow. I: 16px spinner and 64px success. | PaymentsUnavailable wrapper; enabled loading, payment error/recovery, payment form/pending/success. Not submitted. |
| `/payment-success` — `pages/payment-success.tsx` | C: strong green gradient receipt header, white details. T: 30px Montserrat heading, 20/24px receipt values, 14px labels. B: two shared navigation actions. S: 24/32px content, 64px shell. K: shared Card and 8px inset. I: 64px check, 16px chevron. | Purchase-details extraction/fallback and redirect source; route remains in App even when checkout is disabled. No successful purchase asserted. |
| `/subscription` — `pages/subscription.tsx` | C: warm `#e4e2dd`, green checks, amber notices, white/gold popular badge. T: Montserrat 18/24/30px mixed with inherited legal headings. B: shared activate/change/cancel/terms controls; disabled terms and busy states. S: 16/24px grids, 48/80px sections. K: shared cards, popularity rings, inset terms areas. I: 12/20/24/32/48px check/spinner sizes. | PaymentsUnavailable outer gate; native free-beta panel; login-required, loading, free beta/current subscription/future plans, terms/payment/notification dialogs, payment error and pending. Source links to `/login`, not declared in App; future functional review item, not altered here. |
| `/subscription/success` — `pages/subscription/success.tsx` | C: neutral shared cards with green circle/check. T: Montserrat 24px success/loading; error title default font. B: shared retry/navigation variants. S: 16/24px groups, 80px shell. K: shared Card, no normal Layout wrapper. I: 48px spinner, 32px success mark. | Verifying/error/retry/activated states. “Account settings” navigation targets removed `/account-settings`; record for future work, do not change in style task. |
| `/donation-checkout` — `pages/donation-checkout.tsx` | C: warm neutral panel and gold submit/status; white inset. T: Montserrat 24px headings. B: gold override plus shared cancel/back. S: 24px panel, 40px shell. K: custom 12px panel, 8px inset. I: 48/64px gold Heart/Check and 16px spinner. | PaymentsUnavailable wrapper, native gate; enabled amount/error/loading/payment success and busy branches. No donation run. |
| `/donation-success` — `pages/donation-success.tsx` | C: warm neutral card, gold check/heart and action. T: 30px Montserrat title, 20px copy. B: gold override with shared foreground. S: 24px rhythm, 32px panel, 40px shell. K: 12px custom panel; circular icon area. I: 40/64px status illustration. | Amount-dependent text and missing-amount redirect. No receipt verified. |

### Help, legal, opt-out and errors

| Route / source | Findings across C / T / B / S / K / I | Conditional states reviewed |
| --- | --- | --- |
| `/help` — `pages/help.tsx` | C: brown gradient masthead/support block and blue/green/purple/amber instructional tiles. T: `font-serif` 48/60px hero, 36px sections, default card titles. B: translucent outline scroll/install/support actions. S: 16px shell, 48px sections, 64px long-form gaps, 80px indents. K: shared cards and bordered accordion items. I: 16px buttons, 20/24px notices, 32px section icons. | Installed-app success banner, platform-specific installation guidance and FAQ accordion, notification guidance. No installation or permission action performed. |
| `/privacy` — `pages/privacy.tsx` | C: LegalPage charcoal/white with brown links. T: serif 30px page title and prose headings/body rules. B: text navigation/mail links, not marketplace buttons. S: 20px shell, 40px vertical padding, long-form prose. K: no card. I: none. | Static legal content only; actual logo inherited from LegalPage. |
| `/delete-account` — `pages/delete-account.tsx` | C/T/B/S/K/I: same LegalPage system as privacy. | Public instructions and contact links, not the destructive account dialog itself; deletion not attempted. |
| `/unsubscribe` — `pages/unsubscribe.tsx` | C: `#F8F6F0`, brown text, cream border, green/red status and amber loader. T: re-typeset brand name 30px, CardTitle 20px, body 14/16px. B: brown/gold outline return/mail control. S: 16px shell, 16px groups, 32px title gap. K: shared cream-bordered card. I: 40px spinner, 48px check/error, 16px mail. | Loading, success and missing/failed-token states. Not visited with a token: route may mutate opt-out status on load. |
| `/welcome` — inline App redirect | No independent rendered design: `<Redirect to="/filter" />`. | Do not confuse this with unused `pages/welcome.tsx`. |
| Unmatched — `pages/not-found.tsx` | C: gray-50 shell, gray text, red icon. T: inherited 24px bold h1, 14px body. B: no recovery button. S: 16px side margins/24px card body. K: default centered Card. I: 32px alert. | Static error, including removed/nonexistent routes. |

## Shared component inspection

| Source | Findings and relevant states (all code-only) |
| --- | --- |
| `Layout.tsx`, `Sidebar.tsx`, `MobileNavbar.tsx` | White/neutral shell, 256px sidebar, Montserrat 20px header, 32px back target and 16px header actions. Sidebar has 20px icons and gold overrides; mobile sheet rows are 48px but menu icon is 56px/2.5 stroke in 64px control. Seller/admin/auth conditionals differ. Notifications/PWA prompts add visual density around horse content. |
| `HorseCard.tsx` | 4:3 photo, white medium-shadow card, global viewport height caps, Montserrat 20px name, 14px metadata. Black profile button, 40px favorite target with filled 18px white/gold heart. Price pill and lineage/stats add density; currency loading uses 12px spinner. No effect or API path was executed. |
| `HorseGrid.tsx`, `SwipeSection.tsx` | Grid uses 18px Montserrat names, swipe/empty headings Playfair 20px; 12px custom rounding, black actions, varying photo/metadata balance. Swipe skeleton/no-horses/end-of-results states differ from grid empty state. |
| `MediaCarousel.tsx` | Cover media, video badges, 32px round arrows with 20px icons, tiny dots; photo-empty state includes a pictograph. Preview intentionally uses a plain local image, not this API-aware component. |
| `FilterPanel.tsx`, `CurrencySelector.tsx`, `ui/CurrencyRate.tsx` | Montserrat filter labels, compact 32px reset, black/neutral surfaces, 8px panel/12px top corners. Dense multi-selector ranges, disabled competition level and currency status. The global reset/select overrides influence contrast. |
| `NotificationBell.tsx`, `UnreadNotificationBanner.tsx` | Brown bell in 40px target, red/amber unread markers. Banner combines 12px rounding, brown actions and 24px dismiss target. Conditional unread/permission states not rendered. |
| `PWAInstallBanner.tsx`, `ContextualNotificationPrompt.tsx` | Small shared cards, brown controls, 12–20px glyphs and 24px dismiss controls; conditional installed/dismissed/permission branches. |
| `NotificationReminder.tsx`, `NotificationPromptModal.tsx` | Brown gradients, 16px corners, large shadows, coloured benefit tiles, 48/56px CTA variants and mixed heading/body sizes; reminder uses prominent border and decorative pictographs. Stronger visual emphasis than listings. No permissions requested. |
| `NotificationSettings.tsx`, `NotificationDeviceCheck.tsx` | Shared cards/switches, 14px control descriptions, 12px helper text, blue instructions; unsupported/native/denied/loading/subscribed/disabled and diagnostic states. |
| `PushNotificationTestPanel.tsx`, `AutoWebPushRegistration.tsx` | Admin testing UI uses coloured metrics/status badges, 32px icons and scroll areas; automatic registration has no own UI. Preview must mount neither. No test pushes or registration triggered for this task. |
| `DeleteAccountDialog.tsx` | Radix destructive confirmation with typed input, red danger styling, inline alert and pending spinner; distinct from public instructions page. No destructive call executed. |
| `VerifyCodeDialog.tsx` | Amber gradient mail badge, 24px default title, large tracked code input, inline errors, gray/white submit and small amber resend link; countdown/disabled/busy states. |
| `TermsDialog.tsx`, `TermsOfServiceDialog.tsx` and inline auth/subscription terms | Duplicated long-form presentation, blue link variants, 20px dialog titles, 18px legal subheads and fixed-height scroll areas. Not a unified typographic scale. |
| `LegalPage.tsx` | Real `logo.jpg`, charcoal header/white reading area, 30px serif title, brown links and 20px prose margins. Separate shell from Layout. |
| `PaymentsUnavailable.tsx`, `NativePaymentGate.tsx` | Unavailable state is plain centered text/link in Layout; native beta state uses shared card and Montserrat title. These are real active alternatives, not bugs to bypass. |
| `intro-gate.tsx` | Mobile video overlay covers page, with independent skip button and replay/resume behavior. Preview needs a narrow branch before provider/intro mount; do not alter intro for normal pages. |

## Unused alternates are not active pages

App imports none of these. Source import search found no active-page import of the alternates below. They were inspected as historical alternatives, not included in the active route inventory or claimed as rendered:

- `pages/add-horse-complete.tsx`, `pages/add-horse-new.tsx`: alternate card/form implementations with their own upload/step presentations.
- `pages/add-horse.tsx.old`: old listing form with breeding/photo/video sections.
- `pages/admin-clean.tsx`: separate destructive database-management interface; not the active `/admin`.
- `pages/profile.tsx.bak`: old preferences/account/notification/danger-zone tabs; not the active profile.
- `pages/welcome.tsx`: old welcome composition with charcoal/gold shades; `/welcome` currently redirects instead.
- `/account-settings` is explicitly removed in App; it is not a missing route to recreate in this task.

## Approved proposal boundary

**Layout paradigm:** editorial specimen, with a large quiet photograph and an inspectable mobile-first style sheet below. **Mood:** calm, confident equestrian editorial; not a dashboard or a replacement landing page.

- Unchanged existing logo asset and exact existing charcoal `#2b2b2b`, gold `#cdac6e`, warm neutral `#e4e2dd`, white `#ffffff`.
- Montserrat headings 32/24/20px only; Inter 16px body / 1.5 line height. Existing loaded fonts; no font/package installation.
- Primary charcoal/white; secondary warm-neutral/charcoal with light boundary; 48px targets, 12px button corners, real keyboard focus, explicit disabled controls.
- 8/16/24/32px spacing specimens, 20–24px Lucide outline icons, a single 16px rounded photo-led fictional horse card.
- Preview interaction is in-memory only. Nothing creates, favorites, messages, subscribes, uploads or modifies real horses.
- Exact `/style-preview` (optional trailing slash) only when `import.meta.env.VITE_REDESIGN_SANDBOX === "true"`. All normal routes keep the same provider/intro/router tree.
- Scoped preview CSS only. No edits to global tokens, existing pages, shared primitives, logos, backend, providers or safety scripts.
- No-index robots metadata is attached only while preview mounts and restored on unmount. This is indexing advice, not access control; the sandbox preview is intentionally public.

## Photograph and licence

Existing local asset: `client/public/style-preview/horse.jpg`.

Source: https://images.unsplash.com/photo-1603989888581-3115416784fa

Licence: Unsplash License — https://unsplash.com/license (permits downloading and use, including commercial use, subject to its restrictions). Photographer identity was not supplied/independently established; do not invent a credit. No runtime image-service request is used by the preview. The photographed horse is used solely as a **fictional illustration**; invented name, age, breed, location and other attributes are not claims about that horse or a live listing.

## Contrast and verification handoff

Preview text pairings to verify numerically with the sRGB WCAG relative-luminance formula: charcoal on white, charcoal on warm neutral, charcoal on gold, white on charcoal. Small white text on gold must not be used. A light secondary boundary is decorative; filled neutral contrast and a visible charcoal keyboard ring identify the control.

Required rendered verification, not yet performed: narrow mobile (320px), ordinary phone (390/402px), desktop; no horizontal overflow; image loading and fallback; keyboard order/focus; inspect primary/secondary focus/disabled samples and in-memory demo; verify no auth/push/currency requests on preview. Compare landing/login and existing route behavior with sandbox on/off; confirm disabled flag makes preview unreachable and verify no-index metadata cleanup after navigation. Parent to run production build, sandbox safety checks and screenshots. Numerical text contrast does not establish outdoor visibility or replace actual accessibility testing.

Implementation checks: dependency-free Node test runner with the existing tsx loader covers exact route/flag matching and the four text contrast pairs. Additional source tests use existing PostCSS to check selector scoping and check preview source for no-index/local-image/no-data-client constraints. These are not browser interaction tests or a production-build pass. `main.tsx` service-worker registration, splash and resume-recovery behavior remain unchanged; excluding page providers does not disable that application bootstrap.

This audit lives at `client/src/docs/design-audit.md` to comply with the delegated output-directory boundary; it is available read-only inside the preview's audit disclosure.

Stop for explicit user approval before applying anything elsewhere.
