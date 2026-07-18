import { useEffect, useMemo, useState } from "react";
import { AppDataProvider, useAppData } from "./context/AppData.jsx";
import { ToastProvider } from "./components/ui/ToastProvider.jsx";
import Sidebar from "./components/ui/Sidebar.jsx";
import StatusBar from "./components/ui/StatusBar.jsx";
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
import MelvinStockPortalPage from "./pages/MelvinStockPortalPage.jsx";

const PAGE_TITLES = {
  Today: ["Command Center", "Today's operational snapshot"],
  Orders: ["Orders", "Pipeline across all channels"],
  Inventory: ["Inventory", "Stock, SKUs & reorder health"],
  Delivery: ["Delivery", "Live truck manifests & routing"],
  Loyalty: ["Loyalty", "Members, tiers & campaigns"],
  Inbox: ["Inbox", "Customer conversations"],
  Marketplace: ["Marketplace", "Channel performance"],
  Automation: ["Automation", "Rules & workflow health"],
};

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

  if (!state.session.role) return <LoginView />;

  const [title, subtitle] = PAGE_TITLES[tab] || [];

  return (
    <div className="app-shell">
      <Sidebar tab={tab} setTab={setTab} badges={badges} onResetDemo={actions.resetDemoData} />
      <div className="app-main">
        <StatusBar
          theme={state.session.theme}
          onToggleTheme={actions.session.setTheme}
          onExitDemo={actions.session.exitDemo}
          title={title}
          subtitle={subtitle}
        />
        <main className="app-content">
          {tab === "Today" && <TodayPage setTab={setTab} />}
          {tab === "Orders" && <OrdersPage />}
          {tab === "Inventory" && <InventoryPage />}
          {tab === "Delivery" && <DeliveryPage />}
          {tab === "Loyalty" && <LoyaltyPage />}
          {tab === "Inbox" && <InboxPage />}
          {tab === "Marketplace" && <MarketplacePage />}
          {tab === "Automation" && <AutomationPage />}
        </main>
      </div>
    </div>
  );
}

function Router() {
  const path = window.location.pathname;
  if (path === "/driver-portal") return <DriverPortalPage />;
  if (path === "/stock-portal") return <MelvinStockPortalPage />;
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
