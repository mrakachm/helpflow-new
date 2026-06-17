"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  created_at?: string | null;
  sender_name?: string | null;
  sender_phone?: string | null;
  receiver_name?: string | null;
  receiver_phone?: string | null;
  recipient_email?: string | null;
  pickup_address?: string | null;
  pickup_city?: string | null;
  dropoff_address?: string | null;
  dropoff_city?: string | null;
  bag_count?: number | null;
  distance_km?: number | null;
  price_cents?: number | null;
  platform_fee_cents?: number | null;
  courier_earnings_cents?: number | null;
  status?: string | null;
  payment_status?: string | null;
  otp_code?: string | null;
  parcel_type?: string | null;
  parcel_note?: string | null;
  parcel_photo_url?: string | null;
  required_vehicle?: string | null;
  parcel_size?: string | null;
  service_zone?: string | null;
  zone_level?: string | null;
  courier_id?: string | null;
  courier_offer_price_cents?: number | null;
  courier_offer_status?: string | null;
  courier_offer_by?: string | null;
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
};

function formatEuro(cents?: number | null) {
  return `${((cents ?? 0) / 100).toFixed(2)} €`;
}

function cleanStatus(status?: string | null) {
  return String(status || "").trim().toUpperCase();
}

function statusLabel(status?: string | null) {
  const s = cleanStatus(status);

  if (s === "PENDING") return "Payée · en attente d’un livreur";
  if (s === "ACCEPTED") return "Livreur accepté";
  if (s === "OUT_FOR_DELIVERY") return "Livraison en cours";
  if (s === "DELIVERED") return "Livrée";
  if (s === "CANCELLED") return "Annulée";

  return status || "En attente";
}

function formatAddress(address?: string | null, city?: string | null) {
  return [address, city].filter(Boolean).join(", ") || "-";
}

export default function ClientOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const orderId = String(params?.id || "");

  const [order, setOrder] = useState<Order | null>(null);
  const [courier, setCourier] = useState<CourierProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function loadOrder() {
    if (!orderId) return;

    setLoading(true);
    setMsg(null);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error) {
      setMsg(error.message || "Impossible de charger la commande.");
      setLoading(false);
      return;
    }

    setOrder(data as Order);

    if (data?.courier_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.courier_id)
        .maybeSingle();

      setCourier((profile as CourierProfile) || null);
    } else {
      setCourier(null);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function acceptCourierOffer() {
    if (!order) return;

    if (!order.courier_offer_price_cents || !order.courier_offer_by) {
      setMsg("Offre livreur invalide.");
      return;
    }

    const finalPriceCents = order.courier_offer_price_cents;
    const platformFeeCents = Math.round(finalPriceCents * 0.2);
    const courierEarningsCents = Math.max(0, finalPriceCents - platformFeeCents);

    setActionLoading(true);
    setMsg(null);

    const { error } = await supabase
      .from("orders")
      .update({
        price_cents: finalPriceCents,
        platform_fee_cents: platformFeeCents,
        courier_earnings_cents: courierEarningsCents,
        courier_offer_status: "accepted",
        courier_id: order.courier_offer_by,
        status: "ACCEPTED",
        accepted_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("courier_offer_status", "pending");

    setActionLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("✅ Offre acceptée. La commande est attribuée au livreur.");
    await loadOrder();
  }

  async function refuseCourierOffer() {
    if (!order) return;

    setActionLoading(true);
    setMsg(null);

    const { error } = await supabase
      .from("orders")
      .update({
        courier_offer_status: "refused",
        courier_offer_price_cents: null,
        courier_offer_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("courier_offer_status", "pending");

    setActionLoading(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    setMsg("Offre refusée. La commande reste disponible au prix initial.");
    await loadOrder();
  }

  const courierName =
    courier?.full_name ||
    [courier?.first_name, courier?.last_name].filter(Boolean).join(" ") ||
    "Livreur";

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-5">
          Chargement de la commande...
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-6">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-5">
          <p className="font-semibold">Commande introuvable.</p>
          {msg ? <p className="mt-2 text-sm text-red-600">{msg}</p> : null}
          <button
            onClick={() => router.push("/client/orders")}
            className="mt-4 rounded-xl bg-black px-4 py-2 text-white"
          >
            Retour aux commandes
          </button>
        </div>
      </main>
    );
  }

  const status = cleanStatus(order.status);
  const hasPendingCourierOffer =
    order.courier_offer_status === "pending" &&
    order.courier_offer_price_cents != null &&
    order.courier_offer_by;

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-5">
          <button
            onClick={() => router.push("/client/orders")}
            className="mb-4 rounded-xl border px-4 py-2 text-sm"
          >
            ← Retour
          </button>

          <h1 className="text-3xl font-bold">Détail commande</h1>
          <p className="mt-2 break-all text-sm text-gray-500">ID : {order.id}</p>
        </div>

        {msg ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {msg}
          </div>
        ) : null}

        <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="space-y-3 text-base">
            <p>
              <strong>Statut :</strong> {statusLabel(order.status)}
            </p>

            <p>
              <strong>Paiement :</strong>{" "}
              {order.payment_status === "PAID" ? "Confirmé" : order.payment_status || "-"}
            </p>

            <p>
              <strong>Départ :</strong>{" "}
              {formatAddress(order.pickup_address, order.pickup_city)}
            </p>

            <p>
              <strong>Arrivée :</strong>{" "}
              {formatAddress(order.dropoff_address, order.dropoff_city)}
            </p>

            <p>
              <strong>Distance :</strong>{" "}
              {order.distance_km ? `${order.distance_km} km` : "- km"}
            </p>

            <p>
              <strong>Sacs :</strong> {order.bag_count ?? "-"}
            </p>

            <p>
              <strong>Type colis :</strong> {order.parcel_type || "-"}
            </p>

            <p>
              <strong>Taille colis :</strong> {order.parcel_size || "-"}
            </p>

            <p>
              <strong>Véhicule requis :</strong> {order.required_vehicle || "-"}
            </p>

            <p>
              <strong>Zone :</strong>{" "}
              {[order.service_zone, order.zone_level].filter(Boolean).join(" · ") || "-"}
            </p>

            <p>
              <strong>Prix :</strong> {formatEuro(order.price_cents)}
            </p>

            <p>
              <strong>Commission HelpFlow :</strong>{" "}
              {formatEuro(order.platform_fee_cents)}
            </p>

            <p>
              <strong>Gain livreur :</strong>{" "}
              {formatEuro(order.courier_earnings_cents)}
            </p>
          </div>

          {hasPendingCourierOffer ? (
            <div className="mt-5 rounded-2xl border border-orange-200 bg-orange-50 p-4">
              <p className="font-semibold text-orange-900">
                Proposition d’un livreur
              </p>

              <p className="mt-2 text-sm text-orange-900">
                Un livreur propose de faire cette livraison pour :
              </p>

              <p className="mt-3 text-2xl font-bold text-orange-900">
                {formatEuro(order.courier_offer_price_cents)}
              </p>

              <p className="mt-2 text-sm text-orange-800">
                Prix actuel : {formatEuro(order.price_cents)}
              </p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={acceptCourierOffer}
                  className="rounded-xl bg-green-600 px-3 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Accepter
                </button>

                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={refuseCourierOffer}
                  className="rounded-xl border border-red-200 bg-white px-3 py-3 text-sm font-semibold text-red-600 disabled:opacity-60"
                >
                  Refuser
                </button>
              </div>

              <p className="mt-3 text-xs text-orange-800">
                Si tu refuses, la commande reste disponible au prix initial.
              </p>
            </div>
          ) : null}

          {order.parcel_note ? (
            <div className="mt-5 rounded-2xl bg-gray-50 p-4">
              <p className="font-semibold">Note colis</p>
              <p className="mt-1 text-sm text-gray-700">{order.parcel_note}</p>
            </div>
          ) : null}

          {order.parcel_photo_url ? (
            <div className="mt-5">
              <p className="mb-2 font-semibold">Photo du colis</p>
              <img
                src={order.parcel_photo_url}
                alt="Photo du colis"
                className="max-h-72 w-full rounded-2xl object-cover"
              />
            </div>
          ) : null}

          <div className="mt-5 rounded-2xl bg-gray-50 p-4">
            <p className="font-semibold">Code OTP de livraison :</p>
            <p className="mt-3 text-4xl font-bold tracking-[0.25em]">
              {order.otp_code || "------"}
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Donne ce code uniquement au livreur quand tu reçois bien la commande.
            </p>
          </div>
        </section>

        <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-5">
          <h2 className="text-xl font-bold">Contacts</h2>

          <div className="mt-4 space-y-4">
            <div>
              <p className="font-semibold">Expéditeur</p>
              <p>{order.sender_name || "-"}</p>
              {order.sender_phone ? (
                <a
                  href={`tel:${order.sender_phone}`}
                  className="text-blue-600 underline"
                >
                  Appeler : {order.sender_phone}
                </a>
              ) : (
                <p className="text-gray-500">Téléphone non renseigné</p>
              )}
            </div>

            <div>
              <p className="font-semibold">Receveur</p>
              <p>{order.receiver_name || "-"}</p>
              {order.receiver_phone ? (
                <a
                  href={`tel:${order.receiver_phone}`}
                  className="text-blue-600 underline"
                >
                  Appeler : {order.receiver_phone}
                </a>
              ) : (
                <p className="text-gray-500">Téléphone non renseigné</p>
              )}
              {order.recipient_email ? (
                <p className="text-sm text-gray-600">{order.recipient_email}</p>
              ) : null}
            </div>
          </div>
        </section>

        {order.courier_id ? (
          <section className="mt-5 rounded-3xl border border-gray-200 bg-white p-5">
            <h2 className="text-xl font-bold">Livreur</h2>

            <div className="mt-4 flex items-center gap-4">
              {courier?.avatar_url ? (
                <img
                  src={courier.avatar_url}
                  alt="Photo livreur"
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-100">
                  🚚
                </div>
              )}

              <div>
                <p className="font-semibold">{courierName}</p>
                <p className="text-sm text-gray-600">
                  {[courier?.vehicle_type, courier?.vehicle_label]
                    .filter(Boolean)
                    .join(" · ") || "Véhicule non renseigné"}
                </p>

                {courier?.phone ? (
                  <a
                    href={`tel:${courier.phone}`}
                    className="text-sm text-blue-600 underline"
                  >
                    Appeler le livreur : {courier.phone}
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}

        {status === "DELIVERED" ? (
          <section className="mt-5 rounded-3xl border border-green-200 bg-green-50 p-5">
            <p className="text-lg font-semibold text-green-700">
              ✅ Commande livrée.
            </p>
          </section>
        ) : null}
      </div>
    </main>
  );
}