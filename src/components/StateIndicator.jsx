import { AlertTriangle, Package, ShieldCheck, Wifi, WifiOff, Zap } from "lucide-react";

export const STATE_CONFIG = {
  live:         { label: "Live data",      cls: "state-live",          Icon: Wifi },
  demo:         { label: "Demo",           cls: "state-demo",          Icon: Zap },
  configured:   { label: "Configured",     cls: "state-configured",    Icon: ShieldCheck },
  unconfigured: { label: "Not configured", cls: "state-unconfigured",  Icon: WifiOff },
  empty:        { label: "No data",        cls: "state-empty",         Icon: Package },
  error:        { label: "Upstream error", cls: "state-error",         Icon: AlertTriangle }
};

export default function StateIndicator({ state = "demo" }) {
  const cfg = STATE_CONFIG[state] || STATE_CONFIG.demo;
  return (
    <span className={`state-indicator ${cfg.cls}`}>
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  );
}
