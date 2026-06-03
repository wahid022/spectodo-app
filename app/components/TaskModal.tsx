"use client";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Task } from "@/lib/api";
import { CATEGORIES, PRIORITIES } from "@/lib/constants";

export type TaskFormData = {
  title: string;
  category: string;
  priority: string;
  dueDate: string;
  reminderEnabled: boolean;
  reminderTime: string;
};

type Props = {
  mode: "create" | "edit";
  task?: Task;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSave: (data: TaskFormData) => void;
};

export default function TaskModal({
  mode,
  task,
  isOpen,
  isSubmitting,
  onClose,
  onSave,
}: Props) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Personal");
  const [priority, setPriority] = useState("Medium");
  const [dueDate, setDueDate] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [titleError, setTitleError] = useState("");
  const [reminderError, setReminderError] = useState("");
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && task) {
        setTitle(task.title);
        setCategory(task.category);
        setPriority(task.priority);
        setDueDate(task.dueDate ? task.dueDate.slice(0, 10) : "");
        setReminderEnabled(task.reminderEnabled);
        setReminderTime(task.reminderTime ? task.reminderTime.slice(0, 16) : "");
      } else {
        setTitle("");
        setCategory("Personal");
        setPriority("Medium");
        setDueDate("");
        setReminderEnabled(false);
        setReminderTime("");
      }
      setTitleError("");
      setReminderError("");
      setTimeout(() => titleRef.current?.focus(), 50);
    }
  }, [isOpen, mode, task]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("Title is required");
      titleRef.current?.focus();
      return;
    }
    if (reminderEnabled && !reminderTime) {
      setReminderError("Please set a reminder time");
      return;
    }
    onSave({ title: title.trim(), category, priority, dueDate, reminderEnabled, reminderTime });
  }

  const labelCls = "block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1";
  const inputCls =
    "w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 transition";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal card */}
          <motion.div
            className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-200 dark:ring-gray-700"
            initial={{ y: 32, opacity: 0, scale: 0.97 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.97 }}
            transition={{ type: "spring", damping: 22, stiffness: 280 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {mode === "create" ? "New Task" : "Edit Task"}
              </h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-600 dark:hover:text-gray-300 transition"
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} noValidate>
              <div className="space-y-4 px-6 py-5">
                {/* Title */}
                <div>
                  <label className={labelCls}>Title</label>
                  <input
                    ref={titleRef}
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (e.target.value.trim()) setTitleError("");
                    }}
                    placeholder="What needs to be done?"
                    className={`${inputCls} ${titleError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                    disabled={isSubmitting}
                  />
                  {titleError && (
                    <p className="mt-1 text-xs text-red-500">{titleError}</p>
                  )}
                </div>

                {/* Category + Priority */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className={inputCls}
                      disabled={isSubmitting}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Priority</label>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value)}
                      className={inputCls}
                      disabled={isSubmitting}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Due date */}
                <div>
                  <label className={labelCls}>Due Date <span className="normal-case font-normal text-gray-400">(optional)</span></label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className={inputCls}
                    disabled={isSubmitting}
                  />
                </div>

                {/* Reminder */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={reminderEnabled}
                      onChange={(e) => {
                        setReminderEnabled(e.target.checked);
                        setReminderError("");
                      }}
                      disabled={isSubmitting}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Enable reminder</span>
                  </label>
                  {reminderEnabled && (
                    <div>
                      <label className={labelCls}>Reminder Time</label>
                      <input
                        type="datetime-local"
                        value={reminderTime}
                        onChange={(e) => {
                          setReminderTime(e.target.value);
                          setReminderError("");
                        }}
                        className={`${inputCls} ${reminderError ? "border-red-400 focus:border-red-400 focus:ring-red-200" : ""}`}
                        disabled={isSubmitting}
                      />
                      {reminderError && (
                        <p className="mt-1 text-xs text-red-500">{reminderError}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-2 border-t border-gray-100 dark:border-gray-800 px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1 transition disabled:opacity-60"
                >
                  {isSubmitting && (
                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                  )}
                  {mode === "create" ? "Add Task" : "Save Changes"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
