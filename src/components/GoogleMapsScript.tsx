"use client";
import Script from "next/script";

export default function GoogleMapsScript() {
  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!;
  return (
    <Script
      src={`https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`}
      strategy="afterInteractive"
    />
  );
}