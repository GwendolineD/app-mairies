// Tous Voisins — Web Push service worker
// Receives push events, displays a notification, and routes clicks to the app.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  // #region agent log
  var swLog = function (data) {
    return fetch("/api/debug/sw-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        Object.assign(
          {
            at: Date.now(),
            permission:
              (self.Notification && self.Notification.permission) || "unknown",
          },
          data,
        ),
      ),
    }).catch(function () {});
  };
  // #endregion
  if (!event.data) {
    // #region agent log
    event.waitUntil(swLog({ stage: "push", hasData: false }));
    // #endregion
    return;
  }
  let payload = {};
  let parseOk = true;
  try {
    payload = event.data.json();
  } catch {
    parseOk = false;
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
  event.waitUntil(
    // #region agent log
    swLog({
      stage: "push",
      hasData: true,
      parseOk: parseOk,
      title: title,
      payloadKeys: Object.keys(payload),
    })
      .then(function () {
        // #endregion
        return self.registration.showNotification(title, options);
      })
      // #region agent log
      .then(function () {
        return swLog({ stage: "shown", title: title });
      })
      .catch(function (err) {
        return swLog({
          stage: "error",
          message: String((err && err.message) || err),
        });
      }),
    // #endregion
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if (client.url.includes(url) && "focus" in client) {
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(url);
        }
      }),
  );
});
