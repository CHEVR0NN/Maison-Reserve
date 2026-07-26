# Changelog

All notable changes to this project are recorded here.

## v3.1.0 — 2026-07-26

Layout and depth refinement pass across the Twilight Cellar rebrand — same tokens and identity,
fixing a real layout bug plus several places where execution drifted from the v3.0.0 design spec.

- **Fixed a layout-breaking bug:** two unrelated CSS rules both used the class name `.cc` (a
  Loyalty channel-chip badge and the Command Center page container). The container inherited the
  chip's `display: flex; align-items: center` declarations, turning the whole Command Center into
  a single centered flex row instead of a stacked page — this was the direct cause of the large
  dead space and reflowed headings reported. Renamed the chip class to `.chan-tag`.
- Replaced flat single-tone `--surface` fills on Command Center tiles, panel cards, and Inventory
  category cards with a subtle stepped-luminance gradient (`--surface-2` → `--surface`), so depth
  reads from lit-plate shading rather than a uniform boxed fill — no `box-shadow` added to content,
  per the existing no-card-elevation rule.
- Rebuilt the Loyalty tier display from five boxed cards (one filled solid claret) into the single
  hairline-divided ledger row the v3.0.0 spec called for; the top tier now reads via a 2px claret
  rule on its identity column only, restoring the Claret Budget Rule the boxed version had broken.
- Replaced the Inventory category strip's eight-color rainbow of hardcoded off-palette hex accents
  (leftover from the pre-rebrand palette) with the restrained verdigris/neutral system; category
  identity now lives in the mono label instead of a border-color per card.
- Recolored the ambient canvas background glow, which was still using hardcoded gold/cabernet RGB
  values from the pre-Twilight-Cellar palette, to the current claret/verdigris tokens via
  `color-mix()` so it stays correct across theme and future token changes; strengthened it slightly
  so the atmosphere the spec calls for is actually visible.
- Gave the Driver Portal and Stock Portal entry screens (previously a flat, opaque `--bg` fill) the
  same ambient glow treatment as the main app shell, so they no longer read as an empty void around
  a floating card.
- Replaced the Inbox avatar hash-palette (muddy off-brand browns/blues) with verdigris/neutral
  tones, and gave the "no conversation selected" empty state real content (conversation/unread/
  replied counts) instead of leaving most of the pane blank.
- Fixed a second, lower-impact instance of the same duplicate-class pattern: `.chan-chips` was
  defined twice (Marketplace legend, Loyalty campaign chips); the Loyalty one is now
  `.camp-chan-chips`.
- **Fixed a second layout-breaking bug, in the responsive nav:** below 1024px the Rail collapses
  from a sidebar into a horizontal bar, but `.rail-brand` kept its desktop `width: 100%` rule
  (the breakpoint override never reset it), so the brand button alone claimed the full bar width
  and pushed all 8 nav links + 5 footer links off-screen into an effectively invisible
  horizontal-scroll void — this was the "navbar is scrollable and empty" bug reported. Fixed
  `.rail-brand` to `width: auto` at this breakpoint, and rebuilt the compact bar as an icon-only
  strip (labels move to `title`/`aria-label`) instead of a horizontally-scrolling text nav, since
  13 full-text links were never going to fit a tablet-width bar regardless of the sizing bug.
- **Fixed a third layout-breaking bug:** `.loy-grid`, `.deliv-grid`, and `.inv-grid` used plain
  `Nfr` grid tracks, so a wide child (the Loyalty members table's `min-width: 760px`) forced its
  column past its `fr` share and pushed the sibling column off the edge of the viewport at
  intermediate widths (~768–1000px) — the Automation Feed panel was getting silently clipped.
  Switched to the `minmax(0, Nfr)` pattern already used correctly by `.cc-grid`. Also had to fix
  this at its *second* definition: this file keeps a documented "late responsive overrides"
  section (~line 1671) that re-declares these same grid classes after their base rules specifically
  because an earlier duplicate-declaration bug forced that workaround — that late block had its
  own un-fixed `1fr 1fr` for `.loy-grid` and was winning the cascade, silently reverting the fix
  made at the base rule.

## v3.0.0 — 2026-07-26

Full visual rebrand ("Dark Luxury Ops" / "Twilight Cellar") per
`docs/superpowers/specs/2026-07-24-dark-luxury-ops-redesign-design.md`. Replaces the
Charcoal/Oak/Amber/Cabernet palette with a cooler, more disciplined system, driven by an
`/impeccable critique` finding that the previous accent (`--honey`/`--accent`) was used
promiscuously across ~250 call sites app-wide rather than as a genuine accent. Functionality is
unchanged — this is a design-system and token-discipline pass only.

- Renamed the token system: `--honey*` → `--claret*` (`#B8304D` dark / `#8C1E3A` light — a true
  Bordeaux red, not gold), `--cabernet*` → `--verdigris*` (`#3F9C7E` dark / `#1A5C46` light —
  aged-copper patina). Canvas neutrals moved from warm oak-brown to cool graphite/stone.
- Introduced **the Claret Budget Rule**: claret is scoped to exactly four roles app-wide —
  primary CTA buttons, the Rail's active-nav indicator, the top loyalty tier ("Maison Noir")
  only, and one hero KPI on the Command Center. Every other former `--honey`/`--accent` usage
  (~250 call sites across `styles.css` and every page/component/chart/portal) was individually
  reassigned to verdigris or a neutral, not just recolored in place.
- Added themed `--on-claret` / `--on-verdigris` text tokens after auditing every filled-accent
  button and badge for contrast; claret stays dark-saturated in both themes (fixed light text),
  but verdigris flips relative brightness by theme, so its label color now flips too — this
  fixes a real WCAG AA failure the critique caught (light-mode primary-button text was ~3.75:1).
- Replaced the Rail's rounded-card-with-left-accent-bar active state with a hairline
  table-of-contents convention: icon, label, dotted leader line, claret index number (active
  item only). Nav badges (Orders/Inbox counts) changed from a filled pill to a bare bold
  numeral in `--orange`, matching the "status is a colored word + dot, never a pill" rule
  applied consistently across status/channel/category chips.
- Removed colored `border-left` accent bars from Priority Action cards and Inbox thread rows
  (a flagged generic-AI-dashboard tell); severity/selection now reads from existing text color
  and background wash alone.
- Fixed two logic bugs the critique surfaced on the Command Center: the "Healthy" status badge
  no longer ignores low-stock items (`critical === 0` alone was a false-positive trap), and the
  "Notify Members" button — which only navigated and sent nothing — is now "Review Members".
- Made the four KPI cards on the Command Center real navigation buttons (deep-linking to their
  source tab); they previously shared clickable-card styling with no click handler.
- Recolored the bottle-art category palette (`catalogPlaceholders.js`) and the Inbox avatar
  hash-palette: wine and liqueur were sitting in claret's and the rejected-plum direction's hue
  ranges respectively, which would have silently diluted claret's rarity and reopened a direction
  the spec explicitly rejected during its revision process.
- Converted two `width`/`padding-left` hover and fill-bar transitions (Top Sellers bar, Business
  Brief row hover) to `transform`, per the bundled detector's layout-thrash finding.
- Reconciled the Driver Portal and Stock Portal's separate CSS-variable blocks with the shared
  token rename (both already aliased the root tokens rather than hardcoding a separate palette,
  so this was a rename, not a re-architecture) and gave each its own claret-budgeted primary CTA.
- Updated the manifest theme colors and favicon gradient from the amber-on-charcoal mark to a
  neutral cream/muted-ink gradient — brand chrome uses neutral ink, not claret, so the mark
  doesn't quietly spend part of claret's four-role budget.

## v2.0.0 — 2026-07-21

Full visual rebrand: from a generic dark "slate + teal SaaS dashboard" theme into a distinctive
premium alcohol-marketplace command center, per brand brief. Functionality is unchanged — this is
a design-system and layout pass only.

- Replaced the entire color system with **Charcoal / Oak / Amber / Cabernet / Cream**: charcoal
  for the app shell (sidebar, status bar), oak for content surfaces (cards, tables, panels), amber
  as a sparingly-used primary accent, cabernet as a secondary accent (wine categories, Inbox
  conversation accents, critical-alert emphasis), cream for light-mode paper surfaces.
- Replaced typography (Inter/Manrope) with **Fraunces** (display serif for headings, hero
  metrics, panel titles) + **Public Sans** (UI/body) + JetBrains Mono (kept, for SKUs/timestamps).
- Removed glassmorphism (blurred translucent chrome) from the status bar and legacy topbar;
  replaced pure-black shadows app-wide with warm, brand-consistent shadows.
- Tightened the button/input radius scale and reserved pill shapes for status/category chips only.
- Redesigned the Sidebar into grouped navigation (Overview / Fulfillment / Growth /
  Conversations) with a left-accent active state instead of a full gradient fill; the shell now
  gets its own light-mode surface distinct from the content area.
- Reworked the Command Center into an asymmetric layout with a prominent hero revenue metric
  instead of five equal-weight KPI tiles; recolored all Chart.js and inline SVG chart series.
- Re-harmonized the 8 product-category colors (and matching inventory category chips) from an
  arbitrary rainbow into the warm Charcoal/Oak/Amber/Cabernet family, and remapped the loyalty
  tier badge colors, delivery truck/map colors (Delivery page + Driver Portal), and Inbox
  conversation accents (previously hardcoded indigo) to match.
- Updated the brand mark, manifest theme colors, and favicon to the new amber-on-charcoal gradient.

## v1.0.0 — 2026-07-20

Initial release. Full conversion from a real, backend-connected retail-ops product into a
standalone, frontend-only portfolio demo under a new brand, **Maison Reserve**.

- Removed the entire backend (Express server, Postgres models, GHL/WooCommerce/Lazada/Shopee
  integration code and credentials, Python VRP microservice) and all internal ops documentation.
- Replaced every "Beeva"/brand reference, real product photography, and the real trademarked
  logo with generated placeholder art and a new "MR" mark — no scraped or real business assets
  remain in the repo.
- Rebuilt on a single-source-of-truth React context (`src/context/AppData.jsx`) with a typed
  reducer, `localStorage` persistence, and an ambient live-data simulator.
- Redesigned the entire UI in a dark "Command Center" theme (slate background, teal/emerald
  accents) with a new sidebar + status-bar shell, replacing the old top-tab layout.
- Rebuilt all 8 core sections (Command Center, Orders, Inventory, Delivery, Loyalty, Inbox,
  Marketplace, Automation) plus the Driver Portal and Stock Portal against the new mock-data
  layer — including simulated delivery routing/GPS in place of real geolocation and routing APIs.
- Renamed the loyalty tiers and stock-portal persona away from the original brand's naming.
- Added a one-click "Enter Demo" gate in place of real authentication across all three entry
  points (main app, Driver Portal, Stock Portal).
