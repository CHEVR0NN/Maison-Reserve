<!-- v3.0.0 established via docs/superpowers/specs/2026-07-24-dark-luxury-ops-redesign-design.md.
     v4.1.0 (2026-08-07): retired Fraunces (serif), retired the nav dotted-leader/index-number
     convention, dropped hairline borders from card/grid/metric surfaces.
     v5.0.0 (2026-08-07): FULL REPLACEMENT, explicit user override. Discarded "Twilight Cellar"
     (claret/verdigris, no-card-and-shadow, no-pill) for a zinc/slate SaaS operations console in
     the register of Linear and Vercel — hairline-bordered cards, rounded surfaces, emerald/amber
     accents. This is the direction v3.0/v4.1 explicitly rejected ("no card-and-shadow SaaS
     scaffolding... a neighboring electronics-or-cosmetics ops dashboard could not truthfully
     reuse this composition unchanged"); the user weighed that history and chose to proceed anyway.
     See PRODUCT.md § Evidence on Hand for the record of that call.
     v5.1.0 (2026-08-08): refinement pass on user feedback ("too stale," "screaming AI-generated
     visual hierarchy," sidebar scrollable). Two real bugs and one systemic pattern problem:
     (1) sidebar rows/footer were taller than the old rail, overflowing below ~700px window
     height — tightened density, moved secondary footer actions (theme/reset/sign-out) into a
     compact icon toolbar. (2) The ambient canvas gradient used a Tailwind arbitrary value
     Tailwind's extractor failed to compile, silently leaving <main> on its light fallback
     background in dark mode — near-white heading text was landing on that accidental light
     background, reading as "invisible." Fixed by splitting canvas color (plain `dark:bg-zinc-950`)
     from the glow (separate absolutely-positioned overlay div, simpler single-gradient arbitrary
     value). (3) The KPI bar, category strip, and channel list were each a grid of same-size
     bordered cards — flagged by this project's own craft-floor guidance as a genre-default
     "AI slop" tell. Replaced with a single-container divided-row/grid motif (`KpiBar.jsx`,
     `divide-x`/`divide-y` ledger-grid, divided channel list) reused across both pages as the
     system's actual point of view instead of repeated card grids. Also dropped a >1px colored
     `border-left` on priority-action items (a banned craft-floor device) for a tinted dot instead.
     Directly edited in src/styles.css + src/tailwind.css. Re-run /impeccable document to re-sync
     token values if they drift further.
     v5.2.0 (2026-08-08): density/craft pass on the Command Center against an explicit user
     brief ("eliminate design artifacts that make it look like generic AI slop"). Reverses two
     standing conventions on that brief's instruction — the No-Pill Rule for status (now a
     compact StatusBadge pill) and emerald-text active nav (now a surface highlight plus a 2px
     indicator). Both reversals are recorded in Components below, not silently applied. Also
     fixed three build-level defects the brief exposed: `font-mono` never resolved to JetBrains
     Mono (no @theme block existed), user-agent button borders and list markers leaked into
     every Tailwind surface (preflight is off), and the mock seed produced Command Center
     metrics that contradicted each other. See CHANGELOG v5.2.0. -->

---
name: Maison Reserve
description: Zinc/slate dark-primary SaaS operations console in the register of Linear and Vercel — hairline-bordered cards, emerald as the live/positive accent, amber for low-stock warnings.
colors:
  zinc-950: "#09090b"
  zinc-900: "#18181b"
  zinc-800: "#27272a"
  zinc-400: "#A1A1AA"
  slate-50: "#f8fafc"
  emerald-500: "#10b981"
  emerald-600: "#059669"
  amber-500: "#f59e0b"
  amber-600: "#d97706"
  red-500: "#ef4444"
  red-600: "#dc2626"
  blue-500: "#3b82f6"
typography:
  display:
    fontFamily: "Public Sans, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  label:
    fontFamily: "JetBrains Mono, 'Cascadia Mono', Menlo, Consolas, monospace"
rounded:
  button: "6px"
  card: "8px"
  default: "6px"
---

# Design System: Maison Reserve — "SaaS Console" (v5.0.0)

## Overview

**Creative North Star: modern SaaS operations console, Linear/Vercel register.**

A dark-primary zinc canvas, hairline-bordered card surfaces, and a restrained two-accent
signal system (emerald for live/positive, amber for low-stock warning). This is a deliberate
reversal of the prior "Twilight Cellar" system: where v3–v4.1 conveyed depth through stepped
background luminance and banned card borders as "generic templated-SaaS," v5.0.0 embraces the
card-and-border language on purpose, in service of matching the specific benchmark products
named in the brief (Linear, Vercel) rather than differentiating from the SaaS-dashboard category.

**Why the reversal is recorded, not hidden:** the prior system's rejection of this exact
direction is real project history (see `PRODUCT.md` § Evidence on Hand) — this file does not
pretend that history didn't happen. The user reviewed that history and explicitly chose the
SaaS-generic direction over the bespoke-luxury one for this build. Future work should treat
v5.0.0 as the current standing decision, not a regression to be quietly reverted.

**Key Characteristics:**
- Depth from hairline borders (`zinc-800`) and card backgrounds (`zinc-900`) on a `zinc-950`
  canvas — the direct opposite of the v4.1.0 "no hairline on cards" rule.
- Exactly two brand accents: emerald (live/positive/primary action) and amber (low-stock/
  warning) — not a four-role budget system; both are used freely wherever their meaning applies.
- Collapsible sidebar navigation with persisted state, condensed KPI summary row, and a
  dedicated collapsible auxiliary panel for the activity/deduction log.
- Light mode is a companion theme (inferred from the dark spec using standard light-surface
  equivalents of the same hues) so the existing theme toggle keeps working; the brief did not
  specify light-mode values, so treat these as provisional until visually confirmed.

## Colors

### Canvas & Surfaces
- **Base canvas** `#09090b` (zinc-950) dark / `#ffffff` light
- **Card / sidebar background** `#18181b` (zinc-900) dark / `#fafafa` (zinc-50) light
- **Subtle surface / hover state** `#27272a` (zinc-800) dark / `#f4f4f5` (zinc-100) light
- **Border (hairline)** `#27272a` (zinc-800) dark / `#e4e4e7` (zinc-200) light — used on every
  card, sidebar, table, and input; this is the structural device the prior system banned.

### Text
- **Text primary** `#f8fafc` dark / `#09090b` light
- **Text muted** `#A1A1AA` (zinc-400) dark / `#71717a` (zinc-500) light

### Accent — Emerald (live / positive / primary)
`#10b981` dark / `#059669` light. Roles: primary CTA buttons, active-nav indicator, "healthy"
stock status, live-data pulse indicator. Not budgeted to a fixed role count — used wherever
"positive/live/primary" applies.

### Accent — Amber (warning / low stock)
`#f59e0b` dark / `#d97706` light. Roles: low-stock status word + dot, warning banners, pending
badge counts.

### Signal — Critical / Destructive
`#ef4444` dark / `#dc2626` light (red). Critical stock status, destructive action confirmation,
delete affordances. Not named in the original brief; added because the product's existing
three-tier stock-status logic (healthy/low/critical) needs a third color and red is the
category-standard choice at this saturation.

### Signal — Info
`#3b82f6` (blue-500), used sparingly for informational callouts (e.g. the CSV-import hint box).

## Typography

**Display/Body:** Public Sans. **Label/Mono:** JetBrains Mono. Numeric displays keep
`font-variant-numeric: tabular-nums`.

**v5.2.0 — the faces are now bound to Tailwind's font utilities.** `src/tailwind.css` declares
an `@theme` block setting `--font-sans`/`--font-mono`. Before this, no such block existed, so
`font-mono` silently resolved to Tailwind's default `ui-monospace` stack and mono-set figures
rendered in the OS monospace face, not the brand one.

**Mono scope (v5.2.0):** JetBrains Mono is for figures only — currency, counts, SKUs, elapsed
times, IDs, timestamps, tabular data. It never wraps the prose around a figure. In practice that
means `<span className="font-mono tabular-nums">{count}</span> SKUs under reorder level`, not
mono on the whole string. Monospace as a costume for "technical" is the failure mode here.

**Scale (v5.2.0, Command Center):** page `h1` is `text-xl font-semibold`; section headings are
`text-[11px] font-semibold uppercase tracking-wider` in muted zinc; KPI values are `text-2xl`
mono; body/table copy is `text-sm`; supporting metadata is `text-xs` or `text-[11px]`. The
uppercase tracker is the section-heading *device itself* on dense surfaces, not a decorative
eyebrow stacked above a real heading — those were removed.

## Layout

- **Collapsible sidebar:** ~240px expanded (logo, section headers, icon+label nav, badge
  counts) / ~64px collapsed (icon-only, accessible hover tooltips). State persists to
  `localStorage` via the existing `useLocalStorageState` hook (key: `sidebar-collapsed`).
  **v5.1.0:** nav rows are 32px (`h-8`), not 36px — the original 36px rows plus five full-width
  footer rows overflowed the nav on any window under ~700px tall. Secondary footer actions
  (theme toggle, Reset Data, Sign Out) live in a compact icon-only toolbar row instead of full
  labeled rows; only Driver Portal/Stock Portal (external navigation) keep full rows.
- **3-column primary workspace:** sidebar (left) / center workspace (condensed 4-card KPI row →
  action bar with search + ghost-styled filter controls + one primary CTA → primary data table,
  full width) / auxiliary panel (right, collapsible, houses the Auto-Deduction Log so users can
  reclaim table width).

## Elevation & Shape

**The Hairline-Card Rule** (replaces the v4.1.0 Stepped-Luminance Rule): every card, table
wrapper, KPI tile, and sidebar surface gets `border: 1px solid` zinc-800/zinc-200 plus an
8px radius. Modals/dropdowns/toasts additionally keep a real drop shadow, as before — they
still float above the card layer.

**Radius:** 6px on buttons and inputs, 8px on cards and panels. This directly reverses the
v4.1.0 "Minimal-Radius Rule" (`0px` on everything but buttons) — rounded-lg card shapes are
now the intended look, not the rejected one.

## Components

### Buttons
- **Shape:** 6px radius.
- **Primary:** emerald-600 background (light) / emerald-500 (dark), one per view (the single
  highest-priority action).
- **Filter/secondary controls:** transparent-to-white/zinc-900 background, zinc-800/zinc-200
  border — applied directly to the action bar's filter `<select>` elements and the Actions
  menu trigger rather than through a dedicated button component (no standalone "ghost button"
  is currently used anywhere in the built surfaces; if one becomes needed, add it back).
- **Focus:** `outline: 2px solid` emerald-500 (light) / emerald-400 (dark), `outline-offset: 2px`
  on `:focus-visible` — applied to every new interactive primitive (search, buttons, clickable
  KPI cards, nav items, channel/priority-action cards).

### Sidebar navigation
- Each item: `lucide-react` icon + label, unchanged icon set.
- Expanded: full label + section header + badge count. Collapsed: icon only, with an
  accessible hover/focus tooltip carrying the label (use native `title` plus an ARIA-compliant
  tooltip pattern — do not rely on `title` alone for keyboard users).
- Active indicator **(v5.2.0, reverses v4.1.0)**: a surface highlight — `bg-zinc-800/60` dark,
  `bg-zinc-200/70` light — with primary-toned label text and a 2px emerald bar at the row's
  leading edge. The prior convention colored the whole icon+label emerald, which read as a
  *status* signal competing with the amber badge count sitting inches away on the same row.
  Selection is a location, not a status; it belongs to the surface.
- Badge counts: small bold numeral in amber, after the label (expanded) or as a dot on the
  icon (collapsed).

### KPI bar
**v5.1.0:** one bordered container (`KpiBar.jsx`) divided internally with `divide-x`/`divide-y`
hairlines — not four separate cards. Each segment: label, large tabular-nums numeral (tone
colored per meaning), optional sub-label. Four segments on the condensed summary bar: Total
Stock, Low Stock Alert, Active Restocks, Avg Daily Burn (Inventory) / Today's Revenue, Orders,
Inventory Health, Reserve Membership (Command Center). Clickable segments get their own
`:focus-visible` ring; the divided-container motif is deliberate — it's this system's answer to
the "same-size card grid" pattern the craft floor treats as a genre default, and it repeats
across the category ledger-grid and channel list below.

### Trend chart
**v5.1.1:** `TrendChart.jsx` — a small emerald line/area chart (`chart.js` via
`react-chartjs-2`, already a project dependency) for real time-series data, not decoration.
Currently: cumulative orders-placed-today by hour on the Command Center's Business Pulse card.
Theme-aware (emerald-500/dark, emerald-600/light fill+line), minimal gridlines, no legend (one
series), hover tooltip only. This is the system's answer for genuine trend data — distinct from
the divided-container motif above, which is for discrete same-shaped stats, not a series.

### Category ledger-grid / channel list
Same divided-container motif as the KPI bar, applied to two more repeated-stat contexts:
Inventory's 8-category breakdown (`divide-x divide-y` grid, no per-cell border/radius) and
Command Center's channel-operations list (`divide-y` rows, full-width). Neither is a grid of
separate bordered cards.

### Status badge
**v5.2.0 — `StatusBadge.jsx`. This reverses the No-Pill Rule.** A compact pill: `rounded-full`,
`px-2 py-0.5`, `text-[11px]`, a tinted background wash, hue-matched text, and a small solid dot.
Four tones: emerald (live/healthy), amber (degraded/warning), red (critical), neutral (upcoming/
inert). The v4.1.0 rule banned pills and specified colored word + floating dot; at 11–12px that
treatment read as stray colored text rather than a bounded status object, and it left status
words visually indistinguishable from adjacent body copy. The user's v5.2.0 brief called for
compact badges explicitly and the reversal is adopted deliberately.

Secondary text inside a badge is never gray — tint it from the badge's own hue, or leave it
outside the badge entirely (the Command Center header does the latter: muted note *beside* the
badge, not inside it).

### Data table
Full-width, hairline row dividers (unchanged functional-divider use from v4.1.0), bordered
wrapper card. Status cells should use `StatusBadge`; the unmigrated `styles.css` pages still
render the older colored-word-plus-dot treatment until their own migration pass.

### Auxiliary panel
Bordered card matching the sidebar's surface tone, collapsible via its own toggle (independent
of the sidebar's), houses the Auto-Deduction Log feed.

## Do's and Don'ts

### Do:
- **Do** reset user-agent chrome on any new Tailwind surface (v5.2.0). Preflight is off for the
  duration of the migration, so a bare `<button>` still ships `border: 2px outset ButtonBorder`
  and a bare `<ol>` still ships decimal markers. A minimal reset now lives in a `reset` cascade
  layer declared *below* `legacy` in `tailwind.css`, so it never overrides `styles.css`. Put
  further resets there rather than sprinkling `border-0` on each new element.
- **Do** keep every figure and its own breakdown reconcilable (v5.2.0). If a headline says 37
  orders, its sub-label accounts for all 37. A count whose parts don't sum to its whole is the
  single loudest "generated data" tell on a dashboard.
- **Do** reach for the divided-container motif (one bordered wrapper, `divide-x`/`divide-y`
  hairlines between segments) for any row of same-shaped stats or list items — KPI bar,
  category breakdown, channel list. This is the system's own device for that job.
- **Do** put a 1px zinc-800/zinc-200 border on every card, table wrapper, KPI tile, and
  sidebar/panel surface.
- **Do** use 6–8px radius throughout (buttons 6px, cards/panels 8px).
- **Do** use emerald for primary/live/positive, amber for warning/low-stock, red for
  critical/destructive.
- **Do** persist sidebar collapsed state to `localStorage`.
- **Do** give every collapsed-sidebar icon an accessible tooltip, not just a `title` attribute.
- **Do** apply `font-variant-numeric: tabular-nums` to numeric displays (unchanged from v4.1.0).

### Don't:
- **Don't** reintroduce claret/verdigris, the four-role accent budget, or the No-Card rule —
  those were the prior system, explicitly superseded, not a style to blend with this one.
- **Don't** use `backdrop-filter` blur/glassmorphism — not part of this brief either.
- **Don't** ship a card/table/panel with no border — the hairline border is this system's
  primary structural device; omitting it reads as an incomplete migration, not as intentional
  restraint.
- **Don't** render a row of same-size icon/heading/stat cards as the default for repeated data
  (v5.1.0) — that's the generic-dashboard tell this revision fixed twice already (KPI bar,
  category strip, channel list). Use the divided-container motif instead.
- **Don't** use a colored `border-left`/`border-right` above 1px on cards, list items, or
  callouts (v5.1.0) — use a tinted dot, background wash, or text color for the same signal.
- **Don't** write explainer copy under a section heading or inside an alert (v5.2.0). No
  slogans ("One stock pool, every storefront"), no sentences justifying the alert ("Restock
  before these labels sell out across every storefront"). An operator reading a dense console
  wants the figure that drives the decision — `4 SKUs under reorder level`. Prose in these slots
  is the most recognizable generated-UI tell in the whole product.
- **Don't** set monospace on a sentence (v5.2.0). Mono marks figures — wrap the numeral, leave
  its surrounding words in Public Sans.
- **Don't** stack a tracked uppercase eyebrow above a real page heading (v5.2.0). On dense
  surfaces the uppercase tracker *is* the section heading; used as a pre-heading it is
  decoration. The "Maison Reserve" kicker above `Operations Overview` was removed for this
  reason — the sidebar already carries the brand.
- **Don't** combine multiple comma-separated layers (gradient + fallback color) inside one
  Tailwind arbitrary-value bracket (v5.1.0) — it silently failed to compile once already. Split
  a solid base color and a decorative gradient into two declarations/elements instead, and
  verify any new arbitrary-value class actually appears in rendered computed styles.
