import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { escapeHtml } from "../utils.js";

const TRUCK_TINT = { truck_1: "#E8B964", truck_2: "#D99A5B" };
const TRUCK_LABEL = { truck_1: "Truck 1", truck_2: "Truck 2" };

function agoLabel(seconds) {
  if (seconds == null) return "—";
  if (seconds < 60) return "just now";
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

// Best stop coordinate: exact lat/lng if present, else the stop's zone centroid
// (mirrors the server's coordForStop) so every stop can be plotted on the map.
function stopCoord(stop, centroids) {
  if (Number.isFinite(stop?.lat) && Number.isFinite(stop?.lng)) return [stop.lat, stop.lng];
  const c = centroids?.[stop?.zone];
  return c ? [c.lat, c.lng] : null;
}

// Stops sharing the same ~111m grid cell get spread into a small circle so all
// pins are visible — mirrors resolveOverlaps in TodayPage.
function resolveStopOverlaps(allStops, centroids) {
  const grid = new Map();
  allStops.forEach((s) => {
    const c = stopCoord(s, centroids);
    if (!c) return;
    const key = `${c[0].toFixed(3)},${c[1].toFixed(3)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(s);
  });
  const coordMap = new Map();
  const clusters = [];
  for (const [, group] of grid) {
    if (group.length < 2) continue;
    const base = stopCoord(group[0], centroids);
    const r = 0.00022 + group.length * 0.00006;
    clusters.push([base, group.length]);
    group.forEach((s, i) => {
      const angle = (2 * Math.PI * i) / group.length - Math.PI / 2;
      coordMap.set(s.orderReference, [
        base[0] + r * Math.cos(angle),
        base[1] + r * Math.sin(angle),
      ]);
    });
  }
  return { coordMap, clusters };
}

// ─── Live driver tracking map (in-app, Leaflet) ───────────────────────────────
// Plots each truck's latest GPS ping (polled) AND its assigned route — warehouse
// → numbered stops, coloured per truck — from the current manifest. Fully
// self-contained, no external navigation app.
function LiveDriverMap({ manifest }) {
  const containerRef  = useRef(null);
  const mapRef        = useRef(null);
  const markersRef    = useRef({});
  const routeLayerRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [zones, setZones] = useState(null);
  const [ready, setReady] = useState(false);

  // Poll locations every 30s.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/delivery/driver-locations")
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (!cancelled && d) setLocations(d.locations || []); })
        .catch(() => {});
    load();
    const id = setInterval(load, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Zone reference (warehouse + centroids) for plotting the route.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/delivery/zones")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setZones(d); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // Init Leaflet map once.
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
      L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd", maxZoom: 19,
        attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>'
      }).addTo(map);
      map.setView([1.3521, 103.8198], 11); // Singapore
      mapRef.current = map;
      setReady(true);
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Sync markers to the latest locations.
  useEffect(() => {
    if (!ready || !mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const live = locations.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng));
      live.forEach((l) => {
        const color = TRUCK_TINT[l.truckId] || "#E8B964";
        const dim = l.live ? 1 : 0.4;
        const html = `<div style="display:flex;flex-direction:column;align-items:center;opacity:${dim}">`
          + `<div style="width:18px;height:18px;border-radius:50%;background:${color};border:2px solid #0E0C07;box-shadow:0 0 0 2px ${color};"></div>`
          + `<div style="margin-top:2px;font:600 10px ui-sans-serif,sans-serif;color:${color};white-space:nowrap;text-shadow:0 1px 2px #000">${escapeHtml(TRUCK_LABEL[l.truckId] || l.truckId)}</div></div>`;
        const icon = L.divIcon({ html, className: "", iconSize: [60, 34], iconAnchor: [30, 9] });
        const label = `${escapeHtml(TRUCK_LABEL[l.truckId] || l.truckId)} · ${escapeHtml(l.driverName || "driver")} · ${l.live ? "live" : "last seen"} ${agoLabel(l.ageSeconds)}`;
        if (markersRef.current[l.truckId]) {
          markersRef.current[l.truckId].setLatLng([l.lat, l.lng]).setIcon(icon).bindTooltip(label, { direction: "top" });
        } else {
          markersRef.current[l.truckId] = L.marker([l.lat, l.lng], { icon }).bindTooltip(label, { direction: "top" }).addTo(mapRef.current);
        }
      });
      // Remove markers for trucks no longer reported.
      Object.keys(markersRef.current).forEach((id) => {
        if (!live.find((l) => l.truckId === id)) {
          mapRef.current.removeLayer(markersRef.current[id]);
          delete markersRef.current[id];
        }
      });
    });
  }, [locations, ready]);

  // Draw each truck's assigned route — warehouse → numbered stops — from the
  // manifest. Redrawn whenever the manifest (or selected day) changes.
  useEffect(() => {
    if (!ready || !mapRef.current || !zones) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      if (routeLayerRef.current) { mapRef.current.removeLayer(routeLayerRef.current); routeLayerRef.current = null; }
      const layer = L.layerGroup();
      const wh = zones.warehouse;

      const allStops = (manifest?.manifests || []).flatMap((m) => m.stops || []);
      const { coordMap, clusters } = resolveStopOverlaps(allStops, zones.centroids);

      // Faint dashed rings where stops were spread so staff can see co-located stops.
      clusters.forEach(([base]) => {
        L.circle(base, { radius: 35, color: "#ffffff", weight: 1, opacity: 0.25, fill: false, dashArray: "4 6" }).addTo(layer);
      });

      (manifest?.manifests || []).forEach((m) => {
        const color = TRUCK_TINT[m.truckId] || "#E8B964";
        const coords = (m.stops || []).map((s) => coordMap.get(s.orderReference) || stopCoord(s, zones.centroids)).filter(Boolean);
        if (!coords.length) return;
        const line = wh ? [[wh.lat, wh.lng], ...coords] : coords;
        L.polyline(line, { color, weight: 3, opacity: 0.6, dashArray: "6 7" }).addTo(layer);
        (m.stops || []).forEach((s, i) => {
          const c = coordMap.get(s.orderReference) || stopCoord(s, zones.centroids);
          if (!c) return;
          const html = `<div style="width:22px;height:22px;border-radius:50%;background:${color};color:#0E0C07;`
            + `font:700 11px ui-sans-serif,sans-serif;display:flex;align-items:center;justify-content:center;`
            + `border:2px solid #0E0C07;box-shadow:0 0 0 1px ${color}">${i + 1}</div>`;
          const icon = L.divIcon({ html, className: "", iconSize: [22, 22], iconAnchor: [11, 11] });
          L.marker(c, { icon })
            .bindTooltip(`#${i + 1} · ${escapeHtml(s.customer || s.orderReference)} · ${escapeHtml(s.zone || "")}`, { direction: "top" })
            .addTo(layer);
        });
      });

      if (wh) {
        const whIcon = L.divIcon({
          html: `<div style="width:14px;height:14px;border-radius:3px;background:#F4ECD8;border:2px solid #0E0C07"></div>`,
          className: "", iconSize: [14, 14], iconAnchor: [7, 7]
        });
        L.marker([wh.lat, wh.lng], { icon: whIcon }).bindTooltip("Warehouse · Keppel Rd", { direction: "top" }).addTo(layer);
      }

      layer.addTo(mapRef.current);
      routeLayerRef.current = layer;
    });
  }, [manifest, zones, ready]);

  // Fit the map to everything currently shown: route stops, warehouse, live GPS.
  useEffect(() => {
    if (!ready || !mapRef.current || !zones) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const pts = [];
      (manifest?.manifests || []).forEach((m) =>
        (m.stops || []).forEach((s) => { const c = stopCoord(s, zones.centroids); if (c) pts.push(c); })
      );
      locations.filter((l) => Number.isFinite(l.lat) && Number.isFinite(l.lng)).forEach((l) => pts.push([l.lat, l.lng]));
      if (zones.warehouse) pts.push([zones.warehouse.lat, zones.warehouse.lng]);
      if (pts.length) mapRef.current.fitBounds(L.latLngBounds(pts).pad(0.3), { maxZoom: 14 });
    });
  }, [manifest, zones, ready, locations]);

  const anyLive = locations.some((l) => l.live);
  const routeStops = (manifest?.manifests || []).reduce((n, m) => n + (m.stops?.length || 0), 0);

  return (
    <div className="card" style={{ marginBottom: "var(--sp-3)", padding: 0 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
        <div>
          <div className="hl" style={{ fontWeight: 700 }}>Live Driver Tracking</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
            Assigned routes + live GPS · drivers ping every 2 min while on an active route
          </div>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: anyLive ? "var(--green, #4FD08A)" : "var(--muted)" }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: anyLive ? "#4FD08A" : "#7a6e5c" }} />
          {anyLive ? "Live" : "No active drivers"}
        </span>
      </div>
      <div style={{ position: "relative", height: 280, overflow: "hidden", isolation: "isolate", background: "#15130E" }}>
        <div ref={containerRef} style={{ height: "100%", width: "100%" }} />
      </div>
      <div style={{ display: "flex", gap: 16, flexWrap: "wrap", padding: "10px 16px", fontSize: 12, color: "var(--cream-dim, var(--muted))" }}>
        {locations.length === 0 && (
          <span style={{ color: "var(--muted)" }}>
            {routeStops > 0 ? `${routeStops} stops routed · no driver GPS pings yet` : "No routes or GPS pings yet."}
          </span>
        )}
        {locations.map((l) => (
          <span key={l.truckId} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: TRUCK_TINT[l.truckId] || "#E8B964", opacity: l.live ? 1 : 0.4 }} />
            <b>{TRUCK_LABEL[l.truckId] || l.truckId}</b> {l.driverName || "—"} · {l.live ? "live" : "last seen"} {agoLabel(l.ageSeconds)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Status helpers ───────────────────────────────────────────────────────────
function statusClass(status) {
  const s = String(status || "").toLowerCase();
  if (/deliver|confirm|clos/.test(s))       return "del";
  if (/out for|en route|dispatch/.test(s))  return "enr";
  return "pen";
}

function todaySGT() {
  return new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", timeZone: "Asia/Singapore"
  });
}

// ─── Truck visual identity ──────────────────────────────────────────────────
const TRUCK_STYLE = [
  { stroke: "#FFCD4D", fill: "#F5B51C", icoStyle: { background: "rgba(245,181,28,0.16)", border: "1px solid var(--honey-deep)" }, no: "t1" },
  { stroke: "#FF9F40", fill: "#FF9F40", icoStyle: { background: "rgba(255,159,64,0.14)", border: "1px solid #a8631f" },           no: "t2" }
];

// Approximate centre of each zone on the stylized coverage map (viewBox 460x380),
// so live stops can be plotted by their zone instead of hardcoded points.
const ZONE_XY = {
  W1: { x: 60,  y: 152 }, W2: { x: 92,  y: 168 }, W3: { x: 112, y: 138 },
  C1: { x: 190, y: 176 }, C2: { x: 212, y: 192 }, C3: { x: 200, y: 150 },
  N1: { x: 210, y: 86 },  N2: { x: 240, y: 74 },  N3: { x: 266, y: 96 },
  NE1:{ x: 334, y: 108 }, NE2:{ x: 360, y: 130 }, NE3:{ x: 344, y: 150 },
  E1: { x: 314, y: 234 }, E2: { x: 346, y: 250 }, E3: { x: 362, y: 224 }
};

// Build the route polyline + numbered pins for one truck from its live stops.
function truckGeometry(truck, styleIndex) {
  const style = TRUCK_STYLE[styleIndex % TRUCK_STYLE.length];
  const pts = truck.stops.slice(0, 8).map((stop, idx) => {
    const base = ZONE_XY[stop.zone] || { x: 230, y: 190 };
    const dx = ((idx % 3) - 1) * 9;
    const dy = (Math.floor(idx / 3) - 1) * 9;
    return { x: base.x + dx, y: base.y + dy, n: idx + 1, delivered: statusClass(stop.status) === "del" };
  });
  const line = pts.map((p, idx) => `${idx === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  return { ...style, pts, line };
}

function TruckIcon({ stroke }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth="2">
      <path d="M2 7h11v9H2z" />
      <path d="M13 10h4l3 3v3h-7z" />
      <circle cx="6" cy="18" r="1.6" />
      <circle cx="16" cy="18" r="1.6" />
    </svg>
  );
}

// ─── Demo fallback (shown in /demo and before live events arrive) ────────────
const DEMO_TRUCKS = [
  {
    name: "Truck 1", driver: "Driver 1", zones: ["W1", "W2", "C1"],
    label: "west & central loop", meta: "est 5h 40m · W1 W2 C1", totalStops: 14,
    stops: [
      { no: "BV2026060500014", eta: "8:05",  addr: "Blk 650A Jurong West St 61 #11-220", zone: "W1", status: "Delivered" },
      { no: "844512330091",    eta: "8:24",  addr: "Blk 518 Jurong West St 52 #04-88",   zone: "W1", status: "Delivered" },
      { no: "260605UT1T78J4",  eta: "8:51",  addr: "Blk 233 Boon Lay Dr #08-145",        zone: "W1", status: "En route" },
      { no: "BV2026060500021", eta: "9:18",  addr: "Blk 412 Clementi Ave 1 #10-302",     zone: "W2", status: "Pending" },
      { no: "260605KP9M21XR",  eta: "9:44",  addr: "28 Holland Grove Rd",                zone: "W2", status: "Pending" },
      { no: "844599017724",    eta: "10:20", addr: "Blk 7 Everton Park #02-21",          zone: "C1", status: "Pending" }
    ]
  },
  {
    name: "Truck 2", driver: "Driver 2", zones: ["NE1", "NE2", "NE3", "E2"],
    label: "northeast & east loop", meta: "est 6h 05m · NE1-NE3 E2", totalStops: 16,
    stops: [
      { no: "844603221890",    eta: "8:10",  addr: "Blk 682C Punggol Dr #14-330",         zone: "NE1", status: "Delivered" },
      { no: "260605SK4P09LM",  eta: "8:33",  addr: "Blk 313B Sengkang East Way #09-12",   zone: "NE1", status: "Delivered" },
      { no: "BV2026060500018", eta: "9:02",  addr: "Blk 201 Hougang St 21 #07-444",       zone: "NE2", status: "En route" },
      { no: "844611450037",    eta: "9:30",  addr: "Blk 156 Serangoon Nth Ave 1 #03-77",  zone: "NE2", status: "Pending" },
      { no: "260605LY7Q33ZT",  eta: "10:05", addr: "206 Loyang Ave",                      zone: "E2",  status: "Pending" },
      { no: "BV2026060500025", eta: "10:38", addr: "Blk 720 Tampines St 72 #12-08",       zone: "E2",  status: "Pending" }
    ]
  }
];

function manifestToTruck(m) {
  return {
    name: m.truck, driver: m.driverName, zones: m.zones || [],
    label: m.label, meta: (m.zones || []).join(" ") || "zones pending",
    totalStops: m.totalStops,
    stops: (m.stops || []).map((s) => ({
      no:       s.orderReference,
      eta:      s.eta || "--:--",
      addr:     s.address || s.customer,
      zone:     s.zone,
      customer: s.customer,
      phone:    s.phone,
      items:    s.itemsSummary,
      status:   s.status
    }))
  };
}

// ─── CSV export ───────────────────────────────────────────────────────────────
function csvCell(value) {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportManifestCSV(trucks) {
  const header = ["Truck", "Driver", "Seq", "Order Reference", "Customer", "Phone", "Zone", "Address", "Items", "ETA", "Status"];
  const rows = [header];
  for (const t of trucks) {
    t.stops.forEach((s, i) => {
      rows.push([t.name, t.driver, i + 1, s.no, s.customer || "", s.phone || "", s.zone || "", s.addr || "", s.items || "", s.eta || "", s.status || ""]);
    });
  }
  const csv  = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `beeva-delivery-manifest-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ─── Truck card ────────────────────────────────────────────────────────────────
function TruckCard({ truck, style }) {
  const shown = truck.stops.slice(0, 6);
  const extra = truck.totalStops - shown.length;
  const portalUrl = "/driver-portal";
  return (
    <div className="card route-card">
      <div className="route-top">
        <div className="truck-ico" style={style.icoStyle}><TruckIcon stroke={style.stroke} /></div>
        <div>
          <div className="nm">{truck.name}</div>
          <div className="driver">{truck.driver}</div>
        </div>
        <div className="stats">
          <div className="big">{truck.totalStops} stops</div>
          <div className="sm">{truck.meta}</div>
        </div>
        <a
          href={portalUrl}
          target="_blank"
          rel="noreferrer"
          title={`Open driver portal — ${truck.driver} signs in with their credentials`}
          style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "6px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600,
            background: style.fill, color: "#0E0C07",
            textDecoration: "none", whiteSpace: "nowrap", flexShrink: 0
          }}
        >
          Driver App &rarr;
        </a>
      </div>
      <div className="route-zones">
        {truck.zones.map((z) => <span className="zone" key={z}>{z}</span>)}
        {truck.label && (
          <span style={{ fontSize: "11px", color: "var(--muted)", alignSelf: "center", marginLeft: 4 }}>
            &middot; {truck.label}
          </span>
        )}
      </div>
      <div className="stops">
        {shown.map((stop, index) => (
          <div className="stop" key={stop.no || index}>
            <div className={`stop-no ${style.no}`}>{index + 1}</div>
            <div className="eta">{stop.eta}</div>
            <div className="addr">
              {stop.addr} <span className="o">{stop.no}</span>
            </div>
            <div className="st">
              <span className={`ministat ${statusClass(stop.status)}`}>{stop.status}</span>
              {statusClass(stop.status) === "del" && (
                <svg className="podok" viewBox="0 0 24 24" fill="none" stroke="#4FD08A" strokeWidth="2">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </div>
          </div>
        ))}
        {extra > 0 && (
          <div style={{ textAlign: "center", padding: "8px", fontSize: "11px", color: "var(--muted)" }}>
            + {extra} more stops &middot; tap a stop to view in driver app
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Unassigned stops (red) ──────────────────────────────────────────────────
// Orders whose postal code matched no zone and that have no manual truck. They
// are deliberately NOT placed on any truck — a dispatcher must assign one.
function UnassignedSection({ stops }) {
  if (!stops?.length) return null;
  return (
    <div
      className="card"
      style={{
        border: "1px solid #E8736B",
        background: "rgba(232,115,107,0.07)",
        marginBottom: "var(--sp-3)",
        padding: "14px 16px"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#E8736B" strokeWidth="2">
          <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
        <b style={{ color: "#E8736B" }}>{stops.length} unassigned stop{stops.length > 1 ? "s" : ""}</b>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          — postal code didn&rsquo;t match any zone. Assign a truck manually before dispatch.
        </span>
      </div>
      <div className="stops">
        {stops.map((s, i) => (
          <div className="stop" key={s.orderReference || i}>
            <div className="stop-no" style={{ background: "rgba(232,115,107,0.18)", color: "#E8736B" }}>!</div>
            <div className="eta">{s.eta || "--:--"}</div>
            <div className="addr">
              {s.address || s.customer} <span className="o">{s.orderReference}</span>
            </div>
            <div className="st">
              <span className="ministat pen">{s.zone && s.zone !== "Unknown" ? s.zone : "No zone"}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Daily driver ↔ zone assignment (admin) ──────────────────────────────────
// Beeva Office reallocates drivers daily. This control sets, for today, which
// driver runs each truck and which zone sectors each truck covers.
function DriverAssignment({ serviceDate = "today", onSaved }) {
  const [data, setData]       = useState(null);
  const [drivers, setDrivers] = useState({});
  const [sectors, setSectors] = useState({});
  const [saving, setSaving]   = useState(false);
  const [status, setStatus]   = useState(null);

  useEffect(() => {
    let cancelled = false;
    setStatus(null);
    fetch(`/api/delivery/assignment?serviceDate=${serviceDate}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && !cancelled) { setData(d); setDrivers(d.drivers || {}); setSectors(d.sectors || {}); } })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [serviceDate]);

  if (!data) return null;
  const trucks = data.trucks || [];

  async function save() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/delivery/assignment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ drivers, sectors, serviceDate })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Save failed");
      setData((prev) => (prev ? { ...prev, source: "custom" } : prev));
      setStatus("Saved · click “Refresh Driver Routes” to push it to the drivers");
      if (onSaved) onSaved();
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  // Drop today's manual override → orders auto-assign to trucks by delivery zone.
  async function resetAuto() {
    setSaving(true);
    setStatus(null);
    try {
      const res = await fetch("/api/delivery/assignment/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceDate })
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "Reset failed");
      setData(j);
      setDrivers(j.drivers || {});
      setSectors(j.sectors || {});
      setStatus("Reset to automatic · trucks now assigned by delivery zone · click “Refresh Driver Routes” to push it");
      if (onSaved) onSaved();
    } catch (e) {
      setStatus(`Error: ${e.message}`);
    } finally {
      setSaving(false);
    }
  }

  const inputStyle = {
    width: "100%", boxSizing: "border-box", background: "var(--bg)",
    border: "1px solid var(--rule-strong, var(--line-soft))", borderRadius: 6,
    color: "var(--cream, var(--ink))", fontSize: 13, padding: "8px 10px", outline: "none", fontFamily: "inherit"
  };

  return (
    <div className="card" style={{ marginBottom: "var(--sp-3)", padding: "16px 18px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14, flexWrap: "wrap" }}>
        <div>
          <div className="hl" style={{ fontWeight: 700 }}>{serviceDate === "next" ? "Tomorrow's" : "Today's"} Driver Assignment</div>
          <div style={{ fontSize: 11.5, color: "var(--muted)" }}>
            Reassign drivers &amp; zones for {data.serviceDate} · {data.source === "custom" ? "manual override active" : "automatic (by delivery zone)"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {data.source === "custom" && (
            <button type="button" className="btn" onClick={resetAuto} disabled={saving} title="Drop today's manual override — assign trucks automatically by delivery zone">
              Reset to automatic
            </button>
          )}
          <button type="button" className="btn" onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save Assignment"}
          </button>
        </div>
      </div>

      {/* Driver per truck */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
        {trucks.map((t) => (
          <label key={t.id} style={{ fontSize: 12 }}>
            <div style={{ color: "var(--muted)", marginBottom: 5 }}>{t.name} driver <span style={{ opacity: 0.7 }}>· {t.label}</span></div>
            <input
              value={drivers[t.id] || ""}
              onChange={(e) => setDrivers((p) => ({ ...p, [t.id]: e.target.value }))}
              placeholder={t.defaultDriver}
              style={inputStyle}
            />
          </label>
        ))}
      </div>

      {/* Sector → truck */}
      <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>Which truck runs each zone sector</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {(data.sectorList || []).map((sec) => (
          <div key={sec} style={{ border: "1px solid var(--line-soft)", borderRadius: 8, padding: "6px 8px", minWidth: 92 }}>
            <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 5, color: "var(--cream, var(--ink))" }}>Sector {sec}</div>
            <div style={{ display: "flex", gap: 4 }}>
              {trucks.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSectors((p) => ({ ...p, [sec]: t.id }))}
                  className={`fchip ${sectors[sec] === t.id ? "on" : ""}`}
                  style={{ fontSize: 10, padding: "3px 9px" }}
                >
                  {t.name.replace("Truck ", "T")}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {status && <div className="status-line" style={{ marginTop: 12 }}>{status}</div>}
    </div>
  );
}

export default function DeliveryPage({ isDemo = false }) {
  const [manifest, setManifest] = useState(null);
  const [optimizing, setOptimizing] = useState(false);
  const [optimizeInfo, setOptimizeInfo] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedInfo, setSeedInfo] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshInfo, setRefreshInfo] = useState(null);
  const [dayMode, setDayMode] = useState("today"); // "today" | "next" (tomorrow)

  async function reloadManifest() {
    try {
      const res = await fetch(`/api/delivery/manifest?serviceDate=${dayMode}`);
      if (res.ok) setManifest(await res.json());
    } catch { /* keep existing manifest */ }
  }

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    fetch(`/api/delivery/manifest?serviceDate=${dayMode}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`Manifest API error: ${res.status}`);
        return res.json();
      })
      .then((json) => { if (!cancelled) setManifest(json); })
      .catch((error) => { if (!cancelled) setManifest({ mode: "fallback", error: error.message, manifests: [] }); });
    return () => { cancelled = true; };
  }, [isDemo, dayMode]);

  async function optimizeRoutes() {
    setOptimizing(true);
    setOptimizeInfo(null);
    try {
      const res = await fetch("/api/delivery/optimize");
      if (!res.ok) throw new Error(`Optimize error: ${res.status}`);
      const json = await res.json();
      setManifest(json);
      setOptimizeInfo({
        optimizer: json.optimizer,
        distance: json.totalDistanceKm,
        at: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Singapore" })
      });
    } catch (error) {
      setOptimizeInfo({ error: error.message });
    } finally {
      setOptimizing(false);
    }
  }

  // Freeze the current live routes as the selected day's driver snapshot (what
  // drivers see). dayMode picks today or tomorrow's run.
  async function refreshDriverRoutes() {
    setRefreshing(true);
    setRefreshInfo(null);
    try {
      const res = await fetch("/api/delivery/manifest/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceDate: dayMode })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Refresh failed (${res.status})`);
      const total = (json.manifests || []).reduce((sum, m) => sum + m.totalStops, 0);
      setRefreshInfo({
        total,
        day: dayMode === "next" ? "tomorrow" : "today",
        at: new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Singapore" })
      });
    } catch (error) {
      setRefreshInfo({ error: error.message });
    } finally {
      setRefreshing(false);
    }
  }

  async function seedSampleDeliveries() {
    setSeeding(true);
    setSeedInfo(null);
    try {
      const res = await fetch("/api/admin/sync/seed-sample-deliveries", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || `Seed failed (${res.status})`);
      setSeedInfo({ seeded: json.seeded, skipped: json.skipped });
      // Reload manifest so the new stops appear immediately
      const mRes = await fetch("/api/delivery/manifest");
      if (mRes.ok) setManifest(await mRes.json());
    } catch (error) {
      setSeedInfo({ error: error.message });
    } finally {
      setSeeding(false);
    }
  }

  const liveTrucks = (manifest?.manifests || []).filter((m) => m.totalStops > 0).map(manifestToTruck);
  const usingLive  = !isDemo && liveTrucks.length > 0;
  const trucks     = usingLive ? liveTrucks : DEMO_TRUCKS;

  const totalStops = trucks.reduce((sum, t) => sum + t.totalStops, 0);
  // Delivered stops are now excluded from the run, so the live delivered count
  // comes from the API (deliveredCount); demo mode still derives it from stops.
  const delivered  = usingLive
    ? (manifest?.deliveredCount ?? 0)
    : trucks.reduce((sum, t) => sum + t.stops.filter((s) => statusClass(s.status) === "del").length, 0);
  const progressTotal = usingLive ? delivered + totalStops : totalStops;
  const activeZones = new Set(trucks.flatMap((t) => t.zones)).size;

  return (
    <section className="panel active" id="delivery">
      <div className="panel-head">
        <div>
          <h2>Delivery &amp; Routes</h2>
          <div className="sub">
            {todaySGT()} &middot; {trucks.length} trucks &middot; {totalStops} stops sequenced overnight
            {usingLive ? " · live bridge" : ""}
          </div>
        </div>
        <div className="right-note" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <div>
            Stops {dayMode === "next" ? "(tomorrow)" : "today"}<br />
            <b>{delivered} of {progressTotal}</b> delivered
          </div>
          {!isDemo && (
            <div className="ts-seg" role="group" aria-label="Service day" style={{ display: "inline-flex", gap: 3, padding: 3, border: "1px solid var(--line)", borderRadius: 10 }}>
              <button type="button" className={`fchip ${dayMode === "today" ? "on" : ""}`} onClick={() => setDayMode("today")} style={{ fontSize: 12, padding: "5px 12px" }}>Today</button>
              <button type="button" className={`fchip ${dayMode === "next" ? "on" : ""}`} onClick={() => setDayMode("next")} style={{ fontSize: 12, padding: "5px 12px" }}>Tomorrow</button>
            </div>
          )}
          {!isDemo && (
            <button type="button" className="btn" onClick={seedSampleDeliveries} disabled={seeding} title="Load 12 sample stops across both trucks (idempotent)">
              {seeding ? "Seeding…" : "Load Sample Deliveries"}
            </button>
          )}
          {!isDemo && (
            <button type="button" className="btn" onClick={optimizeRoutes} disabled={optimizing}>
              {optimizing ? "Optimising…" : "Optimize Routes"}
            </button>
          )}
          {!isDemo && (
            <button type="button" className="btn" onClick={refreshDriverRoutes} disabled={refreshing} title="Freeze the selected day's routes as the driver run (drivers reload to see the update)">
              {refreshing ? "Refreshing…" : `Refresh Driver Routes${dayMode === "next" ? " · Tomorrow" : ""}`}
            </button>
          )}
          <button type="button" className="btn" onClick={() => exportManifestCSV(trucks)}>
            Export Manifest CSV
          </button>
        </div>
      </div>

      {optimizeInfo && (
        <div className="status-line" style={{ marginBottom: "var(--sp-2)" }}>
          {optimizeInfo.error
            ? `Route optimisation failed: ${optimizeInfo.error}`
            : `Routes ${optimizeInfo.optimizer === "vrp" ? "optimised (VRP solver)" : "sequenced (nearest-neighbour fallback)"}${optimizeInfo.distance ? ` · ${optimizeInfo.distance.toFixed(1)} km total` : ""} · ${optimizeInfo.at} SGT`}
        </div>
      )}

      {seedInfo && (
        <div className="status-line" style={{ marginBottom: "var(--sp-2)" }}>
          {seedInfo.error
            ? `Sample seed failed: ${seedInfo.error}`
            : `${seedInfo.seeded} sample stops loaded${seedInfo.skipped > 0 ? ` · ${seedInfo.skipped} already existed (skipped)` : ""} · Truck 1 & Truck 2 manifests updated`}
        </div>
      )}

      {refreshInfo && (
        <div className="status-line" style={{ marginBottom: "var(--sp-2)" }}>
          {refreshInfo.error
            ? `Driver route refresh failed: ${refreshInfo.error}`
            : `Driver routes refreshed · ${refreshInfo.total} stops frozen for ${refreshInfo.day || "today"} · drivers see the update on next reload · ${refreshInfo.at} SGT`}
        </div>
      )}

      {!isDemo && manifest?.unassigned?.length > 0 && (
        <UnassignedSection stops={manifest.unassigned} />
      )}

      <div className="deliv-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2l2.4 4.9 5.4.8-3.9 3.8.9 5.3L12 14.3 7.2 16.8l.9-5.3L4.2 7.7l5.4-.8z" />
        </svg>
        <div className="bt">
          <b>Routes auto-sequenced nightly.</b> Drivers receive their run in the driver app the moment they clock in - no more self-routing, no printed lists, no morning phone calls.
        </div>
      </div>

      {!isDemo && <DriverAssignment serviceDate={dayMode} onSaved={reloadManifest} />}

      {!isDemo && <LiveDriverMap manifest={manifest} />}

      <div className="deliv-grid">
        <div className="routes-col">
          {trucks.map((truck, i) => (
            <TruckCard key={truck.name} truck={truck} style={TRUCK_STYLE[i % TRUCK_STYLE.length]} />
          ))}
        </div>

        {/* MAP */}
        <div className="card map-card">
          <div className="mh">
            <div className="hl">Today's Coverage</div>
            <div style={{ fontSize: "11.5px", color: "var(--muted)" }}>15 zones mapped &middot; {activeZones} on today's runs</div>
          </div>
          <svg viewBox="0 0 460 380" style={{ width: "100%", height: "auto" }}>
            <defs>
              <radialGradient id="zg" cx="50%" cy="40%">
                <stop offset="0" stopColor="#241d11" />
                <stop offset="1" stopColor="#16120a" />
              </radialGradient>
            </defs>
            {/* zone blobs */}
            <path d="M30,150 Q20,90 80,80 Q130,70 150,120 Q160,170 120,200 Q60,220 40,190 Z" fill="url(#zg)" stroke="#3a3019" strokeWidth="1.5" />
            <text x="80" y="135" fill="#8C8266" fontSize="13" fontFamily="Georgia" fontWeight="700">WEST</text>
            <text x="62" y="152" fill="#5F583F" fontSize="10" fontFamily="monospace">W1 W2 W3</text>
            <path d="M160,170 Q150,120 200,115 Q250,110 255,160 Q258,205 215,215 Q170,218 160,190 Z" fill="url(#zg)" stroke="#3a3019" strokeWidth="1.5" />
            <text x="190" y="165" fill="#8C8266" fontSize="12" fontFamily="Georgia" fontWeight="700">CENTRAL</text>
            <text x="182" y="182" fill="#5F583F" fontSize="10" fontFamily="monospace">C1 C2 C3</text>
            <path d="M180,60 Q230,30 290,55 Q320,75 300,115 Q270,140 220,120 Q180,105 180,60 Z" fill="url(#zg)" stroke="#3a3019" strokeWidth="1.5" />
            <text x="225" y="80" fill="#8C8266" fontSize="13" fontFamily="Georgia" fontWeight="700">NORTH</text>
            <text x="210" y="97" fill="#5F583F" fontSize="10" fontFamily="monospace">N1 N2 N3</text>
            <path d="M300,75 Q360,55 405,95 Q430,130 400,165 Q360,185 320,160 Q295,130 300,75 Z" fill="url(#zg)" stroke="#3a3019" strokeWidth="1.5" />
            <text x="335" y="115" fill="#8C8266" fontSize="11" fontFamily="Georgia" fontWeight="700">NE</text>
            <text x="322" y="132" fill="#5F583F" fontSize="9" fontFamily="monospace">NE1 NE2 NE3</text>
            <path d="M280,200 Q340,180 400,210 Q435,235 405,275 Q355,300 300,275 Q270,245 280,200 Z" fill="url(#zg)" stroke="#3a3019" strokeWidth="1.5" />
            <text x="330" y="245" fill="#8C8266" fontSize="13" fontFamily="Georgia" fontWeight="700">EAST</text>
            <text x="312" y="262" fill="#5F583F" fontSize="10" fontFamily="monospace">E1 E2 E3</text>

            {trucks.map((truck, ti) => {
              const g = truckGeometry(truck, ti);
              if (g.pts.length === 0) return null;
              return (
                <g key={truck.name}>
                  {g.pts.length > 1 && (
                    <path d={g.line} fill="none" stroke={g.stroke} strokeWidth="2.5" strokeLinecap="round" strokeDasharray="2 6" opacity="0.85" />
                  )}
                  <g fontFamily="monospace" fontSize="9" fontWeight="700">
                    {g.pts.map((p) => (
                      <g key={p.n}>
                        <circle
                          cx={p.x} cy={p.y} r="9"
                          fill={p.delivered ? g.fill : "#241d11"}
                          stroke={p.delivered ? "none" : g.fill}
                          strokeWidth={p.delivered ? 0 : 1.5}
                        />
                        <text x={p.x} y={p.y + 3.5} fill={p.delivered ? "#0E0C07" : g.stroke} textAnchor="middle">{p.n}</text>
                      </g>
                    ))}
                  </g>
                </g>
              );
            })}
          </svg>
          <div className="map-legend">
            <span><i style={{ background: "#FFCD4D" }}></i>{trucks[0]?.name || "Truck 1"} &middot; {trucks[0]?.driver || "Driver 1"}</span>
            <span><i style={{ background: "#FF9F40" }}></i>{trucks[1]?.name || "Truck 2"} &middot; {trucks[1]?.driver || "Driver 2"}</span>
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
