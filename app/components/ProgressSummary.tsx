"use client";
import { Task } from "@/lib/api";
import { CATEGORIES, CATEGORY_COLORS } from "@/lib/constants";

type Props = { tasks: Task[] };

export default function ProgressSummary({ tasks }: Props) {
  if (tasks.length === 0) return null;

  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const pct = Math.round((completed / total) * 100);

  const byCategory = CATEGORIES.map((cat) => {
    const catTasks = tasks.filter((t) => t.category === cat);
    const catDone = catTasks.filter((t) => t.completed).length;
    return { cat, total: catTasks.length, done: catDone };
  }).filter((c) => c.total > 0);

  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Progress
        </span>
        <span className="text-sm font-bold text-gray-800 dark:text-gray-200">
          {completed}/{total}
          <span className="ml-1 text-xs font-normal text-gray-400">tasks</span>
        </span>
      </div>

      {/* Main progress bar */}
      <div className="mb-4 h-2.5 w-full rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Percentage label */}
      <p className="mb-3 text-2xl font-bold text-gray-900 dark:text-gray-100">
        {pct}%{" "}
        <span className="text-sm font-normal text-gray-400 dark:text-gray-500">
          complete
        </span>
      </p>

      {/* Category breakdown */}
      <div className="space-y-1.5">
        {byCategory.map(({ cat, total: t, done: d }) => {
          const pctCat = Math.round((d / t) * 100);
          const colorCls = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "";
          return (
            <div key={cat} className="flex items-center gap-2">
              <span className={`w-16 shrink-0 rounded-full px-2 py-0.5 text-center text-xs font-medium ${colorCls}`}>
                {cat}
              </span>
              <div className="flex-1 h-1.5 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-400 dark:bg-indigo-600 transition-all duration-500"
                  style={{ width: `${pctCat}%` }}
                />
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500 w-8 text-right shrink-0">
                {d}/{t}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
