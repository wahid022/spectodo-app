"use client";
import { Task } from "@/lib/api";
import { CATEGORIES, CATEGORY_COLORS, FilterState } from "@/lib/constants";

type Props = {
  tasks: Task[];
  filter: FilterState;
  onCategoryClick: (cat: string) => void;
};

export default function Sidebar({ tasks, filter, onCategoryClick }: Props) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const active = total - completed;

  return (
    <aside className="hidden lg:flex flex-col gap-6 w-56 shrink-0">
      {/* Brand */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">My Tasks</h1>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Stay on top of everything</p>
      </div>

      {/* Overview counts */}
      <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Total</span>
          <span className="font-semibold text-gray-900 dark:text-gray-100">{total}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Active</span>
          <span className="font-semibold text-indigo-600 dark:text-indigo-400">{active}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Done</span>
          <span className="font-semibold text-green-600 dark:text-green-400">{completed}</span>
        </div>
      </div>

      {/* Category nav */}
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-600">
          Categories
        </p>
        <nav className="space-y-1">
          {CATEGORIES.map((cat) => {
            const count = tasks.filter((t) => t.category === cat).length;
            const isActive = filter.categories.includes(cat);
            const colorCls = CATEGORY_COLORS[cat as keyof typeof CATEGORY_COLORS] ?? "";
            return (
              <button
                key={cat}
                onClick={() => onCategoryClick(cat)}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-sm transition ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-semibold"
                    : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                }`}
              >
                <span>{cat}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${colorCls}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
