import { useMemo, useState } from "react";
import { SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";

const WINDOWS = [
  { value: "",   label: "All" },
  { value: "30", label: "30d" },
  { value: "7",  label: "7d" },
];

const METRICS = [
  { value: "units",   label: "Units" },
  { value: "revenue", label: "Revenue" },
];

const VIEWS = [
  { value: "overall",  label: "Overall" },
  { value: "category", label: "By category" },
];

const CATEGORY_LABELS = {
  "wine-champagne": "Wine & Champagne",
  "gin-vodka":      "Gin & Vodka",
  "bourbon-whisky": "Bourbon & Whisky",
  "beer-cider":     "Beer & Cider",
  "liqueur":        "Liqueur",
  "rum-tequila":    "Rum & Tequila",
  "brandy-cognac":  "Brandy & Cognac",
  "mixers":         "Mixers",
  "uncategorized":  "Uncategorized",
};
const catLabel = (k) => CATEGORY_LABELS[k] || k.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const metricValue = (s, by) => (by === "revenue" ? s.revenue : s.unitsSold);

// Aggregates actual recorded order lines (not a heuristic) into a per-SKU
// leaderboard — this is real demand from the mock order set, not a fallback.
function aggregateSales(orders, inventory, windowDays) {
  const cutoff = windowDays ? Date.now() - Number(windowDays) * 86400000 : 0;
  const bySku = new Map(inventory.map((p) => [p.sku, p]));
  const totals = new Map();
  orders
    .filter((o) => o.status !== "cancelled" && o.deliveredAt && new Date(o.deliveredAt).getTime() >= cutoff)
    .forEach((o) => o.lines.forEach((l) => {
      const entry = totals.get(l.sku) || { unitsSold: 0, revenue: 0 };
      entry.unitsSold += l.qty;
      entry.revenue += l.qty * l.price;
      totals.set(l.sku, entry);
    }));
  return [...totals.entries()].map(([sku, t]) => {
    const product = bySku.get(sku);
    return {
      sku, name: product?.name || sku, unitsSold: t.unitsSold, revenue: Math.round(t.revenue),
      stock: product?.stock, minStock: product?.minStock, category: product?.category || "uncategorized",
    };
  });
}

function SellerRow({ s, max, by }) {
  const pct  = Math.max(4, Math.round((metricValue(s, by) / max) * 100));
  const low  = s.stock != null && s.minStock != null && s.stock <= s.minStock;
  const lead = s.rank === 1;
  return (
    <div className={`ts-row${lead ? " ts-row-lead" : ""}${low ? " ts-row-low" : ""}`}>
      <span className="ts-rank mono">{String(s.rank).padStart(2, "0")}</span>
      <div className="ts-bar-wrap">
        <div className="ts-bar" style={{ width: `${pct}%` }} />
        <div className="ts-row-content">
          <div className="ts-id">
            <span className="ts-name">{s.name}</span>
            {s.sku && <span className="ts-sku mono">{s.sku}</span>}
            {low && <span className="pill crit">RESTOCK</span>}
          </div>
          <div className="ts-metrics">
            <span className={`ts-metric mono${by === "units" ? " ts-metric-lead" : ""}`}>
              {s.unitsSold.toLocaleString("en-SG")}<i>u</i>
            </span>
            <span className={`ts-metric mono${by === "revenue" ? " ts-metric-lead" : ""}`}>
              {SGD(s.revenue, true)}
            </span>
            {s.stock != null && (
              <span className={`ts-stock mono ${low ? "is-low" : "is-ok"}`} title="Units in stock">
                <i className="ts-dot" />{s.stock}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TopSellersPanel() {
  const { state } = useAppData();
  const [view, setView]             = useState("overall");
  const [windowDays, setWindowDays] = useState("");
  const [by, setBy]                 = useState("units");

  const rows = useMemo(
    () => aggregateSales(state.orders.items, state.inventory.items, windowDays).sort((a, b) => metricValue(b, by) - metricValue(a, by)),
    [state.orders.items, state.inventory.items, windowDays, by]
  );

  const sellers = useMemo(() => rows.slice(0, 8).map((s, i) => ({ rank: i + 1, ...s })), [rows]);

  const categories = useMemo(() => {
    const groups = new Map();
    for (const s of rows) {
      const cat = s.category || "uncategorized";
      if (!groups.has(cat)) groups.set(cat, []);
      groups.get(cat).push(s);
    }
    return [...groups.entries()]
      .map(([category, list]) => ({ category, sellers: list.slice(0, 3).map((s, i) => ({ rank: i + 1, ...s })) }))
      .map((g) => ({ ...g, leaderMetric: g.sellers[0] ? metricValue(g.sellers[0], by) : 0 }))
      .sort((a, b) => b.leaderMetric - a.leaderMetric);
  }, [rows, by]);

  const overallMax = sellers.reduce((m, s) => Math.max(m, metricValue(s, by)), 0) || 1;
  const hasData = view === "category" ? categories.length > 0 : sellers.length > 0;

  return (
    <article className="panel ts-panel" id="top-sellers">
      <div className="panel-head">
        <div>
          <h2>Top Sellers</h2>
          <div className="sub">Ranked by order volume · a bestseller running low is flagged to restock</div>
        </div>
        <div className="ts-controls">
          <div className="ts-seg" role="group" aria-label="View">
            {VIEWS.map((v) => (
              <button key={v.value} className={`fchip${view === v.value ? " on" : ""}`} aria-pressed={view === v.value} onClick={() => setView(v.value)}>
                {v.label}
              </button>
            ))}
          </div>
          <div className="ts-seg" role="group" aria-label="Time window">
            {WINDOWS.map((w) => (
              <button key={w.value} className={`fchip${windowDays === w.value ? " on" : ""}`} aria-pressed={windowDays === w.value} onClick={() => setWindowDays(w.value)}>
                {w.label}
              </button>
            ))}
          </div>
          <div className="ts-seg" role="group" aria-label="Rank by">
            {METRICS.map((m) => (
              <button key={m.value} className={`fchip${by === m.value ? " on" : ""}`} aria-pressed={by === m.value} onClick={() => setBy(m.value)}>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="ts-empty">No sales in this window yet. Top sellers appear here as orders come in.</div>
      ) : view === "category" ? (
        <div className="ts-cats">
          {categories.map((c) => {
            const catMax = c.sellers.reduce((m, s) => Math.max(m, metricValue(s, by)), 0) || 1;
            return (
              <div className="ts-cat-group" key={c.category}>
                <div className="ts-cat-head"><span>{catLabel(c.category)}</span></div>
                <div className="ts-board">
                  {c.sellers.map((s) => <SellerRow key={`${s.sku || s.name}-${s.rank}`} s={s} max={catMax} by={by} />)}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="ts-board">
          {sellers.map((s) => <SellerRow key={`${s.sku || s.name}-${s.rank}`} s={s} max={overallMax} by={by} />)}
        </div>
      )}
    </article>
  );
}
