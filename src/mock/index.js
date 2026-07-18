// Aggregates every mock/*.js domain into the single initial state tree
// that AppData.jsx persists to localStorage. Keeping this as one function
// (rather than static exports) means "Reset Demo" can always produce a
// fresh, time-relative seed instead of replaying a stale hardcoded date.
import { INVENTORY } from "./inventory.js";
import { generateOrders } from "./orders.js";
import { DEPOT, ZONE_CENTROIDS, optimizeStops, computeEtas, buildRoutePolyline } from "./delivery.js";
import { TIERS, generateMembers, generateBroadcasts } from "./loyalty.js";
import { generateThreads } from "./inbox.js";
import { generateChannels } from "./marketplace.js";
import { generateRules } from "./automations.js";
import { DRIVERS, STOCK_CLERK } from "./people.js";

export const STORAGE_KEY = "mr:appstate:v1";
export const STATE_VERSION = 1;

function buildTrucks(orders, now) {
  const trucks = {};
  DRIVERS.forEach((driver, i) => {
    const truckId = driver.truckId;
    const stops = orders.filter((o) => o.truckId === truckId && o.status === "out_for_delivery");
    const ordered = optimizeStops(stops.map((s) => ({ id: s.id, zone: s.zone, orderNo: s.orderNo, customer: s.customer })));
    const withEtas = computeEtas(ordered, now);
    const polyline = buildRoutePolyline(ordered, truckId);
    trucks[truckId] = {
      id: truckId,
      label: `Truck ${i + 1}`,
      driverId: driver.id,
      driverName: driver.name,
      stopIds: withEtas.map((s) => s.id),
      stops: withEtas,
      polyline,
      segmentIndex: 0,
      progress: 0,
      position: { lat: DEPOT.lat, lng: DEPOT.lng, heading: 0 },
      status: withEtas.length ? "en_route" : "idle",
    };
  });
  return trucks;
}

export function buildInitialState(now = new Date()) {
  const orders = generateOrders(now);
  const members = generateMembers(now);
  const broadcasts = generateBroadcasts(now);
  const threads = generateThreads(now);
  const channels = generateChannels(now);
  const rules = generateRules(now);
  const trucks = buildTrucks(orders, now);

  return {
    meta: { version: STATE_VERSION, seedId: "default", seededAt: now.toISOString() },
    session: { role: null, enteredAt: null, theme: "dark" },
    inventory: { items: INVENTORY },
    orders: { items: orders },
    delivery: { trucks, zoneCentroids: ZONE_CENTROIDS, depot: DEPOT, liveEvents: [] },
    loyalty: { tiers: TIERS, members, broadcasts, referrals: { count: 47, points: 4200, monthlyGoal: 60 } },
    inbox: { threads },
    marketplace: { channels },
    automation: { rules },
    stock: { clerk: STOCK_CLERK, receipts: [] },
  };
}
