"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabaseClient";

const supabase = supabaseBrowser();

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id);

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setMsg(null);

      // Vérifier connexion
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        setMsg("Tu dois être connecté.");
        router.push("/login");
        return;
      }

      // Charger commande
      const { data: o, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id)
        .single();

      if (error) setMsg(error.message);
      setOrder(o);
      setLoading(false);
    })();
  }, [id, router]);

  async function handleCancel() {
    setMsg(null);
    setCancelLoading(true);
    try {
      const res = await fetch("/api/orders/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Annulation impossible");

      setMsg("✅ Commande annulée (refund si payé).");
      // Recharger la commande
      const { data: o } = await supabase.from("orders").select("*").eq("id", id).single();
      setOrder(o);
    } catch (e: any) {
      setMsg("❌ " + (e?.message ?? "Erreur"));
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) return <p className="p-4">Chargement…</p>;
  if (!order) return <p className="p-4">Commande introuvable</p>;

  const canCancel = ["DRAFT", "PAID"].includes(order.status);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Détail commande</h1>

      {msg && <div className="mb-4 rounded border p-3">{msg}</div>}

      <div className="rounded border p-3 space-y-2">
        <div><b>ID:</b> {order.id}</div>
        <div><b>Status:</b> {order.status}</div>
        <div><b>Départ:</b> {order.pickup_address}</div>
        <div><b>Arrivée:</b> {order.dropoff_address}</div>
        <div><b>Prix:</b> {(order.price_cents / 100).toFixed(2)} €</div>
      </div>

      {canCancel && (
        <button
          onClick={handleCancel}
          disabled={cancelLoading}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
        >
          {cancelLoading ? "Annulation..." : "Annuler la commande"}
        </button>
      )}
    </div>
  );
}
