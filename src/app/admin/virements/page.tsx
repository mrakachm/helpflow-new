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

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("payout_requests")
        .select("*")
        .order("created_at", { ascending: false });

      setPayouts((data || []) as Payout[]);
      setLoading(false);
    }

    load();
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-5">

        <h1 className="text-3xl font-bold">
          💳 Demandes de virements
        </h1>

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
            className="bg-white rounded-3xl p-5 shadow"
          >
            <p className="font-bold text-xl">
              {euro(p.amount_cents)}
            </p>

            <p>
              Livreur : {p.courier_id}
            </p>

            <p>
              Statut : {p.status}
            </p>

            <p className="text-sm text-gray-500">
              {new Date(p.created_at).toLocaleString("fr-FR")}
            </p>
          </div>
        ))}

      </div>
    </main>
  );
}