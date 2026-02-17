"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderStatus = "PUBLISHED" | "ASSIGNED" | "IN_PROGRESS" | "DELIVERED";

type OrderRow = {
  id: string;
  pickup_address: string | null;
  dropoff_address: string | null;
  distance_km: number | null;
  bag_count: number | null;
  weight_kg: number | null;
  price_cents: number | null;
  platform_fee_cents: number | null;
  status: OrderStatus;
  courier_id: string | null;

  created_at?: string;
  assigned_at?: string | null;
  started_at?: string | null;
  delivered_at?: string | null;
  cancelled_at?: string | null;
  updated_at?: string | null;
};

function formatEurosFromCents(cents: number | null) {
  if (cents == null) return "-";
  return (cents / 100).toFixed(2) + " €";
}

export default function LivreurPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  // ✅ STATES (propres, une seule fois)
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [takingId, setTakingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [available, setAvailable] = useState<OrderRow[]>([]);
  const [myMissions, setMyMissions] = useState<OrderRow[]>([]);

  // ✅ Auth
  async function requireAuth(): Promise<string | null> {
    const { data, error: authErr } = await supabase.auth.getUser();
    if (authErr || !data?.user) {
      router.push("/login");
      return null;
    }
    setUserId(data.user.id);
    return data.user.id;
  }

  // ✅ Load data
  async function loadOrders(uid: string) {
    setLoading(true);
    setError(null);

    // Missions dispo = PUBLISHED + pas de courier
    const a = await supabase
      .from("orders")
      .select(
        "id,pickup_address,dropoff_address,distance_km,bag_count,weight_kg,price_cents,platform_fee_cents,status,courier_id,created_at,assigned_at,started_at,delivered_at,cancelled_at,updated_at"
      )
      .eq("status", "PUBLISHED")
      .is("courier_id", null)
      .order("created_at", { ascending: false });

    // Mes missions = celles assignées à moi (ASSIGNED/IN_PROGRESS/DELIVERED)
    const m = await supabase
      .from("orders")
      .select(
        "id,pickup_address,dropoff_address,distance_km,bag_count,weight_kg,price_cents,platform_fee_cents,status,courier_id,created_at,assigned_at,started_at,delivered_at,cancelled_at,updated_at"
      )
      .eq("courier_id", uid)
      .in("status", ["ASSIGNED", "IN_PROGRESS", "DELIVERED"])
      .order("created_at", { ascending: false });

    if (a.error) setError(a.error.message);
    if (m.error) setError(m.error.message);

    setAvailable(((a.data as OrderRow[]) ?? []).map((x) => ({ ...x, status: x.status as OrderStatus })));
    setMyMissions(((m.data as OrderRow[]) ?? []).map((x) => ({ ...x, status: x.status as OrderStatus })));

    setLoading(false);
  }

  async function refreshOrders() {
    if (!userId) return;
    await loadOrders(userId);
  }

  // ✅ Prendre mission
async function takeMission(orderId: string) {
  if (!userId) {
    alert("Tu dois être connecté.");
    return;
  }

  setError(null);
  setTakingId(orderId);

  const now = new Date().toISOString();

  const { data, error: takeErr } = await supabase
    .from("orders")
    .update({
      status: "ASSIGNED",
      courier_id: userId,
      assigned_at: now,
      updated_at: now,
    })
    .eq("id", orderId)
    .eq("status", "PUBLISHED")
    .is("courier_id", null)
    .select("id")
    .single();

  setTakingId(null);

  console.log("TAKE ERR =>", takeErr);
  console.log("TAKE DATA =>", data);

  if (takeErr || !data) {
    setError("Impossible de prendre la mission (déjà prise ou statut changé).");
    await loadOrders(userId); // rafraîchir listes
    return;
  }

  alert("✅ Mission acceptée !");
  await loadOrders(userId);
}

// ✅ Changer statut (Démarrer / Livré)
async function setStatus(orderId: string, status: "IN_PROGRESS" | "DELIVERED") {
  if (!userId) {
    alert("Tu dois être connecté.");
    return;
  }

  setError(null);

  const allowedFrom = status === "IN_PROGRESS" ? ["ASSIGNED"] : ["IN_PROGRESS"];

  const payload: Partial<OrderRow> =
    status === "IN_PROGRESS"
      ? { status: "IN_PROGRESS", started_at: new Date().toISOString() }
      : { status: "DELIVERED", delivered_at: new Date().toISOString() };

  const { error: stErr } = await supabase
    .from("orders")
    .update(payload)
    .eq("id", orderId)
    .eq("courier_id", userId)
    .in("status", allowedFrom);

  if (stErr) {
    setError("Impossible de changer le statut.");
    return;
  }

  await loadOrders(userId);
}

// ✅ Annuler mission (remet en ligne)
async function cancelMission(orderId: string) {
  if (!userId) {
    alert("Tu dois être connecté.");
    return;
  }

  setError(null);

  const now = new Date().toISOString();

  const { error: cancelErr } = await supabase
    .from("orders")
    .update({
      status: "PUBLISHED",
      courier_id: null,
      cancelled_at: now,
      updated_at: now,
    })
    .eq("id", orderId)
    .eq("courier_id", userId)
    .in("status", ["ASSIGNED", "IN_PROGRESS"]);

  if (cancelErr) {
    setError("Impossible d'annuler (pas ta mission ou déjà changée).");
    return;
  }

  alert("↩️ Mission annulée et remise en ligne !");
  await loadOrders(userId);
}

    useEffect(() => {
  (async () => {
    const uid = await requireAuth();
    if (!uid) return;
    await loadOrders(uid);
  })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Espace livreur</h1>
        <button
          className="px-3 py-2 rounded bg-black text-white text-sm"
          onClick={refreshOrders}
          disabled={loading}
        >
          Rafraîchir
        </button>
      </div>

      {error && (
        <div className="mt-2 p-3 rounded bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Missions disponibles */}
      <section className="p-4 rounded border">
        <h2 className="font-semibold text-lg">Missions disponibles</h2>
        <p className="text-xs text-gray-600 mt-1">
          Statut = PUBLISHED et courier_id vide.
        </p>

        {loading ? (
          <p className="mt-4 text-sm">Chargement...</p>
        ) : available.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">Aucune mission disponible.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {available.map((o) => (
              <div key={o.id} className="p-3 rounded border bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{o.pickup_address ?? "-"}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      → {o.dropoff_address ?? "Dropoff -"}
                    </div>
                  </div>

                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
                    {o.status}
                  </span>
                </div>

                <div className="text-xs text-gray-600 mt-2 flex gap-4 flex-wrap">
                  <span>Distance: {o.distance_km ?? "-"} km</span>
                  <span>Sacs: {o.bag_count ?? "-"}</span>
                  <span>Poids: {o.weight_kg ?? "-"} kg</span>
                  <span>Prix: {formatEurosFromCents(o.price_cents)}</span>
                </div>

                <div className="mt-3">
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-green-600 text-white text-sm disabled:opacity-60"
                    onClick={() => takeMission(o.id)}
                    disabled={takingId === o.id}
                  >
                    {takingId === o.id ? "..." : "Accepter"}
                  </button>
                </div>
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
          <p className="mt-4 text-sm">Chargement...</p>
        ) : myMissions.length === 0 ? (
          <p className="mt-4 text-sm text-gray-600">Tu n’as aucune mission.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {myMissions.map((o) => (
              <div key={o.id} className="p-3 rounded border bg-white">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{o.pickup_address ?? "-"}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      → {o.dropoff_address ?? "Dropoff -"}
                    </div>
                  </div>

                  <span className="text-xs px-2 py-1 rounded bg-gray-100">
                    {o.status}
                  </span>
                </div>

                <div className="text-xs text-gray-600 mt-2 flex gap-4 flex-wrap">
                  <span>Distance: {o.distance_km ?? "-"} km</span>
                  <span>Sacs: {o.bag_count ?? "-"}</span>
                  <span>Poids: {o.weight_kg ?? "-"} kg</span>
                  <span>Prix: {formatEurosFromCents(o.price_cents)}</span>
                </div>

                <div className="mt-3 flex gap-2 flex-wrap">
                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-blue-600 text-white text-sm disabled:opacity-60"
                    onClick={() => setStatus(o.id, "IN_PROGRESS")}
                    disabled={o.status !== "ASSIGNED"}
                  >
                    Démarrer
                  </button>

                  <button
                    type="button"
                    className="px-3 py-1 rounded bg-purple-600 text-white text-sm disabled:opacity-60"
                    onClick={() => setStatus(o.id, "DELIVERED")}
                    disabled={o.status !== "IN_PROGRESS"}
                  >
                    Livré
                  </button>

                  <button
                    type="button"
                    className="px-3 py-1 rounded border text-sm"
                    onClick={() => router.push(`/client/orders/${o.id}`)}
                  >
                    Voir détail
                  </button>

                  <button
                    type="button"
                    className="px-3 py-1 rounded border text-sm"
                    onClick={() => cancelMission(o.id)}
                    disabled={o.status === "DELIVERED"}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

