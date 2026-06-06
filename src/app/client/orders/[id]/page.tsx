"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type OrderRow = {
  id: string;
  status?: string | null;
  payment_status?: string | null;
  pickup_address?: string | null;
  dropoff_address?: string | null;
  distance_km?: number | null;
  bag_count?: number | null;
  weight_kg?: number | null;
  price_cents?: number | null;
  platform_fee_cents?: number | null;
  delivery_otp?: string | null;
};

function formatEurosFromCents(cents?: number | null) {
  if (cents == null) return "-";
  return (cents / 100).toFixed(2) + " €";
}

function getStatusLabel(status?: string | null) {
  switch (status) {
    case "PENDING":
      return "Payée - en attente d’un livreur";
    case "ACCEPTED":
      return "Livreur accepté";
    case "OUT_FOR_DELIVERY":
      return "Livraison en cours";
    case "DELIVERED":
      return "Livrée";
    default:
      return "Brouillon";
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
    } else {
      setOrder(data as OrderRow);
    }

    setLoadingOrder(false);
  }

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const isPaid =
    order?.payment_status?.toLowerCase() === "paid" ||
    order?.status === "PENDING" ||
    order?.status === "ACCEPTED" ||
    order?.status === "OUT_FOR_DELIVERY" ||
    order?.status === "DELIVERED";

  const canPay = !!order && !isPaid && order.status === "DRAFT";

  async function goToStripe(orderId: string) {
    if (!order) return;

    if (isPaid) {
      alert("Cette commande est déjà payée.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ orderId }),
      });

     const text = await res.text();
const data = text ? JSON.parse(text) : {};

      if (!res.ok) {
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
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ padding: 24, maxWidth: 760, margin: "0 auto" }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
        Détail commande
      </h1>

      <p>
        <strong>ID :</strong> {orderId}
      </p>

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
              <strong>Paiement :</strong> {isPaid ? "Confirmé" : "Non payé"}
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

            {isPaid && (
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
                onClick={() => goToStripe(orderId)}
                disabled={loading}
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
                ✅ Paiement confirmé.

                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => (window.location.href = "/client")}
                    style={{
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: "#2563eb",
                      color: "white",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    Retour à l'accueil
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ marginTop: 20 }}>
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