"use client";
import { Task } from "@/lib/api";
import TaskCard from "./TaskCard";

type Props = {
  tasks: Task[];
  isLoading: boolean;
  loadingId: string | null;
  onEdit: (task: Task) => void;
  onToggle: (task: Task) => void;
  onDelete: (id: string) => void;
  activeAlertIds?: string[];
};

export default function TaskList({
  tasks,
  isLoading,
  loadingId,
  onEdit,
  onToggle,
  onDelete,
  activeAlertIds = [],
}: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-400 dark:text-gray-600 text-sm">
        <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
        </svg>
        Loading tasks…
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <svg className="mb-3 h-12 w-12 text-gray-200 dark:text-gray-800" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <p className="text-sm font-medium text-gray-400 dark:text-gray-600">No tasks yet</p>
        <p className="text-xs text-gray-300 dark:text-gray-700 mt-1">Click the + button to add one</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          loadingId={loadingId}
          onEdit={onEdit}
          onToggle={onToggle}
          onDelete={onDelete}
          isAlerting={activeAlertIds.includes(task.id)}
        />
      ))}
    </div>
  );
}
