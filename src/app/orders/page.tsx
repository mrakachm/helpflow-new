"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabaseClient";

type OrderRow = {
  id: string;
  client_id: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
  pickup_city: string | null;
  dropoff_city: string | null;
  pickup_zip: string | null;
  dropoff_zip: string | null;
  distance_km: number | null;
  weight_kg: number | null;
  bag_count: number | null;
  price_cents: number | null;
  status: string | null;
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
  if (s === "delivered" || s === "livree" || s === "livrée") return "✅ Livrée";
  if (s === "canceled" || s === "annulee" || s === "annulée") return "❌ Annulée";
  return status || "--";
}

export default function ClientOrdersPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);

  async function load() {
    setError("");
    setLoading(true);

    // ✅ 1) Utilisateur connecté
   
const supabase = supabaseBrowser();
const { data, error } = await supabase.from("orders").select("*");
    if (userErr) {
      setError(userErr.message);
      setOrders([]);
      setLoading(false);
      return;
    }

    const userId = userData.user?.id;
    if (!userId) {
      setError("Tu dois être connecté");
      setOrders([]);
      setLoading(false);
      return;
    }

    // ✅ 2) Commandes du client
    const { data: ordersData, error: ordersErr } = await supabase
      .from("orders")
      .select("*")
      .eq("client_id", userId)
      .order("created_at", { ascending: false });

    if (ordersErr) {
      setError(ordersErr.message);
      setOrders([]);
    } else {
      setOrders((ordersData ?? []) as OrderRow[]);
    }

    setLoading(false);
  }

  async function setStatus(orderId: string, status: string) {
    setError("");

    const { error: updateErr } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", orderId);

    if (updateErr) {
      setError(updateErr.message);
      return;
    }

    await load();
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4">
      <div className="flex items-center justify-between gap-3 mb-4">
        <h1 className="text-xl font-bold">Mes commandes</h1>

        <div className="flex gap-2">
          <Link
            className="px-3 py-2 rounded border"
            href="/client/new-order"
          >
            ➕ Nouvelle commande
          </Link>

          <button
            className="px-3 py-2 rounded border"
            onClick={load}
          >
            🔄 Actualiser
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 p-3 rounded border border-red-300 bg-red-50">
          ❗ {error}
        </div>
      )}

      {loading ? (
        <p>Chargement…</p>
      ) : orders.length === 0 ? (
        <p>Aucune commande.</p>
      ) : (
        <div className="overflow-auto rounded border">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Date</th>
                <th className="text-left p-3">Départ</th>
                <th className="text-left p-3">Arrivée</th>
                <th className="text-left p-3">Sacs</th>
                <th className="text-left p-3">Poids</th>
                <th className="text-left p-3">Distance</th>
                <th className="text-left p-3">Prix</th>
                <th className="text-left p-3">Statut</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="p-3 whitespace-nowrap">
                    {o.created_at ? new Date(o.created_at).toLocaleString("fr-FR") : "--"}
                  </td>

                  <td className="p-3">
                    <div className="font-medium">{o.pickup_city || "--"}</div>
                    <div className="text-gray-600">{o.pickup_address || ""}</div>
                  </td>

                  <td className="p-3">
                    <div className="font-medium">{o.dropoff_city || "--"}</div>
                    <div className="text-gray-600">{o.dropoff_address || ""}</div>
                  </td>

                  <td className="p-3">{o.bag_count ?? "--"}</td>
                  <td className="p-3">{o.weight_kg != null ? `${o.weight_kg} kg` : "--"}</td>
                  <td className="p-3">{o.distance_km != null ? `${o.distance_km} km` : "--"}</td>
                  <td className="p-3">{formatEURFromCents(o.price_cents)}</td>
                  <td className="p-3">{statusLabel(o.status)}</td>

                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => setSelected(o)}
                      >
                        🔎 Détails
                      </button>

                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => setStatus(o.id, "en_cours")}
                      >
                        🚚 En cours
                      </button>

                      <button
                        className="px-2 py-1 rounded border"
                        onClick={() => setStatus(o.id, "livree")}
                      >
                        ✅ Livrée
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Détails */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-lg shadow p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold">Détails commande</h2>
              <button
                className="px-2 py-1 rounded border"
                onClick={() => setSelected(null)}
              >
                ✖ Fermer
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded border">
                <div className="font-semibold mb-1">Départ</div>
                <div>{selected.pickup_address || "--"}</div>
                <div>
                  {selected.pickup_city || "--"}{" "}
                  {selected.pickup_zip ? `(${selected.pickup_zip})` : ""}
                </div>
              </div>

              <div className="p-3 rounded border">
                <div className="font-semibold mb-1">Arrivée</div>
                <div>{selected.dropoff_address || "--"}</div>
                <div>
                  {selected.dropoff_city || "--"}{" "}
                  {selected.dropoff_zip ? `(${selected.dropoff_zip})` : ""}
                </div>
              </div>

              <div className="p-3 rounded border">
                <div className="font-semibold mb-1">Infos</div>
                <div>Sacs : {selected.bag_count ?? "--"}</div>
                <div>Poids : {selected.weight_kg != null ? `${selected.weight_kg} kg` : "--"}</div>
                <div>Distance : {selected.distance_km != null ? `${selected.distance_km} km` : "--"}</div>
              </div>

              <div className="p-3 rounded border">
                <div className="font-semibold mb-1">Paiement</div>
                <div>Prix : {formatEURFromCents(selected.price_cents)}</div>
                <div>Statut : {statusLabel(selected.status)}</div>
                <div>
                  Date :{" "}
                  {selected.created_at
                    ? new Date(selected.created_at).toLocaleString("fr-FR")
                    : "--"}
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2 justify-end">
              <button
                className="px-3 py-2 rounded border"
                onClick={() => setStatus(selected.id, "en_cours")}
              >
                🚚 Passer “En cours”
              </button>
              <button
                className="px-3 py-2 rounded border"
                onClick={() => setStatus(selected.id, "livree")}
              >
                ✅ Marquer “Livrée”
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
