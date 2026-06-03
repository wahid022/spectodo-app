"use client";
import { arrayMove } from "@dnd-kit/sortable";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Task,
  createTask,
  deleteTask,
  editTask,
  getAllTasks,
  reorderTasks,
  markReminderTriggered,
  snoozeReminder,
  dismissReminder,
} from "@/lib/api";
import {
  DEFAULT_FILTER_STATE,
  FilterState,
  PRIORITY_SORT_WEIGHT,
  Priority,
} from "@/lib/constants";
import { playAlarm, stopAlarm } from "@/lib/reminderAudio";
import {
  requestNotificationPermission,
  showReminderNotification,
  listenForNotificationActions,
} from "@/lib/notificationService";
import { useReminderChecker } from "@/lib/useReminderChecker";

import DraggableTaskList from "./components/DraggableTaskList";
import ErrorBanner from "./components/ErrorBanner";
import FAB from "./components/FAB";
import FilterBar from "./components/FilterBar";
import ProgressSummary from "./components/ProgressSummary";
import ReminderBanner from "./components/ReminderBanner";
import Sidebar from "./components/Sidebar";
import SortBar from "./components/SortBar";
import TaskList from "./components/TaskList";
import TaskModal, { TaskFormData } from "./components/TaskModal";
import ThemeToggle from "./components/ThemeToggle";

type ModalState =
  | { open: false }
  | { open: true; mode: "create" }
  | { open: true; mode: "edit"; task: Task };

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER_STATE);
  const [activeAlerts, setActiveAlerts] = useState<Task[]>([]);

  const fetchTasks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getAllTasks();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // ── Derived display list ─────────────────────────────────────────────────
  const displayedTasks = useMemo(() => {
    let list = [...tasks];

    if (filter.search.trim()) {
      const q = filter.search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (filter.status === "active") list = list.filter((t) => !t.completed);
    if (filter.status === "completed") list = list.filter((t) => t.completed);
    if (filter.categories.length > 0)
      list = list.filter((t) => filter.categories.includes(t.category));
    if (filter.priorities.length > 0)
      list = list.filter((t) => filter.priorities.includes(t.priority));

    if (filter.sortBy === "dueDate") {
      list.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (filter.sortBy === "priority") {
      list.sort(
        (a, b) =>
          (PRIORITY_SORT_WEIGHT[b.priority as Priority] ?? 0) -
          (PRIORITY_SORT_WEIGHT[a.priority as Priority] ?? 0),
      );
    } else if (filter.sortBy === "createdAt") {
      list.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }
    // "custom" → keep DB sortOrder (already sorted by backend)

    return list;
  }, [tasks, filter]);

  const isDragEnabled = filter.sortBy === "custom";
  const activeAlertIds = activeAlerts.map((a) => a.id);

  // ── Reminder handlers ────────────────────────────────────────────────────
  const handleReminderDue = useCallback(async (task: Task) => {
    try {
      const updated = await markReminderTriggered(task.id);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch {}
    playAlarm();
    await requestNotificationPermission();
    await showReminderNotification(task.id, task.title);
    setActiveAlerts((prev) =>
      prev.some((a) => a.id === task.id) ? prev : [...prev, task],
    );
  }, []);

  useReminderChecker(tasks, handleReminderDue);

  useEffect(() => {
    return listenForNotificationActions(
      (id) => handleSnooze(id),
      (id) => handleDismiss(id),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSnooze(id: string) {
    stopAlarm();
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      const updated = await snoozeReminder(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to snooze");
    }
  }

  async function handleDismiss(id: string) {
    stopAlarm();
    setActiveAlerts((prev) => prev.filter((a) => a.id !== id));
    try {
      const updated = await dismissReminder(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to dismiss");
    }
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  async function handleCreate(data: TaskFormData) {
    setIsSubmitting(true);
    try {
      const created = await createTask({
        title: data.title,
        category: data.category,
        priority: data.priority,
        dueDate: data.dueDate || null,
        reminderEnabled: data.reminderEnabled,
        reminderTime: data.reminderTime || null,
      });
      setTasks((prev) => [...prev, created]);
      setModal({ open: false });
      toast.success("Task added!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleEdit(data: TaskFormData) {
    if (modal.open && modal.mode === "edit") {
      const id = modal.task.id;
      setIsSubmitting(true);
      try {
        const updated = await editTask(id, {
          title: data.title,
          category: data.category,
          priority: data.priority,
          dueDate: data.dueDate || null,
          reminderEnabled: data.reminderEnabled,
          reminderTime: data.reminderTime || null,
          ...(!data.reminderEnabled && { reminderStatus: "none" }),
        });
        setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
        setModal({ open: false });
        toast.success("Task updated!");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to update task");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  async function handleToggle(task: Task) {
    setLoadingId(task.id);
    if (!task.completed) {
      stopAlarm();
      setActiveAlerts((prev) => prev.filter((a) => a.id !== task.id));
    }
    try {
      const updated = await editTask(task.id, { completed: !task.completed });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update task");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleDelete(id: string) {
    setLoadingId(id);
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      toast.success("Task deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete task");
    } finally {
      setLoadingId(null);
    }
  }

  async function handleReorder(activeId: string, overId: string) {
    const oldIndex = tasks.findIndex((t) => t.id === activeId);
    const newIndex = tasks.findIndex((t) => t.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(tasks, oldIndex, newIndex);
    setTasks(reordered); // optimistic

    const payload = reordered.map((t, i) => ({ id: t.id, sortOrder: i }));
    try {
      await reorderTasks(payload);
    } catch (err) {
      toast.error("Reorder failed, refreshing…");
      fetchTasks();
    }
  }

  function handleCategoryClick(cat: string) {
    setFilter((prev) => ({
      ...prev,
      categories: prev.categories.includes(cat)
        ? prev.categories.filter((c) => c !== cat)
        : [...prev.categories, cat],
    }));
  }

  const onSave = modal.open && modal.mode === "edit" ? handleEdit : handleCreate;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <ReminderBanner alerts={activeAlerts} onSnooze={handleSnooze} onDismiss={handleDismiss} />
      {/* Top nav bar */}
      <header className="sticky top-0 z-30 border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-sm font-semibold text-gray-600 dark:text-gray-400 lg:hidden">
            My Tasks
          </span>
          <span className="hidden lg:block" />
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <div className="flex gap-8">
          {/* Sidebar */}
          <Sidebar tasks={tasks} filter={filter} onCategoryClick={handleCategoryClick} />

          {/* Main content */}
          <main className="flex min-w-0 flex-1 flex-col gap-4">
            {/* Progress */}
            <ProgressSummary tasks={tasks} />

            {/* Filter bar */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 shadow-sm">
              <FilterBar filter={filter} onChange={setFilter} />
            </div>

            {/* Sort bar */}
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 shadow-sm">
              <SortBar
                sortBy={filter.sortBy}
                onChange={(sortBy) => setFilter((f) => ({ ...f, sortBy }))}
              />
            </div>

            {/* Error banner */}
            {error && !isLoading && (
              <ErrorBanner message={error} onRetry={fetchTasks} />
            )}

            {/* Task list */}
            {isDragEnabled ? (
              <DraggableTaskList
                tasks={displayedTasks}
                isLoading={isLoading}
                loadingId={loadingId}
                onEdit={(task) => setModal({ open: true, mode: "edit", task })}
                onDelete={handleDelete}
                onToggle={handleToggle}
                onReorder={handleReorder}
                activeAlertIds={activeAlertIds}
              />
            ) : (
              <TaskList
                tasks={displayedTasks}
                isLoading={isLoading}
                loadingId={loadingId}
                onEdit={(task) => setModal({ open: true, mode: "edit", task })}
                onToggle={handleToggle}
                onDelete={handleDelete}
                activeAlertIds={activeAlertIds}
              />
            )}
          </main>
        </div>
      </div>

      {/* FAB */}
      <FAB onClick={() => setModal({ open: true, mode: "create" })} />

      {/* Task modal */}
      <TaskModal
        mode={modal.open ? modal.mode : "create"}
        task={modal.open && modal.mode === "edit" ? modal.task : undefined}
        isOpen={modal.open}
        isSubmitting={isSubmitting}
        onClose={() => setModal({ open: false })}
        onSave={onSave}
      />
    </div>
  );
}
