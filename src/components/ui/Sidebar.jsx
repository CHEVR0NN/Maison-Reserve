import {
  LayoutDashboard, ClipboardList, Package, Truck, Gem,
  MessageSquare, Store, Workflow, RotateCcw, Car, Boxes,
} from "lucide-react";

export const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ key: "Today", label: "Command Center", icon: LayoutDashboard }],
  },
  {
    label: "Fulfillment",
    items: [
      { key: "Orders", label: "Orders", icon: ClipboardList },
      { key: "Inventory", label: "Inventory", icon: Package },
      { key: "Delivery", label: "Delivery", icon: Truck },
    ],
  },
  {
    label: "Growth",
    items: [
      { key: "Loyalty", label: "Loyalty", icon: Gem },
      { key: "Marketplace", label: "Marketplace", icon: Store },
      { key: "Automation", label: "Automation", icon: Workflow },
    ],
  },
  {
    label: "Conversations",
    items: [{ key: "Inbox", label: "Inbox", icon: MessageSquare }],
  },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((g) => g.items);

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
        {NAV_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            {group.items.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={`sidebar-link${tab === key ? " active" : ""}`}
                aria-current={tab === key ? "page" : undefined}
                onClick={() => setTab(key)}
              >
                <Icon />
                <span>{label}</span>
                {badges[key] != null && badges[key] > 0 && <span className="sidebar-link-badge">{badges[key]}</span>}
              </button>
            ))}
          </div>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="sidebar-group-label">External</div>
        <a className="sidebar-link" href="/driver-portal">
          <Car /> <span>Driver Portal</span>
        </a>
        <a className="sidebar-link" href="/stock-portal">
          <Boxes /> <span>Stock Portal</span>
        </a>
        <button type="button" className="sidebar-reset-btn" onClick={onResetDemo}>
          <RotateCcw size={13} /> Reset Demo Data
        </button>
        <div style={{ textAlign: "center", fontSize: 10.5, color: "var(--ink-3)", letterSpacing: ".04em" }}>
          Maison Reserve v2.0.0 · Portfolio Demo
        </div>
      </div>
    </aside>
  );
}
