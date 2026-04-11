"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderStatus =
  | "DRAFT"
  | "PENDING"
  | "ACCEPTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED";

type OrderRow = {
  id: string;
  status: OrderStatus;
  payment_status?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  distance_km?: number | null;
  bag_count?: number | null;
  weight_kg?: number | null;
  price_cents?: number | null;
  platform_fee_cents?: number | null;
  courier_id?: string | null;
  delivery_otp?: string | null;
  created_at?: string | null;
  accepted_at?: string | null;
  started_at?: string | null;
  delivered_at?: string | null;
  updated_at?: string | null;
};

function formatEurosFromCents(cents: number | null | undefined) {
  if (cents == null) return "-";
  return (cents / 100).toFixed(2) + " €";
}

function getStatusLabel(status?: OrderStatus) {
  switch (status) {
    case "DRAFT":
      return "Brouillon";
    case "PENDING":
      return "Payée - en attente d’un livreur";
    case "ACCEPTED":
      return "Livreur accepté";
    case "OUT_FOR_DELIVERY":
      return "Livraison en cours";
    case "DELIVERED":
      return "Livrée";
    default:
      return "-";
  }
}

export default function ClientOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [loading, setLoading] = useState(false);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchOrder() {
  if (!orderId) return;

  setLoadingOrder(true);
  setError(null);

  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", orderId)
    .maybeSingle();

  if (error || !data) {
    setError("Commande introuvable");
    setOrder(null);
    setLoadingOrder(false);
    return;
  }

  setOrder(data as OrderRow);
  setLoadingOrder(false);
}

useEffect(() => {
  fetchOrder();
}, [orderId]);

async function goToStripe(orderId: string) {
  try {
    const amountCents =
      typeof order?.price_cents === "number" && order.price_cents > 0
        ? order.price_cents
        : 0;

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        orderId,
        amountCents,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error("Erreur checkout:", data);
      alert(data?.error || "Erreur paiement");
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    } else {
      alert("URL Stripe manquante");
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau");
  }
}

  const invalid = !orderId;
  const canPay =
    order &&
    (order.status === "DRAFT" || order.payment_status !== "paid");

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Détail commande
      </h1>

      <p>
        <strong>ID :</strong> {orderId}
      </p>

      {invalid && (
        <p style={{ color: "red" }}>ERREUR : ID commande invalide</p>
      )}


      {loadingOrder && <p>Chargement de la commande...</p>}

      {error && (
        <div
          style={{
            marginTop: 16,
            padding: 16,
            borderRadius: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
          }}
        >
          {error}
        </div>
      )}

      {order && (
        <>
          <div
            style={{
              marginTop: 20,
              padding: 16,
              borderRadius: 12,
              border: "1px solid #e5e7eb",
              background: "#fff",
            }}
          >
            <div style={{ marginBottom: 8 }}>
              <strong>Statut :</strong> {getStatusLabel(order.status)}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Paiement :</strong>{" "}
              {order.payment_status === "paid" ? "Confirmé" : "Non payé"}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Départ :</strong> {order.pickup_address ?? "-"}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Arrivée :</strong> {order.dropoff_address ?? "-"}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Distance :</strong> {order.distance_km ?? "-"} km
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Sacs :</strong> {order.bag_count ?? "-"}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Poids :</strong> {order.weight_kg ?? "-"} kg
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Prix :</strong> {formatEurosFromCents(order.price_cents)}
            </div>

            <div style={{ marginBottom: 8 }}>
              <strong>Frais plateforme :</strong>{" "}
              {formatEurosFromCents(order.platform_fee_cents)}
            </div>

            {order.status !== "DRAFT" && (
              <div
                style={{
                  marginTop: 16,
                  padding: 16,
                  borderRadius: 12,
                  background: "#f9fafb",
                  border: "1px solid #e5e7eb",
                }}
              >
                <strong>Code OTP de livraison :</strong>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 24,
                    fontWeight: 700,
                    letterSpacing: 2,
                  }}
                >
                  {order.delivery_otp || "Non généré"}
                </div>
                <div style={{ marginTop: 8, fontSize: 14, color: "#6b7280" }}>
                  Donne ce code uniquement au livreur quand tu reçois bien la
                  commande.
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
            {canPay ? (
              <button
                disabled={loading || invalid}
                onClick={async () => {
                  if (!orderId) {
                    alert("ID manquant");
                    return;
                  }
                  setLoading(true);
                  await goToStripe(orderId);
                  setLoading(false);
                }}
                style={{
                  padding: "12px 16px",
                  borderRadius: 10,
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                {loading ? "Redirection..." : "Payer et valider"}
              </button>
            ) : (
              <div
                style={{
                  padding: 16,
                  borderRadius: 12,
                  background: "#ecfdf5",
                  border: "1px solid #bbf7d0",
                  color: "#166534",
                }}
              >
                ✅ Commande déjà payée. Tu n’as plus besoin de repayer.
              </div>
            )}
          </div>

          <div
            style={{
              marginTop: 20,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <button
              onClick={fetchOrder}
              style={{
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                background: "white",
                cursor: "pointer",
              }}
            >
              Rafraîchir
            </button>
          </div>
        </>
      )}
    </div>
  );
}