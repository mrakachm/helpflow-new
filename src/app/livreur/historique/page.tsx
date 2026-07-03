"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  created_at: string;
  updated_at: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  courier_earnings_cents: number | null;
};

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export default function HistoriquePage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadHistory() {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("orders")
        .select(
          "id, created_at, updated_at, pickup_city, dropoff_city, courier_earnings_cents"
        )
        .eq("courier_id", userData.user.id)
        .in("status", ["DELIVERED", "delivered", "LIVREE", "LIVRÉE"])
        .order("updated_at", { ascending: false });

      setOrders((data || []) as Order[]);
      setLoading(false);
    }

    loadHistory();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Historique de mes livraisons
        </h1>

        <p className="text-gray-500 mb-6">
          Retrouvez ici toutes vos missions terminées.
        </p>

        {loading ? (
          <div className="bg-white rounded-3xl shadow p-6 text-center">
            Chargement...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl shadow p-6 text-center">
            Aucune livraison terminée pour le moment.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-3xl shadow p-5 flex justify-between"
              >
                <div>
                  <p className="font-bold">
                    Mission terminée
                  </p>

                  <p className="text-gray-500">
                    {order.pickup_city || "Départ"} →{" "}
                    {order.dropoff_city || "Arrivée"}
                  </p>

                  <p className="text-sm text-gray-400">
                    {new Date(
                      order.updated_at || order.created_at
                    ).toLocaleString("fr-FR")}
                  </p>
                </div>

                <p className="font-bold text-green-700">
                  +{formatEuro(order.courier_earnings_cents || 0)}
                </p>

              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}