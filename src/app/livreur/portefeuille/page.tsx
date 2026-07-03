"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  created_at: string;
  updated_at: string | null;
  status: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  courier_earnings_cents: number | null;
};

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export default function LivreurPortefeuillePage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadWallet() {
      setLoading(true);
      setError(null);

      try {
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError) throw userError;
        if (!userData.user) {
          setError("Tu dois être connecté comme livreur.");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select(
            "id, created_at, updated_at, status, pickup_city, dropoff_city, courier_earnings_cents"
          )
          .eq("courier_id", userData.user.id)
          .in("status", ["DELIVERED", "delivered", "LIVREE", "LIVRÉE"])
          .order("updated_at", { ascending: false });

        if (error) throw error;

        setOrders((data || []) as Order[]);
      } catch (e: any) {
        setError(e?.message || "Impossible de charger le portefeuille.");
      } finally {
        setLoading(false);
      }
    }

    loadWallet();
  }, [supabase]);

  const totalCents = orders.reduce(
    (sum, order) => sum + (order.courier_earnings_cents || 0),
    0
  );

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Mon portefeuille
            </h1>
            <p className="text-sm text-gray-500">
              Ici, tu vois uniquement ce que tu as réellement gagné.
            </p>
          </div>

          <Link
            href="/livreur/missions"
            className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold"
          >
            Missions
          </Link>
        </div>

        <section className="rounded-3xl bg-green-600 p-6 text-white shadow-lg">
          <p className="text-sm text-green-100">Solde disponible</p>
          <p className="mt-2 text-5xl font-bold">{formatEuro(totalCents)}</p>
          <p className="mt-3 text-sm text-green-100">
            Total des livraisons terminées.
          </p>
        </section>

        <button
          type="button"
          disabled
          className="w-full rounded-2xl bg-gray-300 px-4 py-4 font-bold text-gray-700"
        >
          Demander un virement bientôt disponible
        </button>

        {loading && (
          <div className="rounded-3xl bg-white p-6 text-center">
            Chargement du portefeuille...
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">
              Mes gains par livraison
            </h2>

            {orders.length === 0 ? (
              <div className="rounded-3xl bg-white p-6 text-center text-gray-600">
                Aucun gain pour le moment.
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          Livraison terminée
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.pickup_city || "Départ"} →{" "}
                          {order.dropoff_city || "Arrivée"}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {new Date(
                            order.updated_at || order.created_at
                          ).toLocaleString("fr-FR")}
                        </p>
                      </div>

                      <p className="text-xl font-bold text-green-700">
                        +{formatEuro(order.courier_earnings_cents || 0)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}