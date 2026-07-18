import { useAppData } from "../context/AppData";


export default function AutomationPanel() {
  const { data } = useAppData();

  return (
    <article className="panel">
      <div className="panel-head">
        <div>
          <h2>Automation stack</h2>
          <p>DTC migration, loyalty, and AI selling flows</p>
        </div>
        
      </div>
      <div className="automation-list">
        {data.automations.map((flow) => (
          <div key={flow.name} className="automation-row">
            <span className={flow.status === "Live" ? "live-dot" : "train-dot"} />
            <div>
              <b>{flow.name}</b>
              <p>{flow.detail}</p>
              <small className="runs">{flow.runs}</small>
            </div>
            <small className={`status-tag${flow.status === "Training" ? " training" : ""}`}>
              {flow.status}
            </small>
          </div>
        ))}
      </div>
    </article>
  );
}
