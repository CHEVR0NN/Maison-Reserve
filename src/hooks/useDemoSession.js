import { useAppData } from "../context/AppData.jsx";

// Thin convenience selector over AppData's session slice — used by the
// Enter-Demo gate and each portal shell to read/set the current role.
export function useDemoSession() {
  const { state, actions } = useAppData();
  return {
    role: state.session.role,
    theme: state.session.theme,
    enterDemo: actions.session.enterDemo,
    exitDemo: actions.session.exitDemo,
    setTheme: actions.session.setTheme,
  };
}
