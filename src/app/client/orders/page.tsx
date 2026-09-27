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

  if (s === "RETURN_DECLINED") return "Retour non demandé";

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

  if (s === "RETURN_DECLINED")
    return "border-gray-300 bg-gray-100 text-gray-700";

  return "border-gray-200 bg-gray-50 text-gray-700";
}

function paymentLabel(payment?: string | null) {
  const p = normalize(payment);

  if (["PAID", "PAYE"].includes(p)) return "Confirmé";
  if (["PENDING", "EN_ATTENTE"].includes(p)) return "En attente";
  if (["FAILED", "ECHEC", "CANCELED", "CANCELLED"].includes(p)) return "Échoué";
  if (["REFUNDED", "REMBOURSE"].includes(p)) return "Remboursé";
  if (["UNPAID", "NON_PAYE"].includes(p)) return "Non payé";
  if (["DECLINED", "REFUSED"].includes(p)) return "Non demandé";

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

function isReturnDecisionRequired(order: OrderRow) {
  const status = normalize(order.status);
  const returnPaymentStatus = normalize(order.return_payment_status);

  const returnNotPaid = ![
    "PAID",
    "PAYE",
    "DECLINED",
    "REFUSED",
    "CANCELED",
    "CANCELLED",
  ].includes(returnPaymentStatus);

  return (
    ["REFUSED_BY_RECIPIENT", "RETURN_PAYMENT_PENDING"].includes(status) &&
    returnNotPaid &&
    order.return_price_cents != null
  );
}

function orderPriority(order: OrderRow) {
  if (isReturnDecisionRequired(order)) return 0;

  const status = normalize(order.status);

  if (
    [
      "PUBLISHED",
      "ACCEPTED",
      "ACCEPTEE",
      "OUT_FOR_DELIVERY",
      "EN_COURS",
      "LIVRAISON",
      "LIVRAISON_EN_COURS",
      "RETURN_TO_SENDER",
    ].includes(status)
  ) {
    return 1;
  }

  if (["PAYMENT_PENDING", "PENDING", "EN_ATTENTE"].includes(status)) {
    return 2;
  }

  return 3;
}

function createdAtTimestamp(value?: string | null) {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export default function ClientOrdersPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const router = useRouter();

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [selected, setSelected] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

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
      const sortedRows = [...rows].sort((a, b) => {
        const priorityDifference = orderPriority(a) - orderPriority(b);

        if (priorityDifference !== 0) return priorityDifference;

        return createdAtTimestamp(b.created_at) - createdAtTimestamp(a.created_at);
      });

      setOrders(sortedRows);

      setSelected((current) => {
        if (!sortedRows.length) return null;
        if (!current) return sortedRows[0];

        return (
          sortedRows.find((order) => order.id === current.id) || sortedRows[0]
        );
      });
    } catch (err) {
      console.error("LOAD CLIENT ORDERS UNCAUGHT ERROR =>", err);
      setError("Erreur pendant le chargement des commandes.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }


  async function payReturn(order: OrderRow) {
    if (!order.id || actionLoadingId) return;

    setActionLoadingId(order.id);
    setActionError(null);

    try {
      const response = await fetch("/api/checkout-return", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderId: order.id,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error || "Impossible de lancer le paiement du retour."
        );
      }

      const checkoutUrl = String(result?.url || "").trim();

      if (!checkoutUrl) {
        throw new Error(
          "Stripe n’a pas retourné de lien de paiement pour le retour."
        );
      }

      window.location.href = checkoutUrl;
    } catch (paymentError) {
      const message =
        paymentError instanceof Error
          ? paymentError.message
          : "Erreur pendant le paiement du retour.";

      setActionError(message);
      setActionLoadingId(null);
    }
  }

  async function declineReturn(order: OrderRow) {
    if (!order.id || actionLoadingId) return;

    const confirmed = window.confirm(
      "Confirmer que vous ne souhaitez pas récupérer ce colis ? Aucun retour ne sera demandé au livreur et aucun paiement de retour ne sera effectué."
    );

    if (!confirmed) return;

    setActionLoadingId(order.id);
    setActionError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;

      if (!accessToken) {
        throw new Error("Session expirée. Reconnectez-vous puis réessayez.");
      }

      const response = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          action: "DECLINE_RETURN",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          result?.error || "Impossible d’enregistrer votre choix."
        );
      }

      await loadOrders(true);
    } catch (declineError) {
      const message =
        declineError instanceof Error
          ? declineError.message
          : "Erreur pendant l’enregistrement de votre choix.";

      setActionError(message);
    } finally {
      setActionLoadingId(null);
    }
  }

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedNeedsReturnDecision = selected
    ? isReturnDecisionRequired(selected)
    : false;

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

        {actionError ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
            {actionError}
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

                const needsReturnDecision = isReturnDecisionRequired(order);
                const actionLoading = actionLoadingId === order.id;

                return (
                  <div
                    key={order.id}
                    className={`w-full rounded-2xl border p-4 shadow-sm transition ${
                      needsReturnDecision
                        ? "border-orange-400 bg-orange-50 ring-2 ring-orange-100"
                        : isSelected
                          ? "border-blue-500 bg-white ring-2 ring-blue-100"
                          : "border-gray-200 bg-white hover:border-gray-300"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(order)}
                      className="w-full text-left"
                    >
                      {needsReturnDecision ? (
                        <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-bold text-red-800">
                          Action requise — colis refusé
                        </div>
                      ) : null}

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

                    {needsReturnDecision ? (
                      <div className="mt-4 space-y-3 border-t border-orange-200 pt-4">
                        <p className="text-sm font-semibold text-orange-900">
                          Retour à payer : {formatEURFromCents(order.return_price_cents)}
                        </p>

                        <div className="grid gap-2 sm:grid-cols-2">
                          <button
                            type="button"
                            onClick={() => payReturn(order)}
                            disabled={Boolean(actionLoadingId)}
                            className="rounded-xl bg-blue-700 px-4 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {actionLoading
                              ? "Traitement..."
                              : `Payer le retour — ${formatEURFromCents(
                                  order.return_price_cents
                                )}`}
                          </button>

                          <button
                            type="button"
                            onClick={() => declineReturn(order)}
                            disabled={Boolean(actionLoadingId)}
                            className="rounded-xl border border-red-300 bg-white px-4 py-3 text-sm font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            Je renonce au retour
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </div>
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

                {selectedNeedsReturnDecision ? (
                  <div className="mt-4 space-y-3 rounded-2xl border-2 border-orange-300 bg-orange-50 p-4 text-sm text-orange-950">
                    <div>
                      <p className="text-base font-bold text-red-800">
                        Action requise — colis refusé
                      </p>
                      <p className="mt-1">
                        Choisissez si vous souhaitez récupérer le colis.
                      </p>
                    </div>

                    {selected.return_price_cents != null ? (
                      <p className="font-semibold">
                        Tarif du retour : {formatEURFromCents(selected.return_price_cents)}
                      </p>
                    ) : null}

                    <div className="grid gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => payReturn(selected)}
                        disabled={Boolean(actionLoadingId)}
                        className="rounded-xl bg-blue-700 px-4 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {actionLoadingId === selected.id
                          ? "Traitement..."
                          : `Payer le retour — ${formatEURFromCents(
                              selected.return_price_cents
                            )}`}
                      </button>

                      <button
                        type="button"
                        onClick={() => declineReturn(selected)}
                        disabled={Boolean(actionLoadingId)}
                        className="rounded-xl border border-red-300 bg-white px-4 py-3 font-bold text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Je renonce au retour
                      </button>
                    </div>
                  </div>
                ) : normalize(selected.status) === "RETURN_DECLINED" ? (
                  <div className="mt-4 rounded-2xl border border-gray-300 bg-gray-50 p-4 text-sm font-semibold text-gray-700">
                    Retour non demandé — aucun retour à effectuer.
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

