// Compact inline status pill. Replaces the loose "colored word + floating dot"
// treatment, which at small sizes read as stray colored text rather than as a
// bounded status object. Reverses the v4.1.0 No-Pill Rule — see DESIGN.md v5.2.0.

const TONE = {
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber:   "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  red:     "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  neutral: "bg-zinc-200 text-zinc-700 dark:bg-zinc-700/60 dark:text-zinc-200",
};

const DOT = {
  emerald: "bg-emerald-500",
  amber:   "bg-amber-500",
  red:     "bg-red-500",
  neutral: "bg-zinc-400 dark:bg-zinc-500",
};

export default function StatusBadge({ tone = "neutral", children, className = "" }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium leading-4 ${TONE[tone]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT[tone]}`} />
      {children}
    </span>
  );
}
