import { ArrowRight } from "lucide-react";
import { SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";

const sgtDate = (d) => { try { return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }); } catch { return ""; } };
const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
const addDays = (yyyyMmDd, n) => sgtDate(new Date(`${yyyyMmDd}T00:00:00+08:00`).getTime() + n * 86400000);

const CHANNEL_NAME = { "own-site": "Own Website", lazada: "Lazada", shopee: "Shopee" };

function relTime(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.max(0, Math.round(diff / 60000));
  if (m < 1) return "just now";
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export default function TodayPage({ setTab }) {
  const { state } = useAppData();

  const ord = state.orders.items;
  const inv = state.inventory.items;
  const members = state.loyalty.members;
  const channels = state.marketplace.channels;

  const today   = todayStr();
  const yesterday = addDays(today, -1);
  const todays  = ord.filter((o) => sgtDate(o.placedAt) === today);
  const yest    = ord.filter((o) => sgtDate(o.placedAt) === yesterday);
  const pending = ord.filter((o) => o.status !== "delivered" && o.status !== "cancelled");

  const revenueToday = todays.reduce((s, o) => s + o.total, 0);
  const revenueYest  = yest.reduce((s, o) => s + o.total, 0);
  const revenueDelta = revenueYest > 0 ? Math.round(((revenueToday - revenueYest) / revenueYest) * 100) : null;

  const lowStock = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock * 2).length;
  const critical = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock).length;
  const criticalItems = inv.filter((p) => p.minStock > 0 && p.stock <= p.minStock);
  const lowItems      = inv.filter((p) => p.minStock > 0 && p.stock > p.minStock && p.stock <= p.minStock * 2);

  const totalPoints = members.reduce((s, m) => s + m.pointsBalance, 0);
  const liability = totalPoints * 0.01;
  const expiringMembers = members.filter((m) => m.coinsExpiringSoon);

  const attentionChannels = channels.filter((c) => c.status === "attention");

  // Order journey — today's orders by stage
  const received  = todays.filter((o) => o.status === "pending").length;
  const preparing = todays.filter((o) => o.status === "packed").length;
  const shipping  = todays.filter((o) => o.status === "out_for_delivery").length;
  const completed = todays.filter((o) => o.status === "delivered").length;
  const stages = [
    { key: "received",  label: "Received",  count: received,  tone: "wait"  },
    { key: "preparing", label: "Preparing", count: preparing, tone: "gold"  },
    { key: "shipping",  label: "Shipping",  count: shipping,  tone: "gold2" },
    { key: "completed", label: "Completed", count: completed, tone: "done"  },
  ];
  const journeyTotal = received + preparing + shipping + completed;

  // ── Business health ─────────────────────────────────────────────────────
  const healthy = attentionChannels.length === 0 && critical === 0;
  const healthNote = healthy
    ? "All channels synchronized"
    : attentionChannels.length > 0
      ? `${attentionChannels.length} channel${attentionChannels.length === 1 ? "" : "s"} need review`
      : `${critical} item${critical === 1 ? "" : "s"} below reorder level`;

  // ── Overview metrics ────────────────────────────────────────────────────
  const metrics = [
    { label: "Today's Revenue", value: SGD(revenueToday), accent: true,
      sub: revenueDelta != null ? `${revenueDelta >= 0 ? "Up" : "Down"} ${Math.abs(revenueDelta)} percent on yesterday` : "Across all channels" },
    { label: "Orders", value: todays.length,
      sub: `${completed} completed, ${received + preparing + shipping} in progress` },
    { label: "Inventory Health", value: lowStock,
      sub: lowStock === 0 ? "All SKUs above reorder" : `${critical} critical, ${Math.max(0, lowStock - critical)} low` },
    { label: "Reserve Membership", value: totalPoints.toLocaleString("en-SG"),
      sub: `${SGD(liability)} liability outstanding` },
  ];

  // ── Channel operations ──────────────────────────────────────────────────
  const channelCards = channels.map((c) => ({
    key: c.id,
    name: CHANNEL_NAME[c.id] || c.label,
    ok: c.status === "connected",
    statusLabel: c.status === "connected" ? "Operational" : "Delayed",
    primary: c.status === "connected" ? `${c.metrics.ordersToday} orders synchronized` : "Sync issue detected",
    secondary: `Last sync ${relTime(c.lastSyncAt)}`,
    tab: "Marketplace",
  }));
  channelCards.push({
    key: "ledger",
    name: "Inventory Ledger",
    ok: critical === 0,
    statusLabel: critical === 0 ? "Reconciled" : "Needs review",
    primary: `${inv.length.toLocaleString("en-SG")} SKUs tracked`,
    secondary: critical === 0 ? "One pool across all storefronts" : `${critical} below reorder level`,
    tab: "Inventory",
  });

  // ── Priority actions ────────────────────────────────────────────────────
  const actions = [];
  if (criticalItems.length > 0) {
    actions.push({ tier: "critical", label: "Critical",
      title: `${criticalItems.length} bottle${criticalItems.length === 1 ? "" : "s"} below reorder level`,
      why: "Restock before these labels sell out across every storefront.",
      cta: "View Inventory", tab: "Inventory" });
  }
  for (const c of attentionChannels) {
    actions.push({ tier: "attention", label: "Attention",
      title: `${CHANNEL_NAME[c.id] || c.label} synchronization delayed`,
      why: "Orders from this channel may not be importing in real time.",
      cta: "Review Marketplace", tab: "Marketplace" });
  }
  if (lowItems.length > 0) {
    actions.push({ tier: "attention", label: "Attention",
      title: `${lowItems.length} SKU${lowItems.length === 1 ? "" : "s"} approaching reorder point`,
      why: "Raise a supplier purchase order before they turn critical.",
      cta: "View Inventory", tab: "Inventory" });
  }
  if (expiringMembers.length > 0) {
    actions.push({ tier: "upcoming", label: "Upcoming",
      title: `${expiringMembers.length} loyalty member${expiringMembers.length === 1 ? "" : "s"} have expiring points`,
      why: "A gentle reminder keeps Reserve members engaged and returning.",
      cta: "Notify Members", tab: "Loyalty" });
  }

  return (
    <div className="cc">
      <header className="cc-hero">
        <div className="cc-hero-head">
          <div>
            <div className="cc-eyebrow">Maison Reserve</div>
            <h1 className="cc-title">Operations Overview</h1>
          </div>
          <div className={`cc-health${healthy ? "" : " warn"}`}>
            <span className="cc-health-dot" />
            <div>
              <div className="cc-health-status">{healthy ? "Healthy" : "Attention Required"}</div>
              <div className="cc-health-note">{healthNote}</div>
            </div>
          </div>
        </div>

        <div className="cc-metrics">
          {metrics.map((m) => (
            <div className="cc-metric" key={m.label}>
              <div className="cc-metric-label">{m.label}</div>
              <div className={`cc-metric-value${m.accent ? " accent" : ""}`}>{m.value}</div>
              <div className="cc-metric-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      </header>

      <div className="cc-grid">
        <div className="cc-col-main">
          <section className="cc-section">
            <div className="cc-section-head">
              <h2 className="cc-section-title">Channel Operations</h2>
              <span className="cc-section-note">One stock pool, every storefront</span>
            </div>
            <div className="cc-channels">
              {channelCards.map((c) => (
                <button type="button" className="cc-channel" key={c.key} onClick={() => setTab(c.tab)}>
                  <div className="cc-channel-top">
                    <span className="cc-channel-name">{c.name}</span>
                    <span className={`cc-status ${c.ok ? "ok" : "warn"}`}>
                      <span className="cc-status-dot" />{c.statusLabel}
                    </span>
                  </div>
                  <div className="cc-channel-primary">{c.primary}</div>
                  <div className="cc-channel-secondary">{c.secondary}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="cc-section">
            <div className="cc-section-head">
              <h2 className="cc-section-title">Business Pulse</h2>
              <span className="cc-section-note">Today's order journey</span>
            </div>
            <div className="cc-pulse">
              <div className="cc-pulse-total">
                <span className="cc-pulse-total-val">{todays.length}</span>
                <span className="cc-pulse-total-label">Orders today</span>
              </div>
              {journeyTotal > 0 && (
                <div className="cc-pulse-bar" aria-hidden="true">
                  {stages.filter((s) => s.count > 0).map((s) => (
                    <i key={s.key} data-tone={s.tone} style={{ width: `${(s.count / journeyTotal) * 100}%` }} />
                  ))}
                </div>
              )}
              <ol className="cc-journey">
                {stages.map((s) => (
                  <li className="cc-stage" key={s.key} data-tone={s.tone}>
                    <div className="cc-stage-count">{s.count}</div>
                    <div className="cc-stage-label">{s.label}</div>
                  </li>
                ))}
              </ol>
            </div>
          </section>
        </div>

        <aside className="cc-col-side">
          <section className="cc-section">
            <div className="cc-section-head">
              <h2 className="cc-section-title">Priority Actions</h2>
              <span className="cc-section-note">{actions.length} open</span>
            </div>
            {actions.length === 0 && (
              <div className="cc-actions-empty">All clear. No priority actions require your attention right now.</div>
            )}
            <div className="cc-actions">
              {actions.map((a, i) => (
                <button type="button" className={`cc-action ${a.tier}`} key={i} onClick={() => setTab(a.tab)}>
                  <div className="cc-action-tier">{a.label}</div>
                  <div className="cc-action-title">{a.title}</div>
                  <div className="cc-action-why">{a.why}</div>
                  <span className="cc-action-cta">{a.cta} <ArrowRight className="cc-arrow" size={14} /></span>
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
