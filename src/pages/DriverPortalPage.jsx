import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import { escapeHtml } from "../utils.js";

// ─── Zone reference data ──────────────────────────────────────────────────────
// Single source of truth lives server-side (server/utils/zones.js) and is
// fetched via GET /api/delivery/zones on load — no hardcoded client copy to
// drift out of sync. WAREHOUSE keeps a default (fixed depot at 43 Keppel Rd) so
// the map still works if the fetch fails; ZONE_CENTROIDS fills in from the API.
let ZONE_CENTROIDS = {};
let WAREHOUSE      = [1.2735, 103.8419];

// Populate the module-level zone data from the /zones payload.
function applyZoneData(data) {
  if (data?.centroids) ZONE_CENTROIDS = data.centroids;
  if (data?.warehouse && Number.isFinite(data.warehouse.lat) && Number.isFinite(data.warehouse.lng)) {
    WAREHOUSE = [data.warehouse.lat, data.warehouse.lng];
  }
}

// ─── Constants ────────────────────────────────────────────────────────────────
const TRUCK_COLOR = { truck_1: "#E8B964", truck_2: "#D99A5B" };
const TRUCK_NAME   = { truck_1: "Truck 1", truck_2: "Truck 2" };
const PANEL_H     = { mini: "76px", half: "46vh", full: "88vh" };
const LOCATION_PING_MS = 30000; // 30s — matches Command Centre's poll cadence for a tighter live feel
const TILE_URL    = {
  dark:  "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

// ─── CSS-variable palette refs (used in React inline styles) ─────────────────
const C = {
  bg:        "var(--c-bg)",
  surface:   "var(--c-surface)",
  surface2:  "var(--c-surface2)",
  hair:      "var(--c-hair)",
  hair2:     "var(--c-hair2)",
  gold:      "var(--c-gold)",
  goldSoft:  "var(--c-goldSoft)",
  text:      "var(--c-text)",
  textDim:   "var(--c-textDim)",
  textFaint: "var(--c-textFaint)",
  green:     "var(--c-green)",
  greenSoft: "var(--c-greenSoft)",
  red:       "var(--c-red)",
};

// Actual hex values for SVG strings (CSS vars don't work inside SVG attr strings)
const HEX = {
  dark:  { gold: "#E8B964", green: "#5FCF92", textDim: "#9A9081", bg: "#0B0A08" },
  light: { gold: "#B8872C", green: "#2A9E5C", textDim: "#6B5F4A", bg: "#F7F4EE" },
};

// ─── Global CSS ───────────────────────────────────────────────────────────────
const GLOBAL_CSS = `
  /* ── Dark theme ── */
  .dp.dark {
    --c-bg:        #0B0A08;
    --c-surface:   #141210;
    --c-surface2:  #1B1815;
    --c-hair:      rgba(255,255,255,.07);
    --c-hair2:     rgba(255,255,255,.04);
    --c-gold:      #E8B964;
    --c-goldDark:  #C4882A;
    --c-goldSoft:  rgba(232,185,100,.13);
    --c-text:      #F3EEE3;
    --c-textDim:   #9A9081;
    --c-textFaint: #6A6256;
    --c-green:     #5FCF92;
    --c-greenSoft: rgba(95,207,146,.12);
    --c-red:       #E8736B;
    --c-headerBg:  rgba(11,10,8,.88);
  }
  /* ── Light theme ── */
  .dp.light {
    --c-bg:        #F7F4EE;
    --c-surface:   #FFFFFF;
    --c-surface2:  #EDE8DE;
    --c-hair:      rgba(0,0,0,.13);
    --c-hair2:     rgba(0,0,0,.09);
    --c-gold:      #A8741C;
    --c-goldDark:  #8A5E12;
    --c-goldSoft:  rgba(168,116,28,.14);
    --c-text:      #1A150E;
    --c-textDim:   #4E4234;
    --c-textFaint: #7A6E5C;
    --c-green:     #1E8A4C;
    --c-greenSoft: rgba(30,138,76,.12);
    --c-red:       #B83030;
    --c-headerBg:  rgba(255,252,246,.92);
  }

  .dp * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
  .dp button { transition: transform .12s ease, opacity .12s ease, background .15s ease; cursor: pointer; }
  .dp button:active { transform: scale(.97); }
  .dp .panel { transition: height .42s cubic-bezier(.25,.46,.45,.94); overflow: hidden; will-change: height; }
  .dp .panel-scroll::-webkit-scrollbar { width: 0; }
  .dp .panel-dragging { transition: none !important; }

  /* Leaflet overrides */
  .dp.dark  .leaflet-container { background: #15130E; }
  .dp.light .leaflet-container { background: #E8E4DA; }
  .dp .leaflet-container { font-family: inherit; }
  .dp.dark  .leaflet-control-attribution { background: rgba(11,10,8,.65) !important; color: #5A5348 !important; }
  .dp.light .leaflet-control-attribution { background: rgba(247,244,238,.92) !important; color: #7A6E5C !important; }
  .dp .leaflet-control-attribution { font-size: 9px; backdrop-filter: blur(4px); border-radius: 6px !important; }
  .dp.dark  .leaflet-tooltip { background:#1B1815; border:1px solid rgba(255,255,255,.08); color:#F3EEE3; }
  .dp.light .leaflet-tooltip { background:#FFFFFF; border:1px solid rgba(0,0,0,.1); color:#1C1810; }
  .dp .leaflet-tooltip { border-radius:9px; font-size:12px; font-weight:600; box-shadow:0 4px 14px rgba(0,0,0,.18); padding:5px 10px; }
  .dp.dark  .leaflet-tooltip-top::before { border-top-color:#1B1815; }
  .dp.light .leaflet-tooltip-top::before { border-top-color:#FFFFFF; }

  @keyframes pinPulse { 0%,100%{transform:scale(1);opacity:.22}50%{transform:scale(1.4);opacity:0} }
  .dp .pin-pulse > div:first-child { animation: pinPulse 2s ease-in-out infinite; }
  @keyframes shimmer { 0%{background-position:-200% 0}100%{background-position:200% 0} }
  .dp.dark  .skeleton { background: linear-gradient(90deg,#16140F 25%,#211D18 50%,#16140F 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  .dp.light .skeleton { background: linear-gradient(90deg,#EDE9E0 25%,#F7F4EE 50%,#EDE9E0 75%); background-size:200% 100%; animation:shimmer 1.4s infinite; }
  @keyframes sheetUp { from{transform:translateY(14px);opacity:0}to{transform:translateY(0);opacity:1} }
  .dp .sheet-anim { animation: sheetUp .22s ease; }

  /* Input theming */
  .dp input { background: var(--c-bg); color: var(--c-text); }
  .dp.light input { background: var(--c-surface2); }
  .dp input:focus { border-color: var(--c-gold) !important; box-shadow: 0 0 0 3px var(--c-goldSoft); outline: none; }
`;

// ─── Shared styles (use CSS vars throughout) ──────────────────────────────────
const F = "ui-sans-serif,-apple-system,'SF Pro Display',Segoe UI,Roboto,sans-serif";
const S = {
  root:       { display:"flex", flexDirection:"column", height:"100dvh", background:C.bg, color:C.text, fontFamily:F, overflow:"hidden", WebkitFontSmoothing:"antialiased" },
  center:     { display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100dvh", padding:20, background:C.bg, fontFamily:F },

  // Login
  loginCard:  { width:"100%", maxWidth:360, background:C.surface, border:`1px solid ${C.hair}`, borderRadius:26, padding:"38px 28px", boxShadow:"0 28px 70px rgba(0,0,0,.22)" },
  loginSub:   { fontSize:12, color:C.textFaint, marginTop:6, marginBottom:32, letterSpacing:".02em" },
  flabel:     { display:"block", fontSize:10.5, color:C.textDim, marginBottom:7, fontWeight:600, letterSpacing:".09em", textTransform:"uppercase" },
  finput:     { width:"100%", padding:"13px 15px", background:C.bg, border:`1px solid ${C.hair}`, borderRadius:14, color:C.text, fontSize:15, outline:"none", marginBottom:16, fontFamily:F, transition:"border-color .15s, box-shadow .15s" },
  btnGold:    { width:"100%", padding:"14px", background:`linear-gradient(180deg,${C.gold},var(--c-goldDark,#C4882A))`, color:"#1A1408", border:"none", borderRadius:14, fontWeight:700, fontSize:15, letterSpacing:".01em", boxShadow:"0 8px 24px var(--c-goldSoft)", fontFamily:F },
  errText:    { fontSize:13, color:C.red, marginTop:12, textAlign:"center" },

  // Header
  header:     { height:52, flexShrink:0, background:"var(--c-headerBg)", backdropFilter:"blur(16px)", WebkitBackdropFilter:"blur(16px)", borderBottom:`1px solid ${C.hair}`, display:"flex", alignItems:"center", padding:"0 14px", gap:10, zIndex:20 },
  progStrip:  { height:36, flexShrink:0, background:"var(--c-headerBg)", backdropFilter:"blur(12px)", WebkitBackdropFilter:"blur(12px)", borderBottom:`1px solid ${C.hair}`, display:"flex", alignItems:"center", padding:"0 16px", gap:10, zIndex:19 },
  hDivider:   { width:1, height:18, background:C.hair, flexShrink:0 },
  truckDot:   { width:7, height:7, borderRadius:"50%", flexShrink:0 },
  hTruckName: { fontSize:13, fontWeight:700, color:C.text, letterSpacing:"-.01em" },
  hTruckSep:  { color:C.hair, fontSize:13, fontWeight:300, margin:"0 2px" },
  hTruckUser: { fontSize:12, color:C.textDim },
  hProgTrack: { flex:1, height:6, borderRadius:3, background:C.hair, overflow:"hidden" },
  hProgFill:  { height:"100%", borderRadius:3, transition:"width .45s cubic-bezier(.4,0,.2,1)" },
  iconBtn:    { background:"transparent", border:`1px solid ${C.hair}`, borderRadius:9, padding:"7px 8px", color:C.textDim, fontFamily:F, display:"flex", alignItems:"center", justifyContent:"center" },

  // Map
  mapWrap:    { flex:"1 1 0", minHeight:0, position:"relative" },
  locBtn:     { position:"absolute", bottom:16, right:16, zIndex:10, width:48, height:48, display:"flex", alignItems:"center", justifyContent:"center", background:"var(--c-surface)", border:`1px solid ${C.hair}`, borderRadius:16, cursor:"pointer", backdropFilter:"blur(10px)", boxShadow:"0 8px 24px rgba(0,0,0,.22)" },

  // Panel
  panel:      { flexShrink:0, background:C.surface, borderTop:`1px solid ${C.hair}`, borderRadius:"20px 20px 0 0", marginTop:-20, position:"relative", zIndex:15, boxShadow:"0 -12px 32px rgba(0,0,0,.22)" },
  panelScroll:{ overflowY:"auto", height:"calc(100% - 44px)", WebkitOverflowScrolling:"touch" },
  grabberRow: { display:"flex", alignItems:"center", justifyContent:"center", padding:"14px 18px 8px", cursor:"grab", userSelect:"none", touchAction:"none", WebkitUserSelect:"none" },
  grabber:    { width:40, height:5, borderRadius:99, background:C.hair2, flexShrink:0 },
  miniRow:    { display:"flex", alignItems:"center", gap:10, padding:"0 18px 14px", cursor:"pointer" },
  miniLabel:  { fontSize:10, color:C.gold, fontWeight:700, letterSpacing:".1em", textTransform:"uppercase", flexShrink:0 },
  miniCust:   { fontSize:14, fontWeight:600, color:C.text, flex:1, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" },
  miniCount:  { fontSize:11, color:C.textFaint, flexShrink:0 },

  // Next stop
  nextWrap:   { padding:"6px 18px 16px" },
  nextLabel:  { fontSize:10, color:C.gold, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", marginBottom:8 },
  nextCust:   { fontWeight:700, fontSize:21, marginBottom:4, lineHeight:1.18, letterSpacing:"-.01em" },
  nextAddr:   { fontSize:13.5, color:C.textDim, marginBottom:12, lineHeight:1.5 },
  chipRow:    { display:"flex", gap:7, flexWrap:"wrap", marginBottom:16 },
  chip:       { fontSize:11, color:C.textDim, background:C.surface2, border:`1px solid ${C.hair2}`, borderRadius:20, padding:"4px 10px", fontWeight:500 },
  btnRow:     { display:"flex", gap:10 },
  markBtn:    { flex:1, padding:"15px", background:`linear-gradient(180deg,${C.gold},var(--c-goldDark,#C4882A))`, color:"#1A1408", border:"none", borderRadius:16, fontWeight:700, fontSize:15, letterSpacing:".01em", boxShadow:"0 8px 22px var(--c-goldSoft)", fontFamily:F },
  navBtn:     { flex:1, padding:"15px", background:C.surface2, border:`1px solid ${C.hair}`, borderRadius:16, fontWeight:600, fontSize:15, color:C.text, fontFamily:F },

  // Turn steps
  stepsWrap:  { borderTop:`1px solid ${C.hair2}` },
  stepsHdr:   { display:"flex", alignItems:"center", justifyContent:"space-between", padding:"13px 18px", cursor:"pointer", fontSize:12.5, color:C.textDim, fontWeight:600, userSelect:"none" },
  stepsList:  { padding:"0 18px 14px" },
  stepRow:    { display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:`1px solid ${C.hair2}` },
  stepIco:    { width:30, height:30, borderRadius:9, background:C.surface2, border:`1px solid ${C.hair2}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0, color:C.gold },
  stepName:   { flex:1, fontSize:13.5, color:C.text, fontWeight:500 },
  stepDist:   { fontSize:11.5, color:C.textFaint, flexShrink:0, fontVariantNumeric:"tabular-nums" },

  // Stop list
  sectionHdr: { padding:"14px 18px 6px", fontSize:10, color:C.textFaint, fontWeight:700, letterSpacing:".11em", textTransform:"uppercase", borderTop:`1px solid ${C.hair2}` },
  stopCard:   { margin:"0 14px 10px", background:C.surface2, border:`1px solid ${C.hair2}`, borderRadius:18, padding:"14px" },
  stopCardActive: { borderColor:C.gold },
  stopCardDone:   { opacity:.45 },
  stopRow:    { display:"flex", alignItems:"center", gap:10, marginBottom:8 },
  seq:        { width:28, height:28, borderRadius:"50%", background:C.goldSoft, border:`1px solid rgba(232,185,100,.3)`, color:C.gold, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:12.5, flexShrink:0, fontFamily:"ui-monospace,monospace" },
  seqDone:    { background:C.greenSoft, border:`1px solid rgba(95,207,146,.3)`, color:C.green },
  stopCust:   { fontWeight:600, fontSize:14.5, flex:1, letterSpacing:"-.005em" },
  zonePill:   { fontFamily:"ui-monospace,monospace", fontWeight:600, fontSize:10.5, padding:"3px 9px", borderRadius:20, background:C.bg, border:`1px solid ${C.hair2}`, color:C.textDim, flexShrink:0 },
  stopAddr:   { fontSize:12.5, color:C.textDim, marginBottom:8, lineHeight:1.45 },
  stopMeta:   { display:"flex", gap:6, fontSize:11, color:C.textFaint, marginBottom:12, flexWrap:"wrap" },
  cardBtnRow: { display:"flex", gap:8 },
  btnGhost:   { flex:1, padding:"10px 12px", borderRadius:14, fontSize:13.5, fontWeight:600, border:`1px solid ${C.hair}`, background:C.surface2, color:C.text, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:F },
  btnPrimary: { flex:1, padding:"11px 12px", borderRadius:14, fontSize:13.5, fontWeight:700, border:"none", background:C.gold, color:"#1A1408", fontFamily:F },
  delivRow:   { display:"flex", alignItems:"center", gap:8, color:C.green, fontWeight:600, fontSize:12.5 },

  // POD overlay
  overlay:    { position:"fixed", inset:0, background:"rgba(0,0,0,.55)", backdropFilter:"blur(5px)", display:"flex", alignItems:"flex-end", justifyContent:"center", zIndex:200 },
  sheet:      { background:C.surface, border:`1px solid ${C.hair}`, borderRadius:"26px 26px 0 0", padding:"20px 22px 32px", width:"100%", maxWidth:520, boxShadow:"0 -20px 50px rgba(0,0,0,.22)" },
  preview:    { width:"100%", borderRadius:14, marginBottom:14, border:`1px solid ${C.hair}`, display:"block" },
  stateMsg:   { textAlign:"center", padding:"28px 20px", color:C.textDim, fontSize:14.5, lineHeight:1.6 },
  linkBtn:    { color:C.gold, background:"none", border:"none", cursor:"pointer", fontWeight:700, fontSize:14, fontFamily:F },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function coordForStop(stop) {
  const { lat, lng } = stop ?? {};
  // guard against 0/0 (null island) and coordinates outside Singapore
  if (Number.isFinite(lat) && Number.isFinite(lng) &&
      lat > 1.1 && lat < 1.5 && lng > 103.5 && lng < 104.1)
    return [lat, lng];
  const c = ZONE_CENTROIDS[stop?.zone];
  return c ? [c.lat, c.lng] : null;
}

// Returns { coordMap: Map<orderRef,[lat,lng]>, clusters: [[lat,lng],N][] }
// Stops sharing the same ~22m cell get spread into a small circle so all pins are visible.
function resolveOverlaps(stops) {
  const grid = new Map();
  stops.forEach((s) => {
    const c = coordForStop(s);
    if (!c) return;
    // 3-decimal precision ≈ 111m grid — intentionally coarser so nearby-but-distinct coords also spread
    const key = `${c[0].toFixed(3)},${c[1].toFixed(3)}`;
    if (!grid.has(key)) grid.set(key, []);
    grid.get(key).push(s);
  });
  const coordMap = new Map();
  const clusters = [];
  for (const [, group] of grid) {
    if (group.length < 2) continue;
    const base = coordForStop(group[0]);
    const r = 0.00022 + group.length * 0.00006; // ~25–50m radius, grows with count
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

function nearestNeighbor(stops) {
  if (stops.length <= 1) return stops.map((s, i) => ({ ...s, sequence: i + 1 }));
  const located = stops.filter((s) => coordForStop(s));
  const unlocated = stops.filter((s) => !coordForStop(s));
  const remaining = [...located], ordered = [];
  let cur = WAREHOUSE;
  while (remaining.length) {
    let best = 0, bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const c = coordForStop(remaining[i]);
      const d = Math.hypot(c[0] - cur[0], c[1] - cur[1]);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    const [next] = remaining.splice(best, 1);
    ordered.push(next);
    cur = coordForStop(next);
  }
  return [...ordered, ...unlocated].map((s, i) => ({ ...s, sequence: i + 1 }));
}

function stopDelivered(stop, done) {
  if (stop?.status === "Failed Delivery") return false;
  if (done?.[stop.orderReference]) return true;
  if ((stop.stage ?? 0) >= 3) return true;
  return /^delivered$|^confirmed$|^closed$/i.test(String(stop.status || "").trim());
}

function stopFailed(stop, failed) {
  if (failed?.[stop?.orderReference]) return true;
  return stop?.status === "Failed Delivery";
}

function makePinHtml(label, state, truckColor, hex) {
  if (state === "done") {
    return `<div style="width:28px;height:28px;background:${hex.green};border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.45),0 0 0 2px #fff">`
      + `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.5"><path d="M20 6L9 17l-5-5"/></svg></div>`;
  }
  if (state === "failed") {
    return `<div style="width:28px;height:28px;background:#E8736B;border-radius:50%;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.45),0 0 0 2px #fff">`
      + `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3"><path d="M18 6L6 18M6 6l12 12"/></svg></div>`;
  }
  if (state === "active") {
    return `<div class="pin-pulse" style="position:relative;width:42px;height:42px;display:flex;align-items:center;justify-content:center">`
      + `<div style="position:absolute;inset:0;border-radius:50%;background:${truckColor};opacity:.25"></div>`
      + `<div style="width:32px;height:32px;background:${truckColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace;font-weight:700;font-size:13px;color:#1A1408;box-shadow:0 3px 12px rgba(0,0,0,.5),0 0 0 2px #fff">${label}</div></div>`;
  }
  return `<div style="width:28px;height:28px;background:#fff;border:2.5px solid ${truckColor};border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:ui-monospace,monospace;font-weight:700;font-size:12px;color:${truckColor};box-shadow:0 2px 10px rgba(0,0,0,.4),0 0 0 1px rgba(0,0,0,.1)">${label}</div>`;
}

function calcBearing(from, to) {
  const r = (d) => d * Math.PI / 180;
  const φ1 = r(from[0]), φ2 = r(to[0]), Δλ = r(to[1] - from[1]);
  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

function fmtDist(m) { return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`; }

function stepArrow({ type, modifier } = {}) {
  if (type === "arrive") return "⬤";
  if (type === "roundabout" || type === "rotary") return "↻";
  const m = modifier;
  if (m === "uturn") return "↩";
  if (m === "sharp right") return "↪";
  if (m === "right") return "→";
  if (m === "slight right") return "↗";
  if (m === "slight left") return "↖";
  if (m === "left") return "←";
  if (m === "sharp left") return "↫";
  return "↑";
}

function stepText({ maneuver, name }) {
  const { type, modifier } = maneuver;
  const road = name ? ` onto ${name}` : "";
  if (type === "depart")  return `Head ${modifier || "forward"}${name ? ` on ${name}` : ""}`;
  if (type === "arrive")  return "Arrive at destination";
  if (type === "turn")    return `Turn ${modifier || ""}${road}`;
  if (type === "new name" || type === "continue") return `Continue${name ? ` on ${name}` : ""}`;
  if (type === "merge")   return `Merge${road}`;
  if (type === "roundabout" || type === "rotary") return "Take the roundabout";
  if (type === "fork")    return `Keep ${modifier || "straight"}${road}`;
  return `${type}${road}`;
}

async function fetchLegSteps(from, to) {
  const pts = `${from[1]},${from[0]};${to[1]},${to[0]}`;
  const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pts}?steps=true&overview=false`);
  const json = await res.json();
  return json.routes?.[0]?.legs?.[0]?.steps ?? [];
}

async function drawRoute(L, layer, stops, color, isCancelled) {
  const coords = stops.map(coordForStop).filter(Boolean);
  if (!coords.length) return;
  const waypoints = [WAREHOUSE, ...coords];
  const addLine = (pts, dashed = false) => {
    if (isCancelled?.()) return;
    L.polyline(pts, { color: "#000", weight: dashed ? 5 : 11, opacity: .28 }).addTo(layer);
    L.polyline(pts, { color, weight: dashed ? 4 : 6, opacity: .93, lineCap: "round", lineJoin: "round", ...(dashed ? { dashArray: "8 12" } : {}) }).addTo(layer);
  };
  try {
    const res = await fetch("/api/delivery/route-geometry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ depot: { lat: WAREHOUSE[0], lng: WAREHOUSE[1] }, vehicles: 1, stops: stops.map((s, i) => { const c = coordForStop(s); return c ? { id: s.orderReference || String(i), lat: c[0], lng: c[1] } : null; }).filter(Boolean) }) });
    const json = await res.json();
    if (json.geometry?.length > 1) { addLine(json.geometry); return; }
  } catch { /* fall through */ }
  try {
    const pts = waypoints.map(([la, ln]) => `${ln},${la}`).join(";");
    const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${pts}?overview=full&geometries=geojson`);
    const json = await res.json();
    const road = json.routes?.[0]?.geometry?.coordinates?.map(([ln, la]) => [la, ln]);
    if (road?.length > 1) { addLine(road); return; }
  } catch { /* fall through */ }
  addLine(waypoints, true);
}

// ─── ProgressRing ─────────────────────────────────────────────────────────────
function ProgressRing({ done, total, color }) {
  const r = 17, circ = 2 * Math.PI * r, pct = total ? done / total : 0;
  return (
    <div style={{ position: "relative", width: 44, height: 44 }}>
      <svg width="44" height="44" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="22" cy="22" r={r} fill="none" stroke={C.hair} strokeWidth="3.5" />
        <circle cx="22" cy="22" r={r} fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} style={{ transition: "stroke-dashoffset .5s ease" }} />
      </svg>
      <div style={S.ringText}>
        <span style={{ ...S.ringNum, color }}>{done}</span>
        <span style={{ fontSize: 8.5, color: C.textFaint, marginTop: 1 }}>/{total}</span>
      </div>
    </div>
  );
}

// ─── ThemeToggle ──────────────────────────────────────────────────────────────
function ThemeToggle({ theme, onToggle }) {
  return (
    <button onClick={onToggle} style={S.iconBtn} aria-label="Toggle theme">
      {theme === "dark"
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      }
    </button>
  );
}

// ─── MapView ──────────────────────────────────────────────────────────────────
function MapView({ stops, done, failed, truckId, currentPos, heading, theme, onReady }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const layerRef     = useRef(null);
  const tileRef      = useRef(null);
  const gpsRef       = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const color = TRUCK_COLOR[truckId] || "#E8B964";
  const hex   = HEX[theme] || HEX.dark;

  // Init map
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const map = L.map(containerRef.current, { zoomControl: false, attributionControl: true });
      tileRef.current = L.tileLayer(TILE_URL[theme] || TILE_URL.dark, { subdomains: "abcd", maxZoom: 19, attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>' }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      map.setView([1.3521, 103.8198], 11);
      mapRef.current = map;
      if (onReady) onReady(map);
      setMapReady(true);
    });
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  // Swap tile layer on theme change
  useEffect(() => {
    if (!mapReady || !tileRef.current || !mapRef.current) return;
    import("leaflet").then((mod) => {
      const L = mod.default;
      mapRef.current.removeLayer(tileRef.current);
      tileRef.current = L.tileLayer(TILE_URL[theme] || TILE_URL.dark, { subdomains: "abcd", maxZoom: 19, attribution: '© <a href="https://openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com">CARTO</a>' }).addTo(mapRef.current);
    });
  }, [theme, mapReady]);

  // Truck icon (SVG rotated to heading)
  useEffect(() => {
    if (!mapReady || !currentPos) return;
    const rot = ((heading ?? 0) + 90) % 360;
    const html = `<div style="width:44px;height:44px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 3px 10px rgba(0,0,0,.7))"><img src="/assets/beeva-truck.svg" width="44" height="44" style="transform:rotate(${rot}deg);transform-origin:center;transition:transform .35s ease;display:block" /></div>`;
    import("leaflet").then((mod) => {
      const L = mod.default;
      const icon = L.divIcon({ html, className: "", iconSize: [44, 44], iconAnchor: [22, 22] });
      if (gpsRef.current) { gpsRef.current.setLatLng(currentPos); gpsRef.current.setIcon(icon); }
      else gpsRef.current = L.marker(currentPos, { icon, zIndexOffset: 1000 }).addTo(mapRef.current);
    });
  }, [mapReady, currentPos, heading]);

  // Stop markers + route
  useEffect(() => {
    if (!mapReady || !stops.length) return;
    let cancelled = false;
    import("leaflet").then(async (mod) => {
      if (cancelled) return;
      const L = mod.default;
      layerRef.current.clearLayers();

      L.marker(WAREHOUSE, { icon: L.divIcon({ html: `<div style="width:22px;height:22px;background:${hex.bg};border:2px solid ${hex.textDim};border-radius:6px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,.4)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="${hex.textDim}" stroke-width="2"><path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3"/></svg></div>`, className: "", iconSize: [22, 22], iconAnchor: [11, 11] }) }).bindTooltip("Warehouse", { direction: "top", opacity: .95 }).addTo(layerRef.current);

      const firstPending = stops.findIndex((s) => !stopDelivered(s, done) && !stopFailed(s, failed));
      const { coordMap, clusters } = resolveOverlaps(stops);

      // Draw faint dashed rings at cluster centres so drivers know stops are co-located
      clusters.forEach(([center]) => {
        L.circle(center, { radius: 38, fill: false, color, opacity: 0.35, dashArray: "5 6", weight: 1.5 }).addTo(layerRef.current);
      });

      const allCoords = [];
      const pendingStops = [];
      stops.forEach((stop, i) => {
        const coord = coordMap.get(stop.orderReference) || coordForStop(stop);
        if (!coord) return;
        const trueCoord = coordForStop(stop) || coord;
        allCoords.push(trueCoord);
        const isDone = stopDelivered(stop, done);
        const isFailed = !isDone && stopFailed(stop, failed);
        const isActive = !isDone && !isFailed && i === firstPending;
        const state = isDone ? "done" : isFailed ? "failed" : isActive ? "active" : "pending";
        const sz = state === "active" ? 42 : 28;
        L.marker(coord, { icon: L.divIcon({ html: makePinHtml(String(i + 1), state, color, hex), className: "", iconSize: [sz, sz], iconAnchor: [sz / 2, sz / 2] }), zIndexOffset: isActive ? 500 : 0 })
          .bindTooltip(escapeHtml(stop.customer || `Stop ${i + 1}`), { direction: "top", opacity: .95 })
          .addTo(layerRef.current);
        if (!isDone && !isFailed) pendingStops.push(stop);
      });

      // Faint trace through completed stops (straight lines, no API call)
      const completedCoords = stops
        .filter((s) => stopDelivered(s, done) || stopFailed(s, failed))
        .map((s) => coordMap.get(s.orderReference) || coordForStop(s))
        .filter(Boolean);
      if (completedCoords.length) {
        L.polyline([WAREHOUSE, ...completedCoords], { color, weight: 3, opacity: 0.22, dashArray: "5 8" }).addTo(layerRef.current);
      }

      // Pending route — draw straight-line fallback immediately, then replace with OSRM route
      const routeStops = pendingStops.length ? pendingStops : [];
      if (routeStops.length) {
        const pendingCoords = routeStops.map(coordForStop).filter(Boolean);
        const fallbackGroup = L.layerGroup().addTo(layerRef.current);
        if (pendingCoords.length) {
          L.polyline([WAREHOUSE, ...pendingCoords], { color: "#000", weight: 9, opacity: .18 }).addTo(fallbackGroup);
          L.polyline([WAREHOUSE, ...pendingCoords], { color, weight: 5, opacity: .7, dashArray: "10 8", lineCap: "round" }).addTo(fallbackGroup);
        }
        await drawRoute(L, layerRef.current, routeStops, color, () => cancelled);
        fallbackGroup.clearLayers();
      }

      // Fit to pending stops only once deliveries have started, otherwise show full route
      const boundsStops = pendingStops.length < stops.length && pendingStops.length
        ? pendingStops.map(coordForStop).filter(Boolean)
        : allCoords;
      if (!cancelled && boundsStops.length) mapRef.current.fitBounds(L.latLngBounds([WAREHOUSE, ...boundsStops]).pad(0.18));
    });
    return () => { cancelled = true; };
  }, [mapReady, stops, done, failed, color, hex]);

  return <div ref={containerRef} style={{ height: "100%", width: "100%" }} />;
}

// ─── TurnSteps ────────────────────────────────────────────────────────────────
function TurnSteps({ steps }) {
  const [open, setOpen] = useState(false);
  const visible = (steps || []).filter((s) => s.maneuver?.type !== "depart");
  if (!visible.length) return null;
  return (
    <div style={S.stepsWrap}>
      <div style={S.stepsHdr} onClick={() => setOpen((o) => !o)}>
        <span>Turn-by-turn · {visible.length} steps</span>
        <span style={{ fontSize: 12, color: C.textFaint, display: "inline-block", transition: "transform .2s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </div>
      {open && (
        <div style={S.stepsList}>
          {visible.map((step, i) => (
            <div key={i} style={{ ...S.stepRow, borderBottom: i === visible.length - 1 ? "none" : S.stepRow.borderBottom }}>
              <div style={S.stepIco}>{stepArrow(step.maneuver)}</div>
              <div style={S.stepName}>{stepText(step)}</div>
              <div style={S.stepDist}>{fmtDist(step.distance)}</div>
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
        <div style={{ ...S.seq, ...(delivered ? S.seqDone : {}), ...(failed ? { background: "rgba(232,115,107,.15)", borderColor: C.red } : {}) }}>
          {delivered
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="3"><path d="M20 6L9 17l-5-5"/></svg>
            : failed
            ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="3"><path d="M18 6L6 18M6 6l12 12"/></svg>
            : (stop.sequence ?? index + 1)}
        </div>
        <div style={S.stopCust}>{stop.customer || "Customer"}</div>
        {stop.zone && <span style={S.zonePill}>{stop.zone}</span>}
      </div>
      <div style={S.stopAddr}>{stop.address || "Address pending"}</div>
      <div style={S.stopMeta}>
        <span>{stop.orderReference}</span>
        {stop.eta          && <span>· ETA {stop.eta}</span>}
        {stop.itemsSummary && <span>· {stop.itemsSummary}</span>}
      </div>
      {delivered
        ? <div style={S.delivRow}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>Delivered · POD recorded</div>
        : failed
        ? <div style={{ ...S.delivRow, color: C.red }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.red} strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>Failed · {typeof failed === "string" ? failed : "Issue reported"}</div>
        : <>
            <div style={S.cardBtnRow}>
              <button style={S.btnGhost} onClick={() => onNavigate(stop)}>Navigate</button>
              <button style={S.btnPrimary} onClick={() => onMarkDelivered(stop)}>Mark Delivered</button>
            </div>
            <button style={{ width: "100%", marginTop: 6, padding: "7px", background: "none", border: `1px solid ${C.hair}`, borderRadius: 8, color: C.textDim, fontSize: 12.5, cursor: "pointer" }} onClick={() => onReportIssue(stop)}>Can't deliver? Report issue</button>
          </>
      }
    </div>
  );
}

// ─── DriverPortal ─────────────────────────────────────────────────────────────
function DriverPortal({ session, theme, onToggleTheme, onLogout }) {
  const truckId = session.truck || "truck_1";
  const color   = TRUCK_COLOR[truckId] || "#E8B964";

  const [driverName, setDriverName] = useState(session.user);
  const [stops, setStops]     = useState([]);
  const [loadState, setLoad]  = useState("loading");
  const [done, setDone]       = useState({});
  const [failed, setFailed]   = useState({});
  const [pod, setPod]         = useState(null);
  const [podMode, setPodMode] = useState("deliver"); // "deliver" | "fail"
  const [failReason, setFailReason] = useState("");
  const [ageVerified, setAgeVerified] = useState(false);
  const [warehouseReturn, setWarehouseReturn] = useState(false);
  const [photo, setPhoto]     = useState(null);
  const [saving, setSaving]   = useState(false);
  const [podErr, setPodErr]   = useState("");
  const [toast, setToast]     = useState(null); // { msg, type }
  const [gpsState, setGpsState] = useState("unknown"); // "unknown"|"ok"|"denied"|"unavailable"
  const [currentPos, setPos]  = useState(null);
  const [heading, setHeading] = useState(null);
  const [steps, setSteps]     = useState([]);
  const [panelState, setPanel]= useState("mini");
  const [zonesReady, setZonesReady] = useState(false);
  const [hoursBannerDismissed, setHoursBannerDismissed] = useState(false);
  const [gpsBannerDismissed, setGpsBannerDismissed]   = useState(false);
  const mapRef    = useRef(null);
  const fileRef   = useRef(null);
  const prevNext  = useRef(null);
  const prevPos   = useRef(null);
  const posRef    = useRef(null); // latest fix for the location ping
  const panelRef  = useRef(null);
  const dragY     = useRef(null);
  const dragState = useRef(null);

  // Redirect to login on 401 (expired session)
  async function safeFetch(url, opts) {
    const res = await fetch(url, opts);
    if (res.status === 401) { onLogout(); throw Object.assign(new Error("Session expired"), { code: 401 }); }
    return res;
  }

  function showToast(msg, type = "ok") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  // ── Panel drag ──────────────────────────────────────────────────────────────
  const SNAPS = ["mini", "half", "full"];
  const dragVel = useRef({ y: 0, t: 0 });
  function getPanelPx(s) {
    if (s === "mini") return 76;
    if (s === "half") return window.innerHeight * 0.46;
    return window.innerHeight * 0.88;
  }
  function snapNearest(px) {
    const dists = SNAPS.map((s) => Math.abs(getPanelPx(s) - px));
    return SNAPS[dists.indexOf(Math.min(...dists))];
  }
  function snapAndSet(startY, endY) {
    if (!panelRef.current) return;
    panelRef.current.classList.remove("panel-dragging");
    const delta = startY - endY;
    const elapsed = Date.now() - dragVel.current.t;
    const vel = elapsed < 150 ? (dragVel.current.y - endY) / Math.max(1, elapsed) : 0;
    dragY.current = null;
    if (Math.abs(delta) < 6) {
      const CYCLE = { mini: "half", half: "full", full: "mini" };
      setPanel((s) => CYCLE[s]);
    } else if (Math.abs(vel) > 0.4) {
      const idx = SNAPS.indexOf(dragState.current);
      setPanel(SNAPS[Math.max(0, Math.min(SNAPS.length - 1, idx + (vel > 0 ? 1 : -1)))]);
    } else {
      setPanel(snapNearest(getPanelPx(dragState.current) + delta));
    }
  }
  function applyDrag(startY, currentY) {
    if (startY === null || !panelRef.current) return;
    dragVel.current = { y: currentY, t: Date.now() };
    const next = Math.max(64, Math.min(window.innerHeight * 0.93, getPanelPx(dragState.current) + (startY - currentY)));
    panelRef.current.style.height = `${next}px`;
  }
  // Touch
  function onDragStart(e) {
    dragY.current = e.touches[0].clientY;
    dragState.current = panelState;
    dragVel.current = { y: e.touches[0].clientY, t: Date.now() };
    if (panelRef.current) panelRef.current.classList.add("panel-dragging");
  }
  function onDragMove(e)  { applyDrag(dragY.current, e.touches[0].clientY);  }
  function onDragEnd(e)   { snapAndSet(dragY.current, e.changedTouches[0].clientY); }
  // Mouse (desktop)
  function onMouseDown(e) {
    e.preventDefault();
    dragY.current = e.clientY;
    dragState.current = panelState;
    dragVel.current = { y: e.clientY, t: Date.now() };
    if (panelRef.current) panelRef.current.classList.add("panel-dragging");
    function move(ev) { applyDrag(dragY.current, ev.clientY); }
    function up(ev)   { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); snapAndSet(dragY.current, ev.clientY); }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }
  const dragProps = { onTouchStart: onDragStart, onTouchMove: onDragMove, onTouchEnd: onDragEnd, onMouseDown };

  // ── Data ────────────────────────────────────────────────────────────────────
  async function geocodeStop(stop) {
    if (Number.isFinite(stop.lat) && Number.isFinite(stop.lng)) return stop;
    const m = String(stop.address || "").match(/(?<!\d)(\d{6})(?!\d)/);
    if (m) {
      try {
        const r = await fetch(`/api/delivery/geocode/${m[1]}`);
        const j = await r.json();
        if (Number.isFinite(j.latitude) && j.latitude > 1.1 && j.latitude < 1.5 && Number.isFinite(j.longitude) && j.longitude > 103.5 && j.longitude < 104.1)
          return { ...stop, lat: j.latitude, lng: j.longitude };
      } catch { /* fall through */ }
    }
    const c = ZONE_CENTROIDS[stop.zone];
    return c ? { ...stop, lat: c.lat, lng: c.lng } : stop;
  }

  async function loadManifest() {
    setLoad("loading");
    try {
      const res  = await safeFetch(`/api/delivery/driver-manifest?truckId=${encodeURIComponent(truckId)}`);
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();
      const match = (json.manifests || []).find((m) => m.truckId === truckId);
      if (!match?.stops?.length) { setLoad("empty"); return; }
      const geocoded = await Promise.all(match.stops.map(geocodeStop));
      setStops(geocoded);
      setDone((prev) => {
        const srv = {};
        geocoded.forEach((s) => { if (stopDelivered(s, {})) srv[s.orderReference] = true; });
        return { ...srv, ...prev };
      });
      setFailed((prev) => {
        const srv = {};
        geocoded.forEach((s) => { if (stopFailed(s, {})) srv[s.orderReference] = s.status; });
        return { ...srv, ...prev };
      });
      setLoad("ready");
    } catch (e) { if (e.code !== 401) setLoad("error"); }
  }

  // Load zone reference data once, then load the manifest (which geocodes
  // against the centroids). Proceeds even if the fetch fails — WAREHOUSE has a
  // default and stops mostly carry explicit coordinates.
  useEffect(() => {
    let cancelled = false;
    fetch("/api/delivery/zones")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled) { applyZoneData(data); setZonesReady(true); } })
      .catch(() => { if (!cancelled) setZonesReady(true); });
    fetch("/api/delivery/assignment")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => { if (!cancelled && data?.drivers?.[truckId]) setDriverName(data.drivers[truckId]); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => { if (zonesReady) loadManifest(); }, [truckId, zonesReady]);

  // Poll every 30s — silently merges any stops delivered on another device
  useEffect(() => {
    if (!zonesReady) return;
    const id = setInterval(async () => {
      try {
        const res  = await safeFetch("/api/delivery/driver-manifest");
        if (!res.ok) return;
        const json = await res.json();
        const match = (json.manifests || []).find((m) => m.truckId === truckId);
        if (!match?.stops?.length) return;
        setDone((prev) => {
          const merged = { ...prev };
          let changed = false;
          match.stops.forEach((s) => { if (!merged[s.orderReference] && stopDelivered(s, {})) { merged[s.orderReference] = true; changed = true; } });
          return changed ? merged : prev;
        });
        setFailed((prev) => {
          const merged = { ...prev };
          let changed = false;
          match.stops.forEach((s) => { if (!merged[s.orderReference] && stopFailed(s, {})) { merged[s.orderReference] = s.status; changed = true; } });
          return changed ? merged : prev;
        });
      } catch { /* silent on network errors; 401 already redirects via safeFetch */ }
    }, 30_000);
    return () => clearInterval(id);
  }, [truckId, zonesReady]);

  // ── GPS ─────────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!navigator.geolocation) { setGpsState("unavailable"); return; }
    const id = navigator.geolocation.watchPosition(
      (p) => {
        setGpsState("ok");
        const pos = [p.coords.latitude, p.coords.longitude];
        let hdg = p.coords.heading;
        if ((hdg === null || isNaN(hdg)) && prevPos.current) hdg = calcBearing(prevPos.current, pos);
        prevPos.current = pos;
        setPos(pos);
        if (hdg !== null && !isNaN(hdg)) setHeading(hdg);
        posRef.current = { lat: pos[0], lng: pos[1], heading: (hdg !== null && !isNaN(hdg)) ? hdg : null, accuracy: p.coords.accuracy };
      },
      (err) => setGpsState(err.code === 1 ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ── Turn steps ──────────────────────────────────────────────────────────────
  const nextStop  = stops.find((s) => !stopDelivered(s, done) && !stopFailed(s, failed));
  const nextCoord = nextStop ? coordForStop(nextStop) : null;
  const nextIdx   = stops.findIndex((s) => !stopDelivered(s, done) && !stopFailed(s, failed));
  const doneCount  = stops.filter((s) => stopDelivered(s, done)).length;
  const failCount  = stops.filter((s) => stopFailed(s, failed)).length;

  // ── Live location ping → Command Centre ───────────────────────────────────────
  // Only while actively on a route (loaded + a stop still pending). Sends the
  // latest fix every LOCATION_PING_MS, and a final "inactive" ping on the way out.
  // A browser tab backgrounding (screen lock, app switch) still suspends this —
  // that's a platform limit, not something fixable in web code. What we *can* do:
  // fire an immediate catch-up ping the moment the tab is visible again, and tell
  // the driver tracking paused so a silent gap doesn't go unnoticed.
  const onActiveRoute = loadState === "ready" && Boolean(nextStop);
  useEffect(() => {
    if (!onActiveRoute) return;
    const hiddenSince = { current: null };
    const send = (active) => {
      const cur = posRef.current;
      if (!cur) return;
      fetch("/api/delivery/driver-location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ truckId, lat: cur.lat, lng: cur.lng, heading: cur.heading, accuracy: cur.accuracy, active })
      }).catch(() => {});
    };
    const onVisibility = () => {
      if (document.visibilityState === "hidden") { hiddenSince.current = Date.now(); return; }
      send(true); // catch-up ping the instant the driver comes back
      const gapMs = hiddenSince.current ? Date.now() - hiddenSince.current : 0;
      if (gapMs > 20_000) showToast("GPS was paused while the app was in the background — resumed", "warn");
      hiddenSince.current = null;
    };
    document.addEventListener("visibilitychange", onVisibility);
    send(true); // immediate ping when the route becomes active
    const id = setInterval(() => send(true), LOCATION_PING_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      clearInterval(id);
      send(false);
    };
  }, [onActiveRoute, truckId]);

  // Keep the screen awake while on an active route so mobile browsers don't
  // suspend the GPS watch / location-ping timer on screen-lock. Re-acquires
  // on tab refocus since the OS releases the lock when the tab backgrounds.
  useEffect(() => {
    if (!onActiveRoute || !("wakeLock" in navigator)) return;
    let cancelled = false;
    let sentinel = null;
    const acquire = () => {
      if (cancelled || document.visibilityState !== "visible") return;
      navigator.wakeLock.request("screen").then((wl) => {
        if (cancelled) { wl.release(); return; }
        sentinel = wl;
      }).catch(() => {});
    };
    acquire();
    document.addEventListener("visibilitychange", acquire);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", acquire);
      sentinel?.release();
    };
  }, [onActiveRoute]);

  useEffect(() => {
    if (!nextStop || nextStop.orderReference === prevNext.current || !nextCoord) return;
    prevNext.current = nextStop.orderReference;
    fetchLegSteps(currentPos || WAREHOUSE, nextCoord).then(setSteps).catch(() => setSteps([]));
  }, [nextStop?.orderReference]);

  function navigateToStop(stop) {
    const coord = coordForStop(stop);
    if (coord && mapRef.current) mapRef.current.flyTo(coord, 16);
  }

  // ── POD ─────────────────────────────────────────────────────────────────────
  function openPOD(stop, mode = "deliver") {
    setPod(stop); setPodMode(mode); setPhoto(null); setFailReason(""); setAgeVerified(false); setWarehouseReturn(false); setPodErr("");
  }
  function onPhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => { setPhoto(r.result); setAgeVerified(true); };
    r.readAsDataURL(file);
  }
  async function confirmPOD() {
    if (!pod || !photo) return;
    setSaving(true); setPodErr("");
    try {
      const res = await safeFetch("/api/delivery/pod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderReference: pod.orderReference, photoDataUrl: photo, podUrl: `pod/${truckId}/${pod.orderReference}-${Date.now()}.jpg`, driverName: session.user, truckId }) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || res.status); }
      setDone((d) => ({ ...d, [pod.orderReference]: true }));
      setPod(null); setPhoto(null);
      showToast("Delivery recorded ✓");
    } catch (err) { if (err.code !== 401) setPodErr(err.message); }
    finally { setSaving(false); }
  }
  async function confirmFailed() {
    if (!pod || !failReason) return;
    setSaving(true); setPodErr("");
    try {
      const res = await safeFetch("/api/delivery/pod", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderReference: pod.orderReference, failReason, driverName: session.user, truckId }) });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j.error || res.status); }
      setFailed((f) => ({ ...f, [pod.orderReference]: failReason }));
      setFailReason("");
      if (failReason === "Damaged goods") { setWarehouseReturn(true); }
      else { setPod(null); showToast("Issue reported", "warn"); }
    } catch (err) { if (err.code !== 401) setPodErr(err.message); }
    finally { setSaving(false); }
  }

  return (
    <div className={`dp ${theme}`} style={S.root}>
      <style>{GLOBAL_CSS}</style>

      {/* Top bar */}
      <div style={S.header}>
        <img src="/assets/logo.png" alt="Beeva" style={{ height: 22, display: "block", flexShrink: 0 }} />
        <div style={S.hDivider} />
        <span style={{ ...S.truckDot, background: color }} />
        <span style={S.hTruckName}>{TRUCK_NAME[truckId]}</span>
        <span style={S.hTruckSep}>|</span>
        <span style={S.hTruckUser}>{driverName}</span>
        <div style={{ flex: 1 }} />
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        <button onClick={onLogout} style={S.iconBtn} aria-label="Sign out" title="Sign out">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {/* Progress strip */}
      <div style={S.progStrip}>
        <div style={S.hProgTrack}>
          <div style={{ ...S.hProgFill, width: stops.length ? `${(doneCount / stops.length) * 100}%` : "0%", background: color }} />
        </div>
        <span style={{ fontSize: 12.5, fontWeight: 600, color, fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {doneCount} / {stops.length || "—"}
          {failCount > 0 && <span style={{ color: C.red, fontSize: 11, marginLeft: 5 }}>· {failCount} failed</span>}
        </span>
      </div>

      {/* Map */}
      <div style={S.mapWrap}>
        {loadState === "loading" && (
          <div className="skeleton" style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center", color: C.textDim, fontSize: 14 }}>
            Loading your route…
          </div>
        )}
        <MapView stops={stops} done={done} failed={failed} truckId={truckId} currentPos={currentPos} heading={heading} theme={theme} onReady={(map) => { mapRef.current = map; }} />
        {currentPos && (
          <button style={S.locBtn} onClick={() => mapRef.current?.setView(currentPos, 16)} aria-label="Center on me">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2">
              <circle cx="12" cy="12" r="3.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
            </svg>
          </button>
        )}
      </div>

      {/* Bottom panel */}
      <div ref={panelRef} className="panel" style={{ ...S.panel, height: PANEL_H[panelState] }}>

        {/* Grabber */}
        <div style={S.grabberRow} {...dragProps}>
          <div style={S.grabber} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.textFaint} strokeWidth="2.5"
            style={{ display: "inline-block", transform: panelState === "full" ? "rotate(180deg)" : "none", transition: "transform .3s ease" }}>
            <path d="M18 15l-6-6-6 6"/>
          </svg>
        </div>

        {/* Mini strip */}
        {panelState === "mini" && (
          <div style={S.miniRow} {...dragProps}>
            {loadState === "ready" && nextStop
              ? <><span style={S.miniLabel}>Next</span><span style={S.miniCust}>{nextStop.customer || "Customer"}</span><span style={S.miniCount}>{nextIdx + 1}/{stops.length}</span></>
              : <span style={{ fontSize: 13, color: C.textDim }}>{loadState === "loading" ? "Loading route…" : loadState === "empty" ? "No stops today" : "Tap to expand"}</span>
            }
          </div>
        )}

        {/* Full content (half + full) */}
        {panelState !== "mini" && (
          <div className="panel-scroll" style={S.panelScroll} onScroll={(e) => { if (panelState === "half" && e.currentTarget.scrollTop === 0) setPanel("full"); }}>

            {loadState === "error" && <div style={S.stateMsg}>Couldn't load your route. <button onClick={loadManifest} style={S.linkBtn}>Retry</button></div>}
            {loadState === "empty" && <div style={S.stateMsg}>No stops assigned yet. <button onClick={loadManifest} style={S.linkBtn}>Refresh</button></div>}

            {loadState === "ready" && nextStop && (
              <>
                <div style={S.nextWrap}>
                  <div style={S.nextLabel}>Next stop · {nextIdx + 1} of {stops.length}</div>
                  <div style={S.nextCust}>{nextStop.customer || "Customer"}</div>
                  <div style={S.nextAddr}>{nextStop.address || "Address pending"}</div>
                  <div style={S.chipRow}>
                    <span style={S.chip}>{nextStop.orderReference}</span>
                    {nextStop.eta          && <span style={S.chip}>ETA {nextStop.eta}</span>}
                    {nextStop.itemsSummary && <span style={S.chip}>{nextStop.itemsSummary}</span>}
                    {nextStop.zone         && <span style={S.chip}>{nextStop.zone}</span>}
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

            {loadState === "ready" && !nextStop && doneCount > 0 && (
              <div style={{ padding: "28px 18px", textAlign: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: C.greenSoft, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                </div>
                <div style={{ color: C.text, fontSize: 17, fontWeight: 700, marginBottom: 4 }}>Route complete</div>
                <div style={{ color: C.textDim, fontSize: 13.5 }}>{doneCount} delivered{failCount > 0 ? `, ${failCount} failed` : ""} · {stops.length} total.</div>
              </div>
            )}

            {loadState === "ready" && stops.length > 0 && (
              <>
                <div style={S.sectionHdr}>All stops</div>
                <div style={{ paddingBottom: 28 }}>
                  {stops.map((stop, i) => (
                    <StopCard key={stop.orderReference || i} stop={stop} index={i}
                      delivered={stopDelivered(stop, done)} failed={failed[stop.orderReference]} active={i === nextIdx}
                      onMarkDelivered={(s) => openPOD(s, "deliver")} onReportIssue={(s) => openPOD(s, "fail")} onNavigate={navigateToStop} />
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: "none" }} onChange={onPhotoChange} />

      {/* POD sheet */}
      {/* GPS denied banner */}
      {(gpsState === "denied" || gpsState === "unavailable") && !gpsBannerDismissed && (
        <div style={{ position: "absolute", top: 88, left: 0, right: 0, zIndex: 450, background: "rgba(232,115,107,.9)", backdropFilter: "blur(6px)", padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#fff" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span style={{ flex: 1 }}>{gpsState === "denied" ? "Location access denied — enable in browser settings for live navigation." : "GPS unavailable on this device."}</span>
          <button onClick={() => setGpsBannerDismissed(true)} style={{ background: "none", border: "none", color: "#fff", opacity: 0.8, cursor: "pointer", padding: "2px 4px", fontSize: 16, lineHeight: 1 }}>✕</button>
        </div>
      )}

      {/* Out-of-hours banner */}
      {(() => {
        const now = new Date();
        const h = now.getHours(), d = now.getDay();
        const isWeekend = d === 0 || d === 6;
        const isOutOfHours = h < 10 || h >= 19;
        if ((!isWeekend && !isOutOfHours) || hoursBannerDismissed) return null;
        const msg = isWeekend ? "No deliveries today — Mon–Fri only." : h < 10 ? "Deliveries start at 10am." : "Delivery hours have ended for today (7pm).";
        return (
          <div style={{ position: "absolute", top: (gpsState === "denied" || gpsState === "unavailable") && !gpsBannerDismissed ? 126 : 88, left: 0, right: 0, zIndex: 449, background: "rgba(200,155,60,.92)", backdropFilter: "blur(6px)", padding: "9px 16px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#fff" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            <span style={{ flex: 1 }}>{msg}</span>
            <button onClick={() => setHoursBannerDismissed(true)} style={{ background: "none", border: "none", color: "#fff", opacity: 0.8, cursor: "pointer", padding: "2px 4px", fontSize: 16, lineHeight: 1 }}>✕</button>
          </div>
        );
      })()}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 96, left: "50%", transform: "translateX(-50%)", zIndex: 9000, background: toast.type === "warn" ? C.red : C.green, color: "#fff", padding: "10px 20px", borderRadius: 24, fontSize: 14, fontWeight: 600, boxShadow: "0 4px 24px rgba(0,0,0,.4)", whiteSpace: "nowrap", pointerEvents: "none" }}>
          {toast.msg}
        </div>
      )}

      {pod && (
        <div style={S.overlay} onClick={() => !saving && (setPod(null), setPhoto(null), setFailReason(""), setAgeVerified(false), setWarehouseReturn(false))}>
          <div className="sheet-anim" style={S.sheet} onClick={(e) => e.stopPropagation()}>
            <div style={{ ...S.grabberRow, marginBottom: 6 }}><div style={S.grabber} /></div>

            {/* Warehouse return screen — shown after confirming damaged goods */}
            {warehouseReturn ? (
              <>
                <div style={{ textAlign: "center", padding: "8px 0 20px" }}>
                  <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(232,185,100,.15)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 17, marginBottom: 8 }}>Return to warehouse</div>
                  <div style={{ fontSize: 13.5, color: C.textDim, lineHeight: 1.5 }}>Bring the damaged goods back before continuing your route. The office will arrange a replacement delivery.</div>
                </div>
                <button style={{ ...S.btnPrimary, width: "100%" }} onClick={() => { setPod(null); setWarehouseReturn(false); showToast("Issue reported", "warn"); }}>Got it</button>
              </>
            ) : (
              <>
                <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 4, letterSpacing: "-.01em" }}>
                  {podMode === "fail" ? "Report delivery issue" : "Proof of delivery"}
                </div>
                <div style={{ fontSize: 13, color: C.textDim, marginBottom: 18 }}>{pod.orderReference} · {pod.customer}</div>

            {podMode === "fail" ? (
              <>
                {["Customer not home", "Wrong address", "Refused delivery", "Age verification failed", "Damaged goods", "Other"].map((r) => (
                  <button key={r} style={{ ...S.btnGhost, width: "100%", marginBottom: 8, justifyContent: "flex-start", background: failReason === r ? "rgba(232,115,107,.15)" : undefined, borderColor: failReason === r ? C.red : undefined, color: failReason === r ? C.red : C.text }} onClick={() => setFailReason(r)}>{r}</button>
                ))}
                {podErr && <div style={S.errText}>{podErr}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                  <button style={S.btnGhost} onClick={() => { setPod(null); setFailReason(""); }} disabled={saving}>Cancel</button>
                  <button style={{ ...S.btnPrimary, background: C.red, opacity: !failReason || saving ? 0.5 : 1 }} onClick={confirmFailed} disabled={saving || !failReason}>{saving ? "Saving…" : "Confirm issue"}</button>
                </div>
              </>
            ) : (
              <>
                {photo
                  ? <img src={photo} alt="POD" style={S.preview} />
                  : <button style={{ ...S.btnGhost, width: "100%", marginBottom: 14, padding: "16px", borderStyle: "dashed" }} onClick={() => fileRef.current?.click()}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" style={{ marginRight: 8 }}><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                      Take photo
                    </button>}
                {photo && <button style={{ ...S.btnGhost, width: "100%", marginBottom: 12, fontSize: 13 }} onClick={() => fileRef.current?.click()}>Retake photo</button>}

                {/* Age verification — only shown once photo is taken */}

                {podErr && <div style={S.errText}>{podErr}</div>}
                <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
                  <button style={S.btnGhost} onClick={() => { setPod(null); setPhoto(null); setAgeVerified(false); }} disabled={saving}>Cancel</button>
                  <button style={{ ...S.btnPrimary, opacity: (!photo || saving) ? 0.5 : 1 }} onClick={confirmPOD} disabled={saving || !photo}>{saving ? "Saving…" : "Confirm delivery"}</button>
                </div>
              </>
            )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── LoginScreen ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin, theme, onToggleTheme }) {
  const [form, setForm]     = useState({ username: "", password: "" });
  const [error, setError]   = useState("");
  const [loading, setLoad]  = useState(false);

  async function submit(e) {
    e.preventDefault(); setError(""); setLoad(true);
    try {
      const res  = await fetch("/api/auth/driver-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Login failed");
      onLogin(json);
    } catch (err) { setError(err.message); }
    finally { setLoad(false); }
  }

  return (
    <div className={`dp ${theme}`} style={S.center}>
      <style>{GLOBAL_CSS}</style>
      <div style={{ position: "fixed", top: 16, right: 16 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div style={S.loginCard}>
        <img src="/assets/logo.png" alt="Beeva" style={{ height: 38, display: "block", marginBottom: 10 }} />
        <div style={S.loginSub}>Driver Portal · Wine &amp; Spirits</div>
        <form onSubmit={submit}>
          <label style={S.flabel}>Username</label>
          <input style={S.finput} value={form.username} onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))} autoComplete="username" placeholder="Enter username" required />
          <label style={S.flabel}>Password</label>
          <input style={{ ...S.finput, marginBottom: 22 }} type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} autoComplete="current-password" placeholder="••••••••" required />
          <button style={{ ...S.btnGold, opacity: loading ? 0.6 : 1 }} type="submit" disabled={loading}>{loading ? "Signing in…" : "Sign in"}</button>
          {error && <div style={S.errText}>{error}</div>}
        </form>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function DriverPortalPage() {
  const [session, setSession] = useState(null);
  const [checked, setChecked] = useState(false);
  const [theme, setTheme]     = useState(() => localStorage.getItem("dp-theme") || "dark");

  useEffect(() => {
    const prev = document.title;
    document.title = "Beeva | Driver Portal";
    return () => { document.title = prev; };
  }, []);

  function toggleTheme() {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      localStorage.setItem("dp-theme", next);
      return next;
    });
  }

  useEffect(() => {
    fetch("/api/auth/driver-me")
      .then((r) => r.json())
      .then((j) => { if (j.role === "driver") setSession(j); setChecked(true); })
      .catch(() => setChecked(true));
  }, []);

  async function logout() { await fetch("/api/auth/driver-logout", { method: "POST" }); setSession(null); }

  if (!checked) return <div className={`dp ${theme}`} style={{ ...S.center, color: C.textDim, fontSize: 14 }}><style>{GLOBAL_CSS}</style>Loading…</div>;
  if (!session)  return <LoginScreen onLogin={setSession} theme={theme} onToggleTheme={toggleTheme} />;
  return <DriverPortal session={session} theme={theme} onToggleTheme={toggleTheme} onLogout={logout} />;
}
