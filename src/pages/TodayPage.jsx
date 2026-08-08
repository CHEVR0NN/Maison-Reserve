import { ArrowRight } from "lucide-react";
import { SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";
import KpiBar from "../components/ui/KpiBar.jsx";
import AuxPanel from "../components/ui/AuxPanel.jsx";
import TrendChart from "../components/ui/TrendChart.jsx";
import StatusBadge from "../components/ui/StatusBadge.jsx";

const sgtDate = (d) => { try { return new Date(d).toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" }); } catch { return ""; } };
const todayStr = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Singapore" });
const addDays = (yyyyMmDd, n) => sgtDate(new Date(`${yyyyMmDd}T00:00:00+08:00`).getTime() + n * 86400000);
const sgtMidnightMs = (yyyyMmDd) => new Date(`${yyyyMmDd}T00:00:00+08:00`).getTime();

const CHANNEL_NAME = { "own-site": "Own Website", lazada: "Lazada", shopee: "Shopee" };

// Returns the bare elapsed figure ("6m", "3h") so callers can set it in mono
// while the surrounding words stay in the body face.
function elapsed(iso) {
  const m = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (m < 60) return `${Math.max(1, m)}m`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h}h` : `${Math.round(h / 24)}d`;
}

const signed = (n) => `${n >= 0 ? "+" : "−"}${Math.abs(n).toFixed(1)}%`;

// ── Presentational primitives ───────────────────────────────────────────────

function SectionHeading({ children }) {
  return (
    <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
      {children}
    </h2>
  );
}

function SecondaryLink({ children }) {
  return (
    <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-zinc-500 transition-colors group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:text-slate-50">
      {children} <ArrowRight size={12} />
    </span>
  );
}

function ChannelRow({ channel, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex w-full items-center gap-3 bg-white px-4 py-2.5 text-left transition-colors hover:bg-zinc-50 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500 dark:bg-zinc-900 dark:hover:bg-zinc-800/60 dark:focus-visible:outline-emerald-400"
    >
      <span className="w-36 shrink-0 truncate text-sm font-medium text-zinc-900 dark:text-slate-50">{channel.name}</span>
      <StatusBadge tone={channel.ok ? "emerald" : "amber"}>{channel.statusLabel}</StatusBadge>
      <span className="min-w-0 flex-1 truncate text-sm text-zinc-600 dark:text-zinc-300">
        <span className="font-mono tabular-nums">{channel.count}</span> {channel.unit}
      </span>
      {/* Secondary metadata yields first: below xl the row has no width to
          spare and the order count matters more than the sync age. */}
      <span className="hidden shrink-0 text-xs text-zinc-500 xl:inline dark:text-zinc-400">
        {channel.metaValue && <span className="font-mono tabular-nums">{channel.metaValue} </span>}
        {channel.metaLabel}
      </span>
    </button>
  );
}

const ACTION_TONE = { critical: "red", attention: "amber", upcoming: "neutral" };

function PriorityAction({ action, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="group w-full rounded-md bg-zinc-100 p-3 text-left transition-colors hover:bg-zinc-200/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-zinc-800/50 dark:hover:bg-zinc-800 dark:focus-visible:outline-emerald-400"
    >
      <StatusBadge tone={ACTION_TONE[action.tier]}>{action.label}</StatusBadge>
      <div className="mt-1.5 text-sm font-medium text-zinc-900 dark:text-slate-50">{action.title}</div>
      <div className="mt-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="font-mono tabular-nums">{action.metric}</span> {action.note}
      </div>
      <SecondaryLink>{action.cta}</SecondaryLink>
    </button>
  );
}

function StageStrip({ stages }) {
  return (
    <ol className="grid grid-cols-4 divide-x divide-zinc-200 border-t border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {stages.map((s) => (
        <li key={s.key} className="px-4 py-3">
          <div className="font-mono text-lg font-semibold tabular-nums text-zinc-900 dark:text-slate-50">{s.count}</div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">{s.label}</div>
        </li>
      ))}
    </ol>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────

export default function TodayPage({ setTab }) {
  const { state } = useAppData();

  const ord = state.orders.items;
  const inv = state.inventory.items;
  const members = state.loyalty.members;
  const channels = state.marketplace.channels;

  const today = todayStr();
  const yesterday = addDays(today, -1);
  const todays = ord.filter((o) => sgtDate(o.placedAt) === today);
  const yest = ord.filter((o) => sgtDate(o.placedAt) === yesterday);

  const revenueToday = todays.reduce((s, o) => s + o.total, 0);

  // Compare like for like: today is a part-day, so measure yesterday only up to
  // the same clock time. Comparing a part-day against a whole one is what made
  // the old delta read as a triple-digit spike every afternoon.
  const elapsedMs = Date.now() - sgtMidnightMs(today);
  const yestMidnight = sgtMidnightMs(yesterday);
  const revenueYest = yest
    .filter((o) => new Date(o.placedAt).getTime() - yestMidnight <= elapsedMs)
    .reduce((s, o) => s + o.total, 0);
  const revenueDelta = revenueYest > 0 ? ((revenueToday - revenueYest) / revenueYest) * 100 : null;

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
  const cancelled = todays.filter((o) => o.status === "cancelled").length;
  const inProgress = received + preparing + shipping;
  const stages = [
    { key: "received",  label: "Received",  count: received  },
    { key: "preparing", label: "Preparing", count: preparing },
    { key: "shipping",  label: "Shipping",  count: shipping  },
    { key: "completed", label: "Completed", count: completed },
  ];

  // Cumulative orders-placed-today, bucketed by hour, for the trend chart
  const sgHour = (iso) => {
    const h = Number(new Date(iso).toLocaleString("en-US", { timeZone: "Asia/Singapore", hour: "2-digit", hour12: false }));
    return h === 24 ? 0 : h;
  };
  const nowHourSG = sgHour(new Date().toISOString());
  const hourlyLabels = Array.from({ length: nowHourSG + 1 }, (_, h) => `${String(h).padStart(2, "0")}:00`);
  const hourlyCounts = Array(nowHourSG + 1).fill(0);
  todays.forEach((o) => {
    const h = sgHour(o.placedAt);
    if (h >= 0 && h <= nowHourSG) hourlyCounts[h]++;
  });
  let runningTotal = 0;
  const cumulativeOrders = hourlyCounts.map((c) => (runningTotal += c));

  // ── Business health ─────────────────────────────────────────────────────
  const healthy = attentionChannels.length === 0 && critical === 0 && lowStock === 0;
  const healthNote = healthy
    ? "All systems nominal"
    : attentionChannels.length > 0
      ? `${attentionChannels.length} channel${attentionChannels.length === 1 ? "" : "s"} degraded`
      : critical > 0
        ? `${critical} SKU${critical === 1 ? "" : "s"} below minimum`
        : `${lowStock} SKU${lowStock === 1 ? "" : "s"} near minimum`;

  // ── Overview metrics ────────────────────────────────────────────────────
  // Every sub-label accounts for the whole of its headline figure — an order
  // count that does not reconcile with its own status breakdown is the tell
  // this pass exists to remove.
  const metrics = [
    { key: "revenue", label: "Revenue", value: SGD(revenueToday), tone: "emerald", tab: "Orders",
      sub: revenueDelta != null ? `${signed(revenueDelta)} vs yesterday` : "No comparable day" },
    { key: "orders", label: "Orders", value: todays.length, tab: "Orders",
      sub: cancelled > 0
        ? `${inProgress} active · ${completed} delivered · ${cancelled} canceled`
        : `${inProgress} active · ${completed} delivered` },
    { key: "inventory", label: "Inventory Health", value: lowStock, tone: lowStock > 0 ? "amber" : "emerald", tab: "Inventory",
      sub: lowStock === 0 ? "All SKUs above minimum" : `${critical} critical · ${Math.max(0, lowStock - critical)} low` },
    { key: "loyalty", label: "Loyalty Points", value: totalPoints.toLocaleString("en-SG"), tab: "Loyalty",
      sub: `${SGD(liability)} liability` },
  ];

  // ── Channel operations ──────────────────────────────────────────────────
  const channelCards = channels.map((c) => ({
    key: c.id,
    name: CHANNEL_NAME[c.id] || c.label,
    ok: c.status === "connected",
    statusLabel: c.status === "connected" ? "Live" : "Degraded",
    count: c.metrics.ordersToday,
    unit: "orders today",
    metaLabel: "since sync",
    metaValue: elapsed(c.lastSyncAt),
    tab: "Marketplace",
  }));
  channelCards.push({
    key: "ledger",
    name: "Inventory Ledger",
    ok: critical === 0,
    statusLabel: critical === 0 ? "Reconciled" : "Review",
    count: inv.length.toLocaleString("en-SG"),
    unit: "SKUs tracked",
    metaLabel: critical === 0 ? "all above min" : "below min",
    metaValue: critical === 0 ? null : String(critical),
    tab: "Inventory",
  });

  // ── Priority actions ────────────────────────────────────────────────────
  const actions = [];
  if (criticalItems.length > 0) {
    actions.push({ tier: "critical", label: "Critical",
      title: "Stock below minimum",
      metric: criticalItems.length, note: `SKU${criticalItems.length === 1 ? "" : "s"} under reorder level`,
      cta: "View Inventory", tab: "Inventory" });
  }
  for (const c of attentionChannels) {
    actions.push({ tier: "attention", label: "Attention",
      title: `${CHANNEL_NAME[c.id] || c.label} sync degraded`,
      metric: elapsed(c.lastSyncAt), note: "since last successful sync",
      cta: "Review Marketplace", tab: "Marketplace" });
  }
  if (lowItems.length > 0) {
    actions.push({ tier: "attention", label: "Attention",
      title: "Stock approaching reorder point",
      metric: lowItems.length, note: `SKU${lowItems.length === 1 ? "" : "s"} under 2× reorder level`,
      cta: "View Inventory", tab: "Inventory" });
  }
  if (expiringMembers.length > 0) {
    actions.push({ tier: "upcoming", label: "Upcoming",
      title: "Loyalty points expiring",
      metric: expiringMembers.length, note: `member${expiringMembers.length === 1 ? "" : "s"} affected`,
      cta: "Review Members", tab: "Loyalty" });
  }

  return (
    <div className="space-y-4 p-6">
      <header className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-zinc-900 dark:text-slate-50">Operations Overview</h1>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{healthNote}</span>
            <StatusBadge tone={healthy ? "emerald" : "amber"}>{healthy ? "Healthy" : "Attention"}</StatusBadge>
          </div>
        </div>

        <KpiBar items={metrics.map((m) => ({ ...m, onClick: () => setTab(m.tab) }))} />
      </header>

      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <section>
            <SectionHeading>Channel Operations</SectionHeading>
            <div className="divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {channelCards.map((c) => (
                <ChannelRow key={c.key} channel={c} onSelect={() => setTab(c.tab)} />
              ))}
            </div>
          </section>

          <section>
            <SectionHeading>Business Pulse</SectionHeading>
            <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              <div className="p-4">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-2xl font-semibold tabular-nums text-zinc-900 dark:text-slate-50">{todays.length}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">orders today, cumulative by hour</span>
                </div>
                <div className="mt-3">
                  {todays.length > 0 ? (
                    <TrendChart labels={hourlyLabels} values={cumulativeOrders} valueLabel="Orders" theme={state.session.theme} />
                  ) : (
                    <div className="flex h-40 items-center justify-center text-sm text-zinc-500 dark:text-zinc-400">
                      No orders placed yet today
                    </div>
                  )}
                </div>
              </div>
              <StageStrip stages={stages} />
            </div>
          </section>
        </div>

        <AuxPanel title="Priority Actions" storageKey="today-auxpanel-collapsed">
          {actions.length === 0 ? (
            <div className="text-sm text-zinc-500 dark:text-zinc-400">No open actions.</div>
          ) : (
            <>
              <div className="mb-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span className="font-mono tabular-nums">{actions.length}</span> open
              </div>
              <div className="space-y-2">
                {actions.map((a, i) => (
                  <PriorityAction key={i} action={a} onSelect={() => setTab(a.tab)} />
                ))}
              </div>
            </>
          )}
        </AuxPanel>
      </div>
    </div>
  );
}
