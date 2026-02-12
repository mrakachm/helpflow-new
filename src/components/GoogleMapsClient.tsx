"use client";

import { useEffect } from "react";

export default function GoogleMapsClient() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (document.getElementById("google-maps")) return;

    const script = document.createElement("script");
    script.id = "google-maps";
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`;
    script.async = true;
    document.body.appendChild(script);
  }, []);

  return null;
}