import { useState } from "react";
import { zoneName, SGD } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";

const CHANNEL_META = {
  "own-site": { cls: "web", label: "Own Site" },
  lazada:     { cls: "lzb", label: "Lazada" },
  shopee:     { cls: "spb", label: "Shopee" },
};

const STAGES = ["Captured", "Packed", "Out for Delivery", "Delivered"];
const STATUS_TO_STAGE = { pending: 0, packed: 1, out_for_delivery: 2, delivered: 3, cancelled: 3 };
const NEXT_STATUS = { pending: "packed", packed: "out_for_delivery", out_for_delivery: "delivered" };
const NEXT_LABEL = { pending: "Mark packed", packed: "Mark out for delivery", out_for_delivery: "Mark delivered" };

function pipeDots(stage) {
  return (
    <div className="pipe">
      {[...Array(4)].map((_, i) => {
        if (i < stage) return <i key={i} className="done" />;
        if (i === stage) return <i key={i} className="now" />;
        return <i key={i} />;
      })}
    </div>
  );
}

function stagePill(status) {
  const map = { pending: "captured", packed: "packed", out_for_delivery: "out", delivered: "delivered", cancelled: "closed" };
  const label = status === "cancelled" ? "Cancelled" : STAGES[STATUS_TO_STAGE[status]];
  return <span className={`pill ${map[status] || "captured"}`}>{label}</span>;
}

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d)) return "—";
  return d.toLocaleDateString("en-SG", { day: "numeric", month: "short" })
    + " " + d.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function PodPhoto({ order }) {
  return (
    <div className="pod">
      <svg className="cam" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="1.5">
        <rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8 7l1.5-2h5L16 7" />
      </svg>
      <div className="lab">POD &middot; {order.orderNo}.jpg</div>
    </div>
  );
}

export default function OrdersPage() {
  const { state, actions } = useAppData();
  const notify = useToast();
  const orders = state.orders.items;

  const [search, setSearch] = useState("");
  const [filterChannel, setFilterChannel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("pending");
  const [activeOrderId, setActiveOrderId] = useState(null);
  const [podView, setPodView] = useState(null);

  const filtered = orders.filter((o) => {
    const matchChannel = filterChannel === "all" || o.channel === filterChannel;
    const matchStatus =
      filterStatus === "all" ? true :
      filterStatus === "pending" ? o.status !== "delivered" && o.status !== "cancelled" : o.status === "delivered";
    const q = search.toLowerCase();
    const hay = [o.orderNo, o.customer.name, o.customer.address, o.zone, ...o.lines.map((l) => `${l.sku} ${l.name}`)].join(" ").toLowerCase();
    return matchChannel && matchStatus && (!q || hay.includes(q));
  }).sort((a, b) => new Date(b.placedAt) - new Date(a.placedAt));

  const pendingCount = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled").length;
  const todayCount = orders.filter((o) => new Date(o.placedAt).toDateString() === new Date().toDateString()).length;
  const selectedOrder = orders.find((o) => o.id === activeOrderId) || null;

  function advanceStatus(order) {
    const next = NEXT_STATUS[order.status];
    if (!next) return;
    actions.orders.updateStatus(order.id, next);
    notify(`${order.orderNo} → ${next.replace(/_/g, " ")}`, "success");
  }

  return (
    <section className="panel active" id="orders">
      <div className="panel-head">
        <div>
          <h2>Unified Orders</h2>
          <div className="sub">Every storefront in one queue &middot; own site, Lazada, Shopee</div>
        </div>
        <div className="right-note">
          <b>{todayCount}</b> orders captured today<br />across <b>3 channels</b>
        </div>
      </div>

      <div className="toolbar orders-toolbar">
        <div className="search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4-4" />
          </svg>
          <input
            placeholder="Search order no, customer, address, SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="orders-filters">
          <div className="filter-group">
            <span className="filter-label">Status</span>
            <div className="chip-row">
              {[
                { id: "pending",   label: `Pending${pendingCount ? ` (${pendingCount})` : ""}` },
                { id: "delivered", label: "Delivered" },
                { id: "all",       label: "All" },
              ].map((c) => (
                <button key={c.id} className={`fchip ${filterStatus === c.id ? "on" : ""}`} onClick={() => setFilterStatus(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-divider" />

          <div className="filter-group">
            <span className="filter-label">Channel</span>
            <div className="chip-row">
              {[{ id: "all", label: "All" }, ...Object.entries(CHANNEL_META).map(([id, m]) => ({ id, label: m.label }))].map((c) => (
                <button key={c.id} className={`fchip ${filterChannel === c.id ? "on" : ""}`} onClick={() => setFilterChannel(c.id)}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="tbl-wrap">
        <table>
          <thead>
            <tr>
              <th>Channel</th>
              <th>Order No</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Date</th>
              <th>Zone</th>
              <th>Total</th>
              <th>Pipeline</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9}>
                  <div className="empty-state" style={{ padding: "32px 0" }}>
                    <b>No orders match{search ? ` "${search}"` : ""}</b>
                    <span>{search ? "Try a different order number, customer, or SKU." : "No orders in this status/channel filter yet — try widening it above."}</span>
                  </div>
                </td>
              </tr>
            )}
            {filtered.map((o) => {
              const s = CHANNEL_META[o.channel] || CHANNEL_META["own-site"];
              const first = o.lines[0];
              return (
                <tr
                  key={o.id} className="clickrow" tabIndex={0} role="button"
                  aria-label={`View order ${o.orderNo}`}
                  onClick={() => setActiveOrderId(o.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActiveOrderId(o.id); } }}
                >
                  <td><span className={`src ${s.cls}`}><i />{s.label}</span></td>
                  <td><span className="mono">{o.orderNo}</span></td>
                  <td><span className="strong">{o.customer.name}</span></td>
                  <td>
                    <span className="strong" style={{ fontSize: "12.5px" }}>{first.name}</span>
                    {o.lines.length > 1 && <span className="dim"> +{o.lines.length - 1}</span>}
                  </td>
                  <td><span className="dim" style={{ fontSize: "11.5px", whiteSpace: "nowrap" }}>{fmtDate(o.placedAt)}</span></td>
                  <td><span className="zone">{o.zone}</span></td>
                  <td><span className="mono" style={{ color: "var(--honey-2)" }}>{SGD(o.total)}</span></td>
                  <td>{pipeDots(STATUS_TO_STAGE[o.status])}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      {stagePill(o.status)}
                      {o.podPhotoRef && (
                        <button
                          type="button" title="View proof of delivery"
                          onClick={(e) => { e.stopPropagation(); setPodView(o); }}
                          style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "var(--positive-soft)", border: "1px solid rgba(94,145,81,0.4)", color: "var(--positive)", borderRadius: 20, padding: "2px 9px", fontSize: 10.5, fontWeight: 700, cursor: "pointer" }}
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8 7l1.5-2h5L16 7" />
                          </svg>
                          POD
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className={`overlay ${selectedOrder ? "show" : ""}`} onClick={() => setActiveOrderId(null)} />
      <aside className={`drawer ${selectedOrder ? "show" : ""}`}>
        {selectedOrder && (
          <>
            <div className="drawer-head">
              <div className="top">
                <span className={`src ${(CHANNEL_META[selectedOrder.channel] || CHANNEL_META["own-site"]).cls}`}>
                  <i />{(CHANNEL_META[selectedOrder.channel] || CHANNEL_META["own-site"]).label}
                </span>
                <button className="x-close" onClick={() => setActiveOrderId(null)}>&times;</button>
              </div>
              <div className="ord">{selectedOrder.orderNo}</div>
              <h3>{selectedOrder.customer.name}</h3>
            </div>
            <div className="drawer-body">
              <div className="drawer-meta">
                <div><div className="k">Order Date</div><div className="v">{fmtDate(selectedOrder.placedAt)}</div></div>
                <div><div className="k">Zone</div><div className="v">{selectedOrder.zone} &middot; {zoneName(selectedOrder.zone)}</div></div>
                <div><div className="k">Status</div><div className="v">{selectedOrder.status === "cancelled" ? "Cancelled" : STAGES[STATUS_TO_STAGE[selectedOrder.status]]}</div></div>
                <div><div className="k">Order Total</div><div className="v" style={{ color: "var(--honey-2)" }}>{SGD(selectedOrder.total)}</div></div>
              </div>

              <div className="card-title">Line Items</div>
              <div style={{ marginTop: "10px" }}>
                {selectedOrder.lines.map((it, idx) => (
                  <div className="di-line" key={idx}>
                    <div>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--honey)" }}>{it.sku}</span>{" "}
                      &middot; {it.name}
                    </div>
                    <div>
                      <span className="qty">&times;{it.qty}</span> &nbsp; <span className="amt">{SGD(it.price * it.qty)}</span>
                    </div>
                  </div>
                ))}
                <div className="di-total"><span>Total</span><span className="amt">{SGD(selectedOrder.total)}</span></div>
              </div>

              {NEXT_STATUS[selectedOrder.status] && (
                <button type="button" className="btn primary" style={{ marginTop: 18, width: "100%", justifyContent: "center" }} onClick={() => advanceStatus(selectedOrder)}>
                  {NEXT_LABEL[selectedOrder.status]} →
                </button>
              )}

              <div className="sechead" style={{ marginTop: 22 }}>Order Timeline</div>
              <div className="timeline">
                {selectedOrder.timeline.map((e, idx) => (
                  <div key={idx} className="tl-item done">
                    <div className="tt">{e.label}</div>
                    <div className="tx">{e.actor}</div>
                    <div className="tm">{fmtDate(e.at)}</div>
                    {idx === selectedOrder.timeline.length - 1 && selectedOrder.podPhotoRef && <PodPhoto order={selectedOrder} />}
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </aside>

      {podView && (
        <div onClick={() => setPodView(null)} style={{ position: "fixed", inset: 0, zIndex: 1000, background: "rgba(16,11,4,0.75)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "var(--surface)", border: "1px solid var(--rule-strong)", borderRadius: 14, maxWidth: 420, width: "100%", boxShadow: "var(--shadow)" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: "1px solid var(--rule)" }}>
              <span style={{ color: "var(--ink)", fontWeight: 700, fontSize: 14 }}>Proof of Delivery &middot; {podView.orderNo}</span>
              <button type="button" onClick={() => setPodView(null)} style={{ background: "none", border: "none", color: "var(--ink-3)", fontSize: 22, lineHeight: 1, cursor: "pointer" }} aria-label="Close">&times;</button>
            </div>
            <div style={{ padding: 20 }}>
              <div style={{
                width: "100%", aspectRatio: "4/3", borderRadius: 10, display: "grid", placeItems: "center",
                background: "repeating-linear-gradient(45deg, var(--surface-2) 0 12px, var(--surface-3) 12px 24px)",
                border: "1px solid var(--rule)", color: "var(--positive)", flexDirection: "column", gap: 8,
              }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="7" width="18" height="13" rx="2" /><circle cx="12" cy="13.5" r="3.5" /><path d="M8 7l1.5-2h5L16 7" />
                  </svg>
                  <span style={{ fontSize: 12, color: "var(--ink-2)" }}>Delivered {fmtDate(podView.deliveredAt)}</span>
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: 11.5, color: "var(--ink-3)" }}>Simulated proof-of-delivery capture — driver portal photos aren't stored in this demo.</div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
