"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

const isDraft = (status?: string | null) => (status ?? "").toLowerCase() === "draft";

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
      .select(
        `
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
        parcel_note,
        client_proposed_price_cents,
        pricing_mode
      `
      )
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
          .select(
            `
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
            parcel_note,
            client_proposed_price_cents,
            pricing_mode
          `
          )
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
          <div className="rounded-2xl border border-gray-200 bg-white p-4">Chargement…</div>
        </div>
      </main>
    );
  }

  if (msg && !order) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-xl px-4 py-6 space-y-3">
          <div className="rounded-2xl border border-red-200 bg-white p-4 text-red-700">{msg}</div>
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
          <div className="rounded-2xl border border-gray-200 bg-white p-4">Commande introuvable.</div>
        </div>
      </main>
    );
  }

  const status = String(order.status || "").toLowerCase();
  const draft = isDraft(order.status);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* pb-24 pour laisser la place au bouton sticky mobile */}
      <div className="mx-auto max-w-xl px-4 py-6 space-y-4 pb-24 sm:pb-6">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-xl font-semibold">Détail commande</h1>
              <p className="text-sm text-gray-600">ID: {order.id}</p>
            </div>

            {/* Badge */}
            <span className="rounded-full border border-gray-200 px-3 py-1 text-sm">
              {draft ? "Brouillon" : "Publié"}
            </span>
          </div>

          {/* Bandeau publish visible tout de suite */}
          {draft && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="inline-flex items-center rounded-full bg-amber-200 px-3 py-1 text-xs font-semibold text-amber-900">
                    À valider
                  </div>
                  <p className="mt-2 text-sm text-amber-900/80">
                    Cette commande n’est pas visible par les livreurs tant que vous ne l’avez pas validée.
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
                  onClick={publishOrder}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Publication…" : "Valider et publier"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Trajet */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold">Trajet</h2>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div>
              <span className="font-medium">Départ :</span>{" "}
              {order.pickup_address || "—"} {order.pickup_city ? `(${order.pickup_city})` : ""}
            </div>
            <div>
              <span className="font-medium">Arrivée :</span>{" "}
              {order.dropoff_address || "—"} {order.dropoff_city ? `(${order.dropoff_city})` : ""}
            </div>
            <div>
              <span className="font-medium">Distance :</span>{" "}
              {typeof order.distance_km === "number" ? `${order.distance_km} km` : "—"}
            </div>
            <div>
              <span className="font-medium">Date :</span>{" "}
              {order.scheduled_at ? new Date(order.scheduled_at).toLocaleString() : "—"}
            </div>
          </div>
        </div>

        {/* Colis */}
        <div className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-base font-semibold">Colis</h2>
          <div className="mt-2 text-sm text-gray-700 space-y-1">
            <div>
              <span className="font-medium">Sacs :</span> {order.bag_count ?? "—"}
            </div>

            <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4">
              <h2 className="text-lg font-semibold">Description du colis</h2>

              <div className="mt-2 text-sm text-gray-600 space-y-2">
                <div>
                  <span className="font-medium text-gray-900">Type :</span>{" "}
                  {order.parcel_type || "—"}
                </div>

                <div className="mt-1">
                  <span className="font-medium text-gray-900">Note :</span>{" "}
                  {order.parcel_note ? (
                    <span className="whitespace-pre-wrap">{order.parcel_note}</span>
                  ) : (
                    "—"
                  )}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <span className="font-medium">Poids :</span>{" "}
              {order.weight_kg ?? "—"} {order.weight_kg ? "kg" : ""}
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
          {msg && (
            <div className="mb-3 rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm">
              {msg}
            </div>
          )}

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
          </div>

          {/* Garde aussi ce bouton dans la section Actions (desktop) */}
          {draft && (
            <button
              type="button"
              className="mt-3 w-full rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              onClick={publishOrder}
              disabled={actionLoading}
            >
              {actionLoading ? "Publication…" : "Valider et publier"}
            </button>
          )}
        </div>
      </div>

      {/* Sticky mobile */}
      {draft && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/90 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
            <div className="text-xs text-slate-600">
              Statut : <span className="font-semibold text-amber-700">Brouillon</span>
            </div>

            <button
              type="button"
              onClick={publishOrder}
              disabled={actionLoading}
              className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {actionLoading ? "…" : "Valider"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}