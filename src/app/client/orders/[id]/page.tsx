"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  client_id?: string | null;

  pickup_address: string | null;
  dropoff_address: string | null;

  pickup_city?: string | null;
  dropoff_city?: string | null;

  pickup_zip?: string | null;
  dropoff_zip?: string | null;

  pickup_floor?: string | null;
  dropoff_floor?: string | null;

  pickup_has_elevator?: boolean | null;
  dropoff_has_elevator?: boolean | null;

  bag_count: number | null;
  price_cents: number | null;
  courier_earnings_cents?: number | null;

  status: string | null;
  payment_status: string | null;

  delivery_otp?: string | null;
  otp_code?: string | null;

  delivered_at: string | null;
  created_at: string | null;
  scheduled_at?: string | null;

  parcel_type?: string | null;
  parcel_note?: string | null;
  parcel_photo_url?: string | null;

  vehicle_required?: string | null;
  parcel_size?: string | null;
};

function formatEURFromCents(cents?: number | null) {
  if (cents == null) return "--";

  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

function cleanValue(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function statusLabel(status?: string | null) {
  const s = cleanValue(status);

  if (s === "payment_pending") {
    return "💳 Paiement en attente";
  }

  if (s === "published") {
    return "📢 Publiée";
  }

  if (s === "pending" || s === "en_attente") {
    return "⏳ En attente";
  }

  if (s === "accepted" || s === "en_cours") {
    return "🚚 Livreur accepté";
  }

  if (
    s === "out_for_delivery" ||
    s === "livraison" ||
    s === "livraison_en_cours"
  ) {
    return "🚚 Livraison en cours";
  }

  if (
    s === "delivered" ||
    s === "livre" ||
    s === "livré" ||
    s === "livrée"
  ) {
    return "✅ Livrée";
  }

  if (s === "draft" || s === "brouillon") {
    return "📝 Brouillon";
  }

  if (
    s === "canceled" ||
    s === "cancelled" ||
    s === "annulee" ||
    s === "annulée"
  ) {
    return "❌ Annulée";
  }

  if (s === "refused_by_recipient") {
    return "📦 Refusée par le receveur";
  }

  if (s === "return_payment_pending") {
    return "💳 Paiement du retour en attente";
  }

  if (s === "return_to_sender") {
    return "↩️ Retour à l’expéditeur";
  }

  return status || "--";
}

function paymentLabel(payment?: string | null) {
  const p = cleanValue(payment);

  if (p === "paid" || p === "payé" || p === "paye") {
    return "✅ Confirmé";
  }

  if (p === "pending") {
    return "⏳ En attente";
  }

  if (
    p === "unpaid" ||
    p === "non payé" ||
    p === "non_paye" ||
    p === "failed"
  ) {
    return "❌ Non payé";
  }

  return payment || "--";
}

function yesNo(value?: boolean | null) {
  if (value === true) return "Oui";
  if (value === false) return "Non";

  return "--";
}

export default function ClientOrderDetailPage() {
  const supabase = useMemo(
    () => createBrowserSupabaseClient(),
    []
  );

  const router = useRouter();
  const params = useParams();

  const orderId = String(params?.id || "").trim();

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(
    null
  );

  async function loadOrder(silent = false) {
    if (!orderId) return;

    if (!silent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error: orderError } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("client_id", user.id)
        .single();

      if (orderError) {
        console.error(
          "LOAD CLIENT ORDER DETAIL ERROR =>",
          orderError
        );

        setError(
          "Impossible de charger le détail de cette commande."
        );

        return;
      }

      setOrder(data as OrderRow);
    } catch (loadError) {
      console.error(
        "LOAD CLIENT ORDER DETAIL UNCAUGHT ERROR =>",
        loadError
      );

      setError("Erreur serveur pendant le chargement.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function resumePayment() {
    if (!order?.id || paymentLoading) return;

    setPaymentLoading(true);
    setPaymentError(null);

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Impossible de reprendre le paiement."
        );
      }

      const checkoutUrl = String(result?.url || "").trim();

      if (!checkoutUrl) {
        throw new Error(
          "Stripe n’a pas retourné de lien de paiement."
        );
      }

      window.location.href = checkoutUrl;
    } catch (resumeError) {
      console.error(
        "RESUME PAYMENT ERROR =>",
        resumeError
      );

      const message =
        resumeError instanceof Error
          ? resumeError.message
          : "Erreur pendant la reprise du paiement.";

      setPaymentError(message);
      setPaymentLoading(false);
    }
  }

  useEffect(() => {
    if (orderId) {
      loadOrder();
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const normalizedStatus = cleanValue(order?.status);
  const normalizedPaymentStatus = cleanValue(
    order?.payment_status
  );

  const paymentConfirmed =
    normalizedPaymentStatus === "paid" ||
    normalizedPaymentStatus === "payé" ||
    normalizedPaymentStatus === "paye";

  const paymentPending =
    normalizedStatus === "payment_pending" ||
    normalizedPaymentStatus === "pending" ||
    normalizedPaymentStatus === "unpaid" ||
    normalizedPaymentStatus === "failed";

  const verificationCode =
    order?.delivery_otp || order?.otp_code || null;

  return (
    <main className="max-w-3xl mx-auto p-4 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            type="button"
            onClick={() => router.push("/client/orders")}
            className="mb-2 text-sm font-semibold text-blue-600"
          >
            ← Retour à mes commandes
          </button>

          <h1 className="text-2xl font-bold">
            Détail de la commande
          </h1>
        </div>

        <button
          type="button"
          onClick={() => loadOrder(true)}
          disabled={loading || refreshing}
          className="rounded-xl border px-3 py-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {refreshing ? "Actualisation..." : "Rafraîchir"}
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-100 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && <p>Chargement...</p>}

      {!loading && !order && !error && (
        <p>Commande introuvable.</p>
      )}

      {!loading && order && (
        <section className="space-y-4 rounded-2xl border bg-white p-4">
          <div>
            <div className="text-sm text-gray-500">
              ID commande
            </div>

            <div className="break-all font-semibold">
              {order.id}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border p-3">
            <div>
              <strong>Statut :</strong>{" "}
              {statusLabel(order.status)}
            </div>

            <div>
              <strong>Paiement :</strong>{" "}
              {paymentLabel(order.payment_status)}
            </div>

            <div>
              <strong>Prix :</strong>{" "}
              {formatEURFromCents(order.price_cents)}
            </div>

            {order.created_at && (
              <div>
                <strong>Créée le :</strong>{" "}
                {new Date(order.created_at).toLocaleString(
                  "fr-FR"
                )}
              </div>
            )}

            {order.scheduled_at && (
              <div>
                <strong>Date souhaitée :</strong>{" "}
                {new Date(order.scheduled_at).toLocaleString(
                  "fr-FR"
                )}
              </div>
            )}
          </div>

          {paymentPending && !paymentConfirmed && (
            <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div>
                <h2 className="font-bold text-amber-900">
                  Paiement non terminé
                </h2>

                <p className="mt-1 text-sm text-amber-800">
                  Cette commande est enregistrée, mais elle ne sera
                  publiée aux livreurs qu’après la confirmation du
                  paiement.
                </p>
              </div>

              {paymentError && (
                <div className="rounded-xl bg-red-100 p-3 text-sm text-red-700">
                  {paymentError}
                </div>
              )}

              <button
                type="button"
                onClick={resumePayment}
                disabled={paymentLoading}
                className="w-full rounded-xl bg-blue-600 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {paymentLoading
                  ? "Redirection vers Stripe..."
                  : `Reprendre le paiement — ${formatEURFromCents(
                      order.price_cents
                    )}`}
              </button>
            </div>
          )}

          <div className="space-y-2 rounded-xl border p-3">
            <h2 className="font-bold">Adresses</h2>

            <div>
              <strong>Départ :</strong>{" "}
              {order.pickup_address || "--"}
              {order.pickup_city
                ? `, ${order.pickup_city}`
                : ""}
              {order.pickup_zip
                ? ` (${order.pickup_zip})`
                : ""}
            </div>

            <div>
              <strong>Étage retrait :</strong>{" "}
              {order.pickup_floor || "--"}
            </div>

            <div>
              <strong>Ascenseur retrait :</strong>{" "}
              {yesNo(order.pickup_has_elevator)}
            </div>

            <div>
              <strong>Arrivée :</strong>{" "}
              {order.dropoff_address || "--"}
              {order.dropoff_city
                ? `, ${order.dropoff_city}`
                : ""}
              {order.dropoff_zip
                ? ` (${order.dropoff_zip})`
                : ""}
            </div>

            <div>
              <strong>Étage livraison :</strong>{" "}
              {order.dropoff_floor || "--"}
            </div>

            <div>
              <strong>Ascenseur livraison :</strong>{" "}
              {yesNo(order.dropoff_has_elevator)}
            </div>
          </div>

          <div className="space-y-2 rounded-xl border p-3">
            <h2 className="font-bold">Colis</h2>

            <div>
              <strong>Nombre de sacs / colis :</strong>{" "}
              {order.bag_count ?? "--"}
            </div>

            <div>
              <strong>Véhicule requis :</strong>{" "}
              {order.vehicle_required || "--"}
            </div>

            <div>
              <strong>Taille du colis :</strong>{" "}
              {order.parcel_size || "--"}
            </div>

            <div>
              <strong>Type de colis :</strong>{" "}
              {order.parcel_type || "--"}
            </div>

            <div>
              <strong>Description :</strong>{" "}
              {order.parcel_note || "--"}
            </div>

            {order.parcel_photo_url && (
              <div className="mt-3">
                <div className="mb-2 font-semibold">
                  Photo du colis :
                </div>

                <img
                  src={order.parcel_photo_url}
                  alt="Photo du colis"
                  className="max-h-80 w-full rounded-2xl border object-cover"
                />
              </div>
            )}
          </div>

          {paymentConfirmed &&
            verificationCode &&
            !order.delivered_at && (
              <div className="mt-4 rounded-xl border bg-gray-50 p-3">
                <div className="font-semibold">
                  Code PIN de livraison :
                </div>

                <div className="text-3xl font-bold tracking-widest">
                  {verificationCode}
                </div>

                <p className="text-sm text-gray-600">
                  Communique ce code au livreur uniquement lorsque
                  la livraison est bien effectuée.
                </p>
              </div>
            )}

          {order.delivered_at && (
            <div className="mt-4 rounded-xl bg-green-100 p-3 text-green-700">
              ✅ Commande livrée le{" "}
              {new Date(order.delivered_at).toLocaleString(
                "fr-FR"
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}