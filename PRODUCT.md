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

**Revised 2026-08-07 (v5.0.0), explicit user override:** the bespoke-luxury-console claim below
described v3.0–v4.1 and is retired. The product is now positioned as an *operator-grade SaaS
console built to the craft standard of Linear and Vercel* — the differentiation claim shifts
from "does not look like a category-standard SaaS dashboard" to "matches the polish bar of the
best category-standard SaaS dashboards." Domain specificity (wine-trade copy, vocabulary, data
shapes) still applies; structural distinctiveness from the SaaS-dashboard genre does not.

<details>
<summary>Prior positioning (v3.0–v4.1, superseded)</summary>

Not a generic admin-dashboard template with a wine skin — the claim it staked (per its own
`docs/superpowers/specs` history) was a *bespoke, restrained luxury-operations console*: a
distinct structural language (no card-and-shadow SaaS scaffolding, no hairline-boxed grids),
a tightly budgeted accent color, and copy/domain vocabulary specific to the wine trade. A
neighboring electronics-or-cosmetics ops dashboard could not truthfully reuse this composition
unchanged.
</details>

## Operating Context

- Local dev: `npm run dev` (Vite). No server, no auth, no real integrations.
- Two standalone portals reachable outside the main shell: Driver Portal (`/driver-portal`),
  Stock Portal (`/stock-portal`) — separate token/CSS surfaces from the main app.
- Versioning discipline is a hard project rule (`.claude/CLAUDE.md`): every shipped build
  versions the dashboard, keeps a changelog, and increments on every change.

## Capabilities and Constraints

- React 19 + Vite. As of v5.0.0, migrating from a single global stylesheet (`src/styles.css`)
  to Tailwind CSS (v4, via `@tailwindcss/vite`) utility classes, in phases — new/rebuilt
  surfaces (app shell, sidebar, Inventory, Command Center) are Tailwind-only; unmigrated pages
  keep running on `src/styles.css` until their own migration pass. `styles.css` is not deleted
  until every page is off it.
- No backend, no real network calls beyond static assets (fonts, map tiles) — this constraint
  is permanent and not up for revisiting during a visual rebrand.
- Existing shared component primitives exist (`src/components/ui/*`: Badge, Modal, Toast,
  Toggle, Rail, EmptyState, ConfirmDialog) but are inconsistently adopted — the Command Center
  page (`TodayPage.jsx`) forks its own parallel `cc-*` styling instead of reusing them
  (confirmed by `/impeccable critique` on 2026-07-24, see `.impeccable/critique/`).

## Brand Commitments

- Name is fixed: **Maison Reserve**. Not open for reconsideration in this rebrand.
- Typography as of v3.1.0 (2026-08-07): Public Sans carries every role (headings, card titles,
  KPI/metric digits with `tabular-nums`), JetBrains Mono stays for SKUs/timestamps/tabular data.
  Fraunces (the prior editorial-serif display face, carried across two earlier redesigns) was
  retired as decorative rather than functional. Fira Code/Fira Sans remain rejected as generic
  and identity-erasing — that earlier call still stands even though Fraunces itself is gone.
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
- **2026-08-07: full identity replacement, explicit user override.** Asked to redesign toward a
  Linear/Vercel-style zinc/slate SaaS console — the same "card-and-shadow SaaS scaffolding"
  direction v3.0/v4.1 evaluated and rejected as generic. Impeccable flagged the conflict against
  this file's recorded history and offered three resolutions (full replace / keep structure only
  swap palette / side-by-side comparison); user chose full replace. Recorded here rather than
  silently overwritten so the rejection history stays legible — this is a deliberate reversal of
  a considered prior call, not evidence the prior call was wrong.
- **2026-08-08: v5.0.0 shipped with two real regressions and one systemic pattern problem,
  caught by user review, fixed as v5.1.0.** Sidebar overflowed/scrolled on windows under ~700px
  tall (rows and footer were taller than the old rail). A Tailwind arbitrary-value class with a
  comma-separated gradient+color layer silently failed to compile, leaving the main canvas on
  its light fallback in dark mode — near-white headings were landing on an accidentally-light
  background, reading as invisible text. Separately, the user called the KPI bar/category
  strip/channel cards "screaming AI-generated" — correctly: they were same-size bordered-card
  grids, the exact pattern this project's own craft-floor guidance names as a genre default.
  Replaced with a divided-container motif (see DESIGN.md v5.1.0). Lesson for future passes:
  verify a new arbitrary-value Tailwind class actually appears in rendered computed styles, not
  just that the source line looks right.

- **2026-08-08: v5.2.0 density/craft pass on the Command Center**, from a detailed user brief
  ("eliminate design artifacts that make it look like generic AI slop"). Three defects were only
  visible in a rendered browser, not in the source diff, and all three had been shipping since
  v5.0.0: user-agent `2px outset` button borders and `<ol>` decimal markers leaking into every
  Tailwind surface (preflight is off during the migration and nothing reset them), and
  `font-mono` resolving to the OS monospace stack because no `@theme` block ever bound the
  project faces to Tailwind's font utilities. **Lesson, and it repeats v5.1.0's:** screenshot
  the built page before claiming a visual change is done. Both regressions were invisible to
  code review and obvious in the first screenshot.
- **2026-08-08: the mock seed was producing self-contradicting metrics.** Order status had been
  assigned by loop index while timestamps were assigned separately, so the two disagreed; and
  all in-flight orders were forced into today while history spread over six days, making today
  structurally 5–10× any prior day (the headline revenue delta read `+436%`). Status is now
  derived from order age against the fulfilment clock, and every day is drawn from an identical
  rolling window. Treat seeded demo data as a design surface: on a portfolio dashboard, numbers
  that don't reconcile read as "generated" faster than any visual choice does.
- **Standing note on the migration's visual split:** only the app shell, sidebar, Command
  Center, and (partly) Inventory render from Tailwind + DESIGN.md v5.x tokens. Orders, Delivery,
  Loyalty, Inbox, Marketplace, Automation, and both portals still render entirely from
  `src/styles.css` on the older honey/cabernet token set, so they look like a different product.
  This is the known phased-migration state, not drift — but it is the most visible unfinished
  thing in the build and the obvious next scope.

## Product Principles

1. Optimize for the portfolio read (craft signal to an evaluator), not for operational
   durability a real wine retailer would need — but the fiction must stay internally consistent.
2. **(Revised v5.0.0)** Craft parity over structural differentiation: the bar is now "as polished
   as Linear/Vercel," not "a genuinely rare, budgeted accent that no SaaS dashboard would reuse."
3. **(Revised v5.0.0)** Domain specificity now lives in copy, data shapes, and wine-trade
   vocabulary rather than structural layout — the layout is intentionally in the SaaS-dashboard
   idiom as of this revision.
4. One design system, actually used as one — new work extends existing tokens/components
   rather than forking parallel ones (this was the single largest gap the 2026-07-24 critique
   found, and remains true independent of which visual world is current).
5. Name and typography are settled brand commitments and were not revisited in v5.0.0; the
   accent palette and structural language are versioned decisions — see DESIGN.md for the
   current one and Evidence on Hand for the supersession record.

## Accessibility & Inclusion

WCAG AA is a stated requirement carried into the approved redesign spec (explicit
`:focus-visible` rules, contrast-aware light/dark token pairs). The 2026-07-24 critique found
the *current* build already fails this in light mode (primary button ≈3.75:1, muted text
≈4.38:1, both below the 4.5:1 AA floor) — this must not carry forward into the rebrand.
