import { ArrowRight } from "lucide-react";
import { useDemoSession } from "../hooks/useDemoSession.js";

// No credentials — this is a one-click "enter the demo" gate for a
// standalone frontend-only portfolio build. Nothing here is authenticated.
export default function LoginView() {
  const { enterDemo } = useDemoSession();

  return (
    <main className="login-shell">
      <div className="login-card">
        <div className="login-brand-zone">
          <div className="sidebar-brand-mark" style={{ width: 48, height: 48, fontSize: 18 }}>MR</div>
          <div>
            <div className="brand-name">Maison Reserve</div>
            <div className="brand-sub">Command Center for Premium Retail Operations</div>
          </div>
        </div>

        <div className="login-form-zone">
          <div className="login-heading">
            <div className="eyebrow">Portfolio demo</div>
            <h1>Step in.</h1>
            <p>
              A fully self-contained retail operations dashboard — mock data, real interactions,
              no backend. Everything you do here persists locally in your browser only.
            </p>
          </div>

          <button type="button" className="primary login-button" onClick={() => enterDemo("staff")}>
            Enter Demo <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </main>
  );
}
