"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Order = {
  id: string;
  created_at: string;
  updated_at: string | null;
  status: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  price_cents: number | null;
  courier_earnings_cents: number | null;
};

function formatEuro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export default function AdminRevenusPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadRevenus() {
      const { data } = await supabase
        .from("orders")
        .select(
          "id, created_at, updated_at, status, pickup_city, dropoff_city, price_cents, courier_earnings_cents"
        )
        .in("status", ["DELIVERED", "delivered", "LIVREE", "LIVRÉE"])
        .order("updated_at", { ascending: false });

      setOrders((data || []) as Order[]);
      setLoading(false);
    }

    loadRevenus();
  }, [supabase]);

  const totalClientCents = orders.reduce(
    (sum, order) => sum + (order.price_cents || 0),
    0
  );

  const totalLivreurCents = orders.reduce(
    (sum, order) => sum + (order.courier_earnings_cents || 0),
    0
  );

  const totalHelpFlowCents = totalClientCents - totalLivreurCents;

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl space-y-5">
        <h1 className="text-3xl font-bold">
          💰 Revenus HelpFlow
        </h1>

        {loading ? (
          <div className="rounded-3xl bg-white p-6 text-center shadow">
            Chargement...
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-3xl bg-white p-5 shadow">
                <p className="text-gray-500">Argent gagné HelpFlow</p>
                <h2 className="text-3xl font-bold text-green-600">
                  {formatEuro(totalHelpFlowCents)}
                </h2>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow">
                <p className="text-gray-500">Missions terminées</p>
                <h2 className="text-3xl font-bold">
                  {orders.length}
                </h2>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow">
                <p className="text-gray-500">Payé aux livreurs</p>
                <h2 className="text-3xl font-bold">
                  {formatEuro(totalLivreurCents)}
                </h2>
              </div>

              <div className="rounded-3xl bg-white p-5 shadow">
                <p className="text-gray-500">Payé par les clients</p>
                <h2 className="text-3xl font-bold">
                  {formatEuro(totalClientCents)}
                </h2>
              </div>
            </div>

            <section className="rounded-3xl bg-white p-5 shadow">
              <h2 className="mb-4 text-xl font-bold">
                Historique commissions
              </h2>

              {orders.length === 0 ? (
                <p className="text-gray-500">
                  Aucune commission pour le moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {orders.map((order) => {
                    const client = order.price_cents || 0;
                    const livreur = order.courier_earnings_cents || 0;
                    const commission = client - livreur;

                    return (
                      <div
                        key={order.id}
                        className="rounded-2xl border border-gray-200 p-4"
                      >
                        <div className="flex justify-between gap-3">
                          <div>
                            <p className="font-bold">
                              Mission terminée
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.pickup_city || "Départ"} →{" "}
                              {order.dropoff_city || "Arrivée"}
                            </p>
                            <p className="text-xs text-gray-400">
                              {new Date(
                                order.updated_at || order.created_at
                              ).toLocaleString("fr-FR")}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-green-700">
                              +{formatEuro(commission)}
                            </p>
                            <p className="text-xs text-gray-400">
                              HelpFlow
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}