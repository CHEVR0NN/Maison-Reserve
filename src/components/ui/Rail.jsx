import {
  LayoutDashboard, ClipboardList, Package, Truck, Gem,
  MessageSquare, Store, Workflow, RotateCcw, Car, Boxes, Sun, Moon, LogOut,
} from "lucide-react";

const NAV_GROUPS = [
  {
    label: "Operations",
    items: [
      { key: "Today", label: "Command Center", icon: LayoutDashboard },
      { key: "Orders", label: "Orders", icon: ClipboardList },
      { key: "Inventory", label: "Inventory", icon: Package },
      { key: "Delivery", label: "Delivery", icon: Truck },
    ],
  },
  {
    label: "Customer Experience",
    items: [
      { key: "Loyalty", label: "Loyalty", icon: Gem },
      { key: "Inbox", label: "Inbox", icon: MessageSquare },
    ],
  },
  {
    label: "System",
    items: [
      { key: "Marketplace", label: "Marketplace", icon: Store },
      { key: "Automation", label: "Automation", icon: Workflow },
    ],
  },
];

export default function Rail({ tab, setTab, badges = {}, onResetDemo, theme, onToggleTheme, onExitDemo }) {
  return (
    <aside className="rail">
      <button type="button" className="rail-brand" onClick={() => setTab("Today")}>
        <span className="rail-brand-mark">Maison Reserve</span>
        <span className="rail-brand-sub">Operations Suite</span>
        <span className="rail-live" aria-hidden="true" />
      </button>

      <nav className="rail-nav" aria-label="Main">
        {NAV_GROUPS.map((group) => (
          <div className="rail-group" key={group.label}>
            <div className="rail-group-label">{group.label}</div>
            {group.items.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              const badge = badges[key];
              return (
                <button
                  key={key}
                  type="button"
                  className={`rail-link${active ? " active" : ""}`}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setTab(key)}
                >
                  <Icon size={18} />
                  <span className="rail-link-label">{label}</span>
                  {badge > 0 && <span className="rail-badge">{badge > 9 ? "9+" : badge}</span>}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="rail-foot">
        <a className="rail-link" href="/driver-portal">
          <Car size={17} />
          <span className="rail-link-label">Driver Portal</span>
        </a>
        <a className="rail-link" href="/stock-portal">
          <Boxes size={17} />
          <span className="rail-link-label">Stock Portal</span>
        </a>
        <button type="button" className="rail-link" onClick={() => onToggleTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          <span className="rail-link-label">{theme === "dark" ? "Daylight Cellar" : "Night Cellar"}</span>
        </button>
        <button type="button" className="rail-link" onClick={onResetDemo}>
          <RotateCcw size={16} />
          <span className="rail-link-label">Reset Data</span>
        </button>
        {onExitDemo && (
          <button type="button" className="rail-link" onClick={onExitDemo}>
            <LogOut size={17} />
            <span className="rail-link-label">Sign Out</span>
          </button>
        )}
      </div>
    </aside>
  );
}
