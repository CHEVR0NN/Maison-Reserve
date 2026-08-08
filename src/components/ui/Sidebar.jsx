import { useId } from "react";
import {
  LayoutDashboard, ClipboardList, Package, Truck, Gem,
  MessageSquare, Store, Workflow, RotateCcw, Car, Boxes, Sun, Moon, LogOut,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useLocalStorageState } from "../../hooks/useLocalStorageState.js";

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

function NavItem({ collapsed, active, label, Icon, badge, href, ...rest }) {
  const Tag = href ? "a" : "button";
  const tooltipId = useId();
  // Active state is carried by surface + text weight, with a small emerald
  // indicator as confirmation — not by recoloring the whole row, which read as
  // a status signal competing with the amber badge counts beside it.
  const className = `group relative flex items-center rounded-md border-0 bg-transparent text-sm font-medium no-underline transition-colors
    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:focus-visible:outline-emerald-400
    ${collapsed ? "justify-center h-8 w-8 mx-auto" : "w-full gap-2.5 px-2.5 h-8"}
    ${active
      ? "bg-zinc-200/70 text-zinc-900 dark:bg-zinc-800/60 dark:text-slate-50"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800/40 dark:hover:text-slate-50"}`;

  return (
    <Tag
      type={href ? undefined : "button"}
      href={href}
      aria-current={active ? "page" : undefined}
      aria-label={label}
      title={collapsed ? undefined : label}
      aria-describedby={collapsed ? tooltipId : undefined}
      className={className}
      {...rest}
    >
      {active && (
        <span
          aria-hidden
          className={`absolute top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-emerald-500 dark:bg-emerald-400 ${collapsed ? "-left-1" : "left-0"}`}
        />
      )}
      <span className="relative shrink-0">
        <Icon size={18} />
        {collapsed && badge > 0 && (
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-amber-500" />
        )}
      </span>
      {!collapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {!collapsed && badge > 0 && (
        <span className="text-xs font-semibold text-amber-500 dark:text-amber-400">
          {badge > 9 ? "9+" : badge}
        </span>
      )}
      {collapsed && (
        <span
          id={tooltipId}
          role="tooltip"
          className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-md border border-zinc-200 bg-white px-2 py-1 text-xs font-medium text-zinc-900 opacity-0 shadow-md transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-50 z-50"
        >
          {label}
          {badge > 0 && <span className="ml-1 text-amber-500 dark:text-amber-400">({badge > 9 ? "9+" : badge})</span>}
        </span>
      )}
    </Tag>
  );
}

export default function Sidebar({ tab, setTab, badges = {}, onResetDemo, theme, onToggleTheme, onExitDemo }) {
  const [collapsed, setCollapsed] = useLocalStorageState("sidebar-collapsed", false);

  return (
    <aside
      className={`flex h-screen shrink-0 flex-col border-r border-zinc-200 bg-white transition-[width] duration-200 dark:border-zinc-800 dark:bg-zinc-900
        ${collapsed ? "w-16" : "w-60"}`}
    >
      <div className={`flex items-center border-b border-zinc-200 dark:border-zinc-800 ${collapsed ? "justify-center px-2 h-14" : "justify-between px-3 h-14"}`}>
        <button type="button" onClick={() => setTab("Today")} className={`flex items-center gap-2 border-0 bg-transparent ${collapsed ? "justify-center" : ""}`}>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          {!collapsed && (
            <span className="flex flex-col items-start leading-tight">
              <span className="text-sm font-semibold text-zinc-900 dark:text-slate-50">Maison Reserve</span>
              <span className="text-[11px] text-zinc-500 dark:text-zinc-400">Operations Suite</span>
            </span>
          )}
        </button>
        {!collapsed && (
          <button
            type="button"
            aria-label="Collapse sidebar"
            title="Collapse sidebar"
            onClick={() => setCollapsed(true)}
            className="rounded-md border-0 bg-transparent p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-slate-50 dark:focus-visible:outline-emerald-400"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {collapsed && (
        <div className="flex justify-center border-b border-zinc-200 py-2 dark:border-zinc-800">
          <button
            type="button"
            aria-label="Expand sidebar"
            title="Expand sidebar"
            onClick={() => setCollapsed(false)}
            className="rounded-md border-0 bg-transparent p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-slate-50 dark:focus-visible:outline-emerald-400"
          >
            <PanelLeftOpen size={16} />
          </button>
        </div>
      )}

      <nav aria-label="Main" className={`flex-1 overflow-y-auto py-2 ${collapsed ? "px-2" : "px-2.5"} space-y-3`}>
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <div className="px-2.5 pb-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                {group.label}
              </div>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ key, label, icon }) => (
                <NavItem
                  key={key}
                  collapsed={collapsed}
                  active={tab === key}
                  label={label}
                  Icon={icon}
                  badge={badges[key]}
                  onClick={() => setTab(key)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className={`border-t border-zinc-200 py-2 dark:border-zinc-800 ${collapsed ? "px-2" : "px-2.5"} space-y-0.5`}>
        <NavItem collapsed={collapsed} label="Driver Portal" Icon={Car} href="/driver-portal" />
        <NavItem collapsed={collapsed} label="Stock Portal" Icon={Boxes} href="/stock-portal" />
      </div>

      <div className={`flex items-center gap-0.5 border-t border-zinc-200 py-2 dark:border-zinc-800 ${collapsed ? "flex-col px-2" : "px-2.5"}`}>
        <IconAction
          label={theme === "dark" ? "Switch to Daylight Cellar" : "Switch to Night Cellar"}
          Icon={theme === "dark" ? Sun : Moon}
          onClick={() => onToggleTheme(theme === "dark" ? "light" : "dark")}
        />
        <IconAction label="Reset Data" Icon={RotateCcw} onClick={onResetDemo} />
        {onExitDemo && <IconAction label="Sign Out" Icon={LogOut} onClick={onExitDemo} />}
      </div>
    </aside>
  );
}

function IconAction({ label, Icon, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border-0 bg-transparent text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-slate-50 dark:focus-visible:outline-emerald-400"
    >
      <Icon size={16} />
    </button>
  );
}
