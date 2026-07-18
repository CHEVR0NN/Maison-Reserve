import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

const DELTA_ICON = { up: ArrowUpRight, down: ArrowDownRight, flat: Minus };

export default function KpiCard({ label, value, delta, direction = "flat", breakdown, honey = false }) {
  const Icon = DELTA_ICON[direction] || Minus;
  return (
    <div className="kpi">
      <div className="lbl">{label}</div>
      <div className={`val${honey ? " honey" : ""}`}>{value}</div>
      {delta != null && (
        <div className={`delta ${direction}`}>
          <Icon size={13} /> {delta}
        </div>
      )}
      {breakdown && breakdown.length > 0 && (
        <div className="breakdown">
          {breakdown.map((b) => (
            <span key={b.label}>{b.label} <i>{b.value}</i></span>
          ))}
        </div>
      )}
    </div>
  );
}
