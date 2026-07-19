# Changelog

All notable changes to this project are recorded here.

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
