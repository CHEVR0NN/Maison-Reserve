import { useEffect, useRef } from "react";

// Cleanup-safe setInterval wrapper — always calls the latest callback
// without needing it in the effect's dependency array.
export function useInterval(callback, delayMs, enabled = true) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    if (!enabled || delayMs == null) return undefined;
    const id = setInterval(() => savedCallback.current(), delayMs);
    return () => clearInterval(id);
  }, [delayMs, enabled]);
}
