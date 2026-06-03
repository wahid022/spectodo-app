export async function registerSW(): Promise<void> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch {}
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission !== 'default') return Notification.permission;
  return Notification.requestPermission();
}

export async function showReminderNotification(taskId: string, title: string): Promise<void> {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;
  const reg = await navigator.serviceWorker.ready;
  // `actions` is valid on ServiceWorkerRegistration.showNotification but missing from TS lib types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (reg.showNotification as (t: string, o: any) => Promise<void>)(title, {
    body: 'Reminder: tap to manage',
    actions: [
      { action: 'snooze', title: 'Snooze 5 min' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    data: { taskId },
    icon: '/favicon.ico',
  });
}

export function listenForNotificationActions(
  onSnooze: (id: string) => void,
  onDismiss: (id: string) => void,
): () => void {
  const bc = new BroadcastChannel('task-reminders');
  bc.onmessage = (e) => {
    const { action, taskId } = e.data as { action: string; taskId: string };
    if (action === 'snooze') onSnooze(taskId);
    else onDismiss(taskId);
  };
  return () => bc.close();
}
