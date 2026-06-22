"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import MissionRoutePreview from "@/components/MissionRoutePreview";
import Link from "next/link";
type Order = {
  id: string;
  sender_name?: string | null;
  sender_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  pickup_address?: string | null;
  pickup_city?: string | null;
  pickup_floor?: string | null;
  pickup_has_elevator?: boolean | null;
  dropoff_address?: string | null;
  dropoff_city?: string | null;
  dropoff_floor?: string | null;
  dropoff_has_elevator?: boolean | null;
  recipient_email?: string | null;
  parcel_type?: string | null;
  parcel_note?: string | null;
  parcel_size?: string | null;
  required_vehicle?: string | null;
  service_zone?: string | null;
  zone_level?: string | null;
  parcel_photo_url?: string | null;
  bag_count?: number | null;
  price_cents?: number | null;
  courier_earnings_cents?: number | null;
  status?: string | null;
  payment_status?: string | null;
  courier_id?: string | null;
};

type CourierProfile = {
  id?: string;
  user_id?: string;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  vehicle_type?: string | null;
  vehicle_label?: string | null;
  city?: string | null;
  service_area?: string | null;
  rating_average?: number | null;
};

function formatEuro(cents?: number | null) {
  return `${((cents ?? 0) / 100).toFixed(2)} €`;
}

function cleanStatus(status?: string | null) {
  return String(status || "").trim().toUpperCase();
}

function cleanAddressDisplay(text?: string | null) {
  return String(text || "")
    .replace(/\b(RDC|DRC|rez-de-chaussée|rez de chaussée)\b/gi, "")
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function elevatorLabel(value?: boolean | null) {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return "-";
}

function profileName(profile: CourierProfile | null) {
  if (!profile) return "Livreur";
  return (
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    "Livreur"
  );
}

export default function MissionsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [courierProfile, setCourierProfile] = useState<CourierProfile | null>(null);
  const [available, setAvailable] = useState<Order[]>([]);
  const [myMissions, setMyMissions] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadCourierProfile(uid: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", uid)
      .maybeSingle();

    if (!error && data) {
      setCourierProfile(data as CourierProfile);
      return;
    }

    setCourierProfile(null);
  }

  async function loadOrders(uid?: string | null, silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    setMsg(null);

    try {
      const currentUserId = uid || userId;

      const { data: availableData, error: availableError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "PUBLISHED")
.eq("payment_status", "PAID")
        .is("courier_id", null)
        .order("created_at", { ascending: false });

      if (availableError) throw availableError;

      let myData: Order[] = [];

      if (currentUserId) {
        const { data, error } = await supabase
          .from("orders")
          .select("*")
          .eq("courier_id", currentUserId)
          .in("status", ["ACCEPTED", "OUT_FOR_DELIVERY"])
          .order("created_at", { ascending: false });

        if (error) throw error;
        myData = (data as Order[]) || [];
      }

      setAvailable(
  ((availableData as Order[]) || []).filter(
    (o) =>
      cleanStatus(o.status) === "PUBLISHED" &&
cleanStatus(o.payment_status) === "PAID"
  )
);

      setMyMissions(myData);
    } catch (error: any) {
      setMsg(error?.message || "Impossible de charger les missions.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    async function init() {
      const { data } = await supabase.auth.getUser();
      const uid = data.user?.id ?? null;

      setUserId(uid);

      if (uid) await loadCourierProfile(uid);
      await loadOrders(uid);
    }

    init();
  }, [supabase]);

  async function acceptMission(orderId: string) {
    if (!userId) {
      setMsg("Tu dois être connecté comme livreur.");
      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        courier_id: userId,
        status: "ACCEPTED",
        accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
.eq("status", "PUBLISHED")
.is("courier_id", null);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("✅ Mission acceptée.");
    await loadOrders(userId, true);

    setTimeout(() => {
      document.getElementById("mes-missions")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 300);
  }

  async function startDelivery(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        status: "OUT_FOR_DELIVERY",
        started_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("courier_id", userId);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("✅ Livraison démarrée.");
    await loadOrders(userId, true);
  }

  async function validateDelivery(order: Order) {
    const input = document.getElementById(
      `otp-${order.id}`
    ) as HTMLInputElement | null;

    const enteredOtp = input?.value.trim();

    if (!enteredOtp || enteredOtp.length !== 4) {
      setMsg("Entre le code OTP à 4 chiffres.");
      return;
    }

    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId: order.id, otp: enteredOtp }),
    });

    const result = await res.json().catch(() => ({}));

    if (!res.ok) {
      setMsg(result?.error || "Code OTP incorrect.");
      return;
    }

    setMsg("✅ Commande livrée.");

    if (input) input.value = "";

    await loadOrders(userId, true);
  }

  async function cancelMission(orderId: string) {
    const { error } = await supabase
      .from("orders")
      .update({
        
        courier_id: null,
        accepted_at: null,
        started_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", orderId)
      .eq("courier_id", userId);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Mission annulée.");
    await loadOrders(userId, true);
  }

  function callPhone(phone?: string | null) {
    if (!phone) return;
    window.location.href = `tel:${phone}`;
  }

  function OrderCard({ order, type }: { order: Order; type: "available" | "mine" }) {
    const status = cleanStatus(order.status);

    return (
      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        {order.parcel_photo_url ? (
          <img
            src={order.parcel_photo_url}
            alt="Photo du colis"
            className="h-48 w-full object-cover"
          />
        ) : null}

        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Mission recommandée</p>
              <div className="text-yellow-400">★★★★★</div>
            </div>

            <div className="rounded-full bg-green-50 px-3 py-2 font-bold text-green-700">
              Gain : {formatEuro(order.courier_earnings_cents)}
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Retrait</p>

              <p className="font-semibold">
                {cleanAddressDisplay(order.pickup_address) || "-"} {order.pickup_city || ""}
              </p>

              <p className="text-sm text-gray-600">
                Expéditeur : {order.sender_name || "-"}
              </p>

              <p className="text-sm text-gray-600">
                Étage retrait : {order.pickup_floor || "-"}
              </p>

              <p className="text-sm text-gray-600">
                Ascenseur retrait : {elevatorLabel(order.pickup_has_elevator)}
              </p>

              {type === "mine" && order.sender_phone ? (
                <button
                  type="button"
                  onClick={() => callPhone(order.sender_phone)}
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium"
                >
                  Appeler expéditeur
                </button>
              ) : null}
            </div>

            <div className="rounded-2xl bg-gray-50 p-3">
              <p className="text-xs font-semibold uppercase text-gray-500">Livraison</p>

              <p className="font-semibold">
                {cleanAddressDisplay(order.dropoff_address) || "-"} {order.dropoff_city || ""}
              </p>

              <p className="text-sm text-gray-600">
                Receveur : {order.receiver_name || "-"}
              </p>

              <p className="text-sm text-gray-600">
                Étage livraison : {order.dropoff_floor || "-"}
              </p>

              <p className="text-sm text-gray-600">
                Ascenseur livraison : {elevatorLabel(order.dropoff_has_elevator)}
              </p>

              {type === "mine" && order.receiver_phone ? (
                <button
                  type="button"
                  onClick={() => callPhone(order.receiver_phone)}
                  className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-medium"
                >
                  Appeler receveur
                </button>
              ) : null}

              {type === "mine" && order.recipient_email ? (
                <p className="mt-2 text-xs text-gray-500">
                  Email OTP : {order.recipient_email}
                </p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Sacs</p>
              <p className="font-semibold">{order.bag_count ?? "-"}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Type colis</p>
              <p className="font-semibold">{order.parcel_type || "-"}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Taille colis</p>
              <p className="font-semibold">{order.parcel_size || "-"}</p>
            </div>

            <div className="rounded-xl bg-gray-50 p-3">
              <p className="text-gray-500">Véhicule requis</p>
              <p className="font-semibold">
                {order.required_vehicle || "Non précisé"}
              </p>
            </div>
          </div>

          {order.parcel_note ? (
            <div className="rounded-2xl bg-yellow-50 p-3 text-sm text-yellow-900">
              {order.parcel_note}
            </div>
          ) : null}

          {order.service_zone || order.zone_level ? (
            <div className="rounded-2xl bg-blue-50 p-3 text-sm text-blue-900">
              Zone : {order.service_zone || "-"} / {order.zone_level || "-"}
            </div>
          ) : null}

          <MissionRoutePreview
            pickupAddress={cleanAddressDisplay(order.pickup_address)}
            pickupCity={order.pickup_city}
            dropoffAddress={cleanAddressDisplay(order.dropoff_address)}
            dropoffCity={order.dropoff_city}
          />

          {type === "available" && (
            <button
              type="button"
              onClick={() => acceptMission(order.id)}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              Accepter cette mission
            </button>
          )}

          {type === "mine" && status === "ACCEPTED" && (
            <button
              type="button"
              onClick={() => startDelivery(order.id)}
              className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              Démarrer la livraison
            </button>
          )}

          {type === "mine" && status === "OUT_FOR_DELIVERY" && (
            <div className="space-y-3">
              <input
                id={`otp-${order.id}`}
                type="tel"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={4}
                onInput={(e) => {
                  const input = e.currentTarget;
                  input.value = input.value.replace(/\D/g, "").slice(0, 4);
                }}
                placeholder="Code OTP à 4 chiffres"
                className="w-full rounded-2xl border px-4 py-3 text-lg tracking-widest"
              />

              <button
                type="button"
                onClick={() => validateDelivery(order)}
                className="w-full rounded-2xl bg-green-600 px-4 py-3 font-semibold text-white"
              >
                Valider la livraison
              </button>
            </div>
          )}

          {type === "mine" && (
            <button
              type="button"
              onClick={() => cancelMission(order.id)}
              className="w-full rounded-2xl px-4 py-3 font-medium text-red-600"
            >
              Annuler la mission
            </button>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow-sm">
          Chargement des missions...
        </div>
      </main>
    );
  }

  const rating = courierProfile?.rating_average || 5;

  const vehicle =
    [
      courierProfile?.vehicle_type?.split("|").filter(Boolean).join(" · "),
      courierProfile?.vehicle_label,
    ]
      .filter(Boolean)
      .join(" · ") || "Véhicule non renseigné";

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-3xl bg-blue-600 p-6 text-white shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-blue-100">
                HelpFlow Livreur
              </p>

              <h1 className="mt-2 text-4xl font-bold">
                Missions disponibles
              </h1>

              <p className="mt-3 text-blue-100">
                Choisissez une mission claire, payée et prête à être prise.
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadOrders(userId, true)}
              disabled={refreshing}
              className="rounded-2xl bg-white px-4 py-3 font-semibold text-blue-700"
            >
              {refreshing ? "..." : "Rafraîchir"}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-4xl font-bold">{available.length}</p>
              <p className="text-blue-100">missions disponibles</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-4xl font-bold">{myMissions.length}</p>
              <p className="text-blue-100">missions en cours</p>
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-white p-4 text-gray-900">
            <div className="flex items-center gap-4">
              {courierProfile?.avatar_url ? (
                <img
                  src={courierProfile.avatar_url}
                  alt="Photo du livreur"
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
                  👤
                </div>
              )}

              <div className="flex-1">
                <p className="font-semibold">{profileName(courierProfile)}</p>
                <p className="text-sm text-gray-600">{vehicle}</p>

                <p className="text-sm text-gray-600">
                  Zone : {courierProfile?.city || "Non renseignée"}
                </p>

             {courierProfile?.phone ? (
  <button
    type="button"
    onClick={() => callPhone(courierProfile.phone)}
    className="mt-2 text-sm font-semibold text-blue-600 underline"
  >
    {courierProfile.phone}
  </button>
) : (
  <p className="mt-2 text-sm text-red-500">
    Téléphone livreur non renseigné
  </p>
)}

<Link
  href="/profile/edit"
  className="mt-3 inline-block rounded-xl bg-blue-600 px-4 py-2 text-white"
>
  Modifier mon profil
</Link>

                                      
              </div>

              <div className="text-right">
                <div className="text-yellow-400">★★★★★</div>
                <p className="text-sm text-gray-500">Note {rating}/5</p>
              </div>
            </div>
          </div>
        </section>

        {msg && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {msg}
          </div>
        )}

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-bold">Missions recommandées</h2>
            <p className="text-gray-500">
              Les étoiles indiquent les missions simples à prendre.
            </p>
          </div>

          {available.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-gray-600">
              <p className="font-semibold">Aucune mission disponible</p>
              <p className="text-sm">
                Revenez dans quelques minutes ou rafraîchissez la page.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {available.map((order) => (
                <OrderCard key={order.id} order={order} type="available" />
              ))}
            </div>
          )}
        </section>

        <section id="mes-missions" className="space-y-4 scroll-mt-6">
          <h2 className="text-2xl font-bold">Mes missions en cours</h2>

          {myMissions.length === 0 ? (
            <div className="rounded-3xl bg-white p-6 text-center text-gray-600">
              Aucune mission en cours
            </div>
          ) : (
            <div className="space-y-4">
              {myMissions.map((order) => (
                <OrderCard key={order.id} order={order} type="mine" />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}