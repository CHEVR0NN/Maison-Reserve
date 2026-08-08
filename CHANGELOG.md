# Changelog

All notable changes to this project are recorded here.

## v5.2.0 — 2026-08-08

Density/craft pass on the Command Center, per user brief ("eliminate design artifacts that make
it look like generic AI slop"), plus the two data-integrity bugs that brief surfaced.

**Data integrity (`mock/orders.js`, rewritten)**

- **Fixed: the revenue delta read `+436%` every afternoon.** The old seed forced all 22
  non-delivered orders into today while spreading 29 delivered ones across six prior days, so
  today was structurally 5–10× any other day. Orders are now drawn per day from an identical
  rolling 13-hour trading window, with a gentle 5%/day growth trend; the delta lands in a
  believable −13%…+5% band. The KPI also compares yesterday *to the same clock time* rather
  than a part-day against a whole day.
- **Fixed: order counts didn't reconcile with their own status breakdown.** The headline
  counted cancelled orders; the sub-label didn't, so "26 orders — 1 completed, 22 in progress"
  silently lost 3. Status is now *derived from order age* against the fulfilment clock rather
  than assigned by loop index, so no order can read "placed 6 hours ago" while sitting in
  Received, and the Orders KPI now states active/delivered/canceled covering the full total.
- Volume raised to ~30 orders/day over 7 days (~210 total, 203KB of seed state). Average basket
  is ~S$200, which is what this catalogue actually produces — see note below.

**Design system**

- **New `StatusBadge.jsx`** (`components/ui/`): compact `px-2 py-0.5` rounded-full badge with a
  solid dot, in emerald/amber/red/neutral. **This reverses the No-Pill Rule** carried since
  v4.1.0 — at these sizes the old "colored word + floating dot" read as stray colored text
  rather than a bounded status object. Recorded in DESIGN.md v5.2.0, not silently changed.
- **Sidebar active state** is now a surface highlight (`bg-zinc-800/60` dark, `bg-zinc-200/70`
  light) plus a 2px emerald indicator, replacing full emerald text on the row — which competed
  with the amber badge counts sitting beside it. Also reverses a v4.1.0 convention.
- **Fixed: `font-mono` never resolved to JetBrains Mono.** No `@theme` block existed, so
  Tailwind's `font-mono` fell back to the OS monospace stack. `--font-sans`/`--font-mono` are
  now bound to the project faces, and mono is applied to figures only (KPI values, stage
  counts, elapsed times, action metrics) — never to the prose around them.
- **Fixed: user-agent styles leaked into every Tailwind surface.** Preflight is deliberately
  off during the migration, so bare `<button>`s carried `border: 2px outset ButtonBorder` —
  visible as stray white outlines around KPI segments and priority-action cards — and the
  order-stage `<ol>` rendered "1. 2. 3. 4." down its own numerals. A minimal reset now sits in
  a new lowest-priority `reset` cascade layer, below `legacy`, so `styles.css` and every
  Tailwind utility still outrank it and unmigrated pages are untouched (verified against
  Orders, Delivery, Loyalty).

**Command Center (`TodayPage.jsx`)**

- Split into named sub-components: `SectionHeading`, `ChannelRow`, `PriorityAction`,
  `StageStrip`, `SecondaryLink`.
- Removed the decorative "Maison Reserve" eyebrow above the `h1` (the sidebar already says it);
  `h1` down to `text-xl`. Section headings are now `text-[11px]` uppercase trackers.
- **Copy stripped of explainer voice:** deleted the "One stock pool, every storefront" and
  "Today's order journey" section slogans, and replaced sentences like "Restock before these
  labels sell out across every storefront" with the figure that actually matters
  (`4 SKUs under reorder level`).
- The bulky two-line "Attention Required / 1 channel need review" header banner is now a note
  plus a compact badge.
- Action CTAs use neutral secondary styling that brightens on hover, instead of emerald text
  that clashed with the red/amber alert badge above it.
- Channel-row sync metadata is hidden below `xl`, where the row has no width to spare — it was
  crushing the order count to "18 ord…" at 1024px.

**Note on average order value.** The brief asked to raise revenue to ~S$710/order as more
"luxury-realistic." Left at ~S$200 deliberately: the catalogue runs from S$7.80 pilsner to
S$295 cognac, so a S$710 basket would be a case purchase, not a typical mixed order. The
absurd number was the *delta*, not the basket — that is what got fixed.

Verified in a real browser at 1024/1280/1440 in both themes: no console errors, no horizontal
overflow, focus rings intact, legacy pages unaffected.

## v5.1.1 — 2026-08-08

Real data visualization on the Command Center, per user request ("try line js or other forms of
data representation") — the flat "Business Pulse" segmented bar wasn't actually charting
anything, just showing stage proportions.

- **New `TrendChart.jsx`** (`components/ui/`): a small emerald line/area chart built on the
  project's existing `chart.js`/`react-chartjs-2` dependencies (already installed, previously
  used only by an orphaned, unused `charts/TodayCharts.jsx` built for an older data schema —
  left untouched, out of scope). Theme-aware (dark/light), matches DESIGN.md v5.1.0 tokens.
- **Business Pulse now shows cumulative orders-placed-today by hour** as a real line/area chart,
  replacing the flat stage-proportion bar. Stage counts (Received/Preparing/Shipping/Completed)
  stay below it — still useful, just no longer duplicating what the bar showed.
- Removed `stageToneClass` and the `tone` field on `stages` entries (both dead code once the
  segmented bar was removed).
- **Fixed: stale-seed root cause behind "I can't see the chart."** `AppData.jsx` reused any
  persisted `localStorage` state whose version matched, regardless of *when* it was seeded —
  so a browser carrying state seeded on 2026-08-07 would, on 2026-08-08, filter every "today"
  view (Command Center KPIs, order journey, the new trend chart, revenue) against yesterday's
  timestamps and silently render empty. `loadInitialState()` now also compares the persisted
  seed's SG calendar day to today's and reseeds fresh on any mismatch — same trigger as
  clicking "Reset Data," but automatic. Verified by forcing a stale `meta.seededAt` and
  confirming reload reseeds with live data.

## v5.1.0 — 2026-08-08

Refinement pass on v5.0.0, driven directly by user review ("kinda better but the navbar is
scrollable now and the colors are too stale. screaming ai generated in terms of visual hierarchy
and organization"). Two real bugs and one systemic pattern problem, all fixed.

- **Fixed: sidebar scrolled on shorter windows.** `Sidebar.jsx` nav rows were 36px and the
  footer held five full-width labeled rows — taller than the old rail, overflowing on any
  window under ~700px tall (a very ordinary laptop/browser-chrome height, not an edge case).
  Nav rows are now 32px; the theme toggle, Reset Data, and Sign Out moved into a compact
  icon-only toolbar row (`IconAction`), leaving only Driver Portal/Stock Portal as full rows.
  Confirmed no scroll overflow down to a 650px-tall viewport.
- **Fixed: near-invisible page headings.** The ambient canvas glow added in this pass used a
  single Tailwind arbitrary-value class combining a gradient layer and a fallback color
  (`dark:bg-[radial-gradient(...),#09090b]`) — Tailwind's class extractor failed to compile it,
  so `<main>` silently stayed on its light `bg-zinc-50` fallback even in dark mode. Near-white
  heading text landing on that accidental light background read as "the text disappeared."
  Root-caused via computed-style diffing (an inline `color:red` override painted fine; the
  class-based color did not, isolating the bug to the background, not the text). Fixed by
  splitting the canvas into a plain `dark:bg-zinc-950` base plus a separate absolutely-positioned
  overlay div carrying the (now single-layer) gradient — verified via computed
  `backgroundColor` before/after, not just visual inspection.
- **Fixed: "screaming AI-generated" visual hierarchy.** The KPI bar (4 cards), Inventory
  category strip (8 cards), and Command Center channel list (3 cards) were each a grid of
  same-size bordered icon/heading/stat cards — the exact "cards are the lazy container" pattern
  this project's own design-review guidance names as a category default, not a designed choice.
  Replaced with a single reusable divided-container motif:
  - `KpiCard.jsx` retired; new `KpiBar.jsx` renders one bordered container with internal
    `divide-x`/`divide-y` hairline segments instead of four separate cards. Used on both
    Inventory and Command Center.
  - Inventory's category strip converted to the same divided-grid treatment (no per-cell
    border/radius).
  - Command Center's channel cards converted to a `divide-y` list instead of a 3-up card grid.
  - Priority-action items dropped a `border-left` accent (a banned design-review device: colored
    borders above 1px on cards/list items) in favor of a tinted status dot.
  - Page titles (`Stock Ledger`, `Operations Overview`) bumped from `text-lg` to `text-2xl
    tracking-tight` for clearer top-of-hierarchy weight.
  - Added a subtle single-layer ambient gradient behind Command Center/Inventory content in
    dark mode (see bug fix above) — the one authored atmospheric touch, not per-card decoration.
- `DESIGN.md` and `PRODUCT.md` updated to record the divided-container motif as this system's
  actual device for repeated stats/lists, and to log both bugs and their root causes for future
  reference (see PRODUCT.md § Evidence on Hand, 2026-08-08 entry).

## v5.0.0 — 2026-08-07

Full layout and visual-identity replacement, explicit user override of the prior "Twilight
Cellar" system (see `PRODUCT.md` § Evidence on Hand and `DESIGN.md` for the record). Modern
SaaS console in the register of Linear/Vercel: zinc/slate palette, hairline-bordered cards,
collapsible sidebar, condensed KPI bar, and a collapsible auxiliary panel.

- **Collapsible sidebar navigation.** `Rail.jsx` replaced by `src/components/ui/Sidebar.jsx`:
  ~240px expanded (logo, section headers, icon+label nav, badge counts) / ~64px collapsed
  (icon-only with accessible hover/focus tooltips). Collapsed state persists to `localStorage`
  (`sidebar-collapsed`) via the previously-unused `useLocalStorageState` hook.
- **New shared workspace primitives** (`src/components/ui/`): `KpiCard`, `ActionBar` (+
  `ActionSearch`/`ActionGhost`/`ActionPrimary`), `DataTable`, `AuxPanel` (independently
  collapsible right-hand panel, state persisted per instance).
- **Inventory rebuilt onto the new primitives:** condensed 4-card KPI bar (Total Stock, Low
  Stock Alert, Active Restocks, Avg Daily Burn), action bar (search + category/sort filters +
  Actions menu + one primary "+ Add Product" CTA), full-width bordered data table, and the
  Auto-Deduction Log moved into a collapsible `AuxPanel`. Add/Edit/Bulk-upload/Stock-adjust
  sub-views were left on the legacy stylesheet for this pass (see Phase 2 below).
- **Command Center (`TodayPage.jsx`) rebuilt onto the same primitives** as the second consumer
  — proves `KpiCard`/`AuxPanel` generalize across pages. Priority Actions now lives in an
  `AuxPanel`.
- **Tailwind CSS (v4, `@tailwindcss/vite`) introduced**, phased migration off the single global
  `src/styles.css`. `styles.css` is imported through an explicit lower-priority `@layer legacy`
  in `src/tailwind.css` so Tailwind utilities reliably win on any selector overlap (CSS cascade
  layers rank above specificity — an unlayered rule beats a layered one regardless of selector
  weight, which is why this had to be explicit rather than relying on source order). Preflight
  is intentionally omitted so pages not yet migrated keep rendering on the legacy stylesheet.
  `styles.css` itself is unchanged and stays in place until every page is migrated.
- **Design system fully superseded, not merged:** claret/verdigris, the four-role accent
  budget, and the no-card/no-shadow/no-pill rules are retired in favor of a zinc/slate palette,
  emerald (live/positive) and amber (low-stock/warning) accents, and hairline-bordered
  rounded-lg cards throughout. Full rationale and token values in `DESIGN.md` v5.0.0;
  positioning implications in `PRODUCT.md` § Positioning and § Evidence on Hand.
- **Phase 2 (not in this pass):** migrate `OrdersPage`, `LoyaltyPage`, `DeliveryPage`,
  `InboxPage`, `MarketplacePage`, `AutomationPage`, the Inventory add/edit/bulk-upload/
  stock-adjust sub-views, and the category-tag color classes (`CatPill`) off `src/styles.css`;
  only then does `styles.css` get deleted.

## v4.1.0 — 2026-08-07

Design-system revision: retired the last two decorative holdovers the "AI slop" audits kept
flagging, plus a genuine card-container border sweep this time (prior passes stopped short of
touching typography, nav chrome, or the hairline-grid technique itself).

- **Typography: dropped Fraunces app-wide.** Every selector that used the editorial serif
  display face (headings, card titles, KPI/metric digits, the sidebar brand mark) now uses
  Public Sans. Removed the `--serif` token, removed Fraunces from the Google Fonts request in
  `index.html`. Added `font-variant-numeric: tabular-nums` to every selector that displays a
  number (14 in `styles.css` plus 3 inline styles) so digits no longer jitter in width as they
  change.
- **Sidebar nav: removed the dotted leader line and claret index numbers** (`Rail.jsx`,
  `.rail-link-leader`/`.rail-link-index`). The active-nav indicator (one of the accent's four
  budgeted roles) now colors the icon+label directly instead of living on the index number.
- **Card/grid/metric surfaces: dropped hairline borders app-wide**, converting the
  background+1px-gap "hairline grid" technique (`.cc-metrics`, `.cc-channels`, `.cc-journey`,
  `.inv-cat-strip`, `.mkt-channels`) and bordered single cards (`.card`, `.panel`, `.cc-health`,
  `.cc-pulse`, `.cc-actions`, `.tier-ledger`, `.camp`) to real spacing + background-elevation
  only. Left hairlines in place where they do real functional work — table rows, form fields,
  and framing devices (modals/dropdowns/toasts) — since those aren't the "boxed card" pattern
  being removed.
- **Inventory toolbar consolidated:** sort-field and asc/desc controls merged into one select;
  Bulk Upload / Stock Adjustment / Export CSV moved into an "Actions" dropdown; "+ Add Product"
  is now the view's one primary CTA.
- Updated `DESIGN.md` and `PRODUCT.md` to record these as deliberate replacements of the prior
  Fraunces/hairline/nav-leader commitments, not regressions — future work should not reintroduce
  them without an explicit new decision.

## v4.0.1 — 2026-08-07

- **Fixed a sixth layout-breaking bug: the Inventory category strip left a visible empty gap in
  its last row at wide viewports** (reported at a screenshot showing 5 columns fit, 8 categories
  wrap to a 5+3 split, leaving 2 empty cells rendered as a solid block in the grid's divider
  color). This is a different failure mode than the `auto-fill` phantom-track bug fixed in
  v3.2.0: `auto-fit` only collapses a track that's *entirely* unused, and here row 1 uses all 5
  tracks, so they all stay — the gap is a partial last row, which no auto-fit/auto-fill setting
  can fix. Since the category count is fixed (always exactly 8), switched `.inv-cat-strip` to a
  pinned `repeat(4, 1fr)` (2 always-full rows) with breakpoints to 2 and 1 columns, instead of
  leaving the column count to "however many happen to fit."
- Audited every other `auto-fit`/`auto-fill` grid for the same risk. `.mkt-channels` (3 fixed
  marketplace channels) had the same latent bug at mid-narrow widths where 2 columns fit but not
  3 — pinned to `repeat(3, 1fr)` with a single-column breakpoint.
- Removed `.panel-grid` / `.panel-grid.three`, dead CSS left over from the v3.2.0 Marketplace
  de-boxify pass — zero remaining usages in any `.jsx` file, and it carried the same broken
  `auto-fill` pattern.

## v4.0.0 — 2026-08-07

Full palette rebrand: replaced claret + verdigris ("Twilight Cellar") with pine + amber
("Cellar Stone"). User explicitly rejected the retune-only path from v3.3.0 as still reading
as "AI-generated slop" — a fair call: near-black canvas + one saturated accent + hairlines +
ambient glow is exactly the "dark terminal with a neon accent" cluster the impeccable skill's
own calibration notes name as an AI-interface tell, and the ambient glow + decorative grid-line
texture were the most literal match for it.

- **New hues, real materials, not a re-skin of the same formula.** Pine — a deep, desaturated
  bottle-glass green — replaces claret as the 4-role rare accent (primary CTA, active-nav index,
  top loyalty tier, one hero KPI). Amber — cognac/cask amber — replaces verdigris as the workhorse
  secondary. Chosen because they're literally true to the product (wine bottle glass, spirits
  cask) rather than an arbitrary hue swap, and neither reads as the red-accent or mint-accent
  variants of the same near-black-terminal cluster.
- **Warmed the base off "cool graphite terminal."** Dark mode shifted from a cool blue-gray
  (`#1B1E23`) to a warm cellar-stone charcoal (`#211E1A`); light mode from a cool pale sage
  (`#E2E4DC`) to a warm limestone/putty tone (`#DDD6C8`) — breaking the "cool near-black canvas"
  half of the AI-terminal signature, not just the accent color.
- **Removed the ambient glow and the decorative grid-line background** (`body`/`body::before`) —
  two large soft radial-gradient color washes plus a 64px hairline grid texture behind the whole
  shell. This was the most literal match for the calibration's named "near-black + glowing accent"
  and "codex-grid-background" signatures (the latter had already been flagged, twice, by the
  design-quality hook in earlier turns and dismissed as intentional; the user's explicit rejection
  of the palette overrides that earlier call). Depth now comes only from the existing stepped
  `--surface` luminance system, no glow layer behind it.
- **Renamed every `--claret*`/`--verdigris*` CSS custom property to `--pine*`/`--amber*`**
  throughout `styles.css` and all JSX (mechanical rename, ~140+ call sites) so the token names
  describe what they now hold, instead of a green token permanently named after a red wine.
- **Found and fixed a second wave of hardcoded hex** bypassing the token system entirely — the
  same class of bug the 2026-07-24 critique flagged ("~74 hardcoded hex values") and that this
  rebrand's own first pass initially missed, because a plain-text search for "claret"/"verdigris"
  can't find a literal `#3F9C7E`. Found by grepping for the *old palette's actual hex values*
  across `src/`, not just the token names: `TodayCharts.jsx`'s Chart.js theme mirror (canvas can't
  resolve CSS custom properties, so it hand-mirrors the tokens), the Delivery page's Leaflet truck
  markers and hand-drawn zone-coverage SVG, and Driver Portal's standalone `HEX` fallback object
  and inline gradient fallbacks — all still carrying the old red/green values after the token
  rename, confirmed by re-screenshotting the Loyalty page and spotting the top tier still
  rendering pink.

## v3.3.0 — 2026-08-07

Retuned the achromatic token ramp (Fraunces/Public Sans/JetBrains Mono and the claret/verdigris
brand hues are unchanged — kept per settled `PRODUCT.md` commitments, confirmed after evaluating
and re-rolling a full-rebrand direction and choosing to retune instead) and finished de-boxifying
Automation, the last page still nesting cards inside a card:

- **Dark mode was too dark, light mode was too light.** Lifted the whole dark-mode `--bg`/
  `--surface`/`--line` ramp off near-black (`#15171B` → `#1B1E23` base) and dimmed the light-mode
  ramp off near-white (`#EDEEEA` → `#E2E4DC` base), narrowing both themes into a less extreme
  luminance band while keeping the same hue family.
- **Caught a real pre-existing contrast failure while retuning, in both themes.** `--muted` text
  in dark mode measured ~2.9:1 against `--surface-2` (computed via WCAG relative luminance, well
  below the 4.5:1 AA floor for normal text) — lightened `#888C90` → `#A0A5AE`, now ~4.8:1+ against
  every surface step. Light-mode `--muted` was a borderline 4.67:1 before this pass; dimming
  `--surface` per the point above would have dropped it under 4.5:1, so `#6C716A` → `#5C6158`
  darkened it in the same edit to hold AA against the new, less-washed-out surface.
- **Automation was four separate `.card` panels (one per rule domain) nested inside the page's
  own `.panel` frame** — cards inside a card, the same anti-pattern already fixed elsewhere.
  Merged into one ledger (`.automation-list`) with domain groups as in-list section breaks
  (`.automation-domain`, hairline `border-top` between groups) instead of each domain getting its
  own bordered box.
- Evaluated a full visual rebrand (new palette + new typography) via the impeccable skill's
  direction-roll process at the user's request, including a re-roll; user chose to keep the
  current fonts (already Google Fonts: Fraunces/Public Sans/JetBrains Mono) and retune rather than
  replace the identity a fourth time.

## v3.2.0 — 2026-08-07

De-boxified three repeated card grids that still violated DESIGN.md's own Stepped-Luminance
Rule and No-Pill-style card ban ("no card-and-shadow elevation... anywhere in the product"),
reported as looking generic/templated ("boxy," "AI-generated"):

- **Command Center — Channel Operations:** four individually bordered `.cc-channel` cards
  merged into one hairline-divided plate (`.cc-channels`), matching the grid-with-1px-gap
  pattern already used correctly by `.cc-metrics`.
- **Command Center — Priority Actions:** the stacked list of individually boxed `.cc-action`
  cards merged into one bordered panel with hairline `border-bottom` row dividers, matching the
  `.tier-ledger` / `.tier-row` convention used on the Loyalty page.
- **Inventory — category health strip:** eight boxed `.inv-cat-card` tiles merged into one
  hairline-divided plate (`.inv-cat-strip`), same grid-with-1px-gap pattern.
- **Marketplace — channel cards:** three `article.panel` cards nested inside an outer `.panel`
  (a literal card-inside-a-card) replaced with a dedicated `.mkt-channels` / `.mkt-channel`
  hairline-divided plate; `MarketplacePage.jsx` no longer reuses the generic `.panel-grid.three`
  scaffold for this section.
- Switched the new grid-with-gap plates from `auto-fill` to `auto-fit` on their column tracks —
  `auto-fill` left a visible empty track (rendered as a solid block in the container's divider
  color) whenever the item count didn't exactly fill a row at the viewport's column count.
- Fixed a regression caught in the same pass: the Priority Actions rows are `<button>` elements,
  and moving their background gradient onto the shared `.cc-actions` parent let the browser's
  default button background paint over it — the gradient now lives on `.cc-action` itself, per
  the same fix already applied correctly to `.cc-channel`.
- **Fixed a fourth layout-breaking bug, in the responsive nav, recurring below the tablet
  breakpoint the v3.1.0 fix covered:** the icon-only compact bar (`.rail` at `max-width: 1024px`)
  had `overflow-x: auto` as a safety net, but at phone widths (≤640px) the 13 nav/footer icons
  genuinely don't fit one row — confirmed by measuring `scrollWidth` vs `clientWidth` in a
  headless browser (724px of content in a 375px bar). That safety net was silently scrolling the
  theme toggle, Reset Data, and Sign Out controls off-screen with no visible scrollbar or
  affordance — the "navbar is scrollable" bug reported. Replaced the horizontal-scroll fallback
  with `flex-wrap: wrap` on `.rail`, `.rail-nav`, `.rail-group`, and `.rail-foot`, so the bar
  grows to two rows at narrow widths instead of hiding controls; removed the now-obsolete
  scroll-fade `mask-image` at the `max-width: 560px` breakpoint.
- **Fixed a fifth scrollable-nav case: the desktop vertical sidebar itself**, reported separately
  after the horizontal-bar fix above — at viewport heights below ~770px, `.rail-nav`'s
  `overflow-y: auto` kicked in because the 8 nav items + 5 footer items + brand block didn't fit,
  and the resulting scroll used the bare OS scrollbar (grey, with up/down arrow buttons),
  which read as an unstyled system widget against the rest of the hairline dark-luxury system.
  Tightened `.rail`/`.rail-brand`/`.rail-link`/`.rail-group`/`.rail-foot` vertical padding and
  gaps so the sidebar now fits without scrolling down to ~650px (confirmed by measuring
  `scrollHeight` vs `clientHeight` in a headless browser at several heights); added a global thin,
  theme-matched scrollbar (`scrollbar-color`/`::-webkit-scrollbar`) for the remaining case of
  genuinely short viewports, and for every other internally-scrolling region in the app (inbox
  thread list, data tables, modals) that was also using the unstyled default.

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
