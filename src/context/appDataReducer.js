import { deriveTierForSpend } from "../mock/loyalty.js";
import { optimizeStops, computeEtas, buildRoutePolyline } from "../mock/delivery.js";
import { nextId } from "../mock/ids.js";

function recomputeMemberTier(member, tiers) {
  const tier = deriveTierForSpend(member.spend13mo, tiers);
  return { ...member, tier: tier.name };
}

function accrueLoyaltyForOrder(loyalty, order) {
  const idx = loyalty.members.findIndex((m) => m.phone === order.customer?.phone);
  if (idx === -1) return loyalty;
  const members = [...loyalty.members];
  const member = members[idx];
  const tier = deriveTierForSpend(member.spend13mo, loyalty.tiers);
  const spend13mo = Math.round((member.spend13mo + order.total) * 100) / 100;
  const pointsBalance = member.pointsBalance + Math.round(order.total * tier.mult);
  members[idx] = recomputeMemberTier({ ...member, spend13mo, pointsBalance, lastOrderAt: order.deliveredAt || new Date().toISOString() }, loyalty.tiers);
  return { ...loyalty, members };
}

function pushLiveEvent(delivery, kind, message, at) {
  const liveEvents = [{ id: nextId("evt"), at, kind, message }, ...delivery.liveEvents].slice(0, 30);
  return { ...delivery, liveEvents };
}

export function appDataReducer(state, action) {
  switch (action.type) {
    // ---- session ----
    case "SESSION_ENTER_DEMO":
      return { ...state, session: { ...state.session, role: action.role, enteredAt: new Date().toISOString() } };
    case "SESSION_EXIT_DEMO":
      return { ...state, session: { ...state.session, role: null } };
    case "SESSION_SET_THEME":
      return { ...state, session: { ...state.session, theme: action.theme } };

    // ---- inventory ----
    case "INVENTORY_ADD":
      return { ...state, inventory: { items: [action.item, ...state.inventory.items] } };
    case "INVENTORY_UPDATE":
      return { ...state, inventory: { items: state.inventory.items.map((it) => it.id === action.id ? { ...it, ...action.patch } : it) } };
    case "INVENTORY_REMOVE":
      return { ...state, inventory: { items: state.inventory.items.filter((it) => it.id !== action.id) } };
    case "INVENTORY_ADJUST_STOCK":
      return { ...state, inventory: { items: state.inventory.items.map((it) => it.id === action.id ? { ...it, stock: Math.max(0, it.stock + action.delta) } : it) } };
    case "INVENTORY_BULK_IMPORT": {
      const bySku = new Map(state.inventory.items.map((it) => [it.sku, it]));
      action.rows.forEach((row) => {
        const existing = bySku.get(row.sku);
        bySku.set(row.sku, existing ? { ...existing, stock: existing.stock + (row.qty || 0) } : { id: row.sku, ...row });
      });
      return { ...state, inventory: { items: Array.from(bySku.values()) } };
    }

    // ---- orders ----
    case "ORDERS_CREATE":
      return { ...state, orders: { items: [action.order, ...state.orders.items] } };
    case "ORDERS_UPDATE_STATUS": {
      let loyalty = state.loyalty;
      const items = state.orders.items.map((o) => {
        if (o.id !== action.id) return o;
        const now = new Date().toISOString();
        const updated = { ...o, status: action.status };
        if (action.status === "packed") updated.packedAt = now;
        if (action.status === "out_for_delivery") updated.dispatchedAt = now;
        if (action.status === "delivered") {
          updated.deliveredAt = now;
          loyalty = accrueLoyaltyForOrder(loyalty, updated);
        }
        updated.timeline = [...o.timeline, { at: now, label: `Status: ${action.status.replace(/_/g, " ")}`, actor: "Staff" }];
        return updated;
      });
      return { ...state, orders: { items }, loyalty };
    }
    case "ORDERS_ATTACH_POD":
      return { ...state, orders: { items: state.orders.items.map((o) => o.id === action.id ? { ...o, podPhotoRef: action.photoRef } : o) } };
    case "ORDERS_ASSIGN_TRUCK":
      return { ...state, orders: { items: state.orders.items.map((o) => o.id === action.id ? { ...o, truckId: action.truckId, zone: o.zone } : o) } };

    // ---- delivery ----
    case "DELIVERY_OPTIMIZE_ROUTE": {
      const truck = state.delivery.trucks[action.truckId];
      if (!truck) return state;
      const ordered = optimizeStops(truck.stops);
      const withEtas = computeEtas(ordered, new Date());
      const polyline = buildRoutePolyline(ordered, action.truckId);
      const nextTruck = { ...truck, stops: withEtas, stopIds: withEtas.map((s) => s.id), polyline, segmentIndex: 0, progress: 0 };
      return {
        ...state,
        delivery: pushLiveEvent(
          { ...state.delivery, trucks: { ...state.delivery.trucks, [action.truckId]: nextTruck } },
          "route", `${truck.label} route re-optimized (${withEtas.length} stops)`, new Date().toISOString()
        ),
      };
    }
    case "DELIVERY_REORDER_STOPS": {
      const truck = state.delivery.trucks[action.truckId];
      if (!truck) return state;
      const byId = new Map(truck.stops.map((s) => [s.id, s]));
      const reordered = action.stopIds.map((id) => byId.get(id)).filter(Boolean);
      const withEtas = computeEtas(reordered, new Date());
      const polyline = buildRoutePolyline(reordered, action.truckId);
      return { ...state, delivery: { ...state.delivery, trucks: { ...state.delivery.trucks, [action.truckId]: { ...truck, stops: withEtas, stopIds: withEtas.map((s) => s.id), polyline, segmentIndex: 0, progress: 0 } } } };
    }
    case "DELIVERY_MARK_STOP_COMPLETE": {
      const truck = state.delivery.trucks[action.truckId];
      if (!truck) return state;
      const stops = truck.stops.map((s) => s.id === action.stopId ? { ...s, completedAt: new Date().toISOString() } : s);
      const allDone = stops.every((s) => s.completedAt);
      return {
        ...state,
        delivery: pushLiveEvent(
          { ...state.delivery, trucks: { ...state.delivery.trucks, [action.truckId]: { ...truck, stops, status: allDone ? "complete" : truck.status } } },
          "stop", `${truck.label} completed a stop`, new Date().toISOString()
        ),
      };
    }
    case "DELIVERY_ADVANCE_TICK": {
      const truck = state.delivery.trucks[action.truckId];
      if (!truck || truck.status !== "en_route" || !truck.polyline?.length) return state;
      const seg = truck.polyline[truck.segmentIndex];
      if (!seg) return state;
      let progress = truck.progress + action.step;
      let segmentIndex = truck.segmentIndex;
      if (progress >= 1) {
        progress = 0;
        segmentIndex = Math.min(segmentIndex + 1, truck.polyline.length - 1);
        if (segmentIndex === truck.segmentIndex) {
          return { ...state, delivery: { ...state.delivery, trucks: { ...state.delivery.trucks, [action.truckId]: { ...truck, status: "complete" } } } };
        }
      }
      const activeSeg = truck.polyline[segmentIndex];
      const idxF = progress * (activeSeg.length - 1);
      const i0 = Math.floor(idxF), i1 = Math.min(i0 + 1, activeSeg.length - 1);
      const [lat0, lng0] = activeSeg[i0];
      const [lat1, lng1] = activeSeg[i1];
      const f = idxF - i0;
      const lat = lat0 + (lat1 - lat0) * f;
      const lng = lng0 + (lng1 - lng0) * f;
      const heading = (Math.atan2(lng1 - lng0, lat1 - lat0) * 180) / Math.PI;
      return { ...state, delivery: { ...state.delivery, trucks: { ...state.delivery.trucks, [action.truckId]: { ...truck, progress, segmentIndex, position: { lat, lng, heading } } } } };
    }
    case "DELIVERY_ADD_EVENT":
      return { ...state, delivery: pushLiveEvent(state.delivery, action.kind, action.message, new Date().toISOString()) };

    // ---- loyalty ----
    case "LOYALTY_ADJUST_POINTS":
      return { ...state, loyalty: { ...state.loyalty, members: state.loyalty.members.map((m) => m.id === action.id ? { ...m, pointsBalance: Math.max(0, m.pointsBalance + action.delta) } : m) } };
    case "LOYALTY_CREATE_BROADCAST":
      return { ...state, loyalty: { ...state.loyalty, broadcasts: [action.broadcast, ...state.loyalty.broadcasts] } };
    case "LOYALTY_RECOMPUTE_TIERS":
      return { ...state, loyalty: { ...state.loyalty, members: state.loyalty.members.map((m) => recomputeMemberTier(m, state.loyalty.tiers)) } };

    // ---- inbox ----
    case "INBOX_SEND_MESSAGE": {
      const threads = state.inbox.threads.map((t) => t.id === action.threadId
        ? { ...t, unread: false, lastMessageAt: action.message.at, messages: [...t.messages, action.message] }
        : t);
      return { ...state, inbox: { threads } };
    }
    case "INBOX_MARK_READ":
      return { ...state, inbox: { threads: state.inbox.threads.map((t) => t.id === action.threadId ? { ...t, unread: false } : t) } };
    case "INBOX_RECEIVE_MESSAGE": {
      const threads = state.inbox.threads.map((t) => t.id === action.threadId
        ? { ...t, unread: true, lastMessageAt: action.message.at, messages: [...t.messages, action.message] }
        : t);
      return { ...state, inbox: { threads } };
    }

    // ---- marketplace ----
    case "MARKETPLACE_REFRESH_CHANNEL":
      return { ...state, marketplace: { channels: state.marketplace.channels.map((c) => c.id === action.channelId ? { ...c, lastSyncAt: new Date().toISOString(), status: "connected" } : c) } };

    // ---- automation ----
    case "AUTOMATION_TOGGLE_RULE":
      return { ...state, automation: { rules: state.automation.rules.map((r) => r.id === action.id ? { ...r, enabled: action.enabled } : r) } };
    case "AUTOMATION_RUN_NOW": {
      const now = new Date().toISOString();
      return {
        ...state,
        automation: {
          rules: state.automation.rules.map((r) => r.id === action.id
            ? { ...r, lastRunAt: now, lastRunResult: "success", lastRunSummary: action.summary || r.lastRunSummary, runLog: [{ at: now, summary: action.summary || r.lastRunSummary, result: "success" }, ...r.runLog].slice(0, 10) }
            : r),
        },
      };
    }

    // ---- stock (receiving) ----
    case "STOCK_ADD_RECEIPT":
      return { ...state, stock: { ...state.stock, receipts: [action.receipt, ...state.stock.receipts] } };
    case "STOCK_REMOVE_RECEIPT":
      return { ...state, stock: { ...state.stock, receipts: state.stock.receipts.filter((r) => r.id !== action.id) } };

    // ---- generic ambient tick patch (see context/liveTicker.js) ----
    case "TICK_PATCH":
      return action.patch(state);

    case "RESET_STATE":
      return action.nextState;

    default:
      return state;
  }
}
