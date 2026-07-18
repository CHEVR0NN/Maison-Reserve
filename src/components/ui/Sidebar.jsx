import {
  LayoutDashboard, ClipboardList, Package, Truck, Gem,
  MessageSquare, Store, Workflow, RotateCcw, Car, Boxes,
} from "lucide-react";

export const NAV_ITEMS = [
  { key: "Today", label: "Command Center", icon: LayoutDashboard },
  { key: "Orders", label: "Orders", icon: ClipboardList },
  { key: "Inventory", label: "Inventory", icon: Package },
  { key: "Delivery", label: "Delivery", icon: Truck },
  { key: "Loyalty", label: "Loyalty", icon: Gem },
  { key: "Inbox", label: "Inbox", icon: MessageSquare },
  { key: "Marketplace", label: "Marketplace", icon: Store },
  { key: "Automation", label: "Automation", icon: Workflow },
];

export default function Sidebar({ tab, setTab, badges = {}, onResetDemo }) {
  return (
    <aside className="app-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-mark">MR</div>
        <div className="sidebar-brand-text">
          <h1>Maison Reserve</h1>
          <span>Command Center</span>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            className={`sidebar-link${tab === key ? " active" : ""}`}
            onClick={() => setTab(key)}
          >
            <Icon />
            <span>{label}</span>
            {badges[key] != null && badges[key] > 0 && <span className="sidebar-link-badge">{badges[key]}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-foot">
        <a className="sidebar-link" href="/driver-portal" style={{ fontSize: 12 }}>
          <Car /> <span>Driver Portal</span>
        </a>
        <a className="sidebar-link" href="/stock-portal" style={{ fontSize: 12 }}>
          <Boxes /> <span>Stock Portal</span>
        </a>
        <button type="button" className="sidebar-reset-btn" onClick={onResetDemo}>
          <RotateCcw size={13} /> Reset Demo Data
        </button>
      </div>
    </aside>
  );
}
