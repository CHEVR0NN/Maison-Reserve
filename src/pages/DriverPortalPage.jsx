import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { escapeHtml } from "../utils.js";
import { useAppData } from "../context/AppData.jsx";
import { useInterval } from "../hooks/useInterval.js";
import { stepsForSegment } from "../mock/delivery.js";
import { DRIVERS } from "../mock/people.js";

// ─── Constants ────────────────────────────────────────────────────────────────
const TRUCK_COLOR = { truck_1: "#14B8A6", truck_2: "#F59E0B" };
const TRUCK_NAME = { truck_1: "Truck 1", truck_2: "Truck 2" };
const PANEL_H = { mini: "76px", half: "46vh", full: "88vh" };
const TILE_URL = {
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

// ─── CSS-variable palette refs — these alias the SAME shared design tokens as
// the main app (styles.css), so the Driver Portal never drifts into its own
// visual language even though it's a separate route/shell.
const C = {
  bg: "var(--c-bg)", surface: "var(--c-surface)", surface2: "var(--c-surface2)",
  hair: "var(--c-hair)", hair2: "var(--c-hair2)", gold: "var(--c-gold)", goldSoft: "var(--c-goldSoft)",
  text: "var(--c-text)", textDim: "var(--c-textDim)", textFaint: "var(--c-textFaint)",
  green: "var(--c-green)", greenSoft: "var(--c-greenSoft)", red: "var(--c-red)",
};
const HEX = {
  dark: { gold: "#14B8A6", green: "#10B981", textDim: "#94A3B8", bg: "#020617" },
  light: { gold: "#0D9488", green: "#059669", textDim: "#475569", bg: "#F1F5F9" },
};

const GLOBAL_CSS = `
  .dp.dark {
    --c-bg: var(--bg); --c-surface: var(--surface); --c-surface2: var(--surface-2);
    --c-hair: var(--line-soft); --c-hair2: rgba(148,163,184,.06);
    --c-gold: var(--honey); --c-goldDark: var(--honey-deep); --c-goldSoft: var(--amber-glow);
    --c-text: var(--cream); --c-textDim: var(--cream-dim); --c-textFaint: var(--muted);
    --c-green: var(--green); --c-greenSoft: var(--green-bg); --c-red: var(--red);
    --c-headerBg: rgba(2,6,23,.88);
  }
  .dp.light {
    --c-bg: var(--bg); --c-surface: var(--surface); --c-surface2: var(--surface-2);
    --c-hair: var(--line-soft); --c-hair2: rgba(51,65,85,.06);
    --c-gold: var(--honey); --c-goldDark: var(--honey-deep); --c-goldSoft: var(--amber-glow);
    --c-text: var(--cream); --c-textDim: var(--cream-dim); --c-textFaint: var(--muted);
    --c-green: var(--green); --c-greenSoft: var(--green-bg); --c-red: var(--red);
    --c-headerBg: rgba(241,245,249,.92);
  }
  .dp * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .dp button { transition: transform .12s ease, opacity .12s ease, background .15s ease; cursor: pointer; }
  .dp button:active { transform: scale(.97); }
  .dp .panel { transition: height .42s cubic-bezier(.25,.46,.45,.94); overflow: hidden; will-change: height; }
  .dp .panel-scroll::-webkit-scrollbar { width: 0; }
  .dp .panel-dragging { transition: none !important; }
  .dp.dark  .leaflet-container { background: #0A0F1E; }
  .dp.light .leaflet-container { background: #E2E8F0; }
  .dp .leaflet-container { font-family: inherit; }
  .dp .leaflet-control-attribution { font-size: 9px; backdrop-filter: blur(4px); border-radius: 6px !important; }
  .dp .leaflet-tooltip { background: var(--c-surface2); border: 1px solid var(--c-hair); color: var(--c-text); border-radius: 9px; font-size: 12px; font-weight: 600; box-shadow: 0 4px 14px rgba(0,0,0,.18); padding: 5px 10px; }
  @keyframes pinPulse { 0%,100%{transform:scale(1);opacity:.22}50%{transform:scale(1.4);opacity:0} }
  .dp .pin-pulse > div:first-child { animation: pinPulse 2s ease-in-out infinite; }
  @keyframes sheetUp { from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1} }
  .dp .sheet-anim { animation: sheetUp .22s ease; }
  .dp input { background: var(--c-bg); color: var(--c-text); }
  .dp input:focus { border-color: var(--c-gold) !important; box-shadow: 0 0 0 3px var(--c-goldSoft); outline: none; }
`;

const F = "'Inter', ui-sans-serif, -apple-system, 'SF Pro Display', Segoe UI, Roboto, sans-serif";
const S = {
  root: { display: "flex", flexDirection: "column", height: "100dvh", background: C.bg, color: C.text, fontFamily: F, overflow: "hidden", WebkitFontSmoothing: "antialiased" },
  center: { display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100dvh", padding: 20, background: C.bg, fontFamily: F },
  loginCard: { width: "100%", maxWidth: 380, background: C.surface, border: `1px solid ${C.hair}`, borderRadius: 26, padding: "38px 28px", boxShadow: "0 28px 70px rgba(0,0,0,.32)" },
  loginSub: { fontSize: 12, color: C.textFaint, marginTop: 6, marginBottom: 28, letterSpacing: ".02em" },
  btnGold: { width: "100%", padding: "14px", background: `linear-gradient(180deg,${C.gold},var(--c-goldDark,#0F766E))`, color: "#04120F", border: "none", borderRadius: 14, fontWeight: 700, fontSize: 15, letterSpacing: ".01em", boxShadow: "0 8px 24px var(--c-goldSoft)", fontFamily: F, marginBottom: 12 },
  header: { height: 52, flexShrink: 0, background: "var(--c-headerBg)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", borderBottom: `1px solid ${C.hair}`, display: "flex", alignItems: "center", padding: "0 14px", gap: 10, zIndex: 20 },
  progStrip: { height: 36, flexShrink: 0, background: "var(--c-headerBg)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", borderBottom: `1px solid ${C.hair}`, display: "flex", alignItems: "center", padding: "0 16px", gap: 10, zIndex: 19 },
  hDivider: { width: 1, height: 18, background: C.hair, flexShrink: 0 },
  truckDot: { width: 7, height: 7, borderRadius: "50%", flexShrink: 0 },
  hTruckName: { fontSize: 13, fontWeight: 700, color: C.text, letterSpacing: "-.01em" },
  hTruckSep: { color: C.hair, fontSize: 13, fontWeight: 300, margin: "0 2px" },
  hTruckUser: { fontSize: 12, color: C.textDim },
  hProgTrack: { flex: 1, height: 6, borderRadius: 3, background: C.hair, overflow: "hidden" },
  hProgFill: { height: "100%", borderRadius: 3, transition: "width .45s cubic-bezier(.4,0,.2,1)" },
  iconBtn: { background: "transparent", border: `1px solid ${C.hair}`, borderRadius: 9, padding: "7px 8px", color: C.textDim, fontFamily: F, display: "flex", alignItems: "center", justifyContent: "center" },
  mapWrap: { flex: "1 1 0", minHeight: 0, position: "relative" },
  locBtn: { position: "absolute", bottom: 16, right: 16, zIndex: 10, width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--c-surface)", border: `1px solid ${C.hair}`, borderRadius: 16, cursor: "pointer", backdropFilter: "blur(10px)", boxShadow: "0 8px 24px rgba(0,0,0,.22)" },
  panel: { flexShrink: 0, background: C.surface, borderTop: `1px solid ${C.hair}`, borderRadius: "20px 20px 0 0", marginTop: -20, position: "relative", zIndex: 15, boxShadow: "0 -12px 32px rgba(0,0,0,.22)" },
  panelScroll: { overflowY: "auto", height: "calc(100% - 44px)", WebkitOverflowScrolling: "touch" },
  grabberRow: { display: "flex", alignItems: "center", justifyContent: "center", padding: "14px 18px 8px", cursor: "grab", userSelect: "none", touchAction: "none", WebkitUserSelect: "none" },
  grabber: { width: 40, height: 5, borderRadius: 99, background: C.hair2, flexShrink: 0 },
  miniRow: { display: "flex", alignItems: "center", gap: 10, padding: "0 18px 14px", cursor: "pointer" },
  miniLabel: { fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase", flexShrink: 0 },
  miniCust: { fontSize: 14, fontWeight: 600, color: C.text, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  miniCount: { fontSize: 11, color: C.textFaint, flexShrink: 0 },
  nextWrap: { padding: "6px 18px 16px" },
  nextLabel: { fontSize: 10, color: C.gold, fontWeight: 700, letterSpacing: ".11em", textTransform: "uppercase", marginBottom: 8 },
  nextCust: { fontWeight: 700, fontSize: 21, marginBottom: 4, lineHeight: 1.18, letterSpacing: "-.01em" },
  nextAddr: { fontSize: 13.5, color: C.textDim, marginBottom: 12, lineHeight: 1.5 },
  chipRow: { display: "flex", gap: 7, flexWrap: "wrap", marginBottom: 16 },
  chip: { fontSize: 11, color: C.textDim, background: C.surface2, border: `1px solid ${C.hair2}`, borderRadius: 20, padding: "4px 10px", fontWeight: 500 },
  btnRow: { display: "flex", gap: 10 },
  markBtn: { flex: 1, padding: "15px", background: `linear-gradient(180deg,${C.gold},var(--c-goldDark,#0F766E))`, color: "#04120F", border: "none", borderRadius: 16, fontWeight: 700, fontSize: 15, letterSpacing: ".01em", boxShadow: "0 8px 22px var(--c-goldSoft)", fontFamily: F },
  navBtn: { flex: 1, padding: "15px", background: C.surface2, border: `1px solid ${C.hair}`, borderRadius: 16, fontWeight: 600, fontSize: 15, color: C.text, fontFamily: F },
  stepsWrap: { borderTop: `1px solid ${C.hair2}` },
  stepsHdr: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 18px", cursor: "pointer", fontSize: 12.5, color: C.textDim, fontWeight: 600, userSelect: "none" },
  stepsList: { padding: "0 18px 14px" },
  stepRow: { display: "flex", alignItems: "center", gap: 12, padding: "9px 0", borderBottom: `1px solid ${C.hair2}` },
  stepIco: { width: 30, height: 30, borderRadius: 9, background: C.surface2, border: `1px solid ${C.hair2}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0, color: C.gold },
  stepName: { flex: 1, fontSize: 13.5, color: C.text, fontWeight: 500 },
  sectionHdr: { padding: "14px 18px 6px", fontSize: 10, color: C.textFaint, fontWeight: 700, letterSpacing: ".11em", textTransform: "uppercase", borderTop: `1px solid ${C.hair2}` },
  stopCard: { margin: "0 14px 10px", background: C.surface2, border: `1px solid ${C.hair2}`, borderRadius: 18, padding: "14px" },
  stopCardActive: { borderColor: C.gold },
  stopCardDone: { opacity: .45 },
  stopRow: { display: "flex", alignItems: "center", gap: 10, marginBottom: 8 },
  seq: { width: 28, height: 28, borderRadius: "50%", background: C.goldSoft, border: `1px solid rgba(20,184,166,.3)`, color: C.gold, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 12.5, flexShrink: 0, fontFamily: "ui-monospace,monospace" },
  seqDone: { background: C.greenSoft, border: `1px solid rgba(16,185,129,.3)`, color: C.green },
  stopCust: { fontWeight: 600, fontSize: 14.5, flex: 1, letterSpacing: "-.005em" },
  zonePill: { fontFamily: "ui-monospace,monospace", fontWeight: 600, fontSize: 10.5, padding: "3px 9px", borderRadius: 20, background: C.bg, border: `1px solid ${C.hair2}`, color: C.textDim, flexShrink: 0 },
  stopAddr: { fontSize: 12.5, color: C.textDim, marginBottom: 8, lineHeight: 1.45 },
  stopMeta: { display: "flex", gap: 6, fontSize: 11, color: C.textFaint, marginBottom: 12, flexWrap: "wrap" },
  cardBtnRow: { display: "flex", gap: 8 },
  btnGhost: { flex: 1, padding: "10px 12px", borderRadius: 14, fontSize: 13.5, fontWeight: 600, border: `1px solid ${C.hair}`, background: C.surface2, color: C.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F },
  btnPrimary: { flex: 1, padding: "11px 12px", borderRadius: 14, fontSize: 13.5, fontWeight: 700, border: "none", background: C.gold, color: "#04120F", fontFamily: F },
  delivRow: { display: "flex", alignItems: "center", gap: 8, color: C.green, fontWeight: 600, fontSize: 12.5 },
  overlay: { position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", backdropFilter: "blur(5px)", display: "flex", alignItems: "flex-end", justifyContent: "center", zIndex: 200 },
  sheet: { background: C.surface, border: `1px solid ${C.hair}`, borderRadius: "26px 26px 0 0", padding: "20px 22px 32px", width: "100%", maxWidth: 520, boxShadow: "0 -20px 50px rgba(0,0,0,.22)" },
  preview: { width: "100%", borderRadius: 14, marginBottom: 14, border: `1px solid ${C.hair}`, display: "block" },
  stateMsg: { textAlign: "center", padding: "28px 20px", color: C.textDim, fontSize: 14.5, lineHeight: 1.6 },
  linkBtn: { color: C.gold, background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, fontFamily: F },
  errText: { fontSize: 13, color: C.red, marginTop: 12, textAlign: "center" },
};

function makePinHtml(label, state, truckColor, hex) {
  if (state === "done") {
    return `<div style="width:28px;height:28px;background:${hex.green};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.45),0 0 0 2px #fff">`
      + `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><path d="M20 6L9 17l-5-5"/></svg></div>`;
  }
  if (state === "active") {
    return `<div class="pin-pulse" style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center">`
      + `<div style="position:absolute;inset:0;border-radius:50%;background:${truckColor};opacity:.25"></div>`
      + `<div style="width:32px;height:32px;background:${truckColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace;font-weight:700;font-size:13px;color:#04120F;box-shadow:0 3px 12px rgba(0,0,0,.5),0 0 0 2px #fff">${label}</div></div>`;
  }
  return `<div style="width:28px;height:28px;background:#fff;border:2.5px solid ${truckColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace;font-weight:700;font-size:12px;color:${truckColor};box-shadow:0 2px 10px rgba(0,0,0,.4),0 0 0 1px rgba(0,0,0,.1)">${label}</div>`;
}

function truckMarkerHtml(color, heading) {
  const rot = (heading || 0) + 90;
  return `<div style="width:38px;height:38px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 10px rgba(0,0,0,.6));transform:rotate(${rot}deg);transform-origin:center;transition:transform .35s ease">`
    + `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2"><path d="M2 7h11v9H2z" fill="${color}" fill-opacity="0.25"/><path d="M13 10h4l3 3v3h-7z" fill="${color}" fill-opacity="0.25"/><circle cx="6" cy="18" r="1.6"/><circle cx="16" cy="18" r="1.6"/></svg></div>`;
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle({ theme, onToggle }) {
  return (
    <button onClick={onToggle} style={S.iconBtn} aria-label="Toggle theme">
      {theme === "dark"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>}
    </button>
  );
}

// ─── MapView — driven entirely by simulated truck position + precomputed polyline
function MapView({ stops, truckId, position, segmentIndex, polyline, depot, theme, onReady }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const tileRef = useRef(null);
  const gpsRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const color = TRUCK_COLOR[truckId] || "#14B8A6";
  const hex = HEX[theme] || HEX.dark;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
      tileRef.current = L.tileLayer(TILE_URL[theme] || TILE_URL.dark, { subdomains: "abcd", maxZoom: 19, attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>' }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.setView([1.3521, 103.8198], 12);
      mapRef.current = map;
      if (onReady) onReady(map);
      setMapReady(true);
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    if (!mapReady || !tileRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      mapRef.current.removeLayer(tileRef.current);
      tileRef.current = L.tileLayer(TILE_URL[theme] || TILE_URL.dark, { subdomains: "abcd", maxZoom: 19 }).addTo(mapRef.current);
    });
  }, [theme, mapReady]);

  useEffect(() => {
    if (!mapReady || !position) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const icon = L.divIcon({ html: truckMarkerHtml(color, position.heading), className: "", iconSize: [38, 38], iconAnchor: [19, 19] });
      if (gpsRef.current) gpsRef.current.setLatLng([position.lat, position.lng]).setIcon(icon);
      else gpsRef.current = L.marker([position.lat, position.lng], { icon, zIndexOffset: 1000 }).addTo(mapRef.current);
    });
  }, [mapReady, position?.lat, position?.lng, position?.heading]);

  useEffect(() => {
    if (!mapReady) return;
    let cancelled = false;
    import("leaflet").then((L0) => {
      if (cancelled) return;
      const L = L0.default;
      layerRef.current.clearLayers();

      if (depot) {
        L.marker([depot.lat, depot.lng], { icon: L.divIcon({ html: `<div style="width:22px;height:22px;background:${hex.bg};border:2px solid ${hex.textDim};border-radius:6px;display:flex;align-items:center;justify-content:center"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${hex.textDim}" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></svg></div>`, className: "", iconSize: [22, 22], iconAnchor: [11, 11] }) })
          .bindTooltip("Depot", { direction: "top" }).addTo(layerRef.current);
      }

      stops.forEach((stop, i) => {
        if (!stop.coord) return;
        const isDone = stop.order?.status === "delivered";
        const isActive = !isDone && i === stops.findIndex((s) => s.order?.status !== "delivered");
        const state = isDone ? "done" : isActive ? "active" : "pending";
        const sz = state === "active" ? 42 : 28;
        L.marker(stop.coord, { icon: L.divIcon({ html: makePinHtml(String(i + 1), state, color, hex), className: "", iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] }), zIndexOffset: isActive ? 500 : 0 })
          .bindTooltip(escapeHtml(stop.customer || `Stop ${i + 1}`), { direction: "top" }).addTo(layerRef.current);
      });

      (polyline || []).forEach((segment, i) => {
        const traveled = i < segmentIndex;
        L.polyline(segment, { color: "#000", weight: traveled ? 5 : 9, opacity: 0.2 }).addTo(layerRef.current);
        L.polyline(segment, { color, weight: traveled ? 3 : 5, opacity: traveled ? 0.28 : 0.85, dashArray: traveled ? "4 6" : undefined, lineCap: "round" }).addTo(layerRef.current);
      });

      const allCoords = stops.map((s) => s.coord).filter(Boolean);
      if (depot) allCoords.push([depot.lat, depot.lng]);
      if (!cancelled && allCoords.length) mapRef.current.fitBounds(L.latLngBounds(allCoords).pad(0.25));
    });
    return () => { cancelled = true; };
  }, [mapReady, stops, polyline, depot, color, hex]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}

// ─── TurnSteps ────────────────────────────────────────────────────────────────
function TurnSteps({ steps }) {
  const [open, setOpen] = useState(false);
  if (!steps?.length) return null;
  return (
    <div style={S.stepsWrap}>
      <div style={S.stepsHdr} onClick={() => setOpen((o) => !o)}>
        <span>Turn-by-turn · {steps.length} steps</span>
        <span style={{ fontSize: 12, color: C.textFaint, display: "inline-block", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </div>
      {open && (
        <div style={S.stepsList}>
          {steps.map((step, i) => (
            <div key={i} style={{ ...S.stepRow, borderBottom: i === steps.length - 1 ? "none" : S.stepRow.borderBottom }}>
              <div style={S.stepIco}>{i === steps.length - 1 ? "⬤" : "↑"}</div>
              <div style={S.stepName}>{step}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── StopCard ─────────────────────────────────────────────────────────────────
function StopCard({ stop, index, delivered, failed, active, onMarkDelivered, onReportIssue, onNavigate }) {
  return (
    <div style={{ ...S.stopCard, ...(active ? S.stopCardActive : {}), ...(delivered ? S.stopCardDone : {}), ...(failed ? { opacity: 0.7 } : {}) }}>
      <div style={S.stopRow}>
        <div style={{ ...S.seq, ...(delivered ? S.seqDone : {}), ...(failed ? { background: "rgba(239,68,68,.15)", borderColor: C.red } : {}) }}>
          {delivered
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><path d="M20 6L9 17l-5-5" /></svg>
            : failed
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="3"><path d="M18 6L6 18M6 6l12 12" /></svg>
              : index + 1}
        </div>
        <div style={S.stopCust}>{stop.customer}</div>
        {stop.zone && <span style={S.zonePill}>{stop.zone}</span>}
      </div>
      <div style={S.stopAddr}>{stop.address}</div>
      <div style={S.stopMeta}>
        <span>{stop.orderNo}</span>
        {stop.eta && <span>· ETA {new Date(stop.eta).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}</span>}
      </div>
      {delivered
        ? <div style={S.delivRow}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><path d="M20 6L9 17l-5-5" /></svg>Delivered · POD recorded</div>
        : failed
          ? <div style={{ ...S.delivRow, color: C.red }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12" /></svg>Failed · {failed}</div>
          : (
            <>
              <div style={S.cardBtnRow}>
                <button style={S.btnGhost} onClick={() => onNavigate(stop)}>Navigate</button>
                <button style={S.btnPrimary} onClick={() => onMarkDelivered(stop)}>Mark Delivered</button>
              </div>
              <button style={{ width: "100%", marginTop: 6, padding: "7px", background: "none", border: `1px solid ${C.hair}`, borderRadius: 8, color: C.textDim, fontSize: 12.5, cursor: "pointer" }} onClick={() => onReportIssue(stop)}>Can't deliver? Report issue</button>
            </>
          )}
    </div>
  );
}

// ─── DriverPortal (the active in-route experience) ──────────────────────────
function DriverPortal({ truckId, theme, onToggleTheme, onExit }) {
  const { state, actions } = useAppData();
  const color = TRUCK_COLOR[truckId] || "#14B8A6";
  const truck = state.delivery.trucks[truckId];
  const ordersById = new Map(state.orders.items.map((o) => [o.id, o]));
  const zoneCentroids = state.delivery.zoneCentroids;
  const depot = state.delivery.depot;

  const [failedReasons, setFailedReasons] = useState({});
  const [pod, setPod] = useState(null);
  const [podMode, setPodMode] = useState("deliver");
  const [failReason, setFailReason] = useState("");
  const [photo, setPhoto] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [panelState, setPanel] = useState("mini");
  const fileRef = useRef(null);
  const mapApiRef = useRef(null);
  const panelRef = useRef(null);
  const dragY = useRef(null);
  const dragState = useRef(null);
  const dragVel = useRef({ y: 0, t: 0 });

  // Drive this truck forward a bit faster than the ambient dashboard ticker
  // while the portal is actually open — makes the "you're on the road" feel real.
  useInterval(() => {
    if (truck.status === "en_route") actions.delivery.advanceTick(truckId, 0.05);
  }, 2200, truck.status === "en_route");

  function showToast(msg, type = "ok") { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); }

  const stops = truck.stops.map((s) => {
    const order = ordersById.get(s.id);
    const c = zoneCentroids[s.zone];
    return { ...s, order, coord: c ? [c.lat, c.lng] : null, customer: s.customer?.name, address: s.customer?.address };
  });

  const nextIdx = stops.findIndex((s) => s.order?.status !== "delivered" && !failedReasons[s.id]);
  const nextStop = nextIdx >= 0 ? stops[nextIdx] : null;
  const doneCount = stops.filter((s) => s.order?.status === "delivered").length;
  const failCount = Object.keys(failedReasons).length;
  const steps = nextStop ? stepsForSegment(truck.segmentIndex) : [];

  // ── Panel drag (unchanged interaction pattern) ──────────────────────────
  const SNAPS = ["mini", "half", "full"];
  function getPanelPx(s) { if (s === "mini") return 76; if (s === "half") return window.innerHeight * 0.46; return window.innerHeight * 0.88; }
  function snapNearest(px) { const d = SNAPS.map((s) => Math.abs(getPanelPx(s) - px)); return SNAPS[d.indexOf(Math.min(...d))]; }
  function snapAndSet(startY, endY) {
    if (!panelRef.current) return;
    panelRef.current.classList.remove("panel-dragging");
    const delta = startY - endY;
    const elapsed = Date.now() - dragVel.current.t;
    const vel = elapsed < 150 ? (dragVel.current.y - endY) / Math.max(1, elapsed) : 0;
    dragY.current = null;
    if (Math.abs(delta) < 6) { const CYCLE = { mini: "half", half: "full", full: "mini" }; setPanel((s) => CYCLE[s]); }
    else if (Math.abs(vel) > 0.4) { const idx = SNAPS.indexOf(dragState.current); setPanel(SNAPS[Math.max(0, Math.min(SNAPS.length - 1, idx + (vel > 0 ? 1 : -1)))]); }
    else setPanel(snapNearest(getPanelPx(dragState.current) + delta));
  }
  function applyDrag(startY, currentY) {
    if (startY === null || !panelRef.current) return;
    dragVel.current = { y: currentY, t: Date.now() };
    const next = Math.max(64, Math.min(window.innerHeight * 0.93, getPanelPx(dragState.current) + (startY - currentY)));
    panelRef.current.style.height = `${next}px`;
  }
  function onDragStart(e) { dragY.current = e.touches[0].clientY; dragState.current = panelState; dragVel.current = { y: e.touches[0].clientY, t: Date.now() }; panelRef.current?.classList.add("panel-dragging"); }
  function onDragMove(e) { applyDrag(dragY.current, e.touches[0].clientY); }
  function onDragEnd(e) { snapAndSet(dragY.current, e.changedTouches[0].clientY); }
  function onMouseDown(e) {
    e.preventDefault();
    dragY.current = e.clientY; dragState.current = panelState; dragVel.current = { y: e.clientY, t: Date.now() };
    panelRef.current?.classList.add("panel-dragging");
    function move(ev) { applyDrag(dragY.current, ev.clientY); }
    function up(ev) { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); snapAndSet(dragY.current, ev.clientY); }
    document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
  }
  const dragProps = { onTouchStart: onDragStart, onTouchMove: onDragMove, onTouchEnd: onDragEnd, onMouseDown };

  // Keep the screen awake while on route — a real, harmless browser API.
  useEffect(() => {
    if (!nextStop || !("wakeLock" in navigator)) return;
    let cancelled = false, sentinel = null;
    const acquire = () => { if (cancelled || document.visibilityState !== "visible") return; navigator.wakeLock.request("screen").then((wl) => { if (cancelled) wl.release(); else sentinel = wl; }).catch(() => {}); };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => { cancelled = true; document.removeEventListener("visibilitychange", acquire); sentinel?.release(); };
  }, [Boolean(nextStop)]);

  function navigateToStop(stop) { if (stop.coord && mapApiRef.current) mapApiRef.current.flyTo(stop.coord, 15); }

  function openPOD(stop, mode = "deliver") { setPod(stop); setPodMode(mode); setPhoto(null); setFailReason(""); }
  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setPhoto(r.result);
    r.readAsDataURL(file);
  }
  function confirmPOD() {
    if (!pod || !photo) return;
    setSaving(true);
    setTimeout(() => {
      actions.orders.updateStatus(pod.order.id, "delivered");
      actions.orders.attachPod(pod.order.id, `driver-pod-${pod.order.id}`);
      setSaving(false); setPod(null); setPhoto(null);
      showToast("Delivery recorded ✓");
    }, 500);
  }
  function confirmFailed() {
    if (!pod || !failReason) return;
    setFailedReasons((f) => ({ ...f, [pod.id]: failReason }));
    setPod(null); setFailReason("");
    showToast("Issue reported", "warn");
  }

  return (
    <div className={`dp ${theme}`} style={S.root}>
      <style>{GLOBAL_CSS}</style>

      <div style={S.header}>
        <div className="sidebar-brand-mark" style={{ width: 26, height: 26, fontSize: 11 }}>MR</div>
        <div style={S.hDivider} />
        <span style={{ ...S.truckDot, background: color }} />
        <span style={S.hTruckName}>{TRUCK_NAME[truckId]}</span>
        <span style={S.hTruckSep}>|</span>
        <span style={S.hTruckUser}>{truck.driverName}</span>
        <div style={{ flex: 1 }} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button onClick={onExit} style={S.iconBtn} aria-label="Exit demo" title="Exit demo">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
        </button>
      </div>

      <div style={S.progStrip}>
        <div style={S.hProgTrack}><div style={{ ...S.hProgFill, width: stops.length ? `${(doneCount / stops.length) * 100}%` : "0%", background: color }} /></div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {doneCount} / {stops.length}
          {failCount > 0 && <span style={{ color: C.red, fontSize: 11, marginLeft: 5 }}>· {failCount} failed</span>}
        </span>
      </div>

      <div style={S.mapWrap}>
        <MapView stops={stops} truckId={truckId} position={truck.position} segmentIndex={truck.segmentIndex} polyline={truck.polyline} depot={depot} theme={theme} onReady={(map) => { mapApiRef.current = map; }} />
        {truck.position && (
          <button style={S.locBtn} onClick={() => mapApiRef.current?.setView([truck.position.lat, truck.position.lng], 16)} aria-label="Center on truck">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2"><circle cx="12" cy="12" r="3.5" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /></svg>
          </button>
        )}
      </div>

      <div ref={panelRef} className="panel" style={{ ...S.panel, height: PANEL_H[panelState] }}>
        <div style={S.grabberRow} {...dragProps}>
          <div style={S.grabber} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth="2.5" style={{ display: "inline-block", transform: panelState === "full" ? "rotate(180deg)" : "none", transition: "transform .3s ease" }}><path d="M18 15l-6-6-6 6" /></svg>
        </div>

        {panelState === "mini" && (
          <div style={S.miniRow} {...dragProps}>
            {nextStop
              ? <><span style={S.miniLabel}>Next</span><span style={S.miniCust}>{nextStop.customer}</span><span style={S.miniCount}>{nextIdx + 1}/{stops.length}</span></>
              : <span style={{ fontSize: 13, color: C.textDim }}>Tap to expand</span>}
          </div>
        )}

        {panelState !== "mini" && (
          <div className="panel-scroll" style={S.panelScroll} onScroll={(e) => { if (panelState === "half" && e.currentTarget.scrollTop === 0) setPanel("full"); }}>
            {nextStop && (
              <>
                <div style={S.nextWrap}>
                  <div style={S.nextLabel}>Next stop · {nextIdx + 1} of {stops.length}</div>
                  <div style={S.nextCust}>{nextStop.customer}</div>
                  <div style={S.nextAddr}>{nextStop.address}</div>
                  <div style={S.chipRow}>
                    <span style={S.chip}>{nextStop.orderNo}</span>
                    <span style={S.chip}>ETA {new Date(nextStop.eta).toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit" })}</span>
                    {nextStop.zone && <span style={S.chip}>{nextStop.zone}</span>}
                  </div>
                  <div style={S.btnRow}>
                    <button style={S.navBtn} onClick={() => navigateToStop(nextStop)}>Navigate</button>
                    <button style={S.markBtn} onClick={() => openPOD(nextStop, "deliver")}>Mark Delivered</button>
                  </div>
                  <button style={{ width: "100%", marginTop: 6, padding: "7px", background: "none", border: `1px solid ${C.hair}`, borderRadius: 8, color: C.textDim, fontSize: 12.5, cursor: "pointer" }} onClick={() => openPOD(nextStop, "fail")}>Can't deliver? Report issue</button>
                </div>
                <TurnSteps steps={steps} />
              </>
            )}

            {!nextStop && doneCount > 0 && (
              <div style={{ padding: "28px 18px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
                </div>
                <div style={{ color: C.text, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Route complete</div>
                <div style={{ color: C.textDim, fontSize: 13.5 }}>{doneCount} delivered{failCount > 0 ? `, ${failCount} failed` : ""} · {stops.length} total.</div>
              </div>
            )}

            {stops.length > 0 && (
              <>
                <div style={S.sectionHdr}>All stops</div>
                <div style={{ paddingBottom: 28 }}>
                  {stops.map((stop, i) => (
                    <StopCard key={stop.id} stop={stop} index={i} delivered={stop.order?.status === "delivered"} failed={failedReasons[stop.id]} active={i === nextIdx}
                      onMarkDelivered={(s) => openPOD(s, "deliver")} onReportIssue={(s) => openPOD(s, "fail")} onNavigate={navigateToStop} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onPhotoChange} />

      {toast && (
        <div style={{ position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", zIndex: 9000, background: toast.type === "warn" ? C.red : C.green, color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 24px rgba(0,0,0,.4)", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {toast.msg}
        </div>
      )}

      {pod && (
        <div style={S.overlay} onClick={() => !saving && (setPod(null), setPhoto(null), setFailReason(""))}>
          <div className="sheet-anim" style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...S.grabberRow, marginBottom: 6 }}><div style={S.grabber} /></div>
            <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, letterSpacing: "-.01em" }}>{podMode === "fail" ? "Report delivery issue" : "Proof of delivery"}</div>
            <div style={{ fontSize: 13, color: C.textDim, marginBottom: 18 }}>{pod.orderNo} · {pod.customer}</div>

            {podMode === "fail" ? (
              <>
                {["Customer not home", "Wrong address", "Refused delivery", "Age verification failed", "Other"].map((r) => (
                  <button key={r} style={{ ...S.btnGhost, width: "100%", marginBottom: 8, justifyContent: "flex-start", background: failReason === r ? "rgba(239,68,68,.15)" : undefined, border: failReason === r ? `1px solid ${C.red}` : S.btnGhost.border, color: failReason === r ? C.red : C.text }} onClick={() => setFailReason(r)}>{r}</button>
                ))}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button style={S.btnGhost} onClick={() => { setPod(null); setFailReason(""); }}>Cancel</button>
                  <button style={{ ...S.btnPrimary, background: C.red, opacity: !failReason ? 0.5 : 1 }} onClick={confirmFailed} disabled={!failReason}>Confirm issue</button>
                </div>
              </>
            ) : (
              <>
                {photo
                  ? <img src={photo} alt="POD" style={S.preview} />
                  : <button style={{ ...S.btnGhost, width: "100%", marginBottom: 14, padding: "16px", borderStyle: "dashed" }} onClick={() => fileRef.current?.click()}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ marginRight: 8 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" /><circle cx="12" cy="13" r="4" /></svg>
                    Take photo
                  </button>}
                {photo && <button style={{ ...S.btnGhost, width: "100%", marginBottom: 12, fontSize: 13 }} onClick={() => fileRef.current?.click()}>Retake photo</button>}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button style={S.btnGhost} onClick={() => { setPod(null); setPhoto(null); }} disabled={saving}>Cancel</button>
                  <button style={{ ...S.btnPrimary, opacity: (!photo || saving) ? 0.5 : 1 }} onClick={confirmPOD} disabled={saving || !photo}>{saving ? "Saving…" : "Confirm delivery"}</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Enter-Demo gate — pick which driver/truck to view ───────────────────────
function EnterDemoScreen({ onEnter, theme, onToggleTheme }) {
  return (
    <div className={`dp ${theme}`} style={S.center}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: "fixed", top: 16, right: 16 }}><ThemeToggle theme={theme} onToggle={onToggleTheme} /></div>
      <div style={S.loginCard}>
        <div className="sidebar-brand-mark" style={{ width: 40, height: 40, fontSize: 15, marginBottom: 14 }}>MR</div>
        <div style={{ fontSize: 20, fontWeight: 700 }}>Driver Portal</div>
        <div style={S.loginSub}>Portfolio demo — pick a truck to view its live route</div>
        {DRIVERS.map((d) => (
          <button key={d.id} style={S.btnGold} onClick={() => onEnter(d.truckId)}>
            Enter as {TRUCK_NAME[d.truckId]} — {d.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function DriverPortalPage() {
  const { state, actions } = useAppData();
  const [truckId, setTruckId] = useState(null);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    const prev = document.title;
    document.title = "Maison Reserve | Driver Portal";
    return () => { document.title = prev; };
  }, []);

  function enter(id) {
    setTruckId(id);
    actions.session.enterDemo("driver");
  }
  function exit() {
    actions.session.exitDemo();
    setTruckId(null);
  }

  if (!truckId || state.session.role !== "driver") {
    return <EnterDemoScreen onEnter={enter} theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />;
  }
  return <DriverPortal truckId={truckId} theme={theme} onToggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} onExit={exit} />;
}
