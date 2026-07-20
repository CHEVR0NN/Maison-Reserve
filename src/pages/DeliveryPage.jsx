import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { escapeHtml, zoneName } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";

const TRUCK_TINT = { truck_1: "#FFC300", truck_2: "#A6455C" };

function statusClass(status) {
  if (status === "delivered") return "del";
  if (status === "out_for_delivery") return "enr";
  return "pen";
}

function todaySGT() {
  return new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Singapore" });
}

// ─── Truck visual identity ──────────────────────────────────────────────────
const TRUCK_STYLE = [
  { stroke: "#FFCF33", fill: "#FFC300", icoStyle: { background: "rgba(255,195,0,0.16)", border: "1px solid var(--honey-deep)" }, no: "t1" },
  { stroke: "#A6455C", fill: "#7C2C40", icoStyle: { background: "rgba(124,44,64,0.16)", border: "1px solid var(--cabernet-deep)" }, no: "t2" },
];

// Approximate centre of each zone on the stylized coverage map (viewBox 460x380).
const ZONE_XY = {
  W1: { x: 60,  y: 152 }, W2: { x: 92,  y: 168 }, W3: { x: 112, y: 138 },
  C1: { x: 190, y: 176 }, C2: { x: 212, y: 192 }, C3: { x: 200, y: 150 },
  N1: { x: 210, y: 86 },  N2: { x: 240, y: 74 },  N3: { x: 266, y: 96 },
  NE1:{ x: 334, y: 108 }, NE2:{ x: 360, y: 130 }, NE3:{ x: 344, y: 150 },
  E1: { x: 314, y: 234 }, E2: { x: 346, y: 250 }, E3: { x: 362, y: 224 },
};

function truckGeometry(stops, styleIndex, ordersById) {
  const style = TRUCK_STYLE[styleIndex % TRUCK_STYLE.length];
  const pts = stops.slice(0, 8).map((stop, idx) => {
    const base = ZONE_XY[stop.zone] || { x: 230, y: 190 };
    const dx = ((idx % 3) - 1) * 9;
    const dy = (Math.floor(idx / 3) - 1) * 9;
    const order = ordersById.get(stop.id);
    return { x: base.x + dx, y: base.y + dy, n: idx + 1, delivered: order?.status === "delivered" };
  });
  const line = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return { ...style, pts, line };
}

function TruckIcon({ stroke }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M2 7h11v9H2z" /><path d="M13 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.6" /><circle cx="16" cy="18" r="1.6" />
    </svg>
  );
}

// ─── Live driver tracking map (Leaflet), driven entirely by context state ──
function LiveDriverMap({ trucks, zoneCentroids, depot }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const routeLayerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
        attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>',
      }).addTo(map);
      map.setView([1.3521, 103.8198], 11);
      mapRef.current = map;
      setReady(true);
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Truck position markers.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      Object.values(trucks).forEach((t) => {
        if (!t.position) return;
        const color = TRUCK_TINT[t.id] || "#FFC300";
        const live = t.status === "en_route";
        const html = `<div style="display:flex;flex-direction:column;align-items:center;opacity:${live ? 1 : 0.5}">`
          + `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #15130F;box-shadow:0 0 0 2px ${color};transform:rotate(${t.position.heading || 0}deg)"></div>`
          + `<div style="margin-top:2px;font:600 10px ui-sans-serif,sans-serif;color:${color};white-space:nowrap;text-shadow:0 1px 2px #000">${escapeHtml(t.label)}</div></div>`;
        const icon = L.divIcon({ html, className: "", iconSize: [60, 34], iconAnchor: [30, 9] });
        const label = `${escapeHtml(t.label)} · ${escapeHtml(t.driverName)} · ${live ? "en route" : t.status}`;
        if (markersRef.current[t.id]) {
          markersRef.current[t.id].setLatLng([t.position.lat, t.position.lng]).setIcon(icon).bindTooltip(label, { direction: "top" });
        } else {
          markersRef.current[t.id] = L.marker([t.position.lat, t.position.lng], { icon }).bindTooltip(label, { direction: "top" }).addTo(mapRef.current);
        }
      });
    });
  }, [trucks, ready]);

  // Route lines + numbered stop markers (drawn once per truck-set change).
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      if (routeLayerRef.current) { mapRef.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
      const layer = L.layerGroup();

      Object.values(trucks).forEach((t) => {
        const color = TRUCK_TINT[t.id] || "#FFC300";
        const coords = t.stops.map((s) => zoneCentroids[s.zone]).filter(Boolean).map((c) => [c.lat, c.lng]);
        if (!coords.length) return;
        const line = depot ? [[depot.lat, depot.lng], ...coords] : coords;
        L.polyline(line, { color, weight: 3, opacity: 0.6, dashArray: "6 7" }).addTo(layer);
        t.stops.forEach((s, i) => {
          const c = zoneCentroids[s.zone];
          if (!c) return;
          const html = `<div style="width:22px;height:22px;border-radius:50%;background:${color};color:#15130F;`
            + `font:700 11px ui-sans-serif,sans-serif;display:flex;align-items:center;justify-content:center;`
            + `border:2px solid #15130F;box-shadow:0 0 0 1px ${color}">${i + 1}</div>`;
          const icon = L.divIcon({ html, className: "", iconSize: [22, 22], iconAnchor: [11, 11] });
          L.marker([c.lat, c.lng], { icon }).bindTooltip(`#${i + 1} · ${escapeHtml(s.customer?.name || s.orderNo)} · ${escapeHtml(s.zone)}`, { direction: "top" }).addTo(layer);
        });
      });

      if (depot) {
        const whIcon = L.divIcon({ html: `<div style="width:14px;height:14px;border-radius:3px;background:#FFF9E5;border:2px solid #15130F"></div>`, className: "", iconSize: [14, 14], iconAnchor: [7, 7] });
        L.marker([depot.lat, depot.lng], { icon: whIcon }).bindTooltip(depot.label, { direction: "top" }).addTo(layer);
      }

      layer.addTo(mapRef.current);
      routeLayerRef.current = layer;

      const pts = [];
      Object.values(trucks).forEach((t) => t.stops.forEach((s) => { const c = zoneCentroids[s.zone]; if (c) pts.push([c.lat, c.lng]); }));
      if (depot) pts.push([depot.lat, depot.lng]);
      if (pts.length) mapRef.current.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 14 });
    });
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const anyLive = Object.values(trucks).some((t) => t.status === "en_route");

  return (
    <div className="card" style={{ marginBottom: "var(--sp-3)", padding: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <div>
          <div className="hl" style={{ fontWeight: 700 }}>Live Driver Tracking</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>Simulated GPS — trucks advance along their route automatically</div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: anyLive ? "var(--positive)" : "var(--muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: anyLive ? "var(--positive)" : "var(--muted)" }} />
          {anyLive ? "Live" : "No active runs"}
        </span>
      </div>
      <div style={{ position: "relative", height: 280, overflow: "hidden", isolation: "isolate", background: "var(--bg-2)" }}>
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>
    </div>
  );
}

// ─── Truck card ────────────────────────────────────────────────────────────
function TruckCard({ truck, style, ordersById, onMarkDelivered, onOptimize, optimizing }) {
  return (
    <div className="card route-card">
      <div className="route-top">
        <div className="truck-ico" style={style.icoStyle}><TruckIcon stroke={style.stroke} /></div>
        <div>
          <div className="nm">{truck.label}</div>
          <div className="driver">{truck.driverName}</div>
        </div>
        <div className="stats">
          <div className="big">{truck.stops.length} stops</div>
          <div className="sm">{truck.status === "complete" ? "run complete" : "en route"}</div>
        </div>
        <button type="button" className="btn" onClick={() => onOptimize(truck.id)} disabled={optimizing === truck.id} style={{ flexShrink: 0 }}>
          {optimizing === truck.id ? "Solving…" : "Optimize"}
        </button>
      </div>
      <div className="stops">
        {truck.stops.length === 0 && (
          <div className="empty-state" style={{ padding: "24px 0" }}>
            <b>No stops assigned</b>
            <span>{truck.label} is clear — new orders will route here automatically.</span>
          </div>
        )}
        {truck.stops.map((stop, index) => {
          const order = ordersById.get(stop.id);
          const status = order?.status || "out_for_delivery";
          const delivered = status === "delivered";
          return (
            <div className="stop" key={stop.id}>
              <div className={`stop-no ${style.no}`}>{index + 1}</div>
              <div className="eta">{new Date(stop.eta).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}</div>
              <div className="addr">
                {stop.customer?.name} <span className="o">{stop.orderNo} · {stop.zone}</span>
              </div>
              <div className="st">
                {delivered ? (
                  <>
                    <span className="ministat del">Delivered</span>
                    <svg className="podok" viewBox="0 0 24 24" fill="none" stroke="var(--positive)" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                  </>
                ) : (
                  <button type="button" className="fchip" style={{ fontSize: 10.5, padding: "3px 9px" }} onClick={() => onMarkDelivered(stop.id)}>
                    Mark delivered
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportManifestCSV(trucks, ordersById) {
  const header = ["Truck", "Driver", "Seq", "Order No", "Customer", "Zone", "ETA", "Status"];
  const rows = [header];
  Object.values(trucks).forEach((t) => {
    t.stops.forEach((s, i) => {
      const order = ordersById.get(s.id);
      rows.push([t.label, t.driverName, i + 1, s.orderNo, s.customer?.name || "", s.zone, s.eta, order?.status || ""]);
    });
  });
  const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `maison-reserve-delivery-manifest-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function DeliveryPage() {
  const { state, actions } = useAppData();
  const notify = useToast();
  const [optimizing, setOptimizing] = useState(null);

  const trucks = state.delivery.trucks;
  const ordersById = new Map(state.orders.items.map((o) => [o.id, o]));
  const truckList = Object.values(trucks);

  const totalStops = truckList.reduce((s, t) => s + t.stops.length, 0);
  const delivered = truckList.reduce((s, t) => s + t.stops.filter((stop) => ordersById.get(stop.id)?.status === "delivered").length, 0);
  const activeZones = new Set(truckList.flatMap((t) => t.stops.map((s) => s.zone))).size;

  function markDelivered(orderId) {
    actions.orders.updateStatus(orderId, "delivered");
    notify("Stop marked delivered", "success");
  }

  function optimize(truckId) {
    setOptimizing(truckId);
    setTimeout(() => {
      actions.delivery.optimizeRoute(truckId);
      setOptimizing(null);
      notify(`${trucks[truckId]?.label} route re-optimized`, "success");
    }, 700);
  }

  return (
    <section className="panel active" id="delivery">
      <div className="panel-head">
        <div>
          <h2>Delivery &amp; Routes</h2>
          <div className="sub">{todaySGT()} &middot; {truckList.length} trucks &middot; {totalStops} stops today</div>
        </div>
        <div className="right-note" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div>Stops today<br /><b>{delivered} of {totalStops}</b> delivered</div>
          <button type="button" className="btn" onClick={() => exportManifestCSV(trucks, ordersById)}>Export Manifest CSV</button>
        </div>
      </div>

      <div className="deliv-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.3 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8z" />
        </svg>
        <div className="bt">
          <b>Routes auto-sequenced nightly.</b> A nearest-neighbor + 2-opt heuristic sequences each truck's stops — click Optimize on any truck to re-run it.
        </div>
      </div>

      <LiveDriverMap trucks={trucks} zoneCentroids={state.delivery.zoneCentroids} depot={state.delivery.depot} />

      <div className="deliv-grid">
        <div className="routes-col">
          {truckList.map((truck, i) => (
            <TruckCard key={truck.id} truck={truck} style={TRUCK_STYLE[i % TRUCK_STYLE.length]} ordersById={ordersById} onMarkDelivered={markDelivered} onOptimize={optimize} optimizing={optimizing} />
          ))}
        </div>

        <div className="card map-card">
          <div className="mh">
            <div className="hl">Today's Coverage</div>
            <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>15 zones mapped &middot; {activeZones} on today's runs</div>
          </div>
          <svg viewBox="0 0 460 380" style={{ width: "100%", height: "auto" }}>
            <defs>
              <radialGradient id="zg" cx="50%" cy="40%">
                <stop offset="0" stopColor="#3B352B" />
                <stop offset="1" stopColor="#15130F" />
              </radialGradient>
            </defs>
            <path d="M30,150 Q20,90 80,80 Q130,70 150,120 Q160,170 120,200 Q60,220 40,190 Z" fill="url(#zg)" stroke="#3B352B" strokeWidth="1.5" />
            <text x="80" y="135" fill="#CFC6B0" fontSize="13" fontFamily="Fraunces, Georgia, serif" fontWeight="700">WEST</text>
            <text x="62" y="152" fill="#A99D89" fontSize="10" fontFamily="monospace">W1 W2 W3</text>
            <path d="M160,170 Q150,120 200,115 Q250,110 255,160 Q258,205 215,215 Q170,218 160,190 Z" fill="url(#zg)" stroke="#3B352B" strokeWidth="1.5" />
            <text x="190" y="165" fill="#CFC6B0" fontSize="12" fontFamily="Fraunces, Georgia, serif" fontWeight="700">CENTRAL</text>
            <text x="182" y="182" fill="#A99D89" fontSize="10" fontFamily="monospace">C1 C2 C3</text>
            <path d="M180,60 Q230,30 290,55 Q320,75 300,115 Q270,140 220,120 Q180,105 180,60 Z" fill="url(#zg)" stroke="#3B352B" strokeWidth="1.5" />
            <text x="225" y="80" fill="#CFC6B0" fontSize="13" fontFamily="Fraunces, Georgia, serif" fontWeight="700">NORTH</text>
            <text x="210" y="97" fill="#A99D89" fontSize="10" fontFamily="monospace">N1 N2 N3</text>
            <path d="M300,75 Q360,55 405,95 Q430,130 400,165 Q360,185 320,160 Q295,130 300,75 Z" fill="url(#zg)" stroke="#3B352B" strokeWidth="1.5" />
            <text x="335" y="115" fill="#CFC6B0" fontSize="11" fontFamily="Fraunces, Georgia, serif" fontWeight="700">NE</text>
            <text x="322" y="132" fill="#A99D89" fontSize="9" fontFamily="monospace">NE1 NE2 NE3</text>
            <path d="M280,200 Q340,180 400,210 Q435,235 405,275 Q355,300 300,275 Q270,245 280,200 Z" fill="url(#zg)" stroke="#3B352B" strokeWidth="1.5" />
            <text x="330" y="245" fill="#CFC6B0" fontSize="13" fontFamily="Fraunces, Georgia, serif" fontWeight="700">EAST</text>
            <text x="312" y="262" fill="#A99D89" fontSize="10" fontFamily="monospace">E1 E2 E3</text>

            {truckList.map((truck, ti) => {
              const g = truckGeometry(truck.stops, ti, ordersById);
              if (g.pts.length === 0) return null;
              return (
                <g key={truck.id}>
                  {g.pts.length > 1 && <path d={g.line} fill="none" stroke={g.stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 6" opacity="0.85" />}
                  <g fontFamily="monospace" fontSize="9" fontWeight="700">
                    {g.pts.map((p) => (
                      <g key={p.n}>
                        <circle cx={p.x} cy={p.y} r="9" fill={p.delivered ? g.fill : "#3B352B"} stroke={p.delivered ? "none" : g.fill} strokeWidth={p.delivered ? 0 : 1.5} />
                        <text x={p.x} y={p.y + 3.5} fill={p.delivered ? "#15130F" : g.stroke} textAnchor="middle">{p.n}</text>
                      </g>
                    ))}
                  </g>
                </g>
              );
            })}
          </svg>
          <div className="map-legend">
            {truckList.map((t, i) => (
              <span key={t.id}><i style={{ background: TRUCK_STYLE[i % TRUCK_STYLE.length].fill }}></i>{t.label} &middot; {t.driverName}</span>
            ))}
          </div>
          <div style={{ marginTop: "14px", paddingTop: "14px", borderTop: "1px solid var(--line-soft)", display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--cream-dim)" }}>
            <span>Delivered today</span>
            <span style={{ color: "var(--green)", fontWeight: 700 }}>{delivered} of {totalStops}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
