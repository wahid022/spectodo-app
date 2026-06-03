self.addEventListener('install', (e) => e.waitUntil(self.skipWaiting()));
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const bc = new BroadcastChannel('task-reminders');
  bc.postMessage({
    action: e.action || 'click',
    taskId: e.notification.data?.taskId,
  });
  bc.close();
});
