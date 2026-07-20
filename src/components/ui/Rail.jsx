import {
  LayoutDashboard, ClipboardList, Package, Truck, Gem,
  MessageSquare, Store, Workflow, RotateCcw, Car, Boxes, Sun, Moon, LogOut,
} from "lucide-react";

const NAV_ITEMS = [
  { key: "Today", label: "Command Center", icon: LayoutDashboard },
  { key: "Orders", label: "Orders", icon: ClipboardList },
  { key: "Inventory", label: "Inventory", icon: Package },
  { key: "Delivery", label: "Delivery", icon: Truck },
  { key: "Loyalty", label: "Loyalty", icon: Gem },
  { key: "Marketplace", label: "Marketplace", icon: Store },
  { key: "Automation", label: "Automation", icon: Workflow },
  { key: "Inbox", label: "Inbox", icon: MessageSquare },
];

export default function Rail({ tab, setTab, badges = {}, onResetDemo, theme, onToggleTheme, onExitDemo }) {
  return (
    <aside className="rail">
      <button type="button" className="rail-brand rail-tooltip" data-tip="Maison Reserve — Command Center" onClick={() => setTab("Today")}>
        MR
        <span className="rail-live" aria-hidden="true" />
      </button>

      <nav className="rail-nav" aria-label="Main">
        {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          const badge = badges[key];
          return (
            <button
              key={key}
              type="button"
              className={`rail-link rail-tooltip${active ? " active" : ""}`}
              data-tip={label}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => setTab(key)}
            >
              <Icon size={19} />
              {badge > 0 && <span className="rail-badge">{badge > 9 ? "9+" : badge}</span>}
            </button>
          );
        })}
      </nav>

      <div className="rail-foot">
        <a className="rail-link rail-tooltip" data-tip="Driver Portal" aria-label="Driver Portal" href="/driver-portal">
          <Car size={17} />
        </a>
        <a className="rail-link rail-tooltip" data-tip="Stock Portal" aria-label="Stock Portal" href="/stock-portal">
          <Boxes size={17} />
        </a>
        <button type="button" className="rail-link rail-tooltip" data-tip={theme === "dark" ? "Switch to light" : "Switch to dark"} aria-label="Toggle theme" onClick={() => onToggleTheme(theme === "dark" ? "light" : "dark")}>
          {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <button type="button" className="rail-link rail-tooltip" data-tip="Reset demo data" aria-label="Reset demo data" onClick={onResetDemo}>
          <RotateCcw size={16} />
        </button>
        {onExitDemo && (
          <button type="button" className="rail-link rail-tooltip" data-tip="Exit demo" aria-label="Exit demo" onClick={onExitDemo}>
            <LogOut size={17} />
          </button>
        )}
      </div>
    </aside>
  );
}
