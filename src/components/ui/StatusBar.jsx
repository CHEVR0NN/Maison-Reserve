import { useEffect, useState } from "react";
import { Sun, Moon, LogOut } from "lucide-react";

export default function StatusBar({ theme, onToggleTheme, onExitDemo, title, subtitle }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString("en-SG", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Asia/Singapore" });
  const dateStr = now.toLocaleDateString("en-SG", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Singapore" });

  return (
    <header className="app-statusbar">
      <div>
        {title && <div style={{ fontFamily: "var(--serif)", fontWeight: 700, fontSize: 15 }}>{title}</div>}
        {subtitle && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{subtitle}</div>}
      </div>
      <div className="statusbar-live"><i /> Live Demo</div>
      <div className="statusbar-right">
        <div className="statusbar-clock">
          <span className="t">{timeStr} SGT</span>
          <span className="d">{dateStr}</span>
        </div>
        <button type="button" className="icon-btn" onClick={() => onToggleTheme(theme === "dark" ? "light" : "dark")} aria-label="Toggle theme">
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        {onExitDemo && (
          <button type="button" className="icon-btn" onClick={onExitDemo} aria-label="Exit demo">
            <LogOut size={16} />
          </button>
        )}
      </div>
    </header>
  );
}
