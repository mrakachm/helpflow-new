"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "../../../lib/supabase/client";

type OrderRow = {
  id: string;
  created_at: string;
  status: string | null;

  pickup_address: string | null;
  dropoff_address: string | null;

  pickup_city: string | null;
  dropoff_city: string | null;

  pickup_zip: string | null;
  dropoff_zip: string | null;

  distance_km: number | null;
  bag_count: number | null;
  weight_kg: number | null;

  price_cents: number | null;
  platform_fee_cents: number | null;
};

function formatMoney(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatLine(address?: string | null, zip?: string | null, city?: string | null) {
  const parts = [address, zip, city].filter((v) => v && String(v).trim().length > 0);
  return parts.join(", ");
}

export default function OrdersPage() {
const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  async function loadOrders() {
    setLoading(true);
    setError(null);

    try {
      // 1) Vérifier session
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      const userId = userData?.user?.id;
      if (!userId) {
        setError("Tu dois être connecté");
        setOrders([]);
        return;
      }

      // 2) Charger commandes
      const { data: ordersData, error: selErr } = await supabase
        .from("orders")
        .select(
          `
          id,
          created_at,
          status,
          pickup_address,
          dropoff_address,
          pickup_city,
          dropoff_city,
          pickup_zip,
          dropoff_zip,
          distance_km,
          bag_count,
          weight_kg,
          price_cents,
          platform_fee_cents
        `
        )
        .eq("client_id", userId)
        .order("created_at", { ascending: false });

      if (selErr) throw selErr;

      // ✅ LIGNE DEMANDÉE (la dernière ligne, suite d'orders)
      setOrders(ordersData ?? []);
    } catch (e: any) {
      setError(e?.message || "Erreur inconnue");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Mes commandes</h1>

        <button
          onClick={loadOrders}
          className="border px-3 py-2 rounded"
          disabled={loading}
        >
          {loading ? "Chargement..." : "Rafraîchir"}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-800">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="p-3 rounded border bg-white">
          Aucune commande pour le moment.
        </div>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const price = formatMoney(o.price_cents);
          const fee = formatMoney(o.platform_fee_cents);

          const pickup = formatLine(o.pickup_address, o.pickup_zip, o.pickup_city);
          const dropoff = formatLine(o.dropoff_address, o.dropoff_zip, o.dropoff_city);

          return (
            <div key={o.id} className="border rounded p-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold">
                    Statut : <span className="uppercase">{o.status ?? "—"}</span>
                  </p>
                  <p className="text-xs text-gray-600">
                    {new Date(o.created_at).toLocaleString()}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">{price} €</p>
                  <p className="text-xs text-gray-600">Frais plateforme : {fee} €</p>
                </div>
              </div>

              <div className="mt-3 text-sm">
                <p>
                  <span className="font-semibold">Départ :</span>{" "}
                  {pickup || "—"}
                </p>
                <p>
                  <span className="font-semibold">Arrivée :</span>{" "}
                  {dropoff || "—"}
                </p>
              </div>

              <div className="mt-3 text-xs text-gray-600 flex gap-4 flex-wrap">
                <span>Distance : {o.distance_km ?? "—"} km</span>
                <span>Sacs : {o.bag_count ?? "—"}</span>
                <span>Poids : {o.weight_kg ?? "—"} kg</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
