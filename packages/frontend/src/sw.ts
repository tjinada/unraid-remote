/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';

declare let self: ServiceWorkerGlobalScope;

// Precache the built app shell.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// SPA navigation fallback. API and the terminal WebSocket are online-only
// and are intentionally NOT cached.
registerRoute(
  new NavigationRoute(createHandlerBoundToURL('index.html'), {
    denylist: [/^\/api\//, /^\/ws(\/|$)/],
  }),
);

// ── Push notification infrastructure (no triggers sent in v1) ──────────────
interface PushPayload {
  title?: string;
  body?: string;
  icon?: string;
  tag?: string;
  data?: { url?: string };
}

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch {
      payload = { title: 'Notification', body: event.data.text() };
    }
  }
  event.waitUntil(
    self.registration.showNotification(payload.title ?? 'Unraid Control', {
      body: payload.body ?? '',
      icon: payload.icon ?? '/icons/icon.svg',
      badge: '/icons/icon.svg',
      tag: payload.tag ?? 'unraidpwa',
      data: payload.data ?? {},
    }),
  );
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          (client as WindowClient).navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow?.(url);
    }),
  );
});

// Let the update prompt activate a waiting SW immediately.
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
