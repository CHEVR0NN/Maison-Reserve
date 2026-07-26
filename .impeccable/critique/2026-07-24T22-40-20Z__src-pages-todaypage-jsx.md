---
target: src/pages/TodayPage.jsx (Command Center)
total_score: 20
max_score: 40
na_heuristics: 
p0_count: 0
p1_count: 2
timestamp: 2026-07-24T22-40-20Z
slug: src-pages-todaypage-jsx
---
Method: dual-agent (A: design-review sub-agent · B: detector+evidence sub-agent)

## Critique — src/pages/TodayPage.jsx ("Command Center")

### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|---|---|---|
| 1 | Visibility of System Status | 3 | Sync freshness + health badge good; no page-level "last updated" |
| 2 | Match System/Real World | 3 | Wine-trade vocabulary throughout |
| 3 | User Control and Freedom | 2 | No dismiss/snooze on priority actions |
| 4 | Consistency and Standards | 1 | cc-* classes fork the app's own .panel/.pill/.fchip system; zero reuse of shared components |
| 5 | Error Prevention | 3 | Read-only nav surface, low risk by construction |
| 6 | Recognition Rather Than Recall | 3 | Self-explanatory labels |
| 7 | Flexibility and Efficiency | 1 | KPI cards look clickable, aren't; "Notify Members" navigates, doesn't notify |
| 8 | Aesthetic and Minimalist Design | 3 | Restrained hairline/type hierarchy — undercut by hardcoded colors bypassing tokens |
| 9 | Error Recovery | 1 | No error state; "healthy" logic is a false-positive trap |
| 10 | Help and Documentation | 0 | Zero tooltips/hints on the most-used page in the app |
| Total | | 20/40 | Acceptable — significant improvements needed |

### Design Specificity Verdict

Design review: Partial. Copy is genuinely grounded ("bottles below reorder level," "One stock pool, every storefront") and the serif/type system is bespoke. But composition — KPI strip -> 2-col grid -> clickable cards -> action rail — is stock SaaS-ops layout; nothing wine-specific (no BottleArt, no vintage/label device) appears on this page at all. Luxury identity lives entirely in color/type, not structure.

Deterministic scan: 5 findings in src/styles.css, none in the JSX itself. side-tab (1962), layout-transition x3 (968, 1618, 2139) — warnings; codex-grid-background (187) — advisory, decorative two-axis grid-line gradient, a recognizable generic-dashboard motif. No false positives in the CLI output.

Deterministic scan also surfaced what the design review couldn't see from JSX alone: styles.css defines a clean two-theme token system but 74 unique hex values / 92 occurrences appear hardcoded in rule bodies outside it, several mismatching the token they sit beside (e.g. rgba(255,195,0,...) glows next to --warning, whose real RGB is nowhere near pure gold). Both assessments independently converged on "the design system isn't actually being used as a system."

No browser visualization: no browser automation tool exposed this session; skipped rather than faked.

### Overall Impression

The page reads calmer and more coherent than most first-pass dashboards, and the copy voice is real. But it's a facade over drift: a parallel cc-* styling language that ignores the app's own shared components, a health signal that lies by omission, and a token system a third of the file's colors quietly bypass.

### What's Working

- Relative-time sync labels (TodayPage.jsx:91) build operational trust.
- :focus-visible correctly implemented on every interactive card (styles.css:1928, 1967).
- Clean semantic structure — single h1->h2 hierarchy, whole-card <button> for touch targets.

### Priority Issues

[P1] Light-mode text fails WCAG AA contrast — Primary button label (#1B1712 on --honey light #96702A) computes to ~3.75:1, below 4.5:1 AA. Metadata/muted text (#7A6A52 on #F3EAD7) computes to ~4.38:1, also borderline-fails. Systemic — this is the CTA and secondary-label color used app-wide in light mode. Fix: darken --honey (light) and --muted (light) until both pairs clear 4.5:1.

[P1] "Healthy" badge ignores low-stock count — healthy (TodayPage.jsx:65) checks only critical === 0, while the Inventory Health KPI directly below (78-79) counts lowItems too. False-positive trust signal on a money/inventory page. Fix: healthy = critical === 0 && lowStock === 0.

[P2] Deceptive CTA — "Notify Members" sends nothing — Button (TodayPage.jsx:126-128) only calls setTab("Loyalty"); no notification fires. Fix: rename to "Review Members," or wire a real send.

[P2] Design-system fork, structurally and at the color layer — cc-* classes duplicate every pattern the rest of the app already has instead of reusing them, and ~74 hardcoded hex values bypass the token system, several mismatching their semantic token. Compounds every future redesign including the pending Dark Luxury Ops rewrite. Fix: migrate cc-* to shared primitives and sweep hardcoded hex to tokens before the repaint.

[P2] Dead-looking interactivity — .cc-metric KPI cards share the exact surface/border treatment as clickable .cc-channel/.cc-action cards but have no onClick or hover state. Fix: make KPIs deep-link to their source tab, or visually demote them.

### Persona Red Flags

Alex (power user): no shortcuts, no bulk action; wastes a click on "Notify Members"; KPI row is inert.

Jordan (first-timer): nothing explains "Business Pulse" or the journey stages — zero tooltips anywhere on the page.

Sam (accessibility-dependent): the light-mode contrast fails above hit Sam directly; decorative status dots are correctly aria-hidden with accessible text alongside.

### Minor Observations

- 3x transition: width/padding-left (styles.css:968, 1618, 2139) — layout-property transitions, mild jank risk.
- codex-grid-background (187) — advisory-only decorative grid motif, generic-dashboard-coded.
- Empty inventory/channel arrays silently read as "Healthy" since filters over [] return 0.
- --blue and --muted resolve to the identical hex in both themes.

### Questions to Consider

1. If Priority Actions, the KPI row, and the health banner all restate the same three facts, should this page collapse them into one state surface?
2. Given the design-system fork found here, is it worth documenting the real incumbent system before layering the Dark Luxury Ops repaint on top of it?
3. Should "Command Center" carry any wine-specific visual signature beyond color/type before calling the redesign a luxury-cellar experience?
