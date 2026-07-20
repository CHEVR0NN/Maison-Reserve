import { useMemo, useState } from "react";
import { SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";
import TodayCharts from "../charts/TodayCharts.jsx";

const sgtDate = (d) => { try { return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }); } catch { return ""; } };
const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
const addDays = (yyyyMmDd, n) => sgtDate(new Date(`${yyyyMmDd}T00:00:00+08:00`).getTime() + n * 86400000);

const CHANNEL_LABEL = { "own-site": "Web", lazada: "Lazada", shopee: "Shopee" };
const STATUS_TO_STAGE = { pending: 0, packed: 1, out_for_delivery: 2, delivered: 3, cancelled: 3 };

const chanCount = (list) => list.reduce((m, o) => { const k = CHANNEL_LABEL[o.channel] || "Other"; m[k] = (m[k] || 0) + 1; return m; }, {});
const chanRevenue = (list) => list.reduce((m, o) => { const k = CHANNEL_LABEL[o.channel] || "Other"; m[k] = (m[k] || 0) + o.total; return m; }, {});

const RANGE_TABS = [
  { key: "today",    label: "Today"    },
  { key: "tomorrow", label: "Pending"  },
  { key: "7d",       label: "7 Days"   },
  { key: "30d",      label: "30 Days"  },
  { key: "all",      label: "All Time" },
];

function sgGreeting() {
  const h = parseInt(new Date().toLocaleString("en-SG", { hour: "numeric", hour12: false, timeZone: "Asia/Singapore" }), 10);
  if (h >= 5  && h < 12) return "Good morning";
  if (h >= 12 && h < 14) return "Good noon";
  if (h >= 14 && h < 18) return "Good afternoon";
  if (h >= 18 && h < 22) return "Good evening";
  return "Good night";
}

export default function TodayPage({ setTab }) {
  const { state } = useAppData();
  const [range, setRange] = useState("today");

  const ord = state.orders.items;
  const inv = state.inventory.items;
  const trucks = state.delivery.trucks;
  const members = state.loyalty.members;
  const channels = state.marketplace.channels;

  const chartOrders = useMemo(() => ord.map((o) => ({
    updatedAt: o.status === "delivered" ? o.deliveredAt : o.placedAt,
    totalValue: o.total,
    stage: STATUS_TO_STAGE[o.status],
    source: CHANNEL_LABEL[o.channel] || "Other",
  })), [ord]);

  const today     = todayStr();
  const yesterday = addDays(today, -1);
  const last7     = Array.from({ length: 7 },  (_, i) => addDays(today, -(6 - i)));
  const last30    = Array.from({ length: 30 }, (_, i) => addDays(today, -(29 - i)));

  const todays    = ord.filter((o) => sgtDate(o.placedAt) === today);
  const yest      = ord.filter((o) => sgtDate(o.placedAt) === yesterday);
  const orders7   = ord.filter((o) => last7.includes(sgtDate(o.placedAt)));
  const orders30  = ord.filter((o) => last30.includes(sgtDate(o.placedAt)));
  const ordersAll = ord;
  const pending   = ord.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  const revenueToday   = todays.reduce((s, o) => s + o.total, 0);
  const revenueYest    = yest.reduce((s, o) => s + o.total, 0);
  const revenue7       = orders7.reduce((s, o) => s + o.total, 0);
  const revenue30      = orders30.reduce((s, o) => s + o.total, 0);
  const revenueAll     = ordersAll.reduce((s, o) => s + o.total, 0);
  const pendingRevenue = pending.reduce((s, o) => s + o.total, 0);

  const ordersDelta  = todays.length - yest.length;
  const revenueDelta = revenueYest > 0 ? Math.round(((revenueToday - revenueYest) / revenueYest) * 100) : null;

  const truck1 = pending.filter((o) => o.truckId === "truck_1").length;
  const truck2 = pending.filter((o) => o.truckId === "truck_2").length;

  const lowStock = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock * 2).length;
  const critical = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock).length;

  const totalPoints = members.reduce((s, m) => s + m.pointsBalance, 0);
  const liability = totalPoints * 0.01;
  const expiringMembers = members.filter((m) => m.coinsExpiringSoon);

  const RANGES = {
    today:    { ordLabel: "Orders Today",     revLabel: "Revenue Captured", count: todays.length,    revenue: revenueToday,   avgOrd: todays.length ? revenueToday / todays.length : 0,    byChan: chanCount(todays),    ordersDelta, revenueDelta, note: null },
    tomorrow: { ordLabel: "Pending Orders",    revLabel: "Pending Value",    count: pending.length,   revenue: pendingRevenue, avgOrd: pending.length ? pendingRevenue / pending.length : 0, byChan: chanCount(pending),   ordersDelta: null, revenueDelta: null, note: "Orders still moving through the pipeline" },
    "7d":     { ordLabel: "Orders (7 Days)",  revLabel: "Revenue (7 Days)", count: orders7.length,   revenue: revenue7,       avgOrd: orders7.length ? revenue7 / orders7.length : 0,       byChan: chanCount(orders7),   ordersDelta: null, revenueDelta: null, note: `Avg ${orders7.length ? Math.round(orders7.length / 7) : 0} orders/day` },
    "30d":    { ordLabel: "Orders (30 Days)", revLabel: "Revenue (30 Days)", count: orders30.length, revenue: revenue30,      avgOrd: orders30.length ? revenue30 / orders30.length : 0,     byChan: chanCount(orders30),  ordersDelta: null, revenueDelta: null, note: `Avg ${orders30.length ? Math.round(orders30.length / 30) : 0} orders/day` },
    all:      { ordLabel: "Total Orders",     revLabel: "Total Revenue",   count: ordersAll.length, revenue: revenueAll,     avgOrd: ordersAll.length ? revenueAll / ordersAll.length : 0,  byChan: chanCount(ordersAll), ordersDelta: null, revenueDelta: null, note: "Across all channels · all time" },
  };
  const rd = RANGES[range];

  const rev7pts  = last7.map((day) => ord.filter((o) => sgtDate(o.placedAt) === day).reduce((s, o) => s + o.total, 0));
  const rev30pts = last30.map((day) => ord.filter((o) => sgtDate(o.placedAt) === day).reduce((s, o) => s + o.total, 0));
  const sparkSeries = (range === "30d" || range === "all") ? rev30pts : rev7pts;
  const sparkMax  = Math.max(1, ...sparkSeries);
  const sparkN    = sparkSeries.length;
  const sparkPts  = sparkSeries.map((v, i) => ({ x: (i / Math.max(1, sparkN - 1)) * 600, y: 58 - (v / sparkMax) * 44 }));
  const sparkLine = sparkPts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(0)},${p.y.toFixed(0)}`).join(" ");
  const sparkArea = `${sparkLine} L600,64 L0,64 Z`;
  const sparkLast = sparkPts[sparkPts.length - 1];

  const dateLabel = new Date().toLocaleDateString("en-US", { timeZone: "Asia/Singapore", weekday: "long", day: "numeric", month: "long", year: "numeric" });

  const attn = [];
  const criticalItems = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock);
  const lowItems      = inv.filter((p) => p.minStock > 0 && p.stock > p.minStock && p.stock <= p.minStock * 2);
  for (const p of criticalItems.slice(0, 2)) {
    attn.push({ bar: "crit", tag: "CRITICAL", tagClass: "crit", tab: "Inventory", t: <><b>{p.sku}</b> {p.name} below reorder point</>, x: `On hand ${p.stock} · reorder at ${p.minStock}` });
  }
  if (lowItems.length > 0) {
    attn.push({ bar: "warn", tag: "LOW STOCK", tagClass: "warn", tab: "Inventory",
      t: <>{lowItems.slice(0, 2).map((p) => <span key={p.sku}><b>{p.sku}</b> {p.name}{" "}</span>)}{lowItems.length > 2 ? `+${lowItems.length - 2} more` : ""}</>,
      x: `${lowItems.length} SKU${lowItems.length === 1 ? "" : "s"} under reorder point · supplier PO suggested` });
  }
  if (expiringMembers.length > 0) {
    attn.push({ bar: "info", tag: "LOYALTY", tagClass: "info", tab: "Loyalty",
      t: <>{expiringMembers.length} member{expiringMembers.length === 1 ? "" : "s"} have <b>Reserve Points</b> expiring within 45 days</>,
      x: "Queue an expiry-warning broadcast from the Loyalty page" });
  }
  const attentionChannels = channels.filter((c) => c.status === "attention");
  for (const c of attentionChannels) {
    attn.push({ bar: "warn", tag: "SYNC", tagClass: "warn", tab: "Marketplace", t: <><b>{c.label}</b> sync is running behind</>, x: "Check the Marketplace page for channel health" });
  }

  return (
    <section className="panel active" id="today">
      <div className="panel-head">
        <div>
          <h2>{sgGreeting()}</h2>
          <div className="sub">{dateLabel} &middot; one stock pool, three storefronts</div>
        </div>
        <div className="seg-tabs" role="tablist" aria-label="Time range">
          {RANGE_TABS.map(({ key, label }) => {
            const active = range === key;
            return (
              <button key={key} type="button" role="tab" aria-selected={active} className={`seg-tab${active ? " active" : ""}`} onClick={() => setRange(key)}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="kpi-strip">
        <div className="kpi kpi-hero">
          <div className="lbl">{rd.revLabel}</div>
          <div className="val honey">{SGD(rd.revenue)}</div>
          {rd.revenueDelta != null && (
            <div className={`delta ${rd.revenueDelta >= 0 ? "up" : "down"}`}>{rd.revenueDelta >= 0 ? "▲" : "▼"} {Math.abs(rd.revenueDelta)}% vs yesterday</div>
          )}
          <div className="breakdown"><span><i>Avg order</i> {SGD(rd.avgOrd)}</span></div>
        </div>
        <div className="kpi">
          <div className="lbl">{rd.ordLabel}</div>
          <div className="val">{rd.count}</div>
          {rd.ordersDelta != null && (
            <div className={`delta ${rd.ordersDelta > 0 ? "up" : rd.ordersDelta < 0 ? "down" : "flat"}`}>
              {rd.ordersDelta > 0 ? "▲" : rd.ordersDelta < 0 ? "▼" : ""} {rd.ordersDelta === 0 ? "same as" : `${Math.abs(rd.ordersDelta)} vs`} yesterday
            </div>
          )}
          {rd.note && <div className="delta flat">{rd.note}</div>}
          <div className="breakdown">
            <span><i>Web</i> {rd.byChan.Web || 0}</span>
            <span><i>Lazada</i> {rd.byChan.Lazada || 0}</span>
            <span><i>Shopee</i> {rd.byChan.Shopee || 0}</span>
          </div>
        </div>
        <div className="kpi">
          <div className="lbl">Pending Deliveries</div>
          <div className="val">{pending.length}</div>
          <div className="delta flat">2 trucks &middot; not yet delivered</div>
          <div className="breakdown"><span><i>Truck 1</i> {truck1}</span><span><i>Truck 2</i> {truck2}</span></div>
        </div>
        <div className="kpi">
          <div className="lbl">Low-Stock Alerts</div>
          <div className="val" style={{ color: "var(--orange)" }}>{lowStock}</div>
          <div className="delta down">{critical} critical &middot; {Math.max(0, lowStock - critical)} low</div>
          <div className="breakdown"><span><i>Below reorder</i> {lowStock} SKUs</span></div>
        </div>
        <div className="kpi">
          <div className="lbl">Reserve Points Issued</div>
          <div className="val">{totalPoints.toLocaleString("en-SG")}</div>
          <div className="delta flat">outstanding balance</div>
          <div className="breakdown"><span><i>=</i> {SGD(liability)} liability</span></div>
        </div>
      </div>

      <TodayCharts ord={chartOrders} range={range} ordReady theme={state.session.theme} />

      <div className="today-grid">
        <div>
          <div className="card feeds-card">
            <div className="feeds-head">
              <div className="hl">Data Feeds</div>
              <div className="auto"><span className="dot g"></span>All channels reconciled automatically</div>
            </div>

            {(() => {
              const chanState = (n) => n > 0
                ? <span className="statepill live"><span className="dot g"></span>{n} TODAY</span>
                : <span className="statepill synced"><span className="dot a"></span>NO ORDERS YET</span>;
              const todaysByChan = chanCount(todays);
              const feeds = [
                { id: "own-site", name: "Own Site", meta: <>Live checkout feed &middot; <b>{todaysByChan.Web || 0} orders</b> ingested today</>, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="var(--honey)" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" /></svg>), state: chanState(todaysByChan.Web || 0), sub: "Streaming", tab: "Marketplace" },
                { id: "lazada",   name: "Lazada",   meta: <><b>{todaysByChan.Lazada || 0} orders</b> pulled via marketplace sync today</>, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></svg>), state: chanState(todaysByChan.Lazada || 0), sub: "Channel sync", tab: "Marketplace" },
                { id: "shopee",   name: "Shopee",   meta: <><b>{todaysByChan.Shopee || 0} orders</b> pulled via marketplace sync &middot; one stock pool</>, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="var(--honey)" strokeWidth="2"><path d="M4 8h16l-1.5 11a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8z" /><path d="M9 8a3 3 0 016 0" /></svg>), state: chanState(todaysByChan.Shopee || 0), sub: "Channel sync", tab: "Marketplace" },
                { id: "ledger",   name: "Inventory Ledger", meta: <><b>{criticalItems.length + lowItems.length} SKUs</b> flagged across all storefronts &middot; one pool stays accurate</>, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2"><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4" /></svg>), state: <span className="statepill live"><span className="dot g"></span>RECONCILED</span>, sub: "Auto-deducted", tab: "Inventory" },
                { id: "loyalty",  name: "Loyalty / QR Funnel", meta: <><b>{members.length.toLocaleString("en-SG")} members</b> in the Reserve loyalty programme</>, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="var(--honey)" strokeWidth="2"><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><path d="M13 13h3v3h-3zM17 17h3v3h-3z" /></svg>), state: <span className="statepill live"><span className="dot g"></span>ACTIVE</span>, sub: `${members.length} members`, tab: "Loyalty" },
              ];
              return feeds.map((f) => (
                <button type="button" key={f.id} className="feed-row" onClick={() => setTab(f.tab)}>
                  <div className="feed-ico">{f.icon}</div>
                  <div className="feed-main"><div className="nm">{f.name}</div><div className="meta">{f.meta}</div></div>
                  <div className="feed-state">
                    {f.state}
                    <div className="sub" style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}><span>{f.sub}</span></div>
                  </div>
                </button>
              ));
            })()}
          </div>

          {range === "today" && (() => {
            const CHANS = [
              { key: "Web",    color: "var(--honey)", label: "Web / Own Site" },
              { key: "Lazada", color: "var(--orange)", label: "Lazada" },
              { key: "Shopee", color: "var(--blue)",   label: "Shopee" },
            ];
            const chanRev = chanRevenue(todays);
            const totalRev = revenueToday || 1;
            return (
              <div className="card sales-card">
                <div className="row">
                  <div><div className="card-title">Today's Revenue by Channel</div><div className="big" style={{ marginTop: 8 }}>{SGD(revenueToday)}</div></div>
                  <div className="side"><div className="card-title muted">Orders today</div><div className="stat-value">{todays.length}</div></div>
                </div>
                {revenueToday > 0 && (
                  <div className="chan-split-bar">
                    {CHANS.map((c) => { const pct = ((chanRev[c.key] || 0) / revenueToday) * 100; return pct > 0 ? <div key={c.key} style={{ width: `${pct}%`, background: c.color }} title={`${c.label}: ${Math.round(pct)}%`} /> : null; })}
                  </div>
                )}
                <div className="chan-split-list">
                  {CHANS.map((c) => {
                    const rev = chanRev[c.key] || 0;
                    const cnt = chanCount(todays)[c.key] || 0;
                    const pct = Math.round((rev / totalRev) * 100);
                    const isEmpty = rev === 0 && cnt === 0;
                    return (
                      <div key={c.key} className={`chan-split-row${isEmpty ? " empty" : ""}`}>
                        <div className="chan-split-row-head">
                          <span className="chan-split-row-name" style={{ color: c.color }}>{c.label}</span>
                          <span className="chan-split-row-val">{isEmpty ? "—" : <>{SGD(rev)} &middot; {cnt} order{cnt !== 1 ? "s" : ""}</>}</span>
                        </div>
                        <div className="chan-split-track"><div className="chan-split-fill" style={{ width: `${pct}%`, background: c.color }} /></div>
                      </div>
                    );
                  })}
                  {todays.length === 0 && <div className="chan-split-empty-note">No orders yet today</div>}
                </div>
              </div>
            );
          })()}

          {range === "tomorrow" && (() => {
            const t1 = pending.filter((o) => o.truckId === "truck_1");
            const t2 = pending.filter((o) => o.truckId === "truck_2");
            const unassigned = pending.filter((o) => !o.truckId);
            const truckRev = (list) => list.reduce((s, o) => s + o.total, 0);
            const rows = [
              { label: `Truck 1${trucks.truck_1 ? ` · ${trucks.truck_1.driverName}` : ""}`, list: t1, cls: "truck1" },
              { label: `Truck 2${trucks.truck_2 ? ` · ${trucks.truck_2.driverName}` : ""}`, list: t2, cls: "truck2" },
              ...(unassigned.length ? [{ label: "Unassigned", list: unassigned, cls: "unassigned" }] : []),
            ];
            return (
              <div className="card sales-card">
                <div className="row">
                  <div><div className="card-title">Pending Delivery Queue</div><div className="big" style={{ marginTop: 8 }}>{pending.length} orders</div></div>
                  <div className="side"><div className="card-title muted">Queue value</div><div className="stat-value">{SGD(pendingRevenue)}</div></div>
                </div>
                <div className="queue-rows">
                  {rows.map((r) => (
                    <div key={r.label} className="queue-row">
                      <div><div className={`queue-row-label ${r.cls}`}>{r.label}</div><div className="queue-row-sub">{r.list.length} stop{r.list.length !== 1 ? "s" : ""}</div></div>
                      <div className="queue-row-value">{SGD(truckRev(r.list))}</div>
                    </div>
                  ))}
                  {pending.length === 0 && <div className="queue-empty-note">Queue is clear — all orders delivered</div>}
                </div>
              </div>
            );
          })()}

          {(range === "7d" || range === "30d" || range === "all") && (
            <div className="card sales-card">
              <div className="row">
                <div>
                  <div className="card-title">{range === "all" ? "All-Time Revenue" : range === "30d" ? "30-Day Revenue" : "7-Day Revenue"}</div>
                  <div className="big" style={{ marginTop: 8 }}>{SGD(range === "all" ? revenueAll : range === "30d" ? revenue30 : revenue7)}</div>
                </div>
                <div className="side">
                  <div className="card-title muted">Orders / {range === "all" ? "all time" : range === "30d" ? "month" : "week"}</div>
                  <div className="stat-value">{range === "all" ? ordersAll.length : range === "30d" ? orders30.length : orders7.length}</div>
                </div>
              </div>
              <svg className="spark" viewBox="0 0 600 64" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#CC9A3E" stopOpacity="0.5" />
                    <stop offset="1" stopColor="#CC9A3E" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={sparkArea} fill="url(#sg)" />
                <path d={sparkLine} fill="none" stroke="#E8B85A" strokeWidth="2.5" />
                {sparkLast && <circle cx={sparkLast.x.toFixed(0)} cy={sparkLast.y.toFixed(0)} r="4" fill="#E8B85A" />}
              </svg>
            </div>
          )}
        </div>

        <div className="card attn-card">
          <div className="attn-head">
            <div className="hl">Needs Attention</div>
            <div className="ct">{attn.length} item{attn.length === 1 ? "" : "s"}</div>
          </div>
          {attn.length === 0 && (
            <div className="attn-item static">
              <div className="attn-bar info"></div>
              <div className="attn-body"><div className="t">All clear</div><div className="x">No stock, delivery, or loyalty alerts right now</div></div>
            </div>
          )}
          {attn.map((a, i) => (
            <button type="button" className="attn-item" key={i} onClick={() => setTab(a.tab)}>
              <div className={`attn-bar ${a.bar}`}></div>
              <div className="attn-body"><div className="t">{a.t}</div><div className="x">{a.x}</div></div>
              <span className={`attn-tag ${a.tagClass}`}>{a.tag}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
