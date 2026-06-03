"use client";
import { FilterState } from "@/lib/constants";

type Props = {
  sortBy: FilterState["sortBy"];
  onChange: (sortBy: FilterState["sortBy"]) => void;
};

const OPTIONS: { value: FilterState["sortBy"]; label: string }[] = [
  { value: "custom", label: "Custom order" },
  { value: "dueDate", label: "Due date" },
  { value: "priority", label: "Priority" },
  { value: "createdAt", label: "Date added" },
];

export default function SortBar({ sortBy, onChange }: Props) {
  const isDragActive = sortBy === "custom";

  return (
    <div className="flex items-center gap-2">
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 whitespace-nowrap">
        Sort by
      </label>
      <select
        value={sortBy}
        onChange={(e) => onChange(e.target.value as FilterState["sortBy"])}
        className="flex-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>

      {isDragActive ? (
        <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 px-2.5 py-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
          Drag enabled
        </span>
      ) : (
        <button
          onClick={() => onChange("custom")}
          className="text-xs text-gray-400 hover:text-indigo-500 dark:hover:text-indigo-400 font-medium transition whitespace-nowrap"
        >
          Clear sort
        </button>
      )}
    </div>
  );
}
