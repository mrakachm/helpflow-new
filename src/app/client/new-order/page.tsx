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


// Géocodage OSM (test/dev)
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
async function reverseGeocodeOSM(
  lat: number,
  lng: number
): Promise<{ addressLine: string; city: string; postcode?: string } | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${encodeURIComponent(
    String(lat)
  )}&lon=${encodeURIComponent(String(lng))}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();
  if (!data?.address) return null;

  const a = data.address;
  const house = a.house_number ? String(a.house_number) : "";
  const road = a.road ? String(a.road) : "";
  const suburb = a.suburb ? String(a.suburb) : "";

  const addressLine = [house, road, suburb].filter(Boolean).join(" ").trim();

  const city =
    a.city || a.town || a.village || a.municipality || a.county || "";

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

  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  // ===== TARIF =====
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
// ===== Colis (description) =====
const [parcelType, setParcelType] = useState<string>("");
const [parcelNote, setParcelNote] = useState<string>("");

  // ====== Champs expéditeur ======
  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderCity, setSenderCity] = useState("");

  // ====== Champs receveur ======
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCity, setReceiverCity] = useState("");

  // ====== Colis / livraison ======
  const [bagCount, setBagCount] = useState<string>("");
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [scheduledAt, setScheduledAt] = useState<string>("");

  // ====== Proposition client (optionnel) ======
const [clientProposedPrice, setClientProposedPrice] = useState<string>("");

  // ====== GPS ======
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsInfo, setGpsInfo] = useState<string | null>(null);
  const [senderPos, setSenderPos] = useState<GeoPoint | null>(null);

  // ====== UI ======
  const [geoLoading, setGeoLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // ====== User ======
  const [userId, setUserId] = useState<string | null>(null);

  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  // ====== Prix standard (barème) ======
  const pricing = useMemo(() => {
    const priceCents = calculatePrice(distanceKm);

    // (ex: commission 20% si tu veux garder)
    const platformFeeCents = Math.round(priceCents * 0.2);
    const courierEarningsCents = Math.max(0, priceCents - platformFeeCents);

    return {
      priceCents,
      platformFeeCents,
      courierEarningsCents,
    };
  }, [distanceKm]);

  // ✅ PRIX FINAL (UNIQUE) – toujours utiliser pricingView partout
  const pricingView = useMemo(() => {
    const standardPriceCents = pricing?.priceCents ?? 0;

    const proposedPriceCents =
      clientProposedPrice && Number(clientProposedPrice) > 0
        ? Math.round(Number(clientProposedPrice) * 100)
        : null;

    // Prix final = jamais sous le barème
    const finalPriceCents = proposedPriceCents
      ? Math.max(standardPriceCents, proposedPriceCents)
      : standardPriceCents;

    // Commission HelpFlow 20% (pareil que standard)
    const platformFeeCents = Math.round(finalPriceCents * 0.2);
    const courierEarningsCents = Math.max(0, finalPriceCents - platformFeeCents);

    return {
      standardPriceCents,
      proposedPriceCents,
      finalPriceCents,
      platformFeeCents,
      courierEarningsCents,
    };
  }, [pricing?.priceCents, clientProposedPrice]);

  async function computeDistance() {
  setMsg(null);

  if (
    !senderAddress.trim() ||
    !senderCity.trim() ||
    !receiverAddress.trim() ||
    !receiverCity.trim()
  ) {
    setMsg("Merci de remplir adresse + ville pour l’expéditeur et le receveur.");
    return;
  }

  const from = `${senderAddress}, ${senderCity}, France`;
  const to = `${receiverAddress}, ${receiverCity}, France`;

  setGeoLoading(true);

  try {
    const [a, b] = await Promise.all([
      geocodeOSM(from),
      geocodeOSM(to),
    ]);

    if (!a || !b) {
      setDistanceKm(null);
      setMsg("Adresse introuvable. Vérifie bien la rue, la ville et le code postal si possible.");
      return;
    }

    const realKm = haversineKm(a, b);
    const roundedKm = Math.max(1, Math.ceil(realKm));

    setDistanceKm(roundedKm);
    setMsg(`✅ Distance calculée : ${roundedKm} km`);
  } catch (e: any) {
    setDistanceKm(null);
    setMsg(e?.message || "Erreur pendant le calcul de distance.");
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
          setGpsInfo(
            `Position: ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          );

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
        setMsg("Impossible d’accéder au GPS (autorisation refusée).");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

 // =====================
// VALIDATIONS
// =====================
function validate(): string | null {
  if (!userId) return "Tu dois être connecté pour créer une commande.";
  if (!senderName.trim()) return "Nom expéditeur manquant.";
  if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";
  if (!senderAddress.trim() || !senderCity.trim()) return "Adresse expéditeur incomplète.";
  if (!receiverName.trim()) return "Nom receveur manquant.";
  if (!receiverPhone.trim()) return "Téléphone receveur manquant.";
  if (!receiverAddress.trim() || !receiverCity.trim()) return "Adresse receveur incomplète.";
  return null;
}

// Valide seulement l'expéditeur (sans créer la commande)
function validateSender(): string | null {
  if (!senderName.trim()) return "Nom expéditeur manquant.";
  if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";
  if (!senderAddress.trim() || !senderCity.trim()) return "Adresse expéditeur incomplète.";
  return null;
}

// =====================
// SUBMIT (création commande)
// =====================
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

  const otp = Math.floor(100000 + Math.random() * 900000).toString();

  const payload: any = {
    // Expéditeur
    sender_name: senderName,
    sender_phone: senderPhone,
    pickup_address: senderAddress,
    pickup_city: senderCity,

    // Receveur
    receiver_name: receiverName,
    receiver_phone: receiverPhone,
    recipient_email: recipientEmail.trim(),
    dropoff_address: receiverAddress,
    dropoff_city: receiverCity,

    // Colis / livraison
    bag_count: Number(bagCount || 0),
    distance_km: distanceKm,
    scheduled_at: scheduledAt || null,
    parcel_type: parcelType || null,
    parcel_note: parcelNote || null,

    // Prix
    price_cents: pricingView.finalPriceCents,
    client_proposed_price_cents: pricingView.proposedPriceCents,
    platform_fee_cents: pricingView.platformFeeCents,
    courier_earnings_cents: pricingView.courierEarningsCents,
    pricing_mode: pricingView.proposedPriceCents ? "client_proposal" : "standard",

    // Mode test sans paiement Stripe
    status: "PENDING",
    payment_status: "PAID",

    // OTP stocké dans Supabase
    otp_code: otp,
  };

  console.log("📦 PAYLOAD:", payload);

  const { data, error } = await supabase
    .from("orders")
    .insert(payload)
    .select("id, otp_code, recipient_email")
    .single();

  console.log("📦 RESPONSE:", { data, error });

  if (error) {
    console.error("ERREUR SUPABASE INSERT:", JSON.stringify(error, null, 2));
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
    console.error("ERREUR EMAIL OTP:", emailData);
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
          <p className="text-sm text-gray-600">
            Remplis les infos, puis calcule la distance si besoin.
          </p>
        </div>
      </div>

      {/* Messages */}
      {msg ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm">
          {msg}
        </div>
      ) : null}

      {gpsInfo ? (
        <div className="mb-4 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm">
          {gpsInfo}
        </div>
      ) : null}

      <form onSubmit={onSubmit} className="space-y-4">
        {/* distanceKm caché */}
        <input type="hidden" name="distanceKm" value={distanceKm ?? ""} />

{clientProposedPrice && Number(clientProposedPrice) < 5 && (
  <p className="text-red-500 text-sm">Minimum 1€</p>
)}

        {/* ===================== */}
        {/* Expéditeur */}
        {/* ===================== */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Expéditeur</h2>

            {/* ✅ bouton validation expéditeur */}
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

            {/* ✅ Adresse expéditeur (manquait chez toi) */}
            <input
              value={senderAddress}
              onChange={(e) => setSenderAddress(e.target.value)}
              placeholder="Adresse"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />

            <input
              value={senderCity}
              onChange={(e) => setSenderCity(e.target.value)}
              placeholder="Ville"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </div>
        </section>

        {/* ===================== */}
        {/* Receveur */}
        {/* ===================== */}
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
/>
            <input
              value={receiverAddress}
              onChange={(e) => setReceiverAddress(e.target.value)}
              placeholder="Adresse"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />

            <input
              value={receiverCity}
              onChange={(e) => setReceiverCity(e.target.value)}
              placeholder="Ville"
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </div>
        </section>

          {/* ===================== */}
        {/* Colis & Livraison */}
        {/* ===================== */}
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold">Colis & Livraison</h2>

            <button
              type="button"
              onClick={computeDistance}
              disabled={geoLoading}
              className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"
            >
              {geoLoading ? "Calcul..." : "Calculer distance"}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
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
          </div>

          <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
            <h3 className="text-lg font-semibold">Description du colis</h3>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Type de colis</label>
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
            </div>

            <div className="space-y-1">
              <label className="text-sm text-gray-600">Note / détails</label>
              <textarea
                value={parcelNote}
                onChange={(e) => setParcelNote(e.target.value)}
                placeholder="Fragile, ne pas pencher…"
                className="w-full rounded-xl border border-gray-200 p-3"
              />
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Distance (auto) :{" "}
            <span className="font-semibold">{distanceKm} km</span>
          </div>

          <div className="mt-3 space-y-1">
            <label className="mb-1 block text-xs text-gray-500">Date & heure</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2"
            />
          </div>
        </section>

        {/* ===================== */}
        {/* Proposition client (optionnel) */}
        {/* ===================== */}
        <input
  type="number"
  inputMode="decimal"
  min="0"
  step="0.5"
  value={clientProposedPrice}
  onChange={(e) => {
    const v = e.target.value;
if (v === "") {
  setClientProposedPrice("");
  return;
}
    const n = Number(v.replace(",", "."));
    if (Number.isNaN(n)) return;
   setClientProposedPrice(String(n));
  }}
  placeholder="Ex : 5"
  className="w-full rounded-xl border border-gray-200 px-3 py-2"
/>

        {/* ✅ BOUTON FINAL : création commande */}
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