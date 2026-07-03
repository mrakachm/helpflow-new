"use client";

import { useEffect, useState } from "react";

export default function PushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
    }
  }, []);

  async function enableNotifications() {
    if (!("Notification" in window)) {
      alert("Notifications non supportées sur ce téléphone.");
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === "granted") {
      alert("Notifications activées ✅");
    } else {
      alert("Notifications refusées ou silencieuses.");
    }
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
      type="button"
      onClick={enableNotifications}
      className="w-full rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white"
    >
      🔔 Activer les notifications missions
    </button>
  );
}