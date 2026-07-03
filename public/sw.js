self.addEventListener("push", function (event) {
  let data = {};

  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }

  const title = data.title || "Nouvelle mission HelpFlow 🚚";
  const options = {
    body: data.body || "Une nouvelle commande est disponible près de vous.",
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/livreur/missions",
      city: data.city || "",
      orderId: data.orderId || "",
    },
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const url = event.notification.data?.url || "/livreur/missions";

  event.waitUntil(clients.openWindow(url));
});