<!-- v3.0.0 established via docs/superpowers/specs/2026-07-24-dark-luxury-ops-redesign-design.md.
     v4.1.0 (2026-08-07): retired Fraunces (serif) in favor of a single Public Sans system with
     tabular-nums on digits, retired the nav dotted-leader/index-number convention, and dropped
     hairline borders from card/grid/metric surfaces in favor of background elevation + spacing.
     Directly edited in src/styles.css — re-run /impeccable document to re-sync token values if
     they drift further. -->

---
name: Maison Reserve
description: Dark-primary premium operations console for a wine & spirits retailer — hairline/typographic structure, claret used as a rare high-value accent, verdigris as the workhorse secondary.
colors:
  claret: "#B8304D"
  claret-2: "#D65B76"
  claret-deep: "#7A1E34"
  verdigris: "#3F9C7E"
  verdigris-2: "#63BC9C"
  verdigris-deep: "#256B54"
  bg: "#15171B"
  bg-2: "#1B1E23"
  surface: "#21252C"
  surface-2: "#2B303A"
  surface-3: "#363C47"
  line: "#454C58"
  cream: "#EBEDE9"
  muted: "#888C90"
  green: "#6FA35C"
  red: "#CD5237"
  orange: "#C98A3E"
  blue: "#7C89A6"
typography:
  display:
    fontFamily: "Public Sans, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  body:
    fontFamily: "Public Sans, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
  label:
    fontFamily: "JetBrains Mono, 'Cascadia Mono', Menlo, Consolas, monospace"
rounded:
  button: "2px"
  default: "0px"
---

# Design System: Maison Reserve — "Twilight Cellar"

## Overview

**Creative North Star: "Twilight Cellar"**

A dark-primary premium operations console for a wine & spirits retailer — closer to a cellar
ledger or wine list than an admin panel. Cool graphite canvas (not warm oak-brown), depth from
stepped surface luminance rather than card-and-shadow scaffolding, claret (a true, clear
Bordeaux red) budgeted to exactly four roles app-wide, verdigris (aged-copper patina) carrying
the rest of the UI's color needs. This is the third full palette attempt on this product —
gold+cabernet was rejected as a muddy liquor-store cliché, plum was rejected for reading as
beauty/fashion rather than wine — claret was chosen specifically because it reads as "wine" at
a glance, which this project's priority calls for over any other consideration.

Confirmed visual rejections: no card/shadow/pill component scaffolding (rejected as generic
templated-SaaS after a live-preview review), no glassmorphism/backdrop-filter blur (performance
and contrast risk on a data-dense tool), no gold-and-burgundy liquor-store palette, no violet/
plum accent, no Fira Code/Fira Sans typography (rejected as generic-technical-dashboard).

**v4.1.0 revision:** the editorial-serif display face (Fraunces) and the nav dotted-leader/
index-number convention were retired — both read as decorative rather than functional once
audited against a stricter "no ornament without a job" bar. Public Sans now carries every role
(headings, card titles, KPI/metric digits) with `font-variant-numeric: tabular-nums` on numeric
displays for stable alignment. Card, grid-cell and metric-tile surfaces dropped their hairline
borders in the same pass — elevation now comes from background contrast and spacing alone;
hairlines remain only as functional dividers (tables, forms, framing devices), not as a
decorative structural device.

**Key Characteristics:**
- Depth from background elevation and spacing, not boxes, shadows, or hairline dividers
- Claret is a genuinely rare accent (4 defined roles only), verdigris does the everyday work
- Light mode ("Daylight Cellar") is a full companion theme, not an afterthought
- Ambient motion (slow canvas drift, live-data flash pulses) signals the product's real-time
  nature without becoming decorative noise

## Colors

Two-theme system: cool graphite/charcoal in dark mode, pale stone/paper in light mode — same
hues, inverted lightness roles (accents lighten to lift off dark, darken/saturate to sit on
pale paper).

### Primary
- **Claret** (`#B8304D` dark / `#8C1E3A` light): the single high-value accent. **Scoped to
  exactly four roles app-wide: primary CTA buttons (one per view), the active-nav indicator,
  the top loyalty tier badge only, and one hero KPI highlight on the Command Center.** No other
  usage — borders, hover states, links, chips, focus rings, progress bars all use verdigris or
  neutral instead.

### Secondary
- **Verdigris** (`#3F9C7E` dark / `#1A5C46` light): the workhorse secondary, carrying most of
  the UI's everyday color needs — the aged-copper-patina green of old cellar ironwork.

### Neutral
- **Cream** (`#EBEDE9` dark / `#202422` light): high-contrast text and the dedicated
  `:focus-visible` outline color on every interactive element — deliberately never claret, so a
  focus ring firing on every tab-stop doesn't blow the four-role claret budget.
- **Surface steps** (`--surface` → `--surface-2` → `--surface-3`): stepped luminance is the
  primary way depth is conveyed — instead of box-shadow *and*, as of v4.1.0, instead of hairline
  borders on card/grid/metric surfaces too.
- **Line** (`#454C58` dark / `#D2D5CC` light): reserved for functional dividers only — table
  rows, form fields, framing devices (modals/dropdowns/toasts). No longer used to outline card,
  grid-cell, or metric-tile surfaces.
- **Muted** (`#888C90` dark / `#6C716A` light): secondary/metadata text.

### Signal colors (status, not brand)
- **Green** `#6FA35C` / **Red** `#CD5237` / **Orange** `#C98A3E` / **Blue** `#7C89A6`
  (dark-mode values; each has a light-mode counterpart and a `-bg` low-opacity tint). Red is
  deliberately tuned ~24° hue-distance from claret and visibly warmer/more vermillion, after a
  live-preview review caught the two reading as the same color when adjacent (status words vs.
  the claret accent) — a status color must be visually unambiguous *in context*, not just
  distinct on a color wheel.

### Named Rules
**The Claret Budget Rule.** Claret appears in exactly four roles and nowhere else — primary
CTA, active-nav indicator, top loyalty tier only, one hero KPI. Brand chrome (any future
monogram/wordmark) stays neutral ink; it sits outside the four audited roles by definition.

**The No-Pill Rule.** Status, channel/category tags, and nav badges are never a filled pill
background. Status is a colored word + small dot. Channel/category tags are a small-caps mono
label with a colored underline. Nav badges are a bold numeral in `--orange` after the label.

## Typography

**Display/Body Font:** Public Sans (with system-ui fallback) — one sans system for everything,
as of v4.1.0. Fraunces (editorial serif) was retired: it read as decoration rather than a
functional signal once audited, and its removal also let numeric displays go tabular.
**Label/Mono Font:** JetBrains Mono (SKUs, timestamps, tabular data)

**Character:** A clean, unified UI sans with a technical mono for data. Hierarchy now comes
from weight, size and color, not a second typeface.

### Hierarchy
- **Headings & KPI/metric digits** (Public Sans): weight and size carry hierarchy where Fraunces
  used to. Any selector displaying a number gets `font-variant-numeric: tabular-nums` so digits
  don't jitter in width as they change.
- **Label** (JetBrains Mono): SKUs, timestamps, tabular/numeric data, small-caps category tags.
- **Body** (Public Sans): everything else — UI chrome, copy, labels.

## Layout

Data-dense operations console. No structural/layout changes are in scope for this redesign
beyond what's needed to carry the new density rules — page composition (which sections exist,
their order) stays as-is; only the visual system carrying that composition changes.

## Elevation & Depth

**The Stepped-Luminance Rule.** No card-and-shadow elevation for regular page content. Depth
comes from `--surface` → `--surface-2` → `--surface-3` luminance steps and spacing alone —
never `box-shadow`, and as of v4.1.0, never a hairline border either, on card/grid/metric
surfaces. Hairlines survive only where they do real functional work: table rows, form-field
edges, and the framing devices below. The one exception to "no shadow": framing devices that
are genuinely elevated above content — modals, dropdowns, toasts — keep a real drop shadow,
because they actually float.

### Shadow Vocabulary (exception cases only)
- **Frame-level lift** (`box-shadow: 0 4px 12px rgba(0,0,0,.55), 0 32px 64px -18px rgba(0,0,0,.7)`
  dark / lighter equivalent in light mode): modals, dropdowns, toasts only.

**Ambient glow, not glassmorphism.** A soft claret-glow/verdigris-glow radial gradient behind
the canvas plus a faint top-down sheen gives atmosphere without `backdrop-filter` blur, which
carries a performance/contrast risk on a data-dense tool.

## Shapes

**The Minimal-Radius Rule.** `--r: 2px` on buttons only. `--r-sm: 0px` everywhere else. No
`rounded-lg` card shapes anywhere in the product — this is the direct replacement for a
rejected first-pass boxed-KPI-card / pill-badge / rounded-card-with-left-accent-bar component
set that read as a stock SaaS-dashboard template regardless of its custom colors.

## Components

### Buttons
- **Shape:** 2px radius (the one place radius is used at all)
- **Primary:** claret background — one per view, the single highest-priority action (part of
  the four-role claret budget)
- **Focus:** `outline: 2px solid var(--cream)`, `outline-offset: 2px` on `:focus-visible` —
  every interactive element, non-negotiable, never claret

### Navigation (Rail)
- Each item: `lucide-react` icon (kept for scannability — dropping icons was an earlier-draft
  oversight, not a decision) + label. **v4.1.0:** the dotted leader line and claret-colored
  index number were removed — audited as decoration, not information (nav items are a fixed,
  memorized list; a running index number didn't help wayfinding). The active-nav indicator (one
  of pine's four budgeted roles) now colors the icon+label directly instead of the index number.
- **Nav badges** (pending/unread counts): small bold numeral in `--orange`, directly after the
  label. Not a filled pill.

### Status indicators
Colored word + small dot. Never a pill/badge background fill.

### Channel/category tags
Small-caps mono label with a colored underline. Never a pill.

### KPI hero metrics
Large sans numeral (Public Sans, `tabular-nums`) + a short gradient hairline rule beneath it
(`--claret-deep` → transparent). Not a boxed stat card — no border, background-elevated only.

### Loyalty tier list
Flat elevated rows with real spacing between them (v4.1.0: previously hairline-divided within
one bordered ledger). Top tier marked by a 2px `--claret` rule across just that column — part
of the four-role claret budget — not a gradient-filled box.

## Do's and Don'ts

### Do:
- **Do** budget claret to exactly its four defined roles; every other legacy accent usage
  migrates to verdigris or a neutral during implementation.
- **Do** use `outline: 2px solid var(--cream)` on every `:focus-visible` state, unconditionally.
- **Do** convey depth via stepped surface luminance and spacing, never box-shadow or a hairline
  border on card/grid/metric surfaces.
- **Do** apply `font-variant-numeric: tabular-nums` to any selector that displays a number.
- **Do** keep icons (`lucide-react`) on every nav item.
- **Do** apply `prefers-reduced-motion: reduce` to disable ambient drift/pulse animation (live
  data updates still happen, just without the flash).

### Don't:
- **Don't** use claret outside its four audited roles — not borders, not hover states, not
  links, not focus rings, not brand chrome/monogram treatments.
- **Don't** use card-and-shadow elevation, hairline borders on card/grid/metric surfaces,
  rounded-lg shapes, or pill/badge backgrounds anywhere in the product.
- **Don't** use `backdrop-filter` blur or glassmorphism.
- **Don't** use overshoot/`back.out` easing on table-row or list animations — plain opacity
  fade on load only.
- **Don't** reintroduce Fraunces, a nav dotted-leader/index convention, or Fira Code/Fira Sans —
  all three were evaluated and retired (v4.1.0 for the first two).
