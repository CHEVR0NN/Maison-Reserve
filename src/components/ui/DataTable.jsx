export default function DataTable({ children }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full min-w-max border-collapse text-sm [&_th]:border-b [&_th]:border-zinc-200 [&_th]:px-3 [&_th]:py-2.5 [&_th]:text-left [&_th]:text-xs [&_th]:font-medium [&_th]:uppercase [&_th]:tracking-wide [&_th]:text-zinc-500 [&_td]:border-b [&_td]:border-zinc-100 [&_td]:px-3 [&_td]:py-2.5 [&_tr:last-child_td]:border-b-0 dark:[&_th]:border-zinc-800 dark:[&_th]:text-zinc-400 dark:[&_td]:border-zinc-800/60">
        {children}
      </table>
    </div>
  );
}
