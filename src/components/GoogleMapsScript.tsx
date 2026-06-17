"use client";

import Script from "next/script";

export default function GoogleMapsScript() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) return null;

  return (
    <Script
      id="google-maps"
      src={`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=fr&region=FR`}
      strategy="afterInteractive"
    />
  );
}