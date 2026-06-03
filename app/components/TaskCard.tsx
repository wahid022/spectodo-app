"use client";
import { Task } from "@/lib/api";
import { CATEGORY_COLORS, PRIORITY_COLORS, REMINDER_STATUS_COLORS, REMINDER_STATUS_LABELS, ReminderStatus } from "@/lib/constants";

type Props = {
  task: Task;
  loadingId: string | null;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggle: (task: Task) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLSpanElement>;
  isDragEnabled?: boolean;
  isAlerting?: boolean;
};

function formatDueDate(iso: string): { label: string; overdue: boolean } {
  const d = new Date(iso);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const overdue = d < today;
  const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { label, overdue };
}

export default function TaskCard({
  task,
  loadingId,
  onEdit,
  onDelete,
  onToggle,
  dragHandleProps,
  isDragEnabled = false,
  isAlerting = false,
}: Props) {
  const isLoading = loadingId === task.id;
  const categoryColor = CATEGORY_COLORS[task.category as keyof typeof CATEGORY_COLORS] ?? "bg-gray-100 text-gray-600";
  const priorityColor = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] ?? "bg-gray-100 text-gray-600";
  const reminderStatusColor = REMINDER_STATUS_COLORS[task.reminderStatus as ReminderStatus] ?? REMINDER_STATUS_COLORS.none;
  const reminderStatusLabel = REMINDER_STATUS_LABELS[task.reminderStatus as ReminderStatus] ?? REMINDER_STATUS_LABELS.none;

  return (
    <div
      className={`group relative flex items-start gap-3 rounded-xl border bg-white dark:bg-gray-900 px-4 py-3.5 shadow-sm transition-all duration-150 hover:shadow-md ${
        isAlerting
          ? "border-amber-400 dark:border-amber-500 animate-pulse ring-2 ring-amber-400 dark:ring-amber-500"
          : "border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700"
      } ${task.completed ? "opacity-60" : ""}`}
    >
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-sm">
          <svg className="h-5 w-5 animate-spin text-indigo-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        </div>
      )}

      {/* Drag handle */}
      {isDragEnabled && (
        <span
          {...dragHandleProps}
          className="mt-0.5 cursor-grab touch-none text-gray-300 dark:text-gray-700 hover:text-gray-400 dark:hover:text-gray-500 transition active:cursor-grabbing"
          aria-label="Drag to reorder"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6a2 2 0 110-4 2 2 0 010 4zM16 6a2 2 0 110-4 2 2 0 010 4zM8 14a2 2 0 110-4 2 2 0 010 4zM16 14a2 2 0 110-4 2 2 0 010 4zM8 22a2 2 0 110-4 2 2 0 010 4zM16 22a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </span>
      )}

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task)}
        disabled={isLoading}
        className="mt-0.5 flex-shrink-0"
        aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        <span
          className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all ${
            task.completed
              ? "border-indigo-500 bg-indigo-500"
              : "border-gray-300 dark:border-gray-600 hover:border-indigo-400"
          }`}
        >
          {task.completed && (
            <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </span>
      </button>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <p
          className={`text-sm font-medium leading-snug text-gray-900 dark:text-gray-100 transition-all ${
            task.completed ? "line-through text-gray-400 dark:text-gray-600" : ""
          }`}
        >
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-1.5">
          {/* Category badge */}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${categoryColor}`}>
            {task.category}
          </span>

          {/* Priority badge */}
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${priorityColor}`}>
            {task.priority}
          </span>

          {/* Due date */}
          {task.dueDate && (() => {
            const { label, overdue } = formatDueDate(task.dueDate);
            return (
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  overdue && !task.completed
                    ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400"
                    : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                }`}
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {overdue && !task.completed ? `Overdue · ${label}` : label}
              </span>
            );
          })()}
        </div>

        {/* Reminder info */}
        {task.reminderEnabled && task.reminderTime && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg className="h-3 w-3 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(task.reminderTime).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${reminderStatusColor}`}>
              {reminderStatusLabel}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onEdit(task)}
          disabled={isLoading}
          aria-label="Edit task"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 dark:hover:text-indigo-400 transition disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          onClick={() => onDelete(task.id)}
          disabled={isLoading}
          aria-label="Delete task"
          className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition disabled:opacity-40"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}
