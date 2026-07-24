# Dark Luxury Ops Redesign — Design Spec

**Date:** 2026-07-24
**Status:** Approved
**Version target:** v3.0.0 (README + CHANGELOG)

## Context

Maison Reserve has been through two prior full visual rebrands: a dark "Industrial Steel"
telemetry theme (`8a48762`), then a "luxury cellar" parchment/oak/cabernet/antique-gold
rebrand applied only to the Command Center + nav (`9f437ed`). A further uncommitted attempt
at an "ink-black / bone-white / claret" repaint was found in-progress but incomplete (only
6 of ~15 files touched) and has been stashed (`git stash list`) rather than built on, per
user decision — this spec starts the palette fresh rather than finishing that WIP.

This spec covers a complete, consistent redesign across the entire app using the
`ui-ux-pro-max` design-intelligence skill as input, filtered through human judgment where
the tool's raw output was incoherent for this use case (its `--design-system` run mixed a
light e-commerce-luxury palette with mobile-native "Cinema Dark" keywords and suggested
Fira Code/Fira Sans typography — rejected; see Typography below).

## Direction: "Dark Luxury Ops"

Dark-primary premium operations console for a wine & spirits retailer. Near-black warm
canvas, elevation via luminance steps (not blur/glassmorphism — rejected as
performance/contrast-risky for a data-dense tool per the skill's own flags), antique gold
used as a genuinely rare high-value accent, wine-cabernet as the workhorse secondary color
carrying most of the UI's color needs. Light mode is kept as a companion theme, not dropped.

## Color tokens

Same CSS variable names as current `src/styles.css` (`--honey`, `--cabernet`, `--cream`,
etc.) are kept — only values change — so components consuming `var(--honey)` etc. don't
need renaming, only re-auditing (see "Gold usage audit" below).

### Dark mode (`:root`, default)

```
--bg: #100D08              --bg-2: #17130C
--shell-bg: #0B0906        --shell-bg-2: #14100A     --shell-border: #2C2317

--surface: #1E1810         --surface-2: #271F15      --surface-3: #322718
--line: #382D1E            --line-soft: rgba(241,233,216,0.05)
--border-active: #4C3D26

--honey: #C8A155           --honey-2: #DCC17C        --honey-deep: #8F6F2E
--amber-glow: rgba(200,161,85,0.14)

--cabernet: #8C2A3B        --cabernet-2: #B04A5A     --cabernet-deep: #501A24
--cabernet-glow: rgba(140,42,59,0.16)
--burgundy: var(--cabernet-deep)

--cream: #F1E9D8           --cream-dim: #C9BCA0
--muted: #96876B           --muted-2: #6B5D45

--green: #6FA35C   --green-bg: rgba(111,163,92,.14)
--red: #C4483B     --red-bg: rgba(196,72,59,.14)
--orange: #C98A3E  --orange-bg: rgba(201,138,62,.14)
--blue: #6B84A6    --blue-bg: rgba(107,132,166,.13)

--shopee: #B65A3C  --shopee-bg: rgba(182,90,60,.16)
--lazada: #5A7396  --lazada-bg: rgba(90,115,150,.16)

--r: 6px            --r-sm: 4px
--shadow: 0 1px 2px rgba(0,0,0,.35), 0 14px 30px -12px rgba(0,0,0,.55)
--shadow-lift: 0 3px 8px rgba(0,0,0,.4), 0 26px 52px -16px rgba(0,0,0,.65)
--rim: inset 0 1px 0 rgba(241,233,216,.05)   /* neutral warm rim-light, NOT gold */
```

### Light mode (`body[data-theme="light"]`, "Daylight Cellar")

```
--bg: #F4EBD9              --bg-2: #EADEC6
--shell-bg: #EADDC4        --shell-bg-2: #E1D2B4     --shell-border: #D3C09B
--surface: #FBF6EA         --surface-2: #F3EBD8      --surface-3: #E6D9BD
--line: #DECFB0            --line-soft: rgba(42,32,20,0.07)
--border-active: #C7B48C

--honey: #96702A           --honey-2: #B0873A        --honey-deep: #6E5019
--amber-glow: rgba(150,112,42,.10)

--cabernet: #7A2634        --cabernet-2: #9C3A48     --cabernet-deep: #5E222C
--cabernet-glow: rgba(122,38,52,.10)

--cream: #2A2018           --cream-dim: #52422E
--muted: #7A6A52           --muted-2: #9A8A6C

--green: #5C7742   --green-bg: rgba(92,119,66,.12)
--red: #A83A2D     --red-bg: rgba(168,58,45,.10)
--orange: #A9772C  --orange-bg: rgba(169,119,44,.12)
--blue: #4C6A8C    --blue-bg: rgba(76,106,140,.10)

--shopee: #A34B2E  --shopee-bg: rgba(163,75,46,.12)
--lazada: #3E5C78  --lazada-bg: rgba(62,92,120,.12)

--shadow: 0 1px 2px rgba(42,32,20,.08), 0 10px 22px -10px rgba(42,32,20,.12)
--shadow-lift: 0 2px 6px rgba(42,32,20,.10), 0 20px 40px -14px rgba(42,32,20,.16)
```

Notes on the mode-appropriate accent shift: gold and cabernet are *lighter* in dark mode
(need to lift off a near-black canvas) and *darker/more saturated* in light mode (need to
sit on warm paper) — same brand hue, different lightness per the skill's dark-mode-contrast
guidance. `--blue` is now a real cool-slate hue distinct from `--muted` in both modes (the
previous file aliased `--blue` to a muted-grey value, flattening the Lazada channel color).

### Gold usage audit (the "less gold" constraint)

`--honey`/`--accent` must be re-scoped to exactly these four roles, app-wide:

1. Primary CTA buttons (one per view, the single highest-priority action)
2. The active-nav indicator in the Rail
3. The top loyalty tier badge ("Maison Noir") only — tiers below it use cabernet/neutral
4. One hero KPI metric highlight on the Command Center

Every other existing `var(--honey)`/`var(--accent)` usage in `src/styles.css` and page
files (borders, hover backgrounds, secondary buttons, links, category chips, focus rings,
progress bars, etc.) gets reassigned to `var(--cabernet)`/`var(--cabernet-2)` or a neutral
(`--line`, `--border-active`, `--muted`) during implementation. This requires grepping all
`var(--honey`/`var(--accent` occurrences across `src/**/*.jsx` and `src/styles.css` and
deciding each one against this list — it is not just a token-value change.

Product-category and channel chip colors (8 categories + Shopee/Lazada) draw from the
cabernet + neutral + signal-color family; none of them use gold.

## Typography — unchanged

Fraunces (display/serif headings, hero metrics) + Public Sans (UI/body) + JetBrains Mono
(SKUs, timestamps, tabular data). Explicitly rejecting the skill's raw suggestion of Fira
Code/Fira Sans — that pairing reads as generic technical-dashboard and would erase the
boutique-wine-cellar identity that Fraunces/Public Sans has already established across two
prior redesigns.

## Layout, density, elevation

- Tighten the spacing scale for dashboard-dense contexts (tables, lists, KPI grids):
  `--sp-1: 4px, --sp-2: 8px, --sp-3: 12px, --sp-4: 16px, --sp-5: 24px, --sp-6: 32px`.
  Add `--sp-7: 48px` and keep it reserved for hero/panel-header/empty-state zones so the
  asymmetric Command Center hero doesn't get crushed by the same density rule as tables.
- Depth comes from stepped surface luminance (`--surface` → `--surface-2` → `--surface-3`)
  plus `--shadow`/`--shadow-lift` plus the neutral `--rim` top-edge highlight — no
  backdrop-filter blur or glassmorphism anywhere.

## Motion

- KPI tiles / card grids on load: fade + rise + slight scale (`opacity 0→1, y:12→0,
  scale:.97→1`), 300ms, `power2.out`, ~40–60ms stagger.
- Table rows: plain opacity fade only, no transform, no `back.out` overshoot — the skill
  explicitly flags overshoot easing as reading "sloppy" on dense informational UI, which is
  most of this app's surface area.
- Standard hover/focus/active transitions stay 150–250ms ease.
- `prefers-reduced-motion: reduce` disables all of the above (instant state).

## Icons

`lucide-react` stays (already SVG-based, already in use) — no emoji icons anywhere, no
icon-set change needed.

## Scope

Full app, per user decision:

- `src/styles.css` — token source of truth, full `:root` + `body[data-theme="light"]`
  rewrite, plus spacing/shadow/rim additions and the motion utility rules.
- `src/components/ui/Rail.jsx` (nav) and `src/pages/LoginView.jsx`
- All 8 main pages: `TodayPage`, `OrdersPage`, `InventoryPage`, `DeliveryPage`,
  `LoyaltyPage`, `InboxPage`, `MarketplacePage`, `AutomationPage`
- `src/charts/TodayCharts.jsx` (Chart.js series recolor)
- Shared components with hardcoded colors: `InventoryPanel`, `TopSellersPanel`,
  `BottleArt`, `RecommendModal`, `QuoteModal`, and `components/ui/*`
  (`Badge`, `Toggle`, `EmptyState`, `Modal`, `ConfirmDialog`, `Toast`, `ToastProvider`)
- Standalone portals: `DriverPortalPage` (already shares the main token set — sweep
  hardcoded hex only) and `StockPortalPage` (has its own inline `GLOBAL_CSS` block with
  `--kraft`/`--ink` variables — reconcile with the shared token set during implementation)
- `index.html` — manifest `theme-color` and favicon gradient, updated to the new
  gold-restricted/cabernet-forward system
- `README.md` (Design section) and `CHANGELOG.md` — new **v3.0.0** entry, per this
  project's versioning-discipline rule (`.claude/CLAUDE.md`)

## Out of scope

- No structural/layout changes beyond what's needed to carry the new density rules (i.e.
  not re-architecting page layouts, not adding/removing features or sections).
- No dependency changes (stays on the existing Chart.js/lucide-react/React stack).
- The stashed WIP (`git stash list`) is not reused; it remains stashed for the user to
  drop or inspect later at their discretion.
