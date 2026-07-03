"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Payout = {
  id: string;
  courier_id: string;
  amount_cents: number;
  status: string;
  created_at: string;
};

function euro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

export default function AdminVirementsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    const { data } = await supabase
      .from("payout_requests")
      .select("*")
      .order("created_at", { ascending: false });

    setPayouts((data || []) as Payout[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updatePayout(id: string, status: string) {
    const { error } = await supabase
      .from("payout_requests")
      .update({
        status: status,
        paid_at: status === "PAID" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      setMessage("Erreur pendant la mise à jour.");
      return;
    }

    if (status === "PAID") {
      setMessage("✅ Virement validé avec succès.");
    } else {
      setMessage("❌ Demande refusée.");
    }

    load();
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-5">

        <h1 className="text-3xl font-bold">
          💳 Demandes de virements
        </h1>

        {message && (
          <div className="rounded-xl bg-green-100 p-4 text-green-700">
            {message}
          </div>
        )}

        {loading && (
          <div className="bg-white rounded-3xl p-5">
            Chargement...
          </div>
        )}

        {!loading && payouts.length === 0 && (
          <div className="bg-white rounded-3xl p-5">
            Aucune demande de virement.
          </div>
        )}

        {payouts.map((p) => (
          <div
            key={p.id}
            className="bg-white rounded-3xl p-5 shadow space-y-3"
          >
            <p className="font-bold text-xl">
              {euro(p.amount_cents)}
            </p>

            <p>Livreur : {p.courier_id}</p>

            <p>
              Statut :{" "}
              <b>
                {p.status === "PENDING"
                  ? "En attente"
                  : p.status === "PAID"
                  ? "Payé"
                  : "Refusé"}
              </b>
            </p>

            <p className="text-sm text-gray-500">
              {new Date(p.created_at).toLocaleString("fr-FR")}
            </p>

            {p.status === "PENDING" && (
              <div className="flex gap-3">

                <button
                  onClick={() => updatePayout(p.id, "PAID")}
                  className="flex-1 rounded-xl bg-green-600 p-3 font-bold text-white"
                >
                  ✅ Valider le virement
                </button>

                <button
                  onClick={() => updatePayout(p.id, "REFUSED")}
                  className="flex-1 rounded-xl bg-red-600 p-3 font-bold text-white"
                >
                  ❌ Refuser
                </button>

              </div>
            )}

          </div>
        ))}

      </div>
    </main>
  );
}