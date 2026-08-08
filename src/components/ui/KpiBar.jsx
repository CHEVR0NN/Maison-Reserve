const TONE_TEXT = {
  neutral: "text-zinc-900 dark:text-slate-50",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  red: "text-red-600 dark:text-red-400",
};

export default function KpiBar({ items }) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-zinc-200 overflow-hidden rounded-lg border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800 lg:grid-cols-4 lg:divide-y-0">
      {items.map(({ key, label, value, sub, tone = "neutral", onClick }) => {
        const Tag = onClick ? "button" : "div";
        return (
          <Tag
            key={key ?? label}
            type={onClick ? "button" : undefined}
            onClick={onClick}
            className={`bg-white p-4 text-left dark:bg-zinc-900 ${onClick ? "transition-colors hover:bg-zinc-50 focus-visible:relative focus-visible:z-10 focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-emerald-500 dark:hover:bg-zinc-800/60 dark:focus-visible:outline-emerald-400" : ""}`}
          >
            <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</div>
            <div className={`mt-1.5 font-mono text-2xl font-semibold tabular-nums ${TONE_TEXT[tone]}`}>{value}</div>
            {sub && <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{sub}</div>}
          </Tag>
        );
      })}
    </div>
  );
}
