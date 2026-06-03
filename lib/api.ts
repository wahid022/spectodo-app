export type Task = {
  id: string;
  title: string;
  completed: boolean;
  category: string;
  priority: string;
  dueDate: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  reminderTime: string | null;
  reminderEnabled: boolean;
  reminderStatus: "none" | "pending" | "snoozed" | "dismissed";
  notificationTriggered: boolean;
  snoozeUntil: string | null;
};

export type CreateTaskPayload = {
  title: string;
  category: string;
  priority: string;
  dueDate?: string | null;
  reminderTime?: string | null;
  reminderEnabled?: boolean;
};

export type EditTaskPayload = Partial<{
  title: string;
  category: string;
  priority: string;
  dueDate: string | null;
  completed: boolean;
  reminderTime: string | null;
  reminderEnabled: boolean;
  reminderStatus: "none" | "pending" | "snoozed" | "dismissed";
  notificationTriggered: boolean;
}>;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = Array.isArray(body.message)
      ? body.message.join(", ")
      : (body.message ?? "An unexpected error occurred");
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

export function getAllTasks(): Promise<Task[]> {
  return request<Task[]>("/tasks");
}

export function createTask(data: CreateTaskPayload): Promise<Task> {
  return request<Task>("/tasks", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function editTask(id: string, data: EditTaskPayload): Promise<Task> {
  return request<Task>(`/tasks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export function deleteTask(id: string): Promise<Task> {
  return request<Task>(`/tasks/${id}`, { method: "DELETE" });
}

export function reorderTasks(
  tasks: { id: string; sortOrder: number }[]
): Promise<{ updated: number }> {
  return request<{ updated: number }>("/tasks/reorder", {
    method: "PATCH",
    body: JSON.stringify({ tasks }),
  });
}

export function markReminderTriggered(id: string): Promise<Task> {
  return editTask(id, { notificationTriggered: true });
}

export function snoozeReminder(id: string): Promise<Task> {
  return editTask(id, { reminderStatus: "snoozed" });
}

export function dismissReminder(id: string): Promise<Task> {
  return editTask(id, { reminderStatus: "dismissed", notificationTriggered: true });
}
