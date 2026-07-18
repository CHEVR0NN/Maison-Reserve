import { useState, useCallback } from "react";

// Generic persisted-value hook for small standalone flags/values (theme
// preference, "seen demo notice", last-viewed route, etc). The big
// AppData state tree has its own load/save wiring — see context/AppData.jsx.
export function useLocalStorageState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const set = useCallback((next) => {
    setValue((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch {
        // localStorage unavailable (e.g. private mode) — state still works in-memory
      }
      return resolved;
    });
  }, [key]);

  return [value, set];
}
