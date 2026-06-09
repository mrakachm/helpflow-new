"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderStatus =
  | "DRAFT"
  | "PENDING"
  | "ACCEPTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | string;

type Order = {
  id: string;
  pickup_address: string | null;
  dropoff_address: string | null;
  pickup_city?: string | null;
  dropoff_city?: string | null;
  price_cents: number | null;
  price?: number | null;
  payment_status?: string | null;
  status: OrderStatus | null;
  courier_id: string | null;
  delivery_otp?: string | null;
  maps_url?: string | null;
  distance_km?: number | null;
  bag_count?: number | null;
  weight_kg?: number | null;
  category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

function euros(cents: number | null | undefined, price?: number | null) {
  if (cents != null) return (cents / 100).toFixed(2).replace(".", ",") + " €";
  if (price != null) return Number(price).toFixed(2).replace(".", ",") + " €";
  return "-";
}

function normalize(value: string | null | undefined) {
  return String(value || "").trim().toUpperCase();
}

function isPaid(order: Order) {
  return normalize(order.payment_status) === "PAID";
}

function isPendingPaid(order: Order) {
  return normalize(order.status) === "PENDING" && isPaid(order) && !order.courier_id;
}

function Stars({ value = 5 }: { value?: number }) {
  return (
    <div className="flex gap-1 text-amber-400 text-lg">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{star <= value ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

function getMapUrl(order: Order) {
  if (order.maps_url) return order.maps_url;

  const from = [order.pickup_address, order.pickup_city].filter(Boolean).join(", ");
  const to = [order.dropoff_address, order.dropoff_city].filter(Boolean).join(", ");

  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    from
  )}&destination=${encodeURIComponent(to)}&travelmode=driving`;
}

export default function MissionsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [available, setAvailable] = useState<Order[]>([]);
  const [myMissions, setMyMissions] = useState<Order[]>([]);
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpLoadingId, setOtpLoadingId] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  async function requireAuth() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      router.push("/login?next=/livreur/missions");
      return null;
    }

    setUserId(data.user.id);
    return data.user.id;
  }

  async function loadOrders(uid: string, silent = false) {
    silent ? setRefreshing(true) : setLoading(true);
    setError(null);

    try {
      const { data: availableData, error: availableError } = await supabase
        .from("orders")
        .select("*")
        .eq("status", "PENDING")
        .eq("payment_status", "PAID")
        .is("courier_id", null)
        .order("created_at", { ascending: false });

      if (availableError) throw availableError;

      const { data: myData, error: myError } = await supabase
        .from("orders")
        .select("*")
        .eq("courier_id", uid)
        .in("status", ["ACCEPTED", "OUT_FOR_DELIVERY"])
        .order("created_at", { ascending: false });

      if (myError) throw myError;

      setAvailable(((availableData as Order[]) || []).filter(isPendingPaid));
      setMyMissions(
        ((myData as Order[]) || []).filter((order) =>
          ["ACCEPTED", "OUT_FOR_DELIVERY"].includes(normalize(order.status))
        )
      );
    } catch (err) {
      console.error(err);
      setError("Impossible de charger les missions pour le moment.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function refreshOrders() {
    if (!userId) return;
    await loadOrders(userId, true);
  }

  async function takeMission(orderId: string) {
    if (!userId) return;

    setError(null);
    setActionLoadingId(orderId);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "ACCEPTED",
          courier_id: userId,
          accepted_at: now,
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("status", "PENDING")
        .eq("payment_status", "PAID")
        .is("courier_id", null);

      if (error) throw error;

      await loadOrders(userId, true);
    } catch (err) {
      console.error(err);
      setError("Cette mission n'est plus disponible ou une erreur est arrivée.");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function startDelivery(order: Order) {
    if (!userId) return;

    setActionLoadingId(order.id);
    setError(null);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "OUT_FOR_DELIVERY",
          started_at: now,
          updated_at: now,
        })
        .eq("id", order.id)
        .eq("courier_id", userId)
        .eq("status", "ACCEPTED");

      if (error) throw error;

      window.open(getMapUrl(order), "_blank");
      await loadOrders(userId, true);
    } catch (err) {
      console.error(err);
      setError("Impossible de démarrer cette livraison.");
    } finally {
      setActionLoadingId(null);
    }
  }

  function updateOtpInput(orderId: string, value: string) {
    setOtpInputs((prev) => ({
      ...prev,
      [orderId]: value.replace(/\D/g, "").slice(0, 6),
    }));
  }

  async function validateOtpAndDeliver(orderId: string) {
    if (!userId) return;

    const otp = (otpInputs[orderId] || "").trim();

    if (!otp) {
      setError("Entre le code OTP donné par le client.");
      return;
    }

    setOtpLoadingId(orderId);
    setError(null);

    try {
      const res = await fetch("/api/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, otp }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result?.error || "Code OTP incorrect.");
        return;
      }

      setOtpInputs((prev) => ({ ...prev, [orderId]: "" }));
      await loadOrders(userId, true);
    } catch (err) {
      console.error(err);
      setError("Erreur pendant la validation OTP.");
    } finally {
      setOtpLoadingId(null);
    }
  }

  async function cancelMission(orderId: string) {
    if (!userId) return;

    setActionLoadingId(orderId);
    setError(null);

    try {
      const now = new Date().toISOString();

      const { error } = await supabase
        .from("orders")
        .update({
          status: "PENDING",
          courier_id: null,
          accepted_at: null,
          started_at: null,
          updated_at: now,
        })
        .eq("id", orderId)
        .eq("courier_id", userId)
        .in("status", ["ACCEPTED", "OUT_FOR_DELIVERY"]);

      if (error) throw error;

      await loadOrders(userId, true);
    } catch (err) {
      console.error(err);
      setError("Impossible d'annuler cette mission.");
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    (async () => {
      const uid = await requireAuth();
      if (uid) await loadOrders(uid);
    })();
  }, []);

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-slate-900">
      <div className="mx-auto max-w-3xl space-y-6">
        <header className="rounded-3xl bg-blue-600 p-5 text-white shadow-xl">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-blue-100">HelpFlow Livreur</p>
              <h1 className="mt-1 text-3xl font-bold">Missions disponibles</h1>
              <p className="mt-2 text-blue-100">
                Choisissez une mission claire, payée et prête à être prise.
              </p>
            </div>

            <button
              type="button"
              onClick={refreshOrders}
              disabled={refreshing || loading}
              className="rounded-2xl bg-white px-4 py-3 text-sm font-bold text-blue-700 disabled:opacity-60"
            >
              {refreshing ? "Actualisation..." : "Rafraîchir"}
            </button>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-3xl font-bold">{available.length}</p>
              <p className="text-sm text-blue-100">missions disponibles</p>
            </div>

            <div className="rounded-2xl bg-white/15 p-4">
              <p className="text-3xl font-bold">{myMissions.length}</p>
              <p className="text-sm text-blue-100">missions en cours</p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-white p-4 text-slate-900">
              <p className="text-sm font-semibold text-slate-500">Livreur</p>
              <Stars value={5} />
              <p className="text-xs text-slate-500">Note visible bientôt</p>
            </div>

            <div className="rounded-2xl bg-white p-4 text-slate-900">
              <p className="text-sm font-semibold text-slate-500">Application</p>
              <Stars value={5} />
              <p className="text-xs text-slate-500">HelpFlow</p>
            </div>
          </div>
        </header>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            {error}
          </div>
        )}

        {loading && <p className="text-slate-500">Chargement des missions...</p>}

        {!loading && (
          <>
            <section className="space-y-4">
              <div>
                <h2 className="text-xl font-bold">Missions recommandées</h2>
                <p className="text-sm text-slate-500">
                  Les étoiles indiquent les missions simples à prendre.
                </p>
              </div>

              {available.length === 0 && (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 text-center">
                  <p className="text-lg font-bold">Aucune mission disponible</p>
                  <p className="mt-2 text-slate-500">
                    Revenez dans quelques minutes ou rafraîchissez la page.
                  </p>
                </div>
              )}

              {available.map((order, index) => (
                <article
                  key={order.id}
                  className="overflow-hidden rounded-3xl border border-blue-100 bg-blue-600 text-white shadow-xl"
                >
                  <div className="h-36 bg-gradient-to-br from-blue-200 via-green-100 to-blue-100 p-4 text-slate-800">
                    <p className="text-sm font-semibold">Carte GPS</p>
                    <p className="mt-2 text-xs">Retrait → Livraison</p>
                    <button
                      type="button"
                      onClick={() => window.open(getMapUrl(order), "_blank")}
                      className="mt-6 rounded-full bg-white px-4 py-2 text-sm font-bold text-blue-700 shadow"
                    >
                      Ouvrir l'itinéraire
                    </button>
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-blue-100">
                          Mission recommandée
                        </p>
                        <Stars value={index < 2 ? 5 : 4} />
                      </div>

                      <div className="rounded-2xl bg-white px-4 py-2 font-bold text-blue-700">
                        {euros(order.price_cents, order.price)}
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3">
                      <div className="rounded-2xl bg-white/15 p-4">
                        <p className="text-xs uppercase tracking-wide text-blue-100">
                          Retrait
                        </p>
                        <p className="mt-1 font-semibold">
                          {order.pickup_address || "Adresse de retrait inconnue"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-white/15 p-4">
                        <p className="text-xs uppercase tracking-wide text-blue-100">
                          Livraison
                        </p>
                        <p className="mt-1 font-semibold">
                          {order.dropoff_address || "Adresse de livraison inconnue"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2 text-xs">
                      {order.distance_km != null && (
                        <span className="rounded-full bg-white/15 px-3 py-1">
                          {order.distance_km} km
                        </span>
                      )}

                      {order.bag_count != null && (
                        <span className="rounded-full bg-white/15 px-3 py-1">
                          {order.bag_count} sac(s)
                        </span>
                      )}

                      {order.weight_kg != null && (
                        <span className="rounded-full bg-white/15 px-3 py-1">
                          {order.weight_kg} kg
                        </span>
                      )}

                      {order.category && (
                        <span className="rounded-full bg-white/15 px-3 py-1">
                          {order.category}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => takeMission(order.id)}
                      disabled={actionLoadingId === order.id}
                      className="mt-5 w-full rounded-2xl bg-white px-4 py-4 font-bold text-blue-700 disabled:opacity-50"
                    >
                      {actionLoadingId === order.id
                        ? "Prise de mission..."
                        : "Accepter cette mission"}
                    </button>
                  </div>
                </article>
              ))}
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold">Mes missions en cours</h2>

              {myMissions.length === 0 && (
                <div className="rounded-3xl border border-slate-100 bg-slate-50 p-6 text-center">
                  <p className="font-bold">Aucune mission en cours</p>
                  <p className="mt-2 text-slate-500">
                    Acceptez une mission pour la retrouver ici.
                  </p>
                </div>
              )}

              {myMissions.map((order) => (
                <article
                  key={order.id}
                  className="rounded-3xl border border-slate-100 bg-slate-50 p-5 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500">Mission en cours</p>
                      <Stars value={5} />
                    </div>
                    <p className="font-bold text-blue-700">
                      {euros(order.price_cents, order.price)}
                    </p>
                  </div>

                  <div className="mt-4 grid gap-3 text-sm text-slate-700">
                    <p>
                      <strong>Retrait :</strong> {order.pickup_address || "-"}
                    </p>
                    <p>
                      <strong>Livraison :</strong> {order.dropoff_address || "-"}
                    </p>
                    <p>
                      <strong>Statut :</strong> {normalize(order.status)}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.open(getMapUrl(order), "_blank")}
                    className="mt-4 w-full rounded-2xl border border-blue-200 bg-white px-4 py-3 font-bold text-blue-700"
                  >
                    Ouvrir le GPS
                  </button>

                  {normalize(order.status) === "ACCEPTED" && (
                    <div className="mt-4 grid gap-3">
                      <button
                        type="button"
                        onClick={() => startDelivery(order)}
                        disabled={actionLoadingId === order.id}
                        className="rounded-2xl bg-blue-600 px-4 py-3 font-bold text-white disabled:opacity-60"
                      >
                        Démarrer la livraison
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelMission(order.id)}
                        disabled={actionLoadingId === order.id}
                        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 disabled:opacity-60"
                      >
                        Annuler la mission
                      </button>
                    </div>
                  )}

                  {normalize(order.status) === "OUT_FOR_DELIVERY" && (
                    <div className="mt-5 space-y-3">
                      <input
                        type="text"
                        placeholder="Code OTP client"
                        value={otpInputs[order.id] || ""}
                        onChange={(e) => updateOtpInput(order.id, e.target.value)}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none"
                      />

                      <button
                        type="button"
                        onClick={() => validateOtpAndDeliver(order.id)}
                        disabled={otpLoadingId === order.id}
                        className="w-full rounded-2xl bg-green-500 px-4 py-3 font-bold text-white disabled:opacity-60"
                      >
                        {otpLoadingId === order.id
                          ? "Validation..."
                          : "Valider la livraison"}
                      </button>

                      <button
                        type="button"
                        onClick={() => cancelMission(order.id)}
                        disabled={actionLoadingId === order.id}
                        className="w-full text-sm text-red-600 disabled:opacity-60"
                      >
                        Annuler la mission
                      </button>
                    </div>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
      </div>
    </main>
  );
}