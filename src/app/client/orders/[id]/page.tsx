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
  parcel_type?: string | null;
  parcel_note?: string | null;
  parcel_photo_url?: string | null;
  vehicle_required?: string | null;
  parcel_size?: string | null;
  scheduled_at?: string | null;
};

function formatEURFromCents(cents?: number | null) {
  if (cents == null) return "--";
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

function statusLabel(status?: string | null) {
  const s = (status || "").toLowerCase();

  if (s === "published") return "📢 Publiée";
  if (s === "pending" || s === "en_attente") return "⏳ En attente";
  if (s === "accepted" || s === "en_cours") return "🚚 En cours";
  if (
    s === "out_for_delivery" ||
    s === "livraison" ||
    s === "livraison_en_cours"
  )
    return "🚚 Livraison en cours";

  if (s === "delivered" || s === "livre" || s === "livré" || s === "livrée")
    return "✅ Livrée";

  if (s === "draft" || s === "brouillon") return "📝 Brouillon";
  if (s === "canceled" || s === "cancelled" || s === "annulee" || s === "annulée")
    return "❌ Annulée";

  return status || "--";
}

function paymentLabel(payment?: string | null) {
  const p = (payment || "").toLowerCase();

  if (p === "paid" || p === "payé" || p === "paye") return "Confirmé";
  if (p === "unpaid" || p === "non payé" || p === "non_paye") return "Non payé";

  return payment || "--";
}

function yesNo(value?: boolean | null) {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  return "--";
}

export default function ClientOrderDetailPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();
  const params = useParams();

  const orderId = String(params?.id || "");

  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOrder(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

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

      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .eq("client_id", user.id)
        .single();

      if (error) {
        console.error("LOAD CLIENT ORDER DETAIL ERROR =>", error);
        setError("Impossible de charger le détail de cette commande.");
        return;
      }

      setOrder(data as OrderRow);
    } catch (err) {
      console.error("LOAD CLIENT ORDER DETAIL UNCAUGHT ERROR =>", err);
      setError("Erreur serveur pendant le chargement.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    if (orderId) loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  const verificationCode = order?.delivery_otp || order?.otp_code || null;

  return (
    <main className="p-4 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => router.push("/client/orders")}
            className="text-sm text-blue-600 font-semibold mb-2"
          >
            ← Retour à mes commandes
          </button>

          <h1 className="text-2xl font-bold">Détail de la commande</h1>
        </div>

        <button
          type="button"
          onClick={() => loadOrder(true)}
          disabled={loading || refreshing}
          className="px-3 py-2 rounded border"
        >
          {refreshing ? "Actualisation..." : "Rafraîchir"}
        </button>
      </div>

      {error && (
        <div className="p-3 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      {loading && <p>Chargement...</p>}

      {!loading && !order && !error && <p>Commande introuvable.</p>}

      {!loading && order && (
        <section className="border rounded-2xl bg-white p-4 space-y-4">
          <div>
            <div className="text-sm text-gray-500">ID commande</div>
            <div className="font-semibold break-all">{order.id}</div>
          </div>

          <div className="p-3 rounded-xl border space-y-2">
            <div>
              <strong>Statut :</strong> {statusLabel(order.status)}
            </div>

            <div>
              <strong>Paiement :</strong> {paymentLabel(order.payment_status)}
            </div>

            <div>
              <strong>Prix :</strong> {formatEURFromCents(order.price_cents)}
            </div>

            {order.created_at && (
              <div>
                <strong>Créée le :</strong>{" "}
                {new Date(order.created_at).toLocaleString("fr-FR")}
              </div>
            )}

            {order.scheduled_at && (
              <div>
                <strong>Date souhaitée :</strong>{" "}
                {new Date(order.scheduled_at).toLocaleString("fr-FR")}
              </div>
            )}
          </div>

          <div className="p-3 rounded-xl border space-y-2">
            <h2 className="font-bold">Adresses</h2>

            <div>
              <strong>Départ :</strong> {order.pickup_address || "--"}
              {order.pickup_city ? `, ${order.pickup_city}` : ""}
              {order.pickup_zip ? ` (${order.pickup_zip})` : ""}
            </div>

            <div>
              <strong>Étage retrait :</strong> {order.pickup_floor || "--"}
            </div>

            <div>
              <strong>Ascenseur retrait :</strong>{" "}
              {yesNo(order.pickup_has_elevator)}
            </div>

            <div>
              <strong>Arrivée :</strong> {order.dropoff_address || "--"}
              {order.dropoff_city ? `, ${order.dropoff_city}` : ""}
              {order.dropoff_zip ? ` (${order.dropoff_zip})` : ""}
            </div>

            <div>
              <strong>Étage livraison :</strong> {order.dropoff_floor || "--"}
            </div>

            <div>
              <strong>Ascenseur livraison :</strong>{" "}
              {yesNo(order.dropoff_has_elevator)}
            </div>
          </div>

          <div className="p-3 rounded-xl border space-y-2">
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
              <strong>Taille du colis :</strong> {order.parcel_size || "--"}
            </div>

            <div>
              <strong>Type de colis :</strong> {order.parcel_type || "--"}
            </div>

            <div>
              <strong>Description :</strong> {order.parcel_note || "--"}
            </div>

            {order.parcel_photo_url && (
              <div className="mt-3">
                <div className="font-semibold mb-2">Photo du colis :</div>
                <img
                  src={order.parcel_photo_url}
                  alt="Photo du colis"
                  className="w-full max-h-80 object-cover rounded-2xl border"
                />
              </div>
            )}
          </div>

          {verificationCode && !order.delivered_at && (
            <div className="mt-4 p-3 rounded-xl border bg-gray-50">
              <div className="font-semibold">Code de vérification :</div>
              <div className="text-3xl font-bold tracking-widest">
                {verificationCode}
              </div>
              <p className="text-sm text-gray-600">
                Communique ce code au livreur uniquement lorsque la livraison est
                effectuée.
              </p>
            </div>
          )}

          {order.delivered_at && (
            <div className="mt-4 p-3 rounded-xl bg-green-100 text-green-700">
              ✅ Commande livrée le{" "}
              {new Date(order.delivered_at).toLocaleString("fr-FR")}
            </div>
          )}
        </section>
      )}
    </main>
  );
}