"use client";
import { CATEGORIES, PRIORITIES, FilterState } from "@/lib/constants";

type Props = {
  filter: FilterState;
  onChange: (f: FilterState) => void;
};

export default function FilterBar({ filter, onChange }: Props) {
  const hasFilters =
    filter.search ||
    filter.status !== "all" ||
    filter.categories.length > 0 ||
    filter.priorities.length > 0;

  function toggleCategory(c: string) {
    onChange({
      ...filter,
      categories: filter.categories.includes(c)
        ? filter.categories.filter((x) => x !== c)
        : [...filter.categories, c],
    });
  }

  function togglePriority(p: string) {
    onChange({
      ...filter,
      priorities: filter.priorities.includes(p)
        ? filter.priorities.filter((x) => x !== p)
        : [...filter.priorities, p],
    });
  }

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="search"
          value={filter.search}
          onChange={(e) => onChange({ ...filter, search: e.target.value })}
          placeholder="Search tasks…"
          className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 pl-9 pr-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition"
        />
      </div>

      {/* Status filter */}
      <div className="flex gap-1">
        {(["all", "active", "completed"] as const).map((s) => (
          <button
            key={s}
            onClick={() => onChange({ ...filter, status: s })}
            className={`flex-1 rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
              filter.status === s
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => toggleCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter.categories.includes(c)
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Priority chips */}
      <div className="flex flex-wrap gap-1.5">
        {PRIORITIES.map((p) => (
          <button
            key={p}
            onClick={() => togglePriority(p)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              filter.priorities.includes(p)
                ? "bg-indigo-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* Clear all */}
      {hasFilters && (
        <button
          onClick={() =>
            onChange({ search: "", status: "all", categories: [], priorities: [], sortBy: filter.sortBy })
          }
          className="text-xs text-indigo-500 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium transition"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
