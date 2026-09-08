self.addEventListener("push", function (event) {
  if (event.data) {
    try {
      const data = event.data.json();
      const options = {
        body: data.body,
        icon: data.icon || "/icons/icon-192x192.png",
        badge: data.badge || "/icons/icon-72x72.png",
        data: data.data || { url: "/" },
        vibrate: [100, 50, 100],
        actions: data.actions || [],
      };

      event.waitUntil(
        self.registration.showNotification(data.title, options)
      );
    } catch (e) {
      // Fallback if data is not JSON
      const text = event.data.text();
      event.waitUntil(
        self.registration.showNotification("GQ-Attendance Notification", {
          body: text,
          icon: "/icons/icon-192x192.png",
          badge: "/icons/icon-72x72.png",
          data: { url: "/" },
        })
      );
    }
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      // If a window is already open, focus it and redirect
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url && "focus" in client) {
          client.focus();
          if (client.navigate) {
            return client.navigate(targetUrl);
          }
        }
      }
      // Otherwise, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
