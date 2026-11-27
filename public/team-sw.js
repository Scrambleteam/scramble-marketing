// Service worker for the Scramble team mobile app (/admin/app).
// Shows push notifications and opens the app when one is tapped.
// Notification text is kept generic on purpose (no client details on a lock screen).

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  event.waitUntil(
    self.registration.showNotification(data.title || "Scramble", {
      body: data.body || "",
      icon: "/team-app/icon-192.png",
      badge: "/team-app/icon-192.png",
      tag: data.tag || "scramble",
      data: { url: data.url || "/admin/app" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/admin/app";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const w of windows) {
        if (w.url.includes("/admin/app") && "focus" in w) return w.focus();
      }
      return self.clients.openWindow(url);
    })
  );
});
