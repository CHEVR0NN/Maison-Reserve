import { Search } from "lucide-react";

export function ActionBar({ children }) {
  return <div className="flex flex-wrap items-center gap-2.5">{children}</div>;
}

export function ActionSearch({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative flex-1 min-w-[200px]">
      <Search size={15} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      <input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="h-9 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-3 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-slate-50 dark:focus-visible:outline-emerald-400"
      />
    </div>
  );
}

export function ActionPrimary({ className = "", ...rest }) {
  return (
    <button
      type="button"
      className={`h-9 rounded-md bg-emerald-600 px-3 text-sm font-semibold text-zinc-950 hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 dark:focus-visible:outline-emerald-400 ${className}`}
      {...rest}
    />
  );
}
