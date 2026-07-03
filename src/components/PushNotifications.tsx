"use client";

import { useEffect, useState } from "react";

export default function PushNotifications() {
  const [permission, setPermission] =
    useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Notifications non supportées");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== "granted") return;

    const registration =
      await navigator.serviceWorker.register("/sw.js");

    const subscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey:
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

    await fetch("/api/push/subscribe", {
      method: "POST",
      body: JSON.stringify(subscription),
      headers: {
        "Content-Type": "application/json",
      },
    });

    alert("Notifications missions activées ✅");
  }

  if (permission === "granted") {
    return (
      <div className="rounded-xl bg-green-50 border border-green-200 p-4 text-green-800 font-semibold">
        🔔 Notifications activées
      </div>
    );
  }

  return (
    <button
      onClick={enableNotifications}
      className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
    >
      🔔 Activer les notifications missions
    </button>
  );
}