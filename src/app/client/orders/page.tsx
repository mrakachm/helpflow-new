"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  client_id?: string | null;

  pickup_address?: string | null;
  dropoff_address?: string | null;
  pickup_city?: string | null;
  dropoff_city?: string | null;
  pickup_zip?: string | null;
  dropoff_zip?: string | null;

  distance_km?: number | null;
  weight_kg?: number | null;
  bag_count?: number | null;

  price_cents?: number | null;
  platform_fee_cents?: number | null;
  courier_earnings_cents?: number | null;

  status?: string | null;
  payment_status?: string | null;

  scheduled_at?: string | null;
  delivered_at?: string | null;
  created_at?: string | null;

  is_important_parcel?: boolean | null;
  important_parcel_type?: string | null;

  refusal_reason?: string | null;
  return_payment_status?: string | null;
  return_price_cents?: number | null;
};

function normalize(value?: string | null) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatEURFromCents(cents?: number | null) {
  if (cents == null) return "—";
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
  });
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function statusLabel(status?: string | null) {
  const s = normalize(status);

  if (["PAYMENT_PENDING", "PENDING", "EN_ATTENTE"].includes(s))
    return "Paiement en attente";

  if (s === "PUBLISHED") return "Recherche d’un livreur";

  if (["ACCEPTED", "ACCEPTEE"].includes(s)) return "Livreur accepté";

  if (
    ["OUT_FOR_DELIVERY", "EN_COURS", "LIVRAISON", "LIVRAISON_EN_COURS"].includes(s)
  )
    return "Livraison en cours";

  if (["DELIVERED", "LIVRE", "LIVREE"].includes(s)) return "Livrée";

  if (s === "REFUSED_BY_RECIPIENT") return "Refusée par le destinataire";

  if (s === "RETURN_PAYMENT_PENDING") return "Retour en attente de paiement";

  if (s === "RETURN_TO_SENDER") return "Retour vers l’expéditeur";

  if (s === "RETURN_COMPLETED") return "Retour terminé";

  if (["CANCELED", "CANCELLED", "ANNULEE"].includes(s)) return "Annulée";

  if (["DRAFT", "BROUILLON"].includes(s)) return "Brouillon";

  return status || "—";
}

function statusClass(status?: string | null) {
  const s = normalize(status);

  if (["DELIVERED", "LIVRE", "LIVREE", "RETURN_COMPLETED"].includes(s))
    return "border-green-200 bg-green-50 text-green-800";

  if (
    ["ACCEPTED", "OUT_FOR_DELIVERY", "EN_COURS", "LIVRAISON_EN_COURS"].includes(s)
  )
    return "border-blue-200 bg-blue-50 text-blue-800";

  if (["PAYMENT_PENDING", "PENDING", "RETURN_PAYMENT_PENDING"].includes(s))
    return "border-amber-200 bg-amber-50 text-amber-800";

  if (["REFUSED_BY_RECIPIENT", "CANCELED", "CANCELLED", "ANNULEE"].includes(s))
    return "border-red-200 bg-red-50 text-red-800";

  if (s === "RETURN_TO_SENDER")
    return "border-violet-200 bg-violet-50 text-violet-800";

  return "border-gray-200 bg-gray-50 text-gray-700";
}

function paymentLabel(payment?: string | null) {
  const p = normalize(payment);

  if (["PAID", "PAYE"].includes(p)) return "Confirmé";
  if (["PENDING", "EN_ATTENTE"].includes(p)) return "En attente";
  if (["FAILED", "ECHEC", "CANCELED", "CANCELLED"].includes(p)) return "Échoué";
  if (["REFUNDED", "REMBOURSE"].includes(p)) return "Remboursé";
  if (["UNPAID", "NON_PAYE"].includes(p)) return "Non payé";

  return payment || "—";
}

function addressLine(
  address?: string | null,
  zip?: string | null,
  city?: string | null
) {
  return [address, zip, city]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");
}

export default function ClientOrdersPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadOrders(silent = false) {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    setError(null);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.push("/login");
        return;
      }

      const { data, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false });

      if (ordersError) {
        console.error("LOAD CLIENT ORDERS ERROR =>", ordersError);
        setError("Impossible de charger vos commandes.");
        return;
      }

      const rows = (data || []) as OrderRow[];
      setOrders(rows);

      setSelected((current) => {
        if (!rows.length) return null;
        if (!current) return rows[0];

        return rows.find((order) => order.id === current.id) || rows[0];
      });
    } catch (err) {
      console.error("LOAD CLIENT ORDERS UNCAUGHT ERROR =>", err);
      setError("Erreur pendant le chargement des commandes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6">
        <header className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-700">Espace client</p>
              <h1 className="mt-1 text-2xl font-bold text-gray-950">
                Mes commandes
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                Retrouvez ici vos livraisons et leur état d’avancement.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push("/client/new-order")}
                className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
              >
                Nouvelle commande
              </button>

              <button
                type="button"
                onClick={() => loadOrders(true)}
                disabled={loading || refreshing}
                className="rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 disabled:opacity-60"
              >
                {refreshing ? "Actualisation..." : "Rafraîchir"}
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-600">
            Chargement de vos commandes...
          </div>
        ) : null}

        {!loading && orders.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center shadow-sm">
            <h2 className="text-lg font-bold text-gray-900">
              Aucune commande pour le moment
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Créez votre première demande de livraison lorsque vous êtes prêt.
            </p>

            <button
              type="button"
              onClick={() => router.push("/client/new-order")}
              className="mt-5 rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white"
            >
              Créer une commande
            </button>
          </div>
        ) : null}

        {!loading && orders.length > 0 ? (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
            <section className="space-y-3">
              {orders.map((order) => {
                const isSelected = selected?.id === order.id;
                const pickup = addressLine(
                  order.pickup_address,
                  order.pickup_zip,
                  order.pickup_city
                );
                const dropoff = addressLine(
                  order.dropoff_address,
                  order.dropoff_zip,
                  order.dropoff_city
                );

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelected(order)}
                    className={`w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition ${
                      isSelected
                        ? "border-blue-500 ring-2 ring-blue-100"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                            order.status
                          )}`}
                        >
                          {statusLabel(order.status)}
                        </span>

                        {order.is_important_parcel ? (
                          <span className="ml-2 inline-flex rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                            Colis important
                          </span>
                        ) : null}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="font-bold text-gray-950">
                          {formatEURFromCents(order.price_cents)}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">
                          {formatDate(order.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 space-y-1.5 text-sm text-gray-700">
                      <p className="truncate">
                        <span className="font-semibold">Départ :</span>{" "}
                        {pickup || "—"}
                      </p>
                      <p className="truncate">
                        <span className="font-semibold">Arrivée :</span>{" "}
                        {dropoff || "—"}
                      </p>
                      <p>
                        <span className="font-semibold">Paiement :</span>{" "}
                        {paymentLabel(order.payment_status)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </section>

            {selected ? (
              <section className="h-fit rounded-3xl border border-gray-200 bg-white p-5 shadow-sm lg:sticky lg:top-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Détail de la commande
                    </p>
                    <h2 className="mt-1 break-all text-base font-bold text-gray-950">
                      {selected.id}
                    </h2>
                  </div>

                  <span
                    className={`w-fit rounded-full border px-3 py-1.5 text-xs font-semibold ${statusClass(
                      selected.status
                    )}`}
                  >
                    {statusLabel(selected.status)}
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Paiement</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {paymentLabel(selected.payment_status)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Tarif</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatEURFromCents(selected.price_cents)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Créée le</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatDate(selected.created_at)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">Livraison souhaitée</p>
                    <p className="mt-1 font-semibold text-gray-900">
                      {formatDate(selected.scheduled_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 space-y-3 rounded-2xl border border-gray-200 p-4 text-sm">
                  <p>
                    <span className="font-semibold">Départ :</span>{" "}
                    {addressLine(
                      selected.pickup_address,
                      selected.pickup_zip,
                      selected.pickup_city
                    ) || "—"}
                  </p>

                  <p>
                    <span className="font-semibold">Arrivée :</span>{" "}
                    {addressLine(
                      selected.dropoff_address,
                      selected.dropoff_zip,
                      selected.dropoff_city
                    ) || "—"}
                  </p>

                  <p>
                    <span className="font-semibold">Nombre de sacs / colis :</span>{" "}
                    {selected.bag_count ?? "—"}
                  </p>

                  {selected.distance_km != null ? (
                    <p>
                      <span className="font-semibold">Distance :</span>{" "}
                      {selected.distance_km} km
                    </p>
                  ) : null}

                  {selected.weight_kg != null ? (
                    <p>
                      <span className="font-semibold">Poids :</span>{" "}
                      {selected.weight_kg} kg
                    </p>
                  ) : null}

                  {selected.is_important_parcel ? (
                    <p>
                      <span className="font-semibold">Colis important :</span>{" "}
                      {selected.important_parcel_type || "Oui"}
                    </p>
                  ) : null}

                  {selected.refusal_reason ? (
                    <p className="text-red-700">
                      <span className="font-semibold">Motif du refus :</span>{" "}
                      {selected.refusal_reason}
                    </p>
                  ) : null}
                </div>

                {selected.delivered_at ? (
                  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-800">
                    Commande livrée le {formatDate(selected.delivered_at)}
                  </div>
                ) : null}

                {normalize(selected.status) === "RETURN_PAYMENT_PENDING" ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    <p className="font-semibold">Retour en attente de paiement</p>
                    {selected.return_price_cents != null ? (
                      <p className="mt-1">
                        Tarif du retour :{" "}
                        {formatEURFromCents(selected.return_price_cents)}
                      </p>
                    ) : null}
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => router.push(`/client/orders/${selected.id}`)}
                  className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  Voir tous les détails
                </button>

                <p className="mt-3 text-center text-xs text-gray-500">
                  Le Code PIN de livraison reste réservé au destinataire.
                </p>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>
    </main>
  );
}

