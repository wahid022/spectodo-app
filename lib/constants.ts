export const CATEGORIES = [
  "Work",
  "Personal",
  "Health",
  "Finance",
  "Learning",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const PRIORITIES = ["Low", "Medium", "High", "Urgent"] as const;

export type Priority = (typeof PRIORITIES)[number];

export const CATEGORY_COLORS: Record<Category, string> = {
  Work: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  Personal:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  Health:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Finance:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  Learning:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  Low: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  Medium: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  High: "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300",
  Urgent: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
};

export const PRIORITY_SORT_WEIGHT: Record<Priority, number> = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export type FilterState = {
  search: string;
  status: "all" | "active" | "completed";
  categories: string[];
  priorities: string[];
  sortBy: "custom" | "dueDate" | "priority" | "createdAt";
};

export const DEFAULT_FILTER_STATE: FilterState = {
  search: "",
  status: "all",
  categories: [],
  priorities: [],
  sortBy: "custom",
};

export type ReminderStatus = "none" | "pending" | "snoozed" | "dismissed";

export const REMINDER_STATUS_LABELS: Record<ReminderStatus, string> = {
  none: "No reminder",
  pending: "Reminder set",
  snoozed: "Snoozed",
  dismissed: "Dismissed",
};

export const REMINDER_STATUS_COLORS: Record<ReminderStatus, string> = {
  none: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600",
  pending: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  snoozed: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
  dismissed: "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-600",
};

export const SNOOZE_DURATION_MS = 5 * 60 * 1000;
export const ALARM_AUTO_STOP_MS = 5 * 60 * 1000;
export const REMINDER_POLL_INTERVAL_MS = 30 * 1000;
