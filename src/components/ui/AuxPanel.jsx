import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { useLocalStorageState } from "../../hooks/useLocalStorageState.js";

export default function AuxPanel({ title, storageKey, children }) {
  const [collapsed, setCollapsed] = useLocalStorageState(storageKey, false);

  if (collapsed) {
    return (
      <div className="shrink-0">
        <button
          type="button"
          aria-label={`Expand ${title}`}
          title={`Expand ${title}`}
          onClick={() => setCollapsed(false)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <PanelRightOpen size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 shrink-0 rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <span className="text-sm font-semibold text-zinc-900 dark:text-slate-50">{title}</span>
        <button
          type="button"
          aria-label={`Collapse ${title}`}
          title={`Collapse ${title}`}
          onClick={() => setCollapsed(true)}
          className="rounded-md border-0 bg-transparent p-1 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          <PanelRightClose size={16} />
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
