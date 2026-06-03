"use client";

import { useEffect, useRef } from "react";
import { Task } from "./api";
import { REMINDER_POLL_INTERVAL_MS } from "./constants";

export function useReminderChecker(
  tasks: Task[],
  onReminderDue: (task: Task) => void,
): void {
  const tasksRef = useRef(tasks);
  const callbackRef = useRef(onReminderDue);

  useEffect(() => {
    tasksRef.current = tasks;
  }, [tasks]);

  useEffect(() => {
    callbackRef.current = onReminderDue;
  }, [onReminderDue]);

  useEffect(() => {
    function checkReminders() {
      const now = new Date();
      for (const task of tasksRef.current) {
        if (!task.reminderEnabled) continue;
        if (task.notificationTriggered) continue;
        if (task.reminderStatus === "dismissed") continue;

        const isPendingDue =
          task.reminderStatus === "pending" &&
          task.reminderTime !== null &&
          new Date(task.reminderTime) <= now;

        const isSnoozeDue =
          task.reminderStatus === "snoozed" &&
          task.snoozeUntil !== null &&
          new Date(task.snoozeUntil) <= now;

        if (isPendingDue || isSnoozeDue) {
          callbackRef.current(task);
        }
      }
    }

    checkReminders();

    const id = setInterval(checkReminders, REMINDER_POLL_INTERVAL_MS);

    function onVisible() {
      if (document.visibilityState === "visible") checkReminders();
    }
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);
}
