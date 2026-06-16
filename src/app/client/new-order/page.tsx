"use client";

import AddressInput from "@/components/AddressInput";
import GoogleMapsClient from "@/components/GoogleMapsClient";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function formatEuro(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const PARCEL_TYPES = [
    "Documents",
    "Électronique",
    "Téléphone",
    "Ordinateur portable",
    "Tablette",
    "Télévision",
    "Gâteau / alimentaire fragile",
    "Courses",
    "Fragile (verre/vaisselle)",
    "Électroménager",
    "Cafetière",
    "Imprimante",
    "Vêtements",
    "Garde-robe",
    "Armoire",
    "Petit mobilier",
    "Matériel professionnel",
    "Pièces détachées",
    "Moteur / pièce mécanique",
    "Clés",
    "Autre",
  ];

  const BASE_PRICE_CENTS = 100;
  const PRICE_PER_KM_CENTS = 20;

  function calculatePrice(distanceKm: number | null | undefined) {
    const d =
      typeof distanceKm === "number" && !Number.isNaN(distanceKm)
        ? distanceKm
        : 0;

    const billedKm = Math.max(1, Math.ceil(d));
    return BASE_PRICE_CENTS + (billedKm - 1) * PRICE_PER_KM_CENTS;
  }

  const [parcelType, setParcelType] = useState("");
  const [parcelNote, setParcelNote] = useState("");

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderCity, setSenderCity] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCity, setReceiverCity] = useState("");

  const [bagCount, setBagCount] = useState("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [clientProposedPrice, setClientProposedPrice] = useState("");

  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);

  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  const pricing = useMemo(() => {
    const priceCents = calculatePrice(distanceKm);
    const platformFeeCents = Math.round(priceCents * 0.2);
    const courierEarningsCents = Math.max(0, priceCents - platformFeeCents);

    return {
      priceCents,
      platformFeeCents,
      courierEarningsCents,
    };
  }, [distanceKm]);

  const pricingView = useMemo(() => {
    const standardPriceCents = pricing.priceCents;

    const proposedPriceCents =
      clientProposedPrice && Number(clientProposedPrice) > 0
        ? Math.round(Number(clientProposedPrice) * 100)
        : null;

    const finalPriceCents = proposedPriceCents
      ? Math.max(standardPriceCents, proposedPriceCents)
      : standardPriceCents;

    const platformFeeCents = Math.round(finalPriceCents * 0.2);
    const courierEarningsCents = Math.max(0, finalPriceCents - platformFeeCents);

    return {
      standardPriceCents,
      proposedPriceCents,
      finalPriceCents,
      platformFeeCents,
      courierEarningsCents,
    };
  }, [pricing.priceCents, clientProposedPrice]);

 

  async function computeDistance() {
    setMsg(null);

    if (
      !senderAddress.trim() ||
      !senderCity.trim() ||
      !receiverAddress.trim() ||
      !receiverCity.trim()
    ) {
      return;
    }

    const googleMaps = (window as any).google;

    if (!googleMaps?.maps?.DistanceMatrixService) {
      return;
    }

   const from = `${senderAddress.trim()}, ${senderCity.trim()}, France`;
    const to = `${receiverAddress.trim()}, ${receiverCity.trim()}, France`;

    setGeoLoading(true);

    try {
      const service = new googleMaps.maps.DistanceMatrixService();

      service.getDistanceMatrix(
        {
          origins: [from],
          destinations: [to],
          travelMode: googleMaps.maps.TravelMode.DRIVING,
          unitSystem: googleMaps.maps.UnitSystem.METRIC,
        },

        (response: any, status: string) => {
          console.log("Distance Matrix status:", status);
console.log("Distance Matrix response:", response);

          setGeoLoading(false);

          if (status !== "OK") {
            setDistanceKm(null);
            return;
          }

          const element = response?.rows?.[0]?.elements?.[0];

          if (!element || element.status !== "OK") {
            setDistanceKm(null);
            return;
          }

          const km = element.distance.value / 1000;
          const roundedKm = Math.max(1, Math.ceil(km));

          setDistanceKm(roundedKm);
        }
      );
    } catch {
      setGeoLoading(false);
      setDistanceKm(null);
    }
  }

  useEffect(() => {
    if (
      senderAddress.trim() &&
      senderCity.trim() &&
      receiverAddress.trim() &&
      receiverCity.trim()
    ) {
      const timer = setTimeout(() => {
        computeDistance();
      }, 800);

      return () => clearTimeout(timer);
    }
  }, [senderAddress, senderCity, receiverAddress, receiverCity]);

  async function useMyLocationAsSender() {
    setMsg(null);
    setGpsInfo(null);

    if (!navigator.geolocation) {
      setMsg("GPS non disponible sur ce navigateur.");
      return;
    }

    const googleMaps = (window as any).google;

    if (!googleMaps?.maps?.Geocoder) {
      setMsg("Google Maps n’est pas encore chargé. Réessaie dans 2 secondes.");
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;

          setGpsInfo(`Position: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

          const geocoder = new googleMaps.maps.Geocoder();

          geocoder.geocode(
            { location: { lat: latitude, lng: longitude } },
            (results: any[], status: string) => {
              setGpsLoading(false);

              if (status !== "OK" || !results?.[0]) {
                setMsg("Impossible de trouver l’adresse avec le GPS.");
                return;
              }

              const place = results[0];
              const comps = place.address_components ?? [];

              const get = (type: string) =>
                comps.find((c: any) => c.types.includes(type))?.long_name || "";

              const streetNumber = get("street_number");
              const route = get("route");

              const city =
                get("locality") ||
                get("postal_town") ||
                get("administrative_area_level_2");

              const addressLine = [streetNumber, route].filter(Boolean).join(" ");

              setSenderAddress(addressLine || place.formatted_address || "");
              setSenderCity(city || "");
            }
          );
        } catch (e: any) {
          setGpsLoading(false);
          setMsg(e?.message || "Erreur GPS.");
        }
      },
      () => {
        setMsg("Impossible d’accéder au GPS.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function validate(): string | null {
    if (!userId) return "Tu dois être connecté pour créer une commande.";
    if (!senderName.trim()) return "Nom expéditeur manquant.";
    if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";
    if (!senderAddress.trim() || !senderCity.trim()) return "Adresse expéditeur incomplète.";
    if (!receiverName.trim()) return "Nom receveur manquant.";
    if (!receiverPhone.trim()) return "Téléphone receveur manquant.";
    if (!receiverAddress.trim() || !receiverCity.trim()) return "Adresse receveur incomplète.";
    if (distanceKm === null) return "Distance non calculée. Vérifie les adresses.";
    return null;
  }

  function validateSender(): string | null {
    if (!senderName.trim()) return "Nom expéditeur manquant.";
    if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";
    if (!senderAddress.trim() || !senderCity.trim()) return "Adresse expéditeur incomplète.";
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);

    const err = validate();
    if (err) {
      setMsg(err);
      return;
    }

    if (!recipientEmail.trim()) {
      setMsg("Email du receveur manquant pour envoyer le code OTP.");
      return;
    }

    if (clientProposedPrice && Number(clientProposedPrice) < 1) {
      setMsg("Le prix minimum est 1€");
      return;
    }

    setLoading(true);

    const otp = Math.floor(1000 + Math.random() * 9000).toString();

    const payload: any = {
      sender_name: senderName,
      sender_phone: senderPhone,
      pickup_address: senderAddress,
      pickup_city: senderCity,

      receiver_name: receiverName,
      receiver_phone: receiverPhone,
      recipient_email: recipientEmail.trim(),
      dropoff_address: receiverAddress,
      dropoff_city: receiverCity,

      bag_count: Number(bagCount || 0),
      distance_km: distanceKm,
      scheduled_at: scheduledAt || null,
      parcel_type: parcelType || null,
      parcel_note: parcelNote || null,

      price_cents: pricingView.finalPriceCents,
      client_proposed_price_cents: pricingView.proposedPriceCents,
      platform_fee_cents: pricingView.platformFeeCents,
      courier_earnings_cents: pricingView.courierEarningsCents,
      pricing_mode: pricingView.proposedPriceCents ? "client_proposal" : "standard",

      status: "PENDING",
      payment_status: "PAID",
      otp_code: otp,
    };

    const { data, error } = await supabase
      .from("orders")
      .insert(payload)
      .select("id, otp_code, recipient_email")
      .single();

    if (error) {
      setMsg(error.message || JSON.stringify(error));
      setLoading(false);
      return;
    }

    const emailRes = await fetch("/api/send-otp-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: data.recipient_email || recipientEmail.trim(),
        otp: data.otp_code || otp,
        orderId: data.id,
      }),
    });

    const emailData = await emailRes.json().catch(() => ({}));

    if (!emailRes.ok) {
      setMsg(
        emailData?.error ||
          emailData?.message ||
          "Commande créée, mais email OTP non envoyé."
      );
      setLoading(false);
      return;
    }

    router.push(`/client/orders/${data.id}`);
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <GoogleMapsClient />

      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-5 flex items-center gap-3">
          <img
            src="/logo-helpflow.png"
            alt="HelpFlow"
            className="h-10 w-10 rounded-xl object-cover"
          />
          <div>
            <h1 className="text-xl font-semibold">Créer une commande</h1>
            <p className="text-sm text-gray-600">
              Remplis les infos, puis calcule la distance si besoin.
            </p>
          </div>
        </div>

        {msg && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm">
            {msg}
          </div>
        )}

        {gpsInfo && (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
            {gpsInfo}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Expéditeur</h2>

              <button
                type="button"
                onClick={() => {
                  const err = validateSender();
                  if (err) setMsg(err);
                  else setMsg("✅ Expéditeur validé.");
                }}
                className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
              >
                Valider expéditeur
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nom + Prénom"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
              />

              <input
                type="tel"
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="Téléphone"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
              />

              <AddressInput
                label=""
                placeholder="Adresse"
                value={senderAddress}
                onChange={(fullAddress, parsed) => {
                  setSenderAddress(fullAddress);
                  if (parsed.city) setSenderCity(parsed.city);
                }}
              />

              <input
                value={senderCity}
                onChange={(e) => setSenderCity(e.target.value)}
                placeholder="Ville"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
              />

              <button
                type="button"
                onClick={useMyLocationAsSender}
                disabled={gpsLoading}
                className="rounded-xl bg-blue-600 px-3 py-2 text-sm font-medium text-white"
              >
                {gpsLoading ? "GPS..." : "Utiliser ma position"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Receveur</h2>

            <div className="grid grid-cols-1 gap-3">
              <input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Nom + Prénom"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
              />

              <input
                type="tel"
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="Téléphone"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
              />

              <input
                type="email"
                placeholder="Email du receveur"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
              />

              <AddressInput
                label=""
                placeholder="Adresse"
                value={receiverAddress}
                onChange={(fullAddress, parsed) => {
                  setReceiverAddress(fullAddress);
                  if (parsed.city) setReceiverCity(parsed.city);
                }}
              />

              <input
                value={receiverCity}
                onChange={(e) => setReceiverCity(e.target.value)}
                placeholder="Ville"
                className="w-full rounded-xl border border-gray-200 px-3 py-2"
              />
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Colis & Livraison</h2>

            </div>

            <input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={bagCount}
              onChange={(e) => setBagCount(e.target.value)}
              placeholder="Nombre de sacs"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />

            <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <h3 className="text-lg font-semibold">Description du colis</h3>

              <select
                value={parcelType}
                onChange={(e) => setParcelType(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white p-3"
              >
                <option value="">Choisir…</option>
                {PARCEL_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>

              <textarea
                value={parcelNote}
                onChange={(e) => setParcelNote(e.target.value)}
                placeholder="Fragile, ne pas pencher…"
                className="w-full rounded-xl border border-gray-200 p-3"
              />
            </div>

            <div className="mt-3 text-sm text-gray-600">
              Distance : <span className="font-semibold">{distanceKm ?? "-"} km</span>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              Prix :{" "}
              <span className="font-semibold">
                {formatEuro(pricingView.finalPriceCents)}
              </span>
            </div>

            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="mt-3 w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </section>

          <input
            type="number"
            inputMode="decimal"
            min="0"
            step="0.5"
            value={clientProposedPrice}
            onChange={(e) => setClientProposedPrice(e.target.value)}
            placeholder="Prix proposé client, ex : 5"
            className="w-full rounded-xl border border-gray-200 px-3 py-2"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black px-4 py-3 text-white"
          >
            {loading ? "Création..." : "Créer la commande"}
          </button>
        </form>
      </div>
    </main>
  );
}