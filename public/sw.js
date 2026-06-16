<<<<<<< HEAD
// Vie Locale — push + notification handling for PWA mobile notifications.

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }

  const title = data.title || "Vie Locale";
  const options = {
    body: data.body || "",
    icon: "/icons/icon.svg",
    badge: "/icons/icon.svg",
    tag: data.tag || undefined,
    renotify: Boolean(data.tag),
    data: { url: data.url || "/messages" },
  };

=======
// Vie Locale — Web Push service worker
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
    payload = { title: "Vie Locale", body: event.data.text() };
  }
  const title = payload.title || "Vie Locale";
  const options = {
    body: payload.body,
    icon: payload.icon || "/favicon.ico",
    badge: payload.badge || "/favicon.ico",
    tag: payload.tag,
    data: { url: payload.url || "/" },
    renotify: !!payload.tag,
  };
>>>>>>> preprod
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
<<<<<<< HEAD
  const targetUrl =
    (event.notification.data && event.notification.data.url) || "/messages";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if ("focus" in client) {
            if ("navigate" in client) {
              client.navigate(targetUrl).catch(() => {});
            }
=======
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(url) && "focus" in client) {
>>>>>>> preprod
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
<<<<<<< HEAD
          return self.clients.openWindow(targetUrl);
        }
        return undefined;
=======
          return self.clients.openWindow(url);
        }
>>>>>>> preprod
      }),
  );
});
