# Dark Luxury Ops Redesign — Design Spec

**Date:** 2026-07-24 (palette revised same day after visual review — see "Revision" note)
**Status:** Approved
**Version target:** v3.0.0 (README + CHANGELOG)

**Revision 1:** The original palette (antique gold `--honey` + wine-red `--cabernet` on a
warm near-black oak canvas) was visually reviewed via a live preview and rejected as too
dark, too brown/muddy, and too close to a generic gold-and-burgundy liquor-store cliché.
Replaced gold/cabernet with plum/verdigris on a cooler, lighter charcoal canvas.

**Revision 2:** Plum was then rejected — it doesn't read as "wine" at all (too violet,
closer to beauty/fashion branding) and felt wrong for an operations console. The project's
priority is that the accent unmistakably signal "wine & spirits brand" first. Plum is
replaced with **claret** (`#B8304D` dark / `#8C1E3A` light) — a true, clear Bordeaux red,
distinct from both the muddy oxblood-brown of the first pass and the violet-plum of the
second. Verdigris (unchanged, wasn't the problem) stays as the workhorse secondary.
Structure (hairline/typographic component language, dark-primary base, restricted-rare-
accent rule) has been stable across both revisions — only the accent hue keeps changing.
Token names: `--honey`→`--plum`→`--claret`, `--cabernet`→`--verdigris` (final).

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

## Direction: "Twilight Cellar"

Dark-primary premium operations console for a wine & spirits retailer. Cool graphite
canvas (not warm oak-brown), elevation via luminance steps (not blur/glassmorphism —
rejected as performance/contrast-risky for a data-dense tool per the skill's own flags),
claret (a true, unmistakable Bordeaux wine-red) used as a genuinely rare high-value accent,
verdigris (the teal-green patina of aged copper and old cellar ironwork) as the workhorse
secondary color carrying most of the UI's color needs. Claret is deliberately a *clear* red
with a blue-leaning undertone — not the muddy oxblood-brown of the first pass, not the
violet-plum of the second — chosen specifically so the accent reads as "wine" at a glance,
which the project's priority calls for over any other consideration. Light mode is kept as
a companion theme, not dropped.

## Color tokens

CSS variable names in current `src/styles.css` are renamed to match the final hues
(`--honey`→`--claret`, `--cabernet`→`--verdigris`, `--amber-glow`→`--claret-glow`,
`--cabernet-glow`→`--verdigris-glow`) — keeping the old names pointed at unrelated colors
would mislead anyone reading the CSS. All other token names (`--cream`, `--muted`, `--bg`,
etc.) are unchanged; only values change on those.

### Dark mode (`:root`, default)

```
--bg: #15171B              --bg-2: #1B1E23
--shell-bg: #101216        --shell-bg-2: #1A1D22     --shell-border: #2E333B

--surface: #21252C         --surface-2: #2B303A      --surface-3: #363C47
--line: #454C58            --line-soft: rgba(230,233,230,0.07)
--border-active: #5A6272

--claret: #B8304D          --claret-2: #D65B76       --claret-deep: #7A1E34
--claret-glow: rgba(184,48,77,0.24)

--verdigris: #4F9C93       --verdigris-2: #72BAB1    --verdigris-deep: #2E6560
--verdigris-glow: rgba(79,156,147,0.2)

--cream: #EBEDE9           --cream-dim: #B4B7B1
--muted: #888C90           --muted-2: #5C6064

--green: #6FA35C   --green-bg: rgba(111,163,92,.18)
--red: #C4483B     --red-bg: rgba(196,72,59,.18)
--orange: #C98A3E  --orange-bg: rgba(201,138,62,.18)
--blue: #7C89A6    --blue-bg: rgba(124,137,166,.17)

--shopee: #B65A3C  --shopee-bg: rgba(182,90,60,.2)
--lazada: #5A7396  --lazada-bg: rgba(90,115,150,.2)

--r: 2px            --r-sm: 0px
--shadow-lift: 0 4px 12px rgba(0,0,0,.55), 0 32px 64px -18px rgba(0,0,0,.7)   /* frame-level only, see Layout */
```

### Light mode (`body[data-theme="light"]`, "Daylight Cellar")

```
--bg: #EDEEEA              --bg-2: #E3E5DE
--shell-bg: #E6E8E2        --shell-bg-2: #DCDFD7     --shell-border: #C9CCC3
--surface: #F7F8F5         --surface-2: #EEF0EA      --surface-3: #E1E4DC
--line: #D2D5CC            --line-soft: rgba(30,32,28,0.07)
--border-active: #B7BBAE

--claret: #8C1E3A          --claret-2: #A8324F       --claret-deep: #5C1226
--claret-glow: rgba(140,30,58,.12)

--verdigris: #2E6D65       --verdigris-2: #3F877D    --verdigris-deep: #1D4A44
--verdigris-glow: rgba(46,109,101,.10)

--cream: #202422           --cream-dim: #454A44
--muted: #6C716A           --muted-2: #9A9E92

--green: #5C7742   --green-bg: rgba(92,119,66,.14)
--red: #A83A2D     --red-bg: rgba(168,58,45,.12)
--orange: #A9772C  --orange-bg: rgba(169,119,44,.14)
--blue: #5A6A85    --blue-bg: rgba(90,106,133,.12)

--shopee: #A34B2E  --shopee-bg: rgba(163,75,46,.14)
--lazada: #46607D  --lazada-bg: rgba(70,96,125,.14)

--shadow-lift: 0 2px 6px rgba(30,32,28,.12), 0 20px 40px -14px rgba(30,32,28,.18)
```

Notes on the mode-appropriate accent shift: claret and verdigris are *lighter* in dark mode
(need to lift off a dark canvas) and *darker/more saturated* in light mode (need to sit on
pale paper) — same brand hue, different lightness per the skill's dark-mode-contrast
guidance. Canvas neutrals are cool graphite/stone (blue-grey undertone) rather than the
first pass's warm oak-brown, which was the direct fix for "too dark and muddy." Signal
colors (`--green`/`--red`/`--orange`/`--blue`) are unchanged in hue and stay clearly
distinct from both `--claret` (deliberately blue-leaning crimson, not the orange-leaning
`--red`) and `--verdigris` (teal, not sage like `--green` or slate like `--blue`) — status
must never be confused with brand emphasis, and claret must never read as an alert color.

### Claret usage audit (the "used sparingly" constraint carries over)

`--claret`/`--accent` is scoped to exactly these four roles, app-wide — same rule across
all revisions, only the color changed:

1. Primary CTA buttons (one per view, the single highest-priority action)
2. The active-nav indicator in the Rail
3. The top loyalty tier badge ("Maison Noir") only — tiers below it use verdigris/neutral
4. One hero KPI metric highlight on the Command Center

Every other existing `var(--honey)`/`var(--accent)` usage in `src/styles.css` and page
files (borders, hover backgrounds, secondary buttons, links, category chips, focus rings,
progress bars, etc.) gets renamed to `var(--verdigris)`/`var(--verdigris-2)` or a neutral
(`--line`, `--border-active`, `--muted`) during implementation. This requires grepping all
`var(--honey`/`var(--accent`/`var(--cabernet` occurrences across `src/**/*.jsx` and
`src/styles.css` and deciding each one against this list — it is not just a token-value
change.

Product-category and channel chip colors (8 categories + Shopee/Lazada) draw from the
verdigris + neutral + signal-color family; none of them use claret.

## Typography — unchanged

Fraunces (display/serif headings, hero metrics) + Public Sans (UI/body) + JetBrains Mono
(SKUs, timestamps, tabular data). Explicitly rejecting the skill's raw suggestion of Fira
Code/Fira Sans — that pairing reads as generic technical-dashboard and would erase the
boutique-wine-cellar identity that Fraunces/Public Sans has already established across two
prior redesigns.

## Structural language: hairline/typographic, not card-and-shadow

A first pass at the components used a standard boxed-card dashboard (rounded KPI card,
pill status/channel badges, rounded-card-with-left-accent-bar nav) and was rejected as
generic — custom colors on a stock SaaS-dashboard template still reads as templated. The
replacement, validated via live preview, drops card/shadow/pill scaffolding in favor of
hairline rules and typography carrying the hierarchy — closer to a cellar ledger or wine
list than an admin panel:

- **Radius:** `--r: 2px` (buttons only), `--r-sm: 0px` everywhere else. No `rounded-lg`
  card shapes anywhere in the product.
- **No card-and-shadow elevation for content.** Depth comes from stepped surface luminance
  (`--surface` → `--surface-2` → `--surface-3`) and hairline borders (`--line`), not
  `box-shadow` on individual components. The one exception is framing devices that
  genuinely float above content — modals, dropdowns, toasts — which keep a real drop
  shadow because they *are* elevated; regular page content never gets one.
- **Nav (Rail):** each item keeps its `lucide-react` icon (unchanged from today — dropping
  icons in an earlier draft of this preview was an oversight, not a decision; icons stay
  for scannability) followed by the label, then a dotted leader line, then a claret-colored
  index number for the active item only (menu/table-of-contents convention — items are
  already a real numbered, ordered list of sections, so numbering them is informational,
  not decorative). Not a rounded card with a left accent bar.
- **Nav badges** (Orders pending count, Inbox unread count — from `badges[key]` in
  `Rail.jsx` today): shown as a small bold numeral in `--orange` (the "needs attention"
  signal color) directly after the label, before the leader line. Not a filled pill/badge
  background — same "no pill" rule as status, applied consistently.
- **Status:** a colored word + small dot, never a pill/badge background fill.
- **Channel/category tags:** small-caps mono label with a colored underline, never a pill.
- **KPI hero metrics:** large serif numeral + a short gradient hairline rule beneath it
  (`--claret-deep` → transparent), not a boxed stat card.
- **Loyalty tiers:** one ledger row divided by hairlines (`border-left: 1px solid --line`
  between columns), not five separate boxed cards. The top tier is marked by a 2px
  `--claret` rule across just that column, not a gradient-filled box.
- **Ambient glow, not glassmorphism:** a soft `--claret-glow`/`--verdigris-glow` radial
  gradient behind the canvas (plus a faint top-down sheen) gives atmosphere without
  `backdrop-filter` blur, which the skill flags as a performance/contrast risk for a
  data-dense tool.
- **Focus states use `--cream`, never `--claret`.** Every interactive element (nav links,
  buttons, form fields, the theme toggle) gets a visible `outline: 2px solid var(--cream)`
  (`outline-offset: 2px`) on `:focus-visible` — accessibility priority-1 per the skill's own
  rule categories, and non-negotiable regardless of how "quiet" the rest of the UI is. It's
  deliberately *not* claret: claret is budgeted to exactly 4 roles (see "Claret usage
  audit") and a focus ring firing on every tab-stop would blow that budget instantly. Cream
  is high-contrast against every surface in both modes and costs nothing from the budget.
- **Brand chrome (any monogram/wordmark treatment, if added) uses neutral ink, not
  claret.** A monogram mark explored during visual review used claret for its ring, which
  silently broke the "claret appears in exactly 4 places" claim — brand chrome sits outside
  the four audited roles by definition, so it must stay neutral. Whether a monogram mark
  ships in the product at all (Rail brand, LoginView, favicon) is still an open question,
  not decided by this spec — it appeared only in preview-page documentation chrome.

## Motion

- **Ambient canvas drift:** the background glow gradient slowly shifts position over
  ~30–35s (`ease-in-out infinite alternate`) so the canvas doesn't read as static —
  mirrors the real app's existing ambient "live ticker" concept (README: nudges KPIs and
  truck positions every ~15–20s) applied to the visual layer, not just the data layer.
- **Live data nudges:** KPI numbers and status text that the live ticker updates get a
  brief accent-colored flash (text-shadow pulse, ~700–800ms) at the moment they change —
  motion that conveys "this just updated," not decorative motion.
- **A pulsing dot marks live state** on the brand mark (the existing `.rail-live` element
  in `Rail.jsx`) — small, continuous, low-amplitude scale+fade pulse.
- Table rows: plain opacity fade only on load, no transform, no `back.out` overshoot — the
  skill explicitly flags overshoot easing as reading "sloppy" on dense informational UI,
  which is most of this app's surface area.
- Standard hover/focus/active transitions stay 150–250ms ease.
- `prefers-reduced-motion: reduce` disables all of the above (instant state, no drift, no
  pulse animation — live text updates still happen, just without the flash).

## Icons

`lucide-react` stays (already SVG-based, already in use) — no emoji icons anywhere, no
icon-set change needed.

## Scope

Full app, per user decision:

- `src/styles.css` — token source of truth, full `:root` + `body[data-theme="light"]`
  rewrite (including the `--honey`/`--cabernet` → `--claret`/`--verdigris` rename), plus
  the hairline/no-card component rules and the motion utility rules.
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
  claret-restricted/verdigris-forward system
- `README.md` (Design section) and `CHANGELOG.md` — new **v3.0.0** entry, per this
  project's versioning-discipline rule (`.claude/CLAUDE.md`)

## Out of scope

- No structural/layout changes beyond what's needed to carry the new density rules (i.e.
  not re-architecting page layouts, not adding/removing features or sections).
- No dependency changes (stays on the existing Chart.js/lucide-react/React stack).
- The stashed WIP (`git stash list`) is not reused; it remains stashed for the user to
  drop or inspect later at their discretion.
