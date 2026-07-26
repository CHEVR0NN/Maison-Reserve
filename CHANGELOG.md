# Changelog

All notable changes to this project are recorded here.

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
