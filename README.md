# Maison Reserve

**v5.2.0** · Command Center for Premium Retail Operations

A frontend-only portfolio demo: a full retail operations dashboard for a premium wine & spirits
retailer — orders, inventory, delivery, loyalty, inbox, marketplace channels, and automation —
built with React and no backend at all. Every interaction is real (add a product, dispatch a
truck, mark a delivery, send a broadcast), but all state lives in the browser via `localStorage`.
Nothing here talks to a server, a database, or any third-party API — the only outbound network
requests are normal static-asset loads (Google Fonts, OpenStreetMap/CARTO map tiles) that any
website makes.

## Sections

- **Command Center** — live KPIs, revenue/pipeline charts, channel breakdown, needs-attention feed
- **Orders** — unified order queue across channels, drawer with timeline and status actions
- **Inventory** — stock ledger, category health, CSV import/export, generated product art
- **Delivery** — live-tracked truck routes on an interactive map, route optimization, manifests
- **Loyalty** — tiered membership program, member table, referral tracking, campaign broadcasts
- **Inbox** — customer conversations with in-context quote/recommendation tools
- **Marketplace** — channel performance across owned site, Lazada, and Shopee
- **Automation** — toggleable rules across inventory, loyalty, marketplace, and delivery

Two bonus standalone experiences, reachable from the sidebar:
- **Driver Portal** (`/driver-portal`) — mobile-style live route view with simulated GPS movement
- **Stock Portal** (`/stock-portal`) — single-task goods-received logging tool with CSV import

## Local development

```bash
npm install
npm run dev
```

```bash
npm run build      # production build to dist/
npm run preview    # preview the production build locally
```

## How the "live" data works

There's no backend, so every domain (inventory, orders, delivery, loyalty, inbox, marketplace,
automation) is seeded from mock data in `src/mock/` and managed through a single React context
(`src/context/AppData.jsx`) backed by a reducer and persisted to `localStorage`. An ambient
"live ticker" nudges a few KPIs, truck positions, and inbox messages every ~15–20 seconds so the
dashboard feels alive without ever refreshing the page. A **Reset Demo Data** button in the
sidebar wipes local storage and reseeds from scratch at any time.

## Design

A modern SaaS operations console in the register of Linear and Vercel: zinc/slate dark canvas,
hairline-bordered rounded cards, a collapsible sidebar, and a condensed KPI bar over a
full-width data table with a collapsible auxiliary panel. Emerald marks live/positive status
and primary actions; amber marks low-stock warnings. "Daylight Cellar" is the light-mode
companion theme (toggle in the sidebar). Typeset in Public Sans (UI/body/headings) with
JetBrains Mono for SKUs, timestamps and tabular data. Tokens are documented in
[DESIGN.md](./DESIGN.md); styling is mid-migration from a single global stylesheet
(`src/styles.css`) to Tailwind CSS utility classes (`src/tailwind.css`) — see CHANGELOG v5.0.0
for which surfaces have moved. Product imagery is generated inline SVG art
(`src/components/BottleArt.jsx`), not photography.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).
