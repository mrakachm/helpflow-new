"use client";

import { useEffect } from "react";

export default function RegisterSW() {
  useEffect(() => {
    async function register() {
      if ("serviceWorker" in navigator) {
        try {
          await navigator.serviceWorker.register("/sw.js");
          console.log("Service Worker enregistré");
        } catch (error) {
          console.error("Erreur Service Worker:", error);
        }
      }
    }

    register();
  }, []);

  return null;
}