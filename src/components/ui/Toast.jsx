import { CheckCircle2, AlertTriangle, Info } from "lucide-react";

const ICONS = { success: CheckCircle2, error: AlertTriangle, info: Info };

export default function Toast({ tone = "info", message }) {
  const Icon = ICONS[tone] || Info;
  return (
    <div className={`toast ${tone}`}>
      <Icon size={17} />
      <span>{message}</span>
    </div>
  );
}
