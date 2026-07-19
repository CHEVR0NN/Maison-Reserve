import { Globe, ShoppingBag, Store, RefreshCw } from "lucide-react";
import { useAppData } from "../context/AppData.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import { SGD } from "../utils.js";

const CHANNEL_META = {
  "own-site": { icon: Globe, color: "var(--honey)" },
  lazada:     { icon: ShoppingBag, color: "var(--orange)" },
  shopee:     { icon: Store, color: "var(--blue)" },
};

function agoLabel(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  return `${hrs}h ago`;
}

export default function MarketplacePage() {
  const { state, actions } = useAppData();
  const notify = useToast();
  const { channels } = state.marketplace;
  const orders = state.orders.items;

  const today = new Date().toDateString();
  const todaysOrders = orders.filter((o) => new Date(o.placedAt).toDateString() === today && o.status !== "cancelled");
  const revenueByChannel = todaysOrders.reduce((m, o) => { m[o.channel] = (m[o.channel] || 0) + o.total; return m; }, {});
  const ordersByChannel = todaysOrders.reduce((m, o) => { m[o.channel] = (m[o.channel] || 0) + 1; return m; }, {});
  const totalRevenue = Object.values(revenueByChannel).reduce((a, b) => a + b, 0) || 1;

  function resync(channelId, label) {
    actions.marketplace.refreshChannel(channelId);
    notify(`${label} resynced`, "success");
  }

  return (
    <>
      <section className="panel active">
        <div className="panel-head">
          <div>
            <h2>Marketplace Channels</h2>
            <div className="sub">Own site, Lazada, and Shopee — one unified order pipeline and stock pool</div>
          </div>
        </div>

        <div className="panel-grid three">
          {channels.map((c) => {
            const meta = CHANNEL_META[c.id] || CHANNEL_META["own-site"];
            const Icon = meta.icon;
            const attention = c.status === "attention";
            return (
              <article className="panel" key={c.id} style={{ minHeight: 0 }}>
                <div className="panel-head" style={{ marginBottom: 16 }}>
                  <div>
                    <h2 style={{ fontSize: 20 }}>{c.label}</h2>
                    <p style={{ textTransform: "none", letterSpacing: 0, fontSize: 12 }}>Last synced {agoLabel(c.lastSyncAt)}</p>
                  </div>
                  <Icon size={22} style={{ color: meta.color }} />
                </div>
                <span className={`badge ${attention ? "warning" : "positive"}`} style={{ marginBottom: 14 }}>
                  <i />{attention ? "Sync delayed" : "Connected"}
                </span>
                <div style={{ display: "flex", gap: 18, margin: "14px 0" }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)" }}>Orders today</div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 26, marginTop: 4 }}>{ordersByChannel[c.id] || 0}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: ".1em", textTransform: "uppercase", color: "var(--ink-3)" }}>Revenue today</div>
                    <div style={{ fontFamily: "var(--serif)", fontSize: 26, marginTop: 4, color: "var(--honey-2)" }}>{SGD(revenueByChannel[c.id] || 0)}</div>
                  </div>
                </div>
                <button type="button" className="btn" style={{ width: "100%", justifyContent: "center" }} onClick={() => resync(c.id, c.label)}>
                  <RefreshCw size={14} /> Resync now
                </button>
              </article>
            );
          })}
        </div>

        <div className="section-label"><span>Today's Revenue Split</span></div>
        <div className="card" style={{ padding: "20px 22px" }}>
          <div style={{ display: "flex", height: 8, borderRadius: 4, overflow: "hidden", background: "var(--line)" }}>
            {channels.map((c) => {
              const pct = ((revenueByChannel[c.id] || 0) / totalRevenue) * 100;
              const meta = CHANNEL_META[c.id] || CHANNEL_META["own-site"];
              return pct > 0 ? <div key={c.id} style={{ width: `${pct}%`, background: meta.color }} title={`${c.label}: ${Math.round(pct)}%`} /> : null;
            })}
          </div>
          <div className="chan-chips" style={{ marginTop: 16 }}>
            {channels.map((c) => {
              const meta = CHANNEL_META[c.id] || CHANNEL_META["own-site"];
              const rev = revenueByChannel[c.id] || 0;
              const pct = Math.round((rev / totalRevenue) * 100);
              return (
                <span className="chan-chip" key={c.id}>
                  <i style={{ background: meta.color }} />
                  <span className="chan-chip-nm">{c.label}</span>
                  <span className="chan-chip-ct">{SGD(rev)}</span>
                  <span className="chan-chip-pct">{pct}%</span>
                </span>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
