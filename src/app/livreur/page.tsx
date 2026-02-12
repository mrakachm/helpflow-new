"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  pickup_address: string | null;
  dropoff_address: string | null;
  distance_km: number | null;
  bag_count: number | null;
  weight_kg: number | null;
  price_cents: number | null;
  platform_fee_cents: number | null;
  status: string;
  courier_id: string | null;
  created_at?: string;
};

function formatEurosFromCents(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toFixed(2) + " €";
}

export default function LivreurPage() {
 const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [available, setAvailable] = useState<OrderRow[]>([]);
  const [myMissions, setMyMissions] = useState<OrderRow[]>([]);

  async function requireAuth() {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) {
      router.push("/login");
      return null;
    }
    setUserId(data.user.id);
    return data.user.id;
  }

  async function loadOrders(uid: string) {
    setLoading(true);
    setError(null);

    // 1) commandes dispo
    const a = await supabase
      .from("orders")
      .select(
        "id,pickup_address,dropoff_address,distance_km,bag_count,weight_kg,price_cents,platform_fee_cents,status,courier_id,created_at"
      )
      .eq("status", "CREATED")
      .is("courier_id", null)
      .order("created_at", { ascending: false });

    // 2) mes missions
    const m = await supabase
      .from("orders")
      .select(
        "id,pickup_address,dropoff_address,distance_km,bag_count,weight_kg,price_cents,platform_fee_cents,status,courier_id,created_at"
      )
      .eq("courier_id", uid)
      .order("created_at", { ascending: false });

    if (a.error) setError(a.error.message);
    if (m.error) setError(m.error.message);

    setAvailable((a.data as OrderRow[]) ?? []);
    setMyMissions((m.data as OrderRow[]) ?? []);
    setLoading(false);
  }

  useEffect(() => {
    (async () => {
      const uid = await requireAuth();
      if (!uid) return;
      await loadOrders(uid);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function takeMission(orderId: string) {
    if (!userId) return;
    setTakingId(orderId);
    setError(null);

    /**
     * Important :
     * On sécurise en update conditionnel :
     * - status doit être CREATED
     * - courier_id doit être null
     * Si quelqu’un d’autre prend avant toi, l’update ne touche aucune ligne.
     */
    const { data, error } = await supabase
      .from("orders")
      .update({
        courier_id: userId,
        status: "ASSIGNED",
      })
      .eq("id", orderId)
      .eq("status", "CREATED")
      .is("courier_id", null)
      .select("id");

    if (error) {
      setError(error.message);
      setTakingId(null);
      return;
    }

    if (!data || data.length === 0) {
      setError("Mission déjà prise par un autre livreur.");
      setTakingId(null);
      await loadOrders(userId);
      return;
    }

    setTakingId(null);
    await loadOrders(userId);
  }

  async function setStatus(orderId: string, nextStatus: string) {
    if (!userId) return;
    setError(null);

    const { error } = await supabase
      .from("orders")
      .update({ status: nextStatus })
      .eq("id", orderId)
      .eq("courier_id", userId);

    if (error) setError(error.message);
    await loadOrders(userId);
  }

  return (
    <div className="p-4 max-w-5xl mx-auto">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Espace livreur</h1>
          <p className="text-sm text-gray-600">
            Prends une mission, puis fais avancer le statut.
          </p>
        </div>
        <button
          className="px-3 py-2 rounded bg-black text-white text-sm"
          onClick={() => userId && loadOrders(userId)}
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {/* Disponible */}
        <section className="p-4 rounded border">
          <h2 className="font-semibold text-lg">Missions disponibles</h2>
          <p className="text-xs text-gray-600 mt-1">
            Status = CREATED et pas encore attribuées.
          </p>

          {loading ? (
            <p className="mt-4 text-sm">Chargement…</p>
          ) : available.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">Aucune mission pour le moment.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {available.map((o) => (
                <div key={o.id} className="p-3 rounded border bg-white">
                  <div className="text-sm font-medium">
                    {o.pickup_address ?? "Pickup —"}
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    → {o.dropoff_address ?? "Dropoff —"}
                  </div>

                  <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-3">
                    <span>Distance: {o.distance_km ?? "—"} km</span>
                    <span>Sacs: {o.bag_count ?? "—"}</span>
                    <span>Poids: {o.weight_kg ?? "—"} kg</span>
                  </div>

                  <div className="text-xs text-gray-600 mt-2">
                    Prix: {formatEurosFromCents(o.price_cents)} — Commission:{" "}
                    {formatEurosFromCents(o.platform_fee_cents)}
                  </div>

                  <button
                    className="mt-3 w-full px-3 py-2 rounded bg-green-600 text-white text-sm disabled:opacity-60"
                    onClick={() => takeMission(o.id)}
                    disabled={takingId === o.id}
                  >
                    {takingId === o.id ? "Attribution…" : "Je prends la mission"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Mes missions */}
        <section className="p-4 rounded border">
          <h2 className="font-semibold text-lg">Mes missions</h2>
          <p className="text-xs text-gray-600 mt-1">
            Assignées à toi (courier_id = ton user id).
          </p>

          {loading ? (
            <p className="mt-4 text-sm">Chargement…</p>
          ) : myMissions.length === 0 ? (
            <p className="mt-4 text-sm text-gray-600">Tu n’as aucune mission.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {myMissions.map((o) => (
                <div key={o.id} className="p-3 rounded border bg-white">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium">
                        {o.pickup_address ?? "Pickup —"}
                      </div>
                      <div className="text-sm text-gray-700 mt-1">
                        → {o.dropoff_address ?? "Dropoff —"}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-1 rounded bg-gray-100">
                      {o.status}
                    </span>
                  </div>

                  <div className="text-xs text-gray-600 mt-2 flex flex-wrap gap-3">
                    <span>Distance: {o.distance_km ?? "—"} km</span>
                    <span>Sacs: {o.bag_count ?? "—"}</span>
                    <span>Poids: {o.weight_kg ?? "—"} kg</span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      className="px-3 py-2 rounded bg-blue-600 text-white text-sm"
                      onClick={() => setStatus(o.id, "IN_PROGRESS")}
                      disabled={o.status === "IN_PROGRESS"}
                    >
                      Démarrer
                    </button>
                    <button
                      className="px-3 py-2 rounded bg-purple-600 text-white text-sm"
                      onClick={() => setStatus(o.id, "DELIVERED")}
                      disabled={o.status === "DELIVERED"}
                    >
                      Livré
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}