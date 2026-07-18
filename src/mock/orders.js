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

const STATUS_FLOW = ["pending", "packed", "out_for_delivery", "delivered"];

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

export function generateOrders(now = new Date(), count = 54) {
  const rand = seededRandom("orders-seed");
  const orders = [];
  for (let i = 0; i < count; i++) {
    const customer = CUSTOMERS[i % CUSTOMERS.length];
    const channel = pick(rand, CHANNELS).id;
    const zone = getZoneForPostal(customer.postal);
    const lines = buildLines(rand);
    const total = lines.reduce((s, l) => s + l.price * l.qty, 0);

    // Distribution: mostly delivered (history), a working slice of today's
    // pipeline in earlier stages, and a couple of cancellations.
    let status;
    if (i < 6) status = "pending";
    else if (i < 12) status = "packed";
    else if (i < 22) status = "out_for_delivery";
    else if (i < 51) status = "delivered";
    else status = "cancelled";

    const minutesAgo = randInt(rand, 5, status === "delivered" ? 60 * 24 * 6 : 60 * 6);
    const placedAt = new Date(now.getTime() - minutesAgo * 60000).toISOString();
    const packedAt = STATUS_FLOW.indexOf(status) >= 1 ? new Date(new Date(placedAt).getTime() + 20 * 60000).toISOString() : null;
    const dispatchedAt = STATUS_FLOW.indexOf(status) >= 2 ? new Date(new Date(placedAt).getTime() + 55 * 60000).toISOString() : null;
    const deliveredAt = status === "delivered" ? new Date(new Date(placedAt).getTime() + 130 * 60000).toISOString() : null;

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
      truckId: status === "out_for_delivery" ? (i % 2 === 0 ? "truck_1" : "truck_2") : null,
      zone,
    });
  }
  return orders;
}
