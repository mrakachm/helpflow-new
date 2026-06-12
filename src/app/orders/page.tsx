"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  distance_km: number | null;
  weight_kg: number | null;
  bag_count: number | null;
  price_cents: number | null;
  platform_fee_cents?: number | null;
  status: string | null;
  payment_status: string | null;
  delivery_otp: string | null;
  delivered_at: string | null;
  created_at: string | null;
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

  if (s === "pending" || s === "en_attente") return "⏳ En attente";
  if (s === "accepted" || s === "en_cours") return "🚚 En cours";
  if (
    s === "out_for_delivery" ||
    s === "livraison" ||
    s === "livraison_en_cours"
  )
    return "🚚 Livraison en cours";

  if (
    s === "delivered" ||
    s === "livre" ||
    s === "livré" ||
    s === "livrée"
  )
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

export default function ClientOrdersPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders(silent = false) {
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
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("LOAD CLIENT ORDERS ERROR =>", error);
        setError("Impossible de charger vos commandes.");
        return;
      }

      const rows = (data || []) as OrderRow[];
      setOrders(rows);

      if (selected) {
        const freshSelected = rows.find((o) => o.id === selected.id) || null;
        setSelected(freshSelected);
      } else {
        setSelected(rows[0] || null);
      }
    } catch (err) {
      console.error("LOAD CLIENT ORDERS UNCAUGHT ERROR =>", err);
      setError("Erreur serveur pendant le chargement.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="p-4 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Mes commandes</h1>

        <button
          type="button"
          onClick={() => loadOrders(true)}
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

      {!loading && orders.length === 0 && <p>Aucune commande trouvée.</p>}

      {!loading && orders.length > 0 && (
        <div className="grid md:grid-cols-2 gap-4">
          <section className="space-y-3">
            {orders.map((o) => {
              const isSelected = selected?.id === o.id;

              return (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => setSelected(o)}
                  className={`w-full text-left border rounded p-3 ${
                    isSelected ? "bg-blue-50 border-blue-500" : ""
                  }`}
                >
                  <div className="font-semibold">
                    Statut :{" "}
                    <span className="uppercase">{statusLabel(o.status)}</span>
                  </div>

                  <div className="text-sm text-gray-600">
                    Paiement : {paymentLabel(o.payment_status)}
                  </div>

                  <div className="text-sm text-gray-600">
                    Prix : {formatEURFromCents(o.price_cents)}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    ID : {o.id}
                  </div>
                </button>
              );
            })}
          </section>

          {selected && (
            <section className="border rounded p-4 space-y-4">
              <h2 className="text-xl font-bold">Détail commande</h2>

              <div>ID : {selected.id}</div>

              <div className="p-3 rounded border space-y-2">
                <div>
                  <strong>Statut :</strong> {statusLabel(selected.status)}
                </div>

                <div>
                  <strong>Paiement :</strong>{" "}
                  {paymentLabel(selected.payment_status)}
                </div>

                <div>
                  <strong>Départ :</strong>{" "}
                  {selected.pickup_address || "--"}
                  {selected.pickup_city ? `, ${selected.pickup_city}` : ""}
                  {selected.pickup_zip ? ` (${selected.pickup_zip})` : ""}
                </div>

                <div>
                  <strong>Arrivée :</strong>{" "}
                  {selected.dropoff_address || "--"}
                  {selected.dropoff_city ? `, ${selected.dropoff_city}` : ""}
                  {selected.dropoff_zip ? ` (${selected.dropoff_zip})` : ""}
                </div>

                <div>
                  <strong>Distance :</strong>{" "}
                  {selected.distance_km != null
                    ? `${selected.distance_km} km`
                    : "--"}
                </div>

                <div>
                  <strong>Sacs :</strong> {selected.bag_count ?? "--"}
                </div>

                <div>
                  <strong>Poids :</strong>{" "}
                  {selected.weight_kg != null ? `${selected.weight_kg} kg` : "--"}
                </div>

                <div>
                  <strong>Prix :</strong>{" "}
                  {formatEURFromCents(selected.price_cents)}
                </div>


                {selected.delivery_otp && !selected.delivered_at && (
                  <div className="mt-4 p-3 rounded border bg-gray-50">
                    <div className="font-semibold">Code OTP de livraison :</div>
                    <div className="text-3xl font-bold tracking-widest">
                      {selected.delivery_otp}
                    </div>
                    <p className="text-sm text-gray-600">
                      Donne ce code uniquement au livreur quand tu reçois bien la
                      commande.
                    </p>
                  </div>
                )}

                {selected.delivered_at && (
                  <div className="mt-4 p-3 rounded bg-green-100 text-green-700">
                    ✅ Commande livrée le{" "}
                    {new Date(selected.delivered_at).toLocaleString("fr-FR")}
                  </div>
                )}
              </div>
            </section>
          )}
        </div>
      )}
    </main>
  );
}