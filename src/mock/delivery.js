// Delivery/geo helpers: zone centroids, a nearest-neighbor + 2-opt TSP
// heuristic (stands in for the real OR-Tools VRP solver), and a polyline
// generator (stands in for real OSRM road geometry) so the Driver Portal's
// map has something plausible to animate along without any external API.
import { seededRandom, randRange } from "./ids.js";

export const DEPOT = { lat: 1.2740, lng: 103.8480, label: "Depot — Tanjong Pagar" };

export const ZONE_CENTROIDS = {
  C1: { lat: 1.2836, lng: 103.8607 }, C2: { lat: 1.2789, lng: 103.8536 }, C3: { lat: 1.3048, lng: 103.8318 },
  E1: { lat: 1.3236, lng: 103.9273 }, E2: { lat: 1.3496, lng: 103.9568 }, E3: { lat: 1.3201, lng: 103.8918 },
  N1: { lat: 1.4382, lng: 103.7891 }, N2: { lat: 1.4304, lng: 103.8354 }, N3: { lat: 1.3691, lng: 103.8454 },
  NE1: { lat: 1.3984, lng: 103.9072 }, NE2: { lat: 1.3612, lng: 103.8863 }, NE3: { lat: 1.3343, lng: 103.8563 },
  W1: { lat: 1.3404, lng: 103.7090 }, W2: { lat: 1.3162, lng: 103.7649 }, W3: { lat: 1.3294, lng: 103.7936 },
};

const STREET_STEP_POOL = [
  "Head out via the depot gate", "Turn right onto Keppel Rd", "Merge onto Ayer Rajah Expressway",
  "Take the exit toward Orchard Rd", "Turn left onto Bukit Timah Rd", "Continue onto Thomson Rd",
  "Turn right onto Serangoon Ave", "Merge onto Pan Island Expressway", "Take the exit toward Tampines",
  "Turn left onto Jurong Gateway Rd", "Continue straight onto Woodlands Ave", "Turn right onto Yishun Ave",
  "Arrive at stop — park in the loading bay",
];

export function stepsForSegment(index) {
  const a = STREET_STEP_POOL[index % (STREET_STEP_POOL.length - 1)];
  return [a, "Arrive at stop — park in the loading bay"];
}

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function pointFor(stop) {
  return ZONE_CENTROIDS[stop.zone] || DEPOT;
}

// Nearest-neighbor TSP starting from the depot, then a single 2-opt cleanup
// pass — cheap enough to run instantly, convincing enough to look "solved."
export function optimizeStops(stops) {
  if (stops.length === 0) return [];
  const remaining = [...stops];
  const ordered = [];
  let current = DEPOT;
  while (remaining.length) {
    let bestIdx = 0, bestDist = Infinity;
    remaining.forEach((s, i) => {
      const d = haversine(current, pointFor(s));
      if (d < bestDist) { bestDist = d; bestIdx = i; }
    });
    const [next] = remaining.splice(bestIdx, 1);
    ordered.push(next);
    current = pointFor(next);
  }
  return twoOptPass(ordered);
}

function routeDistance(order) {
  let total = 0;
  let prev = DEPOT;
  for (const stop of order) {
    total += haversine(prev, pointFor(stop));
    prev = pointFor(stop);
  }
  return total;
}

function twoOptPass(order) {
  if (order.length < 4) return order;
  let best = order;
  let bestDist = routeDistance(best);
  for (let i = 0; i < best.length - 1; i++) {
    for (let j = i + 1; j < best.length; j++) {
      const candidate = [...best.slice(0, i), ...best.slice(i, j + 1).reverse(), ...best.slice(j + 1)];
      const d = routeDistance(candidate);
      if (d < bestDist) { best = candidate; bestDist = d; }
    }
  }
  return best;
}

// ETA per stop: average 28km/h city speed + 6min dwell per stop.
export function computeEtas(orderedStops, startTime) {
  let t = new Date(startTime).getTime();
  let prev = DEPOT;
  return orderedStops.map((stop) => {
    const dist = haversine(prev, pointFor(stop));
    const travelMs = (dist / 28) * 3600 * 1000;
    t += travelMs;
    const eta = new Date(t);
    t += 6 * 60 * 1000;
    prev = pointFor(stop);
    return { ...stop, eta: eta.toISOString() };
  });
}

// A gently-curved polyline between two points (2 jittered midpoints) so the
// route doesn't render as a laser-straight line without any real road graph.
export function buildSegmentPolyline(from, to, seed) {
  const rand = seededRandom(seed);
  const pts = [[from.lat, from.lng]];
  for (let i = 1; i <= 2; i++) {
    const f = i / 3;
    const lat = from.lat + (to.lat - from.lat) * f;
    const lng = from.lng + (to.lng - from.lng) * f;
    const perpLat = -(to.lng - from.lng);
    const perpLng = to.lat - from.lat;
    const mag = Math.hypot(perpLat, perpLng) || 1;
    const jitter = randRange(rand, -0.0015, 0.0015);
    pts.push([lat + (perpLat / mag) * jitter, lng + (perpLng / mag) * jitter]);
  }
  pts.push([to.lat, to.lng]);
  return pts;
}

export function buildRoutePolyline(orderedStops, truckId) {
  const points = [DEPOT, ...orderedStops.map(pointFor)];
  const segments = [];
  for (let i = 0; i < points.length - 1; i++) {
    segments.push(buildSegmentPolyline(points[i], points[i + 1], `${truckId}-${i}`));
  }
  return segments;
}
