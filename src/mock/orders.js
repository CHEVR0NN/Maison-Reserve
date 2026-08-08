// Order seed generator. Timestamps are generated relative to `now` (not a
// fixed hardcoded date) so the demo always looks current whenever it's
// actually visited, rather than perpetually showing "April 2026."
import { INVENTORY } from "./inventory.js";
import { CUSTOMERS } from "./people.js";
import { getZoneForPostal } from "../utils.js";
import { seededRandom, pick, randInt } from "./ids.js";

export const CHANNELS = [
  { id: "own-site", label: "Own Site" },
  { id: "lazada", label: "Lazada" },
  { id: "shopee", label: "Shopee" },
];

// Fulfilment clock, in minutes after the order is placed. Status is *derived*
// from an order's age against these thresholds rather than assigned by index —
// that is what keeps the Command Center's stage counts internally consistent
// (an order can never read "placed 6 hours ago" and still sit in Received),
// and it guarantees a live pipeline no matter what hour the demo is opened.
const PACK_MIN = 45;
const DISPATCH_MIN = 120;
const DELIVER_MIN = 260;

// Each day's orders are spread across the TRADING_HOURS window *ending at the
// current time*, rather than a fixed 09:00–22:00 clock. Two reasons: the
// pipeline stays populated whenever the demo is opened (a fixed window leaves
// the fleet idle overnight), and every day is drawn from an identical window,
// which is what makes the day-over-day revenue comparison like-for-like
// instead of comparing a part-day against a whole one.
const TRADING_HOURS = 13;
const MS_PER_MIN = 60000;
const DAY_MS = 86400000;

function buildLines(rand) {
  const count = randInt(rand, 1, 3);
  const lines = [];
  const used = new Set();
  for (let i = 0; i < count; i++) {
    let item = pick(rand, INVENTORY);
    let guard = 0;
    while (used.has(item.sku) && guard < 10) { item = pick(rand, INVENTORY); guard++; }
    used.add(item.sku);
    const qty = randInt(rand, 1, 3);
    lines.push({ sku: item.sku, name: item.name, qty, price: item.price });
  }
  return lines;
}

function timelineFor(status, placedAt, packedAt, dispatchedAt, deliveredAt) {
  const t = [{ at: placedAt, label: "Order placed", actor: "Customer" }];
  if (packedAt) t.push({ at: packedAt, label: "Packed & ready", actor: "Warehouse" });
  if (dispatchedAt) t.push({ at: dispatchedAt, label: "Out for delivery", actor: "Dispatch" });
  if (deliveredAt) t.push({ at: deliveredAt, label: "Delivered", actor: "Driver" });
  if (status === "cancelled") t.push({ at: placedAt, label: "Order cancelled", actor: "Staff" });
  return t;
}

// Daily volume trends gently upward across the window — the fictional business
// is growing a few percent a day — so the headline day-over-day KPI settles in
// a believable single-to-low-double-digit band instead of the triple-digit
// swing the old part-day-vs-whole-day seed produced.
const DAILY_GROWTH = 1.05;

function placementTimes(rand, now, perDay, daySpan) {
  const windowMin = TRADING_HOURS * 60;
  const times = [];
  for (let daysAgo = daySpan - 1; daysAgo >= 0; daysAgo--) {
    const closesAt = now.getTime() - daysAgo * DAY_MS;
    const trend = Math.pow(DAILY_GROWTH, daySpan - 1 - daysAgo);
    const volume = Math.round(perDay * trend) + randInt(rand, -2, 2);
    for (let n = 0; n < volume; n++) {
      times.push(closesAt - randInt(rand, 0, windowMin) * MS_PER_MIN);
    }
  }
  return times.sort((a, b) => a - b);
}

export function generateOrders(now = new Date(), perDay = 30, daySpan = 7) {
  const rand = seededRandom("orders-seed");
  const times = placementTimes(rand, now, perDay, daySpan);
  const orders = [];
  let dispatched = 0;

  times.forEach((placedMs, i) => {
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    const channel = pick(rand, CHANNELS).id;
    const zone = getZoneForPostal(customer.postal);
    const lines = buildLines(rand);
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    const ageMin = (now.getTime() - placedMs) / MS_PER_MIN;
    let status;
    if (rand() < 0.035) status = "cancelled";
    else if (ageMin >= DELIVER_MIN) status = "delivered";
    else if (ageMin >= DISPATCH_MIN) status = "out_for_delivery";
    else if (ageMin >= PACK_MIN) status = "packed";
    else status = "pending";

    const placedAt = new Date(placedMs).toISOString();
    const stamp = (min) => new Date(placedMs + min * MS_PER_MIN).toISOString();
    const stage = { pending: 0, packed: 1, out_for_delivery: 2, delivered: 3, cancelled: -1 }[status];
    const packedAt = stage >= 1 ? stamp(PACK_MIN) : null;
    const dispatchedAt = stage >= 2 ? stamp(DISPATCH_MIN) : null;
    const deliveredAt = stage >= 3 ? stamp(DELIVER_MIN) : null;

    orders.push({
      id: `ord_${i + 1}`,
      orderNo: `MR-${10230 + i}`,
      status,
      channel,
      customer,
      lines,
      total: Math.round(total * 100) / 100,
      placedAt,
      packedAt,
      dispatchedAt,
      deliveredAt,
      timeline: timelineFor(status, placedAt, packedAt, dispatchedAt, deliveredAt),
      podPhotoRef: status === "delivered" && rand() > 0.4 ? `pod_${i + 1}` : null,
      truckId: status === "out_for_delivery" ? (dispatched++ % 2 === 0 ? "truck_1" : "truck_2") : null,
      zone,
    });
  });

  return orders.reverse(); // newest first, as every consuming view expects
}
