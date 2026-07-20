import { useState } from "react";
import { SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";

const sgtDate = (d) => { try { return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }); } catch { return ""; } };
const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
const addDays = (yyyyMmDd, n) => sgtDate(new Date(`${yyyyMmDd}T00:00:00+08:00`).getTime() + n * 86400000);

const CHANNEL_LABEL = { "own-site": "Web", lazada: "Lazada", shopee: "Shopee" };

const chanCount = (list) => list.reduce((m, o) => { const k = CHANNEL_LABEL[o.channel] || "Other"; m[k] = (m[k] || 0) + 1; return m; }, {});

const pad2 = (n) => String(n).padStart(2, "0");

const RANGE_TABS = [
  { key: "today",    label: "Today"   },
  { key: "tomorrow", label: "Pending" },
  { key: "7d",       label: "7D"      },
  { key: "30d",      label: "30D"     },
  { key: "all",      label: "All"     },
];

export default function TodayPage({ setTab }) {
  const { state } = useAppData();
  const [range, setRange] = useState("today");

  const ord = state.orders.items;
  const inv = state.inventory.items;
  const members = state.loyalty.members;
  const channels = state.marketplace.channels;

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

  const revenueDelta = revenueYest > 0 ? Math.round(((revenueToday - revenueYest) / revenueYest) * 100) : null;

  const truck1 = pending.filter((o) => o.truckId === "truck_1").length;
  const truck2 = pending.filter((o) => o.truckId === "truck_2").length;

  const lowStock = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock * 2).length;
  const critical = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock).length;

  const totalPoints = members.reduce((s, m) => s + m.pointsBalance, 0);
  const liability = totalPoints * 0.01;
  const expiringMembers = members.filter((m) => m.coinsExpiringSoon);

  // Order-state telemetry — one live count per pipeline stage
  const cap = ord.filter((o) => o.status === "pending").length;
  const pck = ord.filter((o) => o.status === "packed").length;
  const del = ord.filter((o) => o.status === "out_for_delivery").length;
  const fin = ord.filter((o) => o.status === "delivered").length;

  const RANGES = {
    today:    { count: todays.length,    revenue: revenueToday,   noun: "TODAY"          },
    tomorrow: { count: pending.length,   revenue: pendingRevenue, noun: "IN PIPELINE"    },
    "7d":     { count: orders7.length,   revenue: revenue7,       noun: "LAST 7 DAYS"    },
    "30d":    { count: orders30.length,  revenue: revenue30,      noun: "LAST 30 DAYS"   },
    all:      { count: ordersAll.length, revenue: revenueAll,     noun: "ALL TIME"       },
  };
  const rd = RANGES[range];

  const timeLabel = new Date().toLocaleString("en-GB", { timeZone: "Asia/Singapore", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).toUpperCase();

  // ── Action ledger rows ──────────────────────────────────────────────────
  const attn = [];
  const criticalItems = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock);
  const lowItems      = inv.filter((p) => p.minStock > 0 && p.stock > p.minStock && p.stock <= p.minStock * 2);
  for (const p of criticalItems.slice(0, 2)) {
    attn.push({ bar: "crit", tag: "CRIT", tab: "Inventory", t: <><b>{p.sku}</b> {p.name} below reorder point</>, x: `On hand ${p.stock} · reorder at ${p.minStock}` });
  }
  if (lowItems.length > 0) {
    attn.push({ bar: "warn", tag: "LOW", tab: "Inventory",
      t: <>{lowItems.slice(0, 2).map((p) => <span key={p.sku}><b>{p.sku}</b> {p.name}{" "}</span>)}{lowItems.length > 2 ? `+${lowItems.length - 2} more` : ""}</>,
      x: `${lowItems.length} SKU${lowItems.length === 1 ? "" : "s"} under reorder point · supplier PO suggested` });
  }
  if (expiringMembers.length > 0) {
    attn.push({ bar: "info", tag: "LOYAL", tab: "Loyalty",
      t: <>{expiringMembers.length} member{expiringMembers.length === 1 ? "" : "s"} have <b>Reserve Points</b> expiring within 45 days</>,
      x: "Queue an expiry-warning broadcast from the Loyalty page" });
  }
  const attentionChannels = channels.filter((c) => c.status === "attention");
  const attnLabels = new Set(attentionChannels.map((c) => c.label));
  for (const c of attentionChannels) {
    attn.push({ bar: "warn", tag: "SYNC", tab: "Marketplace", t: <><b>{c.label}</b> sync is running behind</>, x: "Check the Marketplace page for channel health" });
  }

  // ── Live ticker feed rows ───────────────────────────────────────────────
  const todaysByChan = chanCount(todays);
  const feeds = [
    { id: "own-site", name: "OWN_SITE", warn: false, meta: <>Live checkout feed &middot; <b>{todaysByChan.Web || 0}</b> ingested today</>, state: `${todaysByChan.Web || 0} today`, tab: "Marketplace" },
    { id: "lazada",   name: "LAZADA",   warn: attnLabels.has("Lazada"), meta: <><b>{todaysByChan.Lazada || 0}</b> pulled via marketplace sync today</>, state: `${todaysByChan.Lazada || 0} today`, tab: "Marketplace" },
    { id: "shopee",   name: "SHOPEE",   warn: attnLabels.has("Shopee"), meta: <><b>{todaysByChan.Shopee || 0}</b> pulled via sync &middot; one stock pool</>, state: `${todaysByChan.Shopee || 0} today`, tab: "Marketplace" },
    { id: "ledger",   name: "INV_LEDGER", warn: (criticalItems.length + lowItems.length) > 0, meta: <><b>{criticalItems.length + lowItems.length}</b> SKUs flagged &middot; one pool stays accurate</>, state: (criticalItems.length + lowItems.length) > 0 ? "flagged" : "reconciled", tab: "Inventory" },
    { id: "loyalty",  name: "QR_FUNNEL", warn: expiringMembers.length > 0, meta: <><b>{members.length.toLocaleString("en-SG")}</b> members in Reserve programme</>, state: expiringMembers.length > 0 ? "expiring" : "active", tab: "Loyalty" },
  ];

  const TEL = [
    { code: "[CAP]", val: cap, sub: "Captured" },
    { code: "[PCK]", val: pck, sub: "Packed" },
    { code: "[DEL]", val: del, sub: "Out for delivery" },
    { code: "[FIN]", val: fin, sub: "Delivered" },
  ];

  return (
    <div className="console">
      {/* PANE 1 — Unified Live Ticker Feed */}
      <section className="console-pane">
        <div className="console-head">
          <span className="console-head-title">Live Feed</span>
          <span className="console-head-note">All channels reconciled</span>
        </div>
        <div className="console-body">
          {feeds.map((f) => (
            <button type="button" key={f.id} className="tick-row" onClick={() => setTab(f.tab)}>
              <span className={`tick-badge ${f.warn ? "warn" : "ok"}`}>{f.warn ? "[WARN]" : "[OK]"}</span>
              <span className="tick-name">{f.name}</span>
              <span className="tick-meta">{f.meta}</span>
              <span className="tick-state">{f.state}</span>
            </button>
          ))}
        </div>
      </section>

      {/* PANE 2 — Inventory & Telemetry Core */}
      <section className="console-pane">
        <div className="console-head">
          <span className="console-head-title">Telemetry Core</span>
          <span className="console-head-note">{timeLabel} SGT</span>
        </div>
        <div className="console-body">
          <div className="tel-readout">
            <div className="tel-readout-val">{SGD(rd.revenue)}</div>
            <div className="tel-readout-sub">
              {rd.count} ORDER{rd.count === 1 ? "" : "S"} &middot; {rd.noun}
              {range === "today" && revenueDelta != null && (
                <> &middot; <span className={`tel-delta ${revenueDelta >= 0 ? "up" : "down"}`}>{revenueDelta >= 0 ? "+" : "-"}{Math.abs(revenueDelta)}% VS YDA</span></>
              )}
            </div>
          </div>

          <div className="tel-tabs" role="tablist" aria-label="Time range">
            {RANGE_TABS.map(({ key, label }) => {
              const active = range === key;
              return (
                <button key={key} type="button" role="tab" aria-selected={active} className={`tel-tab${active ? " on" : ""}`} onClick={() => setRange(key)}>
                  {label}
                </button>
              );
            })}
          </div>

          <div className="tel-grid">
            {TEL.map((t) => (
              <div className="tel-block" key={t.code}>
                <div className="tel-block-code">{t.code}</div>
                <div className="tel-block-val">{pad2(t.val)}</div>
                <div className="tel-block-sub">{t.sub}</div>
              </div>
            ))}
          </div>

          <div className="tel-foot">
            <div className="tel-stat">
              <span className="tel-stat-label">Pending Deliveries</span>
              <span className="tel-stat-val">{pending.length}<span className="tel-stat-sub"> &middot; T1 {truck1} / T2 {truck2}</span></span>
            </div>
            <div className="tel-stat">
              <span className="tel-stat-label">Low-Stock Alerts</span>
              <span className="tel-stat-val" style={{ color: critical > 0 ? "var(--red)" : "var(--cream)" }}>{lowStock}<span className="tel-stat-sub"> &middot; {critical} crit</span></span>
            </div>
            <div className="tel-stat">
              <span className="tel-stat-label">Reserve Points</span>
              <span className="tel-stat-val">{totalPoints.toLocaleString("en-SG")}<span className="tel-stat-sub"> &middot; {SGD(liability)} liab</span></span>
            </div>
          </div>
        </div>
      </section>

      {/* PANE 3 — Action Ledger Matrix */}
      <section className="console-pane">
        <div className="console-head">
          <span className="console-head-title">Action Ledger</span>
          <span className="console-head-note">{attn.length} open</span>
        </div>
        <div className="console-body">
          {attn.length === 0 && (
            <div className="ledger-empty">[OK] No stock, delivery, or loyalty alerts right now.</div>
          )}
          {attn.map((a, i) => (
            <button type="button" className="ledger-row" key={i} onClick={() => setTab(a.tab)}>
              <span className={`ledger-tag ${a.bar}`}>{a.tag}</span>
              <span>
                <span className="ledger-msg">{a.t}</span>
                <span className="ledger-sub">{a.x}</span>
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
