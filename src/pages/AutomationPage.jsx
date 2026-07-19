import { Package, Gem, Store, Truck, Play } from "lucide-react";
import { useAppData } from "../context/AppData.jsx";
import { useToast } from "../components/ui/ToastProvider.jsx";
import Toggle from "../components/ui/Toggle.jsx";
import Badge from "../components/ui/Badge.jsx";

const DOMAIN_META = {
  inventory:   { label: "Inventory",   icon: Package, color: "var(--honey)" },
  loyalty:     { label: "Loyalty",     icon: Gem, color: "var(--blue)" },
  marketplace: { label: "Marketplace", icon: Store, color: "var(--orange)" },
  delivery:    { label: "Delivery",    icon: Truck, color: "var(--positive)" },
};

function agoLabel(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function RuleRow({ rule, onToggle, onRunNow }) {
  return (
    <div className="automation-row" style={{ gridTemplateColumns: "auto 1fr auto auto", alignItems: "center" }}>
      <Toggle on={rule.enabled} onChange={(v) => onToggle(rule.id, v)} label={rule.name} />
      <div>
        <b>{rule.name}</b>
        <p>{rule.description}</p>
        <small className="runs">
          {rule.lastRunResult === "success" ? "✓ " : rule.lastRunResult === "skipped" ? "– " : "✕ "}
          {rule.lastRunSummary} &middot; {agoLabel(rule.lastRunAt)} &middot; {rule.schedule}
        </small>
      </div>
      <Badge tone={rule.enabled ? "positive" : "neutral"}>{rule.enabled ? "Enabled" : "Paused"}</Badge>
      <button type="button" className="fchip" onClick={() => onRunNow(rule)} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
        <Play size={11} /> Run now
      </button>
    </div>
  );
}

export default function AutomationPage() {
  const { state, actions } = useAppData();
  const notify = useToast();
  const rules = state.automation.rules;

  const enabledCount = rules.filter((r) => r.enabled).length;

  function toggle(id, enabled) {
    actions.automation.toggleRule(id, enabled);
    notify(enabled ? "Rule enabled" : "Rule paused", enabled ? "success" : "info");
  }

  function runNow(rule) {
    actions.automation.runNow(rule.id, rule.lastRunSummary);
    notify(`${rule.name} ran successfully`, "success");
  }

  const domains = ["inventory", "loyalty", "marketplace", "delivery"];

  return (
    <section className="panel active">
      <div className="panel-head">
        <div>
          <h2>Automation</h2>
          <div className="sub">Rules that keep inventory, loyalty, marketplace, and delivery in sync — no manual work</div>
        </div>
        <div className="right-note">
          <b>{enabledCount}</b> of {rules.length} rules active
        </div>
      </div>

      {domains.map((domain) => {
        const domainRules = rules.filter((r) => r.domain === domain);
        if (!domainRules.length) return null;
        const meta = DOMAIN_META[domain];
        const Icon = meta.icon;
        return (
          <div key={domain} style={{ marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <Icon size={17} style={{ color: meta.color }} />
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: ".04em" }}>{meta.label}</span>
              <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{domainRules.filter((r) => r.enabled).length} of {domainRules.length} active</span>
            </div>
            <div className="card automation-list" style={{ padding: "6px 22px" }}>
              {domainRules.map((rule) => <RuleRow key={rule.id} rule={rule} onToggle={toggle} onRunNow={runNow} />)}
            </div>
          </div>
        );
      })}
    </section>
  );
}
