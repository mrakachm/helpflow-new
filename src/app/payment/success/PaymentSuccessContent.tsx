"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const sessionId = searchParams.get("session_id");

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const hasRunRef = useRef(false);

  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hasRunRef.current) return;
    hasRunRef.current = true;

    async function finalizePayment() {
      try {
        setLoading(true);
        setError(null);

        if (!orderId) {
          throw new Error("orderId manquant dans l'URL.");
        }

        const uuidRegex =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

        if (!uuidRegex.test(orderId)) {
          throw new Error("orderId invalide.");
        }

        const { data: existingOrder, error: existingError } = await supabase
          .from("orders")
          .select("id, payment_status, status, delivery_otp")
          .eq("id", orderId)
          .single();

        if (existingError) {
          throw new Error(existingError.message);
        }

        if (!existingOrder) {
          throw new Error("Commande introuvable.");
        }

        if (existingOrder.payment_status === "paid") {
          setDone(true);
          return;
        }

        const { data: existing } = await supabase
  .from("orders")
  .select("delivery_otp")
  .eq("id", orderId)
  .single();

if (existing?.delivery_otp) {
  setDone(true);
  setLoading(false);
  return;
}
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        const payload: Record<string, unknown> = {
          payment_status: "paid",
          status: "PENDING",
          delivery_otp: otp,
          updated_at: new Date().toISOString(),
        };

        if (sessionId) {
          payload.stripe_session_id = sessionId;
        }
if (sessionId) {
  payload.stripe_session_id = sessionId;
}

await fetch("/api/send-otp-email", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    to: "test@example.com",
    otp,
    orderId,
  }),
});

const { error: updateError } = await supabase
  .from("orders")
  .update(payload)
  .eq("id", orderId);

if (updateError) {
  throw new Error(updateError.message);
}

setDone(true);

} catch (e: any) {
  setError(e?.message || "Erreur pendant la validation du paiement");
} finally {
  setLoading(false);
}
}

finalizePayment();
}, [orderId, sessionId, supabase]);

  return (
    <main style={{ minHeight: "100vh", background: "white", padding: 24 }}>
      <div
        style={{
          maxWidth: 700,
          margin: "0 auto",
          border: "1px solid #e5e7eb",
          borderRadius: 16,
          padding: 24,
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          Paiement validé
        </h1>

        {loading && (
          <div
            style={{
              border: "1px solid #bfdbfe",
              background: "#eff6ff",
              color: "#1d4ed8",
              padding: 16,
              borderRadius: 12,
            }}
          >
            Validation du paiement en cours...
          </div>
        )}

        {!loading && error && (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                border: "1px solid #fecaca",
                background: "#fef2f2",
                color: "#b91c1c",
                padding: 16,
                borderRadius: 12,
              }}
            >
              {error}
            </div>

            {orderId && (
              <Link
                href={`/client/orders/${orderId}`}
                style={{
                  display: "inline-block",
                  background: "#2563eb",
                  color: "white",
                  padding: "12px 16px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                  width: "fit-content",
                }}
              >
                Retour à la commande
              </Link>
            )}
          </div>
        )}

        {!loading && done && (
          <div style={{ display: "grid", gap: 16 }}>
            <div
              style={{
                border: "1px solid #bbf7d0",
                background: "#f0fdf4",
                color: "#15803d",
                padding: 16,
                borderRadius: 12,
              }}
            >
              ✅ Votre paiement a bien été confirmé.
              <br />
              La commande est maintenant publiée et visible côté livreur.
            </div>

            <div
              style={{
                border: "1px solid #e5e7eb",
                background: "#f9fafb",
                padding: 16,
                borderRadius: 12,
                color: "#374151",
              }}
            >
              <div>
                <strong>Commande :</strong> {orderId || "-"}
              </div>
              <div>
                <strong>Session Stripe :</strong> {sessionId || "-"}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {orderId && (
                <Link
                  href={`/client/orders/${orderId}`}
                  style={{
                    display: "inline-block",
                    background: "#2563eb",
                    color: "white",
                    padding: "12px 16px",
                    borderRadius: 12,
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Voir ma commande
                </Link>
              )}

              <Link
                href="/client/orders"
                style={{
                  display: "inline-block",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "12px 16px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Mes commandes
              </Link>

              <Link
                href="/client/new-order"
                style={{
                  display: "inline-block",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "12px 16px",
                  borderRadius: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Nouvelle commande
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}