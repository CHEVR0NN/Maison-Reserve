import { useEffect, useMemo, useState } from "react";
import { AppDataProvider, useAppData } from "./context/AppData.jsx";
import { ToastProvider } from "./components/ui/ToastProvider.jsx";
import Sidebar from "./components/ui/Sidebar.jsx";
import LoginView from "./pages/LoginView.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import DeliveryPage from "./pages/DeliveryPage.jsx";
import LoyaltyPage from "./pages/LoyaltyPage.jsx";
import InboxPage from "./pages/InboxPage.jsx";
import MarketplacePage from "./pages/MarketplacePage.jsx";
import AutomationPage from "./pages/AutomationPage.jsx";
import DriverPortalPage from "./pages/DriverPortalPage.jsx";
import StockPortalPage from "./pages/StockPortalPage.jsx";

// Pages that manage their own scrolling and must be capped to the frame height
// rather than growing the document.
const SELF_SIZING_TABS = new Set(["Inbox"]);

function MainShell() {
  const { state, actions } = useAppData();
  const [tab, setTab] = useState("Today");

  useEffect(() => {
    document.body.dataset.theme = state.session.theme;
  }, [state.session.theme]);

  const badges = useMemo(() => ({
    Orders: state.orders.items.filter((o) => o.status === "pending").length,
    Inbox: state.inbox.threads.filter((t) => t.unread).length,
  }), [state.orders.items, state.inbox.threads]);

  if (state.session.role !== "staff") return <LoginView />;

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950">
      <Sidebar
        tab={tab} setTab={setTab} badges={badges}
        onResetDemo={actions.resetDemoData}
        theme={state.session.theme}
        onToggleTheme={actions.session.setTheme}
        onExitDemo={actions.session.exitDemo}
      />
      <main className="relative flex-1 overflow-y-auto bg-zinc-50 dark:bg-zinc-950">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[600px] dark:bg-[radial-gradient(ellipse_1200px_600px_at_20%_-10%,rgba(16,185,129,0.08),transparent_70%)]"
        />
        {/* Inbox is a mail-client layout: it fills the frame and scrolls its
            thread list and message pane internally so the composer stays
            pinned in view. Its CSS already asks for `height: 100%`, but this
            wrapper had no height for that to resolve against, so the shell
            collapsed to content height and pushed the reply box below the
            fold. Every other page is a normal document that grows and lets
            <main> scroll, so they must NOT be height-capped. */}
        <div className={`relative ${SELF_SIZING_TABS.has(tab) ? "h-full" : ""}`}>
          {tab === "Today" && <TodayPage setTab={setTab} />}
          {tab === "Orders" && <OrdersPage />}
          {tab === "Inventory" && <InventoryPage />}
          {tab === "Delivery" && <DeliveryPage />}
          {tab === "Loyalty" && <LoyaltyPage />}
          {tab === "Inbox" && <InboxPage />}
          {tab === "Marketplace" && <MarketplacePage />}
          {tab === "Automation" && <AutomationPage />}
        </div>
      </main>
    </div>
  );
}

function Router() {
  const path = window.location.pathname;
  if (path === "/driver-portal") return <DriverPortalPage />;
  if (path === "/stock-portal") return <StockPortalPage />;
  return <MainShell />;
}

export default function App() {
  return (
    <AppDataProvider>
      <ToastProvider>
        <Router />
      </ToastProvider>
    </AppDataProvider>
  );
}
