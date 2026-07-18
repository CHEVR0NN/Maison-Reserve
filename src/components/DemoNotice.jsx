import StateIndicator, { STATE_CONFIG } from "./StateIndicator";

export default function DemoNotice() {
  return (
    <div className="notice">
      <div className="notice-main">
        <strong>Demo mode</strong>
        <span>
          Sample data for Beeva Wine & Spirits Pte Ltd — Singapore's digital-first spirits
          retailer. Sign in at <a href="/">/</a> for connected Wibiz data.
        </span>
      </div>
      <div className="state-legend">
        {Object.entries(STATE_CONFIG).map(([key, cfg]) => (
          <span key={key} className={`state-indicator ${cfg.cls}`}>
            <cfg.Icon size={10} />
            {cfg.label}
          </span>
        ))}
      </div>
    </div>
  );
}
