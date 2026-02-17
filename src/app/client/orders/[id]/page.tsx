"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function formatEuro(cents: number | null | undefined) {
  const v = typeof cents === "number" ? cents : 0;
  return (v / 100).toFixed(2) + " €";
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const id = params?.id;

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [order, setOrder] = useState<any>(null);

  async function refreshOrder() {
    if (!id) return;

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      setMsg(error.message);
      return;
    }

    setOrder(data);
  }

  async function publishOrder() {
    try {
      setActionLoading(true);
      setMsg(null);

      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        setMsg("Tu dois être connecté.");
        router.push("/login");
        return;
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: "published" })
        .eq("id", id)
        .eq("client_id", userData.user.id);

      if (error) {
        setMsg(error.message);
        return;
      }

      await refreshOrder();
      setMsg("✅ Mission publiée !");
    } finally {
      setActionLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    (async () => {
      setLoading(true);
      setMsg(null);

      try {
        if (!id) {
          if (isMounted) setMsg("ID commande manquant.");
          return;
        }

        const { data, error } = await supabase
          .from("orders")
          .select(`
  id,
  status,
  pickup_address,
  pickup_city,
  dropoff_address,
  dropoff_city,
  bag_count,
  weight_kg,
  distance_km,
  scheduled_at,
  price_cents,
  platform_fee_cents,
  courier_earnings_cents,
  parcel_type,
  parcel_note
`)
          .eq("id", id)
          .single();

        if (error) throw error;
        if (isMounted) setOrder(data);
      } catch (e: any) {
        if (isMounted) setMsg(e?.message || "Erreur chargement commande.");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [id, supabase]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-xl px-4 py-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            Chargement...
          </div>
        </div>
      </main>
    );
  }

  if (msg && !order) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-xl px-4 py-6 space-y-3">
          <div className="rounded-2xl border border-red-200 bg-white p-4">{msg}</div>
          <button
            type="button"
            className="rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
            onClick={() => router.push("/client/orders")}
          >
            Retour
          </button>
        </div>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-xl px-4 py-6">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            Commande introuvable.
          </div>
        </div>
      </main>
    );
  }

  const status = String(order.status || "").toLowerCase();

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-6 space-y-4">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Détail commande</h1>
              <p className="text-sm text-gray-600">ID: {order.id}</p>
            </div>
            <span className="rounded-full border border-gray-200 px-3 py-1 text-sm">
              {status || "--"}
            </span>
          </div>
        </div>

        {/* Trajet */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold">Trajet</h2>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div>
              <span className="font-medium">Départ :</span>{" "}
              {order.pickup_address || "--"}{" "}
              {order.pickup_city ? `(${order.pickup_city})` : ""}
            </div>
            <div>
              <span className="font-medium">Arrivée :</span>{" "}
              {order.dropoff_address || "--"}{" "}
              {order.dropoff_city ? `(${order.dropoff_city})` : ""}
            </div>
            <div>
              <span className="font-medium">Distance :</span>{" "}
              {typeof order.distance_km === "number" ? `${order.distance_km} km` : "--"}
            </div>
            <div>
              <span className="font-medium">Date :</span>{" "}
              {order.scheduled_at ? new Date(order.scheduled_at).toLocaleString() : "--"}
            </div>
          </div>
        </div>

        {/* Colis */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold">Colis</h2>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div>
              <span className="font-medium">Sacs :</span> {order.bag_count ?? "--"}
            </div>
            <div>
              <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
  <h2 className="text-lg font-semibold">Description du colis</h2>

  <div className="text-sm text-gray-600">
    <div>
      <span className="font-medium text-gray-900">Type :</span>{" "}
      {order?.parcel_type || "—"}
    </div>
    <div className="mt-1">
      <span className="font-medium text-gray-900">Note :</span>{" "}
      {order?.parcel_note ? (
        <span className="whitespace-pre-wrap">{order.parcel_note}</span>
      ) : (
        "—"
      )}
    </div>
  </div>
</div>
              <span className="font-medium">Poids :</span> {order.weight_kg ?? "--"} kg
            </div>
          </div>
        </div>

        {/* Prix */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold">Prix</h2>
          <div className="mt-2 text-sm text-gray-700 space-y-2">
            <div className="flex items-center justify-between">
              <span>Prix final</span>
              <span className="font-semibold">{formatEuro(order.price_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Mode</span>
              <span className="rounded-full border border-gray-200 px-2 py-0.5 text-xs">
                {order.pricing_mode || "standard"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Prix proposé client</span>
              <span>{formatEuro(order.client_proposed_price_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Commission HelpFlow</span>
              <span>{formatEuro(order.platform_fee_cents)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Gain livreur</span>
              <span>{formatEuro(order.courier_earnings_cents)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          {msg && <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">{msg}</div>}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="flex-1 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium"
              onClick={() => router.push("/client/orders")}
            >
              Mes commandes
            </button>

            <button
              type="button"
              className="flex-1 rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
              onClick={() => router.push("/client/new-order")}
            >
              Nouvelle commande
            </button>

            {status === "draft" && (
              <button
                type="button"
                className="w-full rounded-xl bg-black px-4 py-2 text-sm font-medium text-white"
                onClick={publishOrder}
                disabled={actionLoading}
              >
                {actionLoading ? "Publication..." : "Publier la mission"}
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
