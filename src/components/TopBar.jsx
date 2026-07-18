import { useEffect, useState } from "react";
import { Moon, Sun, Menu, X } from "lucide-react";

export default function TopBar({ tab, setTab, theme, setTheme, session, isDemo, onLogout }) {
  const [timeStr, setTimeStr] = useState("");
  const [dateStr, setDateStr] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [counts, setCounts] = useState({ orders: null, inventory: null });

  // Live nav badges: open orders (still in the active pipeline) + low-stock SKUs.
  useEffect(() => {
    if (isDemo) return;
    fetch("/api/orders")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) setCounts((c) => ({ ...c, orders: (d.orders || []).filter((o) => o.stage < 4).length })); })
      .catch(() => {});
    fetch("/api/inventory/stats")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d && typeof d.lowStock === "number") setCounts((c) => ({ ...c, inventory: d.lowStock })); })
      .catch(() => {});
  }, [isDemo]);

  useEffect(() => {
    function tick() {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { timeZone: "Asia/Singapore", hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" }) + " SGT");
      setDateStr(now.toLocaleDateString("en-US", { timeZone: "Asia/Singapore", weekday: "short", day: "numeric", month: "short", year: "numeric" }));
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const displayName = session?.user || (isDemo ? "Demo User" : "Operations");

  const menuItems = [
    { id: "Today",      label: "Today",            icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg> },
    { id: "Orders",     label: "Orders",   badge: counts.orders > 0 ? counts.orders : null, icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 14h8M8 17h5"/></svg> },
    { id: "Inventory",  label: "Inventory", icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7l9-4 9 4v10l-9 4-9-4z"/><path d="M3 7l9 4 9-4M12 11v10"/></svg> },
    { id: "Delivery",   label: "Delivery & Routes", icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 7h11v9H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg> },
    { id: "Loyalty",    label: "Loyalty",           icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l2.5 5 5.5.8-4 3.9.9 5.5L12 21l-4.9 2.2.9-5.5-4-3.9 5.5-.8z"/></svg> },
    { id: "Broadcasts", label: "Broadcasts",        icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 11l16-7v16L3 13z"/><path d="M3 11v2M8 12v6l3 1"/></svg> },
    ...(!isDemo ? [{ id: "Inbox", label: "Inbox",   icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><polyline points="22,6 12,13 2,6"/></svg> }] : []),
    ...(session?.role === "admin" || isDemo ? [{ id: "Admin", label: "Admin", icon: <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }] : []),
  ];

  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.metaKey || e.ctrlKey) return;
      const idx = parseInt(e.key, 10) - 1;
      if (idx >= 0 && idx < menuItems.length) setTab(menuItems[idx].id);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuItems, setTab]);

  function navigate(id) { setTab(id); setMobileOpen(false); }

  return (
    <header className="topbar">
      {/* Row 1: brand + meta */}
      <div className="topbar-meta">
        <div className="brand">
          <img src="/assets/logo.png" alt="Beeva" className="brand-logo" />
          <div className="brand-text">
            <h1>Beeva Command Centre</h1>
            <div className="tag">Discover the Buzz</div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="clockpill">
            <div className="d">{dateStr}</div>
            <div className="t">{timeStr}</div>
          </div>

          <div className="userchip">
            <div className="avatar">{displayName[0].toUpperCase()}</div>
            <div>
              <div className="nm">{displayName}</div>
              <div className="rl">Operations</div>
            </div>
          </div>

          <button className="icon-btn" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>

          {session && <button className="top-link" onClick={onLogout}>Sign out</button>}

          <button className="icon-btn topbar-hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="Menu">
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Row 2: navigation tabs */}
      <nav className="topnav" aria-label="Primary">
        {menuItems.map((item, i) => (
          <button
            key={item.id}
            className={tab === item.id ? "active" : ""}
            onClick={() => navigate(item.id)}
            title={`${item.label} — press ${i + 1}`}
          >
            {item.icon}
            {item.label}
            {item.badge != null && <span className="badge-n">{item.badge}</span>}
          </button>
        ))}
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="topbar-drawer">
          {menuItems.map((item, i) => (
            <button
              key={item.id}
              className={`topbar-drawer-item${tab === item.id ? " active" : ""}`}
              onClick={() => navigate(item.id)}
            >
              {item.icon}
              <span>{item.label}</span>
              {item.badge != null && <span className="badge-n">{item.badge}</span>}
              <span className="kbd-hint">{i + 1}</span>
            </button>
          ))}
        </div>
      )}
    </header>
  );
}
