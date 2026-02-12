"use client"

import { useEffect, useRef, useState } from "react"
import Script from "next/script"
import { calculatePrice } from "@/lib/pricing"

type LatLng = { lat: number; lng: number }

export default function MapView() {
  const mapRef = useRef<HTMLDivElement | null>(null)
  const mapInstanceRef = useRef<google.maps.Map | null>(null)

  const [distance, setDistance] = useState<number | null>(null)
  const [price, setPrice] = useState<number | null>(null)

  const origin = "7 Rue Lesage, Reims"
  const destination = "26 Rue Emile Zola, Reims"

  useEffect(() => {
    if (!window.google || !mapRef.current) return

    mapInstanceRef.current = new google.maps.Map(mapRef.current, {
      center: { lat: 49.2583, lng: 4.0317 },
      zoom: 13,
    })

    calculateDistance()

  }, [])

  const calculateDistance = () => {
    const service = new google.maps.DistanceMatrixService()

    service.getDistanceMatrix(
      {
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (response, status) => {
        if (status !== "OK" || !response) return

        const meters =
          response.rows[0].elements[0].distance.value

        const pricing = calculatePrice(meters)

        setDistance(pricing.distanceKm)
        setPrice(pricing.price)
      }
    )
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`}
        strategy="afterInteractive"
      />

      <div className="w-full h-[400px]" ref={mapRef} />

      <div className="mt-4 p-4 bg-white shadow rounded">
        {distance && price && (
          <>
            <p>Distance : {distance} km</p>
            <p>Prix : {price} €</p>
          </>
        )}
      </div>
    </>
  )
}
