# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary: recruiters, hiring managers, and prospective clients evaluating Kai's frontend/product
craft — the real "user" of this artifact is someone judging design and engineering ability, not
a wine retailer's actual staff. Secondary (in-fiction only): the demo simulates internal ops
roles (cellar/inventory manager, driver, front-of-house) across its 8 sections + 2 standalone
portals, and the interface must read as convincing and coherent *as if* those roles were real,
since that fictional coherence is itself part of what's being evaluated.

## Product Purpose

A frontend-only portfolio piece: a full retail-operations dashboard for a fictional premium wine
& spirits retailer (orders, inventory, delivery, loyalty, inbox, marketplace channels,
automation). No backend — state lives in `localStorage`, seeded from mock data, with an ambient
"live ticker" simulating a real operating business. Success means a viewer immediately reads
production-grade product thinking and craft, not "student demo."

## Positioning

Not a generic admin-dashboard template with a wine skin — the claim it stakes (per its own
`docs/superpowers/specs` history) is a *bespoke, restrained luxury-operations console*: a
distinct hairline/typographic structural language (no card-and-shadow SaaS scaffolding), a
tightly budgeted accent color used in exactly a few high-value roles rather than decorating
everything, and copy/domain vocabulary specific to the wine trade. A neighboring
electronics-or-cosmetics ops dashboard could not truthfully reuse this composition unchanged —
though the current build only partially delivers on that claim (see Evidence on Hand).

## Operating Context

- Local dev: `npm run dev` (Vite). No server, no auth, no real integrations.
- Two standalone portals reachable outside the main shell: Driver Portal (`/driver-portal`),
  Stock Portal (`/stock-portal`) — separate token/CSS surfaces from the main app.
- Versioning discipline is a hard project rule (`.claude/CLAUDE.md`): every shipped build
  versions the dashboard, keeps a changelog, and increments on every change.

## Capabilities and Constraints

- React 19 + Vite, no CSS framework, single global stylesheet (`src/styles.css`).
- No backend, no real network calls beyond static assets (fonts, map tiles) — this constraint
  is permanent and not up for revisiting during a visual rebrand.
- Existing shared component primitives exist (`src/components/ui/*`: Badge, Modal, Toast,
  Toggle, Rail, EmptyState, ConfirmDialog) but are inconsistently adopted — the Command Center
  page (`TodayPage.jsx`) forks its own parallel `cc-*` styling instead of reusing them
  (confirmed by `/impeccable critique` on 2026-07-24, see `.impeccable/critique/`).

## Brand Commitments

- Name is fixed: **Maison Reserve**. Not open for reconsideration in this rebrand.
- Typography is a confirmed, carried-forward commitment across two prior redesigns: Fraunces
  (display/serif), Public Sans (UI/body), JetBrains Mono (SKUs/timestamps/tabular data) —
  explicitly re-affirmed as recently as the approved Dark Luxury Ops spec, which rejected an
  alternate suggestion (Fira Code/Fira Sans) as generic and identity-erasing.
- `lucide-react` icons stay; no emoji icons, no icon-set change.

## Evidence on Hand

- Two prior full visual rebrands are in the git history: "Industrial Steel" telemetry theme,
  then a "luxury cellar" parchment/oak/cabernet/antique-gold theme (nav + Command Center only).
- An approved, unimplemented redesign spec exists:
  `docs/superpowers/specs/2026-07-24-dark-luxury-ops-redesign-design.md` ("Dark Luxury Ops" /
  "Twilight Cellar," v3.0.0 target, claret + verdigris on cool graphite, hairline/typographic
  structure, full-app scope). Current `src/styles.css` has not been touched yet — still on the
  old honey/cabernet tokens.
- An incomplete, abandoned WIP repaint ("Noir & Bordeaux") sits in `git stash@{0}`, deliberately
  not reused per prior user decision.
- A 2026-07-24 `/impeccable critique` of `TodayPage.jsx` scored 20/40 (Acceptable) and found:
  a false-positive "Healthy" status badge (logic bug), a light-mode WCAG AA contrast failure on
  primary buttons and muted text, a deceptive CTA that doesn't do what it says, a structural
  design-system fork (`cc-*` vs. the app's own shared components), and ~74 hardcoded hex values
  bypassing the token system. Full report: `.impeccable/critique/2026-07-24T22-40-20Z__src-pages-todaypage-jsx.md`.

## Product Principles

1. Optimize for the portfolio read (craft signal to an evaluator), not for operational
   durability a real wine retailer would need — but the fiction must stay internally consistent.
2. Restraint over decoration: a genuinely rare, budgeted accent beats an accent used everywhere.
3. Domain specificity is structural, not just cosmetic — copy and color alone don't earn a
   "bespoke luxury console" claim if the layout is interchangeable with any SaaS dashboard.
4. One design system, actually used as one — new work extends existing tokens/components
   rather than forking parallel ones (this was the single largest gap the critique found).
5. Name and typography are settled brand commitments; the accent palette and structural
   language are what's actively being revised.

## Accessibility & Inclusion

WCAG AA is a stated requirement carried into the approved redesign spec (explicit
`:focus-visible` rules, contrast-aware light/dark token pairs). The 2026-07-24 critique found
the *current* build already fails this in light mode (primary button ≈3.75:1, muted text
≈4.38:1, both below the 4.5:1 AA floor) — this must not carry forward into the rebrand.
