"use client";
import { AnimatePresence, motion } from "framer-motion";
import { Task } from "@/lib/api";
import { stopAlarm } from "@/lib/reminderAudio";

type Props = {
  alerts: Task[];
  onSnooze: (id: string) => void;
  onDismiss: (id: string) => void;
};

export default function ReminderBanner({ alerts, onSnooze, onDismiss }: Props) {
  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", damping: 22, stiffness: 300 }}
            className="pointer-events-auto mx-auto w-full max-w-lg rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-4 py-3 shadow-lg flex items-center gap-3"
          >
            {/* Bell icon */}
            <svg className="h-5 w-5 flex-shrink-0 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>

            {/* Title */}
            <span className="flex-1 text-sm font-medium text-amber-900 dark:text-amber-100 truncate">
              {alert.title}
            </span>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => { stopAlarm(); onSnooze(alert.id); }}
                className="rounded-lg bg-amber-200 dark:bg-amber-800 px-3 py-1 text-xs font-semibold text-amber-800 dark:text-amber-200 hover:bg-amber-300 dark:hover:bg-amber-700 transition"
              >
                Snooze 5 min
              </button>
              <button
                onClick={() => { stopAlarm(); onDismiss(alert.id); }}
                className="rounded-lg bg-white dark:bg-gray-800 px-3 py-1 text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 transition"
              >
                Dismiss
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
