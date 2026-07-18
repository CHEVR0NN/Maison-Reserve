// Ambient "the dashboard is alive" simulator. Ticks rotate through a fixed
// list of small jobs (never everything at once), skip themselves ~25% of
// the time, and dispatch the SAME action types a real user action would —
// so ticks and clicks flow through one consistent, debuggable path.
import { useRef } from "react";
import { useInterval } from "../hooks/useInterval.js";
import { nextId } from "../mock/ids.js";

const TICK_MS = 16000;

const INBOX_LINES = [
  "Any update on my order?",
  "Thanks so much, appreciate it!",
  "Is this still available in stock?",
  "Can you confirm my delivery slot?",
];

const DELIVERY_LINES = (truckLabel, zone) => [
  `${truckLabel} approaching ${zone}`,
  `${truckLabel} completed a stop in ${zone}`,
  `${truckLabel} running slightly ahead of schedule`,
];

function jobInventory(state, dispatch) {
  const sellable = state.inventory.items.filter((i) => i.stock > 0 && i.velocity > 0);
  if (!sellable.length) return;
  const item = sellable[Math.floor(Math.random() * sellable.length)];
  dispatch({ type: "INVENTORY_ADJUST_STOCK", id: item.id, delta: -1 });
}

function jobDeliveryProgress(state, dispatch) {
  const trucks = Object.values(state.delivery.trucks).filter((t) => t.status === "en_route");
  if (!trucks.length) return;
  const truck = trucks[Math.floor(Math.random() * trucks.length)];
  dispatch({ type: "DELIVERY_ADVANCE_TICK", truckId: truck.id, step: 0.18 });
}

function jobDeliveryEvent(state, dispatch) {
  const trucks = Object.values(state.delivery.trucks).filter((t) => t.stops.length);
  if (!trucks.length) return;
  const truck = trucks[Math.floor(Math.random() * trucks.length)];
  const stop = truck.stops[Math.min(truck.segmentIndex, truck.stops.length - 1)];
  const lines = DELIVERY_LINES(truck.label, stop?.zone || "the next zone");
  dispatch({ type: "DELIVERY_ADD_EVENT", kind: "info", message: lines[Math.floor(Math.random() * lines.length)] });
}

function jobOrderPipeline(state, dispatch) {
  const pending = state.orders.items.filter((o) => o.status === "pending");
  const packed = state.orders.items.filter((o) => o.status === "packed");
  if (packed.length && Math.random() < 0.5) {
    const order = packed[Math.floor(Math.random() * packed.length)];
    dispatch({ type: "ORDERS_UPDATE_STATUS", id: order.id, status: "out_for_delivery" });
  } else if (pending.length) {
    const order = pending[Math.floor(Math.random() * pending.length)];
    dispatch({ type: "ORDERS_UPDATE_STATUS", id: order.id, status: "packed" });
  }
}

function jobInbox(state, dispatch) {
  const threads = state.inbox.threads;
  if (!threads.length) return;
  const thread = threads[Math.floor(Math.random() * threads.length)];
  const at = new Date().toISOString();
  dispatch({
    type: "INBOX_RECEIVE_MESSAGE",
    threadId: thread.id,
    message: { id: nextId("msg"), from: "customer", text: INBOX_LINES[Math.floor(Math.random() * INBOX_LINES.length)], at, attachments: [] },
  });
}

function jobAutomation(state, dispatch) {
  const candidates = state.automation.rules.filter((r) => r.enabled && r.schedule === "continuous");
  if (!candidates.length) return;
  const rule = candidates[Math.floor(Math.random() * candidates.length)];
  dispatch({ type: "AUTOMATION_RUN_NOW", id: rule.id, summary: rule.lastRunSummary });
}

const JOBS = [jobInventory, jobDeliveryProgress, jobDeliveryEvent, jobOrderPipeline, jobInbox, jobAutomation];

export function useLiveTicker(getState, dispatch, enabled) {
  const jobIndexRef = useRef(0);

  useInterval(() => {
    if (document.visibilityState !== "visible") return;
    // Skip roughly 1 in 4 ticks so movement reads as organic, not metronomic.
    if (Math.random() < 0.25) return;
    const job = JOBS[jobIndexRef.current % JOBS.length];
    jobIndexRef.current += 1;
    job(getState(), dispatch);
  }, TICK_MS, enabled);
}
