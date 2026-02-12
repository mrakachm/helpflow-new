"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type GeoPoint = { lat: number; lng: number };

function haversineKm(a: GeoPoint, b: GeoPoint) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s1 = Math.sin(dLat / 2) ** 2;
  const s2 =
    Math.cos((a.lat * Math.PI) / 180) *
    Math.cos((b.lat * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;

  return 2 * R * Math.asin(Math.sqrt(s1 + s2));
}

// Géocodage OSM (test / dev)
async function geocodeOSM(query: string): Promise<GeoPoint | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&limit=1`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();
  if (!data?.[0]) return null;
  return { lat: Number(data[0].lat), lng: Number(data[0].lon) };
}

// Reverse geocode OSM (lat/lng -> adresse)
async function reverseGeocodeOSM(lat: number, lng: number): Promise<{
  addressLine: string;
  city: string;
  postcode?: string;
} | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
    lat
  )}&lon=${encodeURIComponent(lng)}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();
  if (!data?.address) return null;

  const a = data.address;

  const house = a.house_number ? String(a.house_number) : "";
  const road = a.road ? String(a.road) : "";
  const suburb = a.suburb ? String(a.suburb) : "";

  const addressLine = [house, road, suburb].filter(Boolean).join(" ").trim();

  const city =
    a.city ||
    a.town ||
    a.village ||
    a.municipality ||
    a.county ||
    "";

  return {
    addressLine: addressLine || (data.display_name ? String(data.display_name) : ""),
    city: String(city),
    postcode: a.postcode ? String(a.postcode) : undefined,
  };
}

function formatEuro(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
const BASE_PRICE_CENTS = 500;      // 5.00 €
const PRICE_PER_KM_CENTS = 20;     // 0.20 €

function calculatePrice(distanceKm: number | null | undefined) {
  const d = typeof distanceKm === "number" && !Number.isNaN(distanceKm) ? distanceKm : 1;
  const billedKm = Math.max(1, Math.ceil(d));     // 1km minimum, puis arrondi au km supérieur
  return BASE_PRICE_CENTS + (billedKm - 1) * PRICE_PER_KM_CENTS;
}
  // Champs expéditeur
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderCity, setSenderCity] = useState("");

  // Champs receveur
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCity, setReceiverCity] = useState("");

  // Colis / trajet
  const [bagCount, setBagCount] = useState<number>(1);
  const [weightKg, setWeightKg] = useState<number>(1);
  const [distanceKm, setDistanceKm] = useState<number>(1);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  // GPS
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [senderPos, setSenderPos] = useState<GeoPoint | null>(null);

  // UI
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // User
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  // --- TARIFICATION (à ajuster à ton modèle) ---
  // Exemple simple : base + km + poids + sacs
  const pricing = useMemo(() => {
    const baseCents = 250; // 2,50€
    const perKmCents = 45; // 0,45€/km
    const perKgCents = 20; // 0,20€/kg
    const perBagCents = 40; // 0,40€/sac

    const km = Math.max(0, Number(distanceKm) || 0);
    const kg = Math.max(0, Number(weightKg) || 0);
    const bags = Math.max(1, Number(bagCount) || 1);

    const priceCents =
      baseCents +
      Math.round(km * perKmCents) +
      Math.round(kg * perKgCents) +
      Math.round(bags * perBagCents);

    // Commission (ex: 20%)
    const platformFeeCents = Math.round(priceCents * 0.2);
    const courierEarningsCents = Math.max(0, priceCents - platformFeeCents);

    return {
      priceCents,
      platformFeeCents,
      courierEarningsCents,
      breakdown: { baseCents, perKmCents, perKgCents, perBagCents },
    };
  }, [distanceKm, weightKg, bagCount]);

  async function computeDistance() {
    setMsg(null);

    const from = `${senderAddress}, ${senderCity}`;
    const to = `${receiverAddress}, ${receiverCity}`;

    if (!senderAddress.trim() || !receiverAddress.trim()) {
      setMsg("Merci de renseigner l’adresse expéditeur et l’adresse receveur (avec ville).");
      return;
    }

    setGeoLoading(true);
    try {
      const [a, b] = await Promise.all([geocodeOSM(from), geocodeOSM(to)]);
      if (!a || !b) {
        setMsg("Impossible de localiser une des adresses. Vérifie Adresse + Ville.");
        return;
      }
 const km = Math.ceil(haversineKm(a, b));

setDistanceKm(Math.max(1, km));
    } catch (e: any) {
      setMsg(e?.message || "Erreur calcul distance");
    } finally {
      setGeoLoading(false);
    }
  }

  async function useMyLocationAsSender() {
    setMsg(null);
    setGpsInfo(null);

    if (!navigator.geolocation) {
      setMsg("GPS non disponible sur ce navigateur.");
      return;
    }

    setGpsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const p = { lat: latitude, lng: longitude };
          setSenderPos(p);
          setGpsInfo(`Position: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);

          // Reverse geocode -> remplit adresse/ville expéditeur
          const rev = await reverseGeocodeOSM(latitude, longitude);
          if (rev) {
            if (rev.addressLine) setSenderAddress(rev.addressLine);
            if (rev.city) setSenderCity(rev.city);
          }
        } catch (e: any) {
          setMsg(e?.message || "Erreur GPS (reverse geocode).");
        } finally {
          setGpsLoading(false);
        }
      },
      () => {
        setMsg("Impossible d'accéder au GPS (autorisation refusée).");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  function validate() {
    if (!userId) return "Tu dois être connecté(e) pour créer une commande.";
    if (!senderName.trim()) return "Nom expéditeur obligatoire.";
    if (!senderPhone.trim()) return "Téléphone expéditeur obligatoire.";
    if (!senderAddress.trim() || !senderCity.trim()) return "Adresse + Ville expéditeur obligatoires.";
    if (!receiverName.trim()) return "Nom receveur obligatoire.";
    if (!receiverPhone.trim()) return "Téléphone receveur obligatoire.";
    if (!receiverAddress.trim() || !receiverCity.trim()) return "Adresse + Ville receveur obligatoires.";
    if (!scheduledAt) return "Merci de choisir une date/heure de livraison.";
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

    setLoading(true);
    try {
      // ⚠️ ADAPTE ICI selon ta table "orders"
      // Exemple de colonnes :
      // user_id, sender_name, sender_phone, pickup_address, pickup_city, receiver_name, receiver_phone, dropoff_address, dropoff_city,
      // bag_count, weight_kg, distance_km, scheduled_at, price_cents, platform_fee_cents, status

      const payload = {
        user_id: userId,
        sender_name: senderName,
        sender_phone: senderPhone,
        pickup_address: senderAddress,
        pickup_city: senderCity,

        receiver_name: receiverName,
        receiver_phone: receiverPhone,
        dropoff_address: receiverAddress,
        dropoff_city: receiverCity,

        bag_count: bagCount,
        weight_kg: weightKg,
        distance_km: distanceKm,
        scheduled_at: scheduledAt,

        price_cents: pricing.priceCents,
        platform_fee_cents: pricing.platformFeeCents,
        status: "DRAFT",
      };

      const { data, error } = await supabase.from("orders").insert(payload).select("id").single();

      if (error) throw error;

      // Redirection vers page détail commande
      router.push(`/client/orders/${data.id}`);
    } catch (e: any) {
      setMsg(e?.message || "Erreur création commande.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-6">
        {/* Header */}
        <div className="mb-5 flex items-center gap-3">
          <img
            src="/logo-helpflow.png"
            alt="HelpFlow"
            className="h-10 w-10 rounded-xl object-cover"
          />
          <div>
            <h1 className="text-xl font-semibold">Créer une commande</h1>
            <p className="text-sm text-gray-600">Remplis les infos, le prix se calcule automatiquement.</p>
          </div>
        </div>

        {/* Messages */}
        {msg ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {msg}
          </div>
        ) : null}

        {gpsInfo ? (
          <div className="mb-4 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-700">
            📍 {gpsInfo}
          </div>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-4">
          <input type="hidden" name="distanceKm" value={distanceKm ?? ""} />
         
          {/* Expéditeur */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold">Expéditeur</h2>
              <button
                type="button"
                onClick={useMyLocationAsSender}
                disabled={gpsLoading}
                className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {gpsLoading ? "GPS..." : "Utiliser ma position"}
              </button>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <input
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Nom + Prénom"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
              <input
                value={senderPhone}
                onChange={(e) => setSenderPhone(e.target.value)}
                placeholder="Téléphone"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
              <input
                value={senderAddress}
                onChange={(e) => setSenderAddress(e.target.value)}
                placeholder="Adresse"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
              <input
                value={senderCity}
                onChange={(e) => setSenderCity(e.target.value)}
                placeholder="Ville"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
            </div>
          </section>

          {/* Receveur */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Receveur</h2>

            <div className="grid grid-cols-1 gap-3">
              <input
                value={receiverName}
                onChange={(e) => setReceiverName(e.target.value)}
                placeholder="Nom + Prénom"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
              <input
                value={receiverPhone}
                onChange={(e) => setReceiverPhone(e.target.value)}
                placeholder="Téléphone"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
              <input
                value={receiverAddress}
                onChange={(e) => setReceiverAddress(e.target.value)}
                placeholder="Adresse"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
              <input
                value={receiverCity}
                onChange={(e) => setReceiverCity(e.target.value)}
                placeholder="Ville"
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
            </div>
          </section>

          {/* Colis / distance / date */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-base font-semibold">Colis & Livraison</h2>

            <div className="grid grid-cols-1 gap-3"></div>
            
            <div className="mt-3">
              <label className="mb-1 block text-xs text-gray-500">Date & heure</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-xl border border-gray-200 px-3 py-3 outline-none focus:border-black"
              />
            </div>
          </section>

          {/* Résumé prix */}
          <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="mb-2 text-base font-semibold">Résumé</h2>

            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Prix total</span>
                <span className="font-semibold">{formatEuro(pricing.priceCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Commission HelpFlow (20%)</span>
                <span>{formatEuro(pricing.platformFeeCents)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Revenu livreur estimé</span>
                <span>{formatEuro(pricing.courierEarningsCents)}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-gray-500">
              *Tarif provisoire pour tests. On pourra ensuite passer au calcul “par la route” (Google/Mapbox).
            </p>
          </section>

          {/* Actions */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-black py-4 text-base font-semibold text-white disabled:opacity-60"
          >
            {loading ? "Création..." : "Créer et publier la commande"}
          </button>

          <button
            type="button"
            onClick={() => router.push("/client")}
            className="w-full rounded-2xl border border-gray-200 bg-white py-4 text-base font-semibold"
          >
            Annuler
          </button>
        </form>
      </div>
    </main>
  );
}
