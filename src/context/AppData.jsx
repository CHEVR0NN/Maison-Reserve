import { createContext, useContext, useEffect, useMemo, useReducer, useRef } from "react";
import { appDataReducer } from "./appDataReducer.js";
import { useLiveTicker } from "./liveTicker.js";
import { buildInitialState, STORAGE_KEY, STATE_VERSION } from "../mock/index.js";
import { nextId } from "../mock/ids.js";

export const AppDataContext = createContext(null);

function loadInitialState() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.meta?.version === STATE_VERSION) return parsed;
    }
  } catch {
    // corrupt/unavailable localStorage — fall through to a fresh seed
  }
  return buildInitialState(new Date());
}

export function AppDataProvider({ children }) {
  const [state, dispatch] = useReducer(appDataReducer, undefined, loadInitialState);
  const stateRef = useRef(state);
  stateRef.current = state;

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // best-effort persistence only
    }
  }, [state]);

  useLiveTicker(() => stateRef.current, dispatch, Boolean(state.session.role));

  const actions = useMemo(() => ({
    session: {
      enterDemo: (role) => dispatch({ type: "SESSION_ENTER_DEMO", role }),
      exitDemo: () => dispatch({ type: "SESSION_EXIT_DEMO" }),
      setTheme: (theme) => dispatch({ type: "SESSION_SET_THEME", theme }),
    },
    inventory: {
      add: (item) => dispatch({ type: "INVENTORY_ADD", item }),
      update: (id, patch) => dispatch({ type: "INVENTORY_UPDATE", id, patch }),
      remove: (id) => dispatch({ type: "INVENTORY_REMOVE", id }),
      adjustStock: (id, delta) => dispatch({ type: "INVENTORY_ADJUST_STOCK", id, delta }),
      bulkImport: (rows) => dispatch({ type: "INVENTORY_BULK_IMPORT", rows }),
    },
    orders: {
      create: (order) => dispatch({ type: "ORDERS_CREATE", order }),
      updateStatus: (id, status) => dispatch({ type: "ORDERS_UPDATE_STATUS", id, status }),
      attachPod: (id, photoRef) => dispatch({ type: "ORDERS_ATTACH_POD", id, photoRef }),
      assignTruck: (id, truckId) => dispatch({ type: "ORDERS_ASSIGN_TRUCK", id, truckId }),
    },
    delivery: {
      optimizeRoute: (truckId) => dispatch({ type: "DELIVERY_OPTIMIZE_ROUTE", truckId }),
      reorderStops: (truckId, stopIds) => dispatch({ type: "DELIVERY_REORDER_STOPS", truckId, stopIds }),
      markStopComplete: (truckId, stopId) => dispatch({ type: "DELIVERY_MARK_STOP_COMPLETE", truckId, stopId }),
      advanceTick: (truckId, step) => dispatch({ type: "DELIVERY_ADVANCE_TICK", truckId, step }),
      addEvent: (kind, message) => dispatch({ type: "DELIVERY_ADD_EVENT", kind, message }),
    },
    loyalty: {
      adjustPoints: (id, delta) => dispatch({ type: "LOYALTY_ADJUST_POINTS", id, delta }),
      createBroadcast: (broadcast) => dispatch({ type: "LOYALTY_CREATE_BROADCAST", broadcast: { id: nextId("bc"), ...broadcast } }),
      recomputeTiers: () => dispatch({ type: "LOYALTY_RECOMPUTE_TIERS" }),
    },
    inbox: {
      sendMessage: (threadId, text) => dispatch({ type: "INBOX_SEND_MESSAGE", threadId, message: { id: nextId("msg"), from: "staff", text, at: new Date().toISOString(), attachments: [] } }),
      markRead: (threadId) => dispatch({ type: "INBOX_MARK_READ", threadId }),
    },
    marketplace: {
      refreshChannel: (channelId) => dispatch({ type: "MARKETPLACE_REFRESH_CHANNEL", channelId }),
    },
    automation: {
      toggleRule: (id, enabled) => dispatch({ type: "AUTOMATION_TOGGLE_RULE", id, enabled }),
      runNow: (id, summary) => dispatch({ type: "AUTOMATION_RUN_NOW", id, summary }),
    },
    stock: {
      addReceipt: (receipt) => dispatch({ type: "STOCK_ADD_RECEIPT", receipt: { id: nextId("rcpt"), ...receipt } }),
      removeReceipt: (id) => dispatch({ type: "STOCK_REMOVE_RECEIPT", id }),
    },
    resetDemoData: () => dispatch({ type: "RESET_STATE", nextState: buildInitialState(new Date()) }),
  }), [dispatch]);

  const value = useMemo(() => ({ state, dispatch, actions }), [state, actions]);

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within an AppDataProvider");
  return ctx;
}
