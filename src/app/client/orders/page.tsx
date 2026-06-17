"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  courier_earnings_cents: number | null;

  courier_offer_price_cents: number | null;
  courier_offer_status: string | null;
  courier_offer_by: string | null;
};

function formatMoney(cents: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toFixed(2).replace(".", ",");
}

function formatLine(address?: string | null, zip?: string | null, city?: string | null) {
  const parts = [address, zip, city].filter((v) => v && String(v).trim().length > 0);
  return parts.join(", ");
}

function normalizeStatus(status?: string | null) {
  return String(status || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function getStatusLabel(status?: string | null) {
  const s = normalizeStatus(status);

  if (s === "pending") return "Payée - en attente";
  if (s === "accepted") return "Livreur accepté";
  if (s === "out_for_delivery" || s === "en_cours") return "En cours";
  if (s === "livre" || s === "livree" || s === "delivered") return "Livrée";
  if (s === "draft" || s === "brouillon") return "Brouillon";

  return status || "—";
}

export default function OrdersPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);

  async function loadOrders() {
    setLoading(true);
    setError(null);

    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr) throw userErr;

      if (!userData.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("orders")
        .select(
          `
          id, created_at, status,
          pickup_address, dropoff_address,
          pickup_city, dropoff_city,
          pickup_zip, dropoff_zip,
          distance_km, bag_count, weight_kg,
          price_cents, platform_fee_cents, courier_earnings_cents,
          courier_offer_price_cents, courier_offer_status, courier_offer_by
        `
        )
        .eq("client_id", userData.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setOrders((data ?? []) as OrderRow[]);
    } catch (e: any) {
      setError(e?.message ?? "Erreur chargement");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }

  async function acceptCourierOffer(order: OrderRow) {
    if (!order.courier_offer_price_cents || !order.courier_offer_by) {
      setError("Offre livreur invalide.");
      return;
    }

    const finalPriceCents = order.courier_offer_price_cents;
    const platformFeeCents = Math.round(finalPriceCents * 0.2);
    const courierEarningsCents = Math.max(0, finalPriceCents - platformFeeCents);

    setActionLoading(order.id);
    setError(null);

    const { error } = await supabase
      .from("orders")
      .update({
        price_cents: finalPriceCents,
        platform_fee_cents: platformFeeCents,
        courier_earnings_cents: courierEarningsCents,
        courier_offer_status: "accepted",
        courier_id: order.courier_offer_by,
        status: "ACCEPTED",
        accepted_at: new Date().toISOString(),
        assigned_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("courier_offer_status", "pending");

    setActionLoading(null);

    if (error) {
      setError(error.message);
      return;
    }

    await loadOrders();
  }

  async function refuseCourierOffer(order: OrderRow) {
    setActionLoading(order.id);
    setError(null);

    const { error } = await supabase
      .from("orders")
      .update({
        courier_offer_status: "refused",
        courier_offer_price_cents: null,
        courier_offer_by: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", order.id)
      .eq("courier_offer_status", "pending");

    setActionLoading(null);

    if (error) {
      setError(error.message);
      return;
    }

    await loadOrders();
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
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
        <div className="mb-4 p-3 rounded border border-red-300 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {!loading && !error && orders.length === 0 && (
        <div className="p-3 rounded border bg-white">Aucune commande pour le moment.</div>
      )}

      <div className="space-y-3">
        {orders.map((o) => {
          const price = formatMoney(o.price_cents);
          const pickup = formatLine(o.pickup_address, o.pickup_zip, o.pickup_city);
          const dropoff = formatLine(o.dropoff_address, o.dropoff_zip, o.dropoff_city);

          const hasPendingOffer =
            o.courier_offer_status === "pending" &&
            o.courier_offer_price_cents != null &&
            o.courier_offer_by;

          return (
            <div
              key={o.id}
              className="border rounded p-3 bg-white hover:bg-gray-50"
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => router.push(`/client/orders/${o.id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") router.push(`/client/orders/${o.id}`);
                }}
                className="cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">
                      Statut : <span>{getStatusLabel(o.status)}</span>
                    </p>
                    <p className="text-xs text-gray-600">
                      {new Date(o.created_at).toLocaleString()}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{price} €</p>
                  </div>
                </div>

                <div className="mt-3 text-sm">
                  <p>
                    <span className="font-semibold">Départ :</span> {pickup || "—"}
                  </p>
                  <p>
                    <span className="font-semibold">Arrivée :</span> {dropoff || "—"}
                  </p>
                </div>
              </div>

              {hasPendingOffer ? (
                <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3">
                  <p className="text-sm font-semibold text-orange-900">
                    Un livreur propose : {formatMoney(o.courier_offer_price_cents)} €
                  </p>

                  <p className="mt-1 text-xs text-orange-800">
                    Tu peux accepter ce nouveau prix ou refuser. En cas de refus,
                    la commande reste disponible au prix initial.
                  </p>

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={actionLoading === o.id}
                      onClick={() => acceptCourierOffer(o)}
                      className="rounded-xl bg-green-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      Accepter
                    </button>

                    <button
                      type="button"
                      disabled={actionLoading === o.id}
                      onClick={() => refuseCourierOffer(o)}
                      className="rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 disabled:opacity-60"
                    >
                      Refuser
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}