"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
type Order = {
  id: string;
  status: string | null;
  accepted_by: string | null;
  picked_up_at: string | null;
  delivered_at?: string | null;
};

export default function CourierOrderActions({
  order,
  courierId,
  onUpdated,
}: {
  order: Order;
  courierId: string;
  onUpdated?: () => void;
}) {
  
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string>("");
const supabase = createClientComponentClient();
  async function update(patch: Partial<Order>) {
    setLoading(true);
    setMsg("");
    const { error } = await supabase.from("orders").update(patch).eq("id", order.id);
    setLoading(false);

    if (error) {
      setMsg("Erreur: " + error.message);
      return;
    }
    setMsg("✅ Mis à jour");
    onUpdated?.();
  }

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="font-semibold">Actions livreur</div>

      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-lg border px-3 py-2"
          disabled={loading}
          onClick={() =>
            update({
              status: "ACCEPTED",
              accepted_by: courierId,
            })
          }
        >
          Accepter
        </button>

        <button
          className="rounded-lg border px-3 py-2"
          disabled={loading}
          onClick={() =>
            update({
              status: "PICKED_UP",
              picked_up_at: new Date().toISOString(),
            })
          }
        >
          Colis récupéré
        </button>

        <button
          className="rounded-lg border px-3 py-2"
          disabled={loading}
          onClick={() =>
            update({
              status: "OUT_FOR_DELIVERY",
            })
          }
        >
          En route
        </button>

        <button
          className="rounded-lg border px-3 py-2"
          disabled={loading}
          onClick={() =>
            update({
              status: "DELIVERED",
              delivered_at: new Date().toISOString(),
            })
          }
        >
          Livré
        </button>
      </div>

      {msg && <div className="text-sm text-gray-600">{msg}</div>}
      <div className="text-sm text-gray-600">
        Statut actuel : <b>{order.status ?? "—"}</b>
      </div>
    </div>
  );
}