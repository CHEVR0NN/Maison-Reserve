# Changelog

All notable changes to this project are recorded here.

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
