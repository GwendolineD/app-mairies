// Tous Voisins — Web Push service worker
// Receives push events, displays a notification, and routes clicks to the app.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  if (!event.data) return;
  let payload = {};
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Tous Voisins", body: event.data.text() };
  }
  const title = payload.title || "Tous Voisins";
  const options = {
    body: payload.body,
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    tag: payload.tag,
    data: { url: payload.url || "/" },
    renotify: !!payload.tag,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Mark the matching in-app notification as read so the bell badge converges
// with what the user already saw natively. Best effort: never blocks navigation.
function markReadByTag(tag) {
  if (!tag) return Promise.resolve();
  return fetch("/api/notifications/read", {
    method: "POST",
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tag }),
  }).catch(() => undefined);
}

function focusOrOpen(url) {
  return self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) {
        // Compare pathnames: `includes` would match "/" against every tab.
        let samePath = false;
        try {
          samePath = new URL(client.url).pathname === url;
        } catch {
          samePath = false;
        }
        if (samePath && "focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    });
}

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  const tag = event.notification.tag;
  event.waitUntil(Promise.all([markReadByTag(tag), focusOrOpen(url)]));
});
