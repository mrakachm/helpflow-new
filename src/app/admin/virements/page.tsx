"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Profile = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
};

type Payout = {
  id: string;
  courier_id: string;
  amount_cents: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  profile?: Profile | null;
};

function euro(cents: number) {
  return `${(cents / 100).toFixed(2).replace(".", ",")} €`;
}

function statusFr(status: string) {
  if (status === "PENDING") return "En attente";
  if (status === "PAID") return "Payé";
  if (status === "REFUSED") return "Refusé";
  return status;
}

export default function AdminVirementsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [message, setMessage] = useState("");

  async function loadPayouts() {
    const { data: payoutsData, error: payoutsError } = await supabase
      .from("payout_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (payoutsError) {
      setMessage("Erreur chargement virements.");
      setLoading(false);
      return;
    }

    const courierIds = Array.from(
      new Set((payoutsData || []).map((p) => p.courier_id))
    );

    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id, full_name, email, phone")
      .in("id", courierIds);

    const profilesMap = new Map(
      (profilesData || []).map((p) => [p.id, p as Profile])
    );

    const finalData = (payoutsData || []).map((p) => ({
      ...p,
      profile: profilesMap.get(p.courier_id) || null,
    }));

    setPayouts(finalData as Payout[]);
    setLoading(false);
  }

  useEffect(() => {
    async function checkAdmin() {
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.toLowerCase();

     if (data.user) {
  setAuthorized(true);
  await loadPayouts();
} else {
  setAuthorized(false);
  setLoading(false);
}
    }

    checkAdmin();
  }, [supabase]);

  async function updatePayout(id: string, status: "PAID" | "REFUSED") {
    setMessage("");

    const { error } = await supabase
      .from("payout_requests")
      .update({
        status,
        paid_at: status === "PAID" ? new Date().toISOString() : null,
      })
      .eq("id", id);

    if (error) {
      setMessage("Erreur pendant la mise à jour.");
      return;
    }

    setMessage(
      status === "PAID"
        ? "✅ Virement validé avec succès."
        : "❌ Demande refusée."
    );

    await loadPayouts();
  }

  if (!authorized) {
    return (
      <main className="min-h-screen bg-gray-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-6 shadow">
          Accès réservé administrateur.
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-3xl font-bold">💳 Demandes de virements</h1>

        {message && (
          <div className="rounded-2xl bg-green-100 p-4 text-green-700">
            {message}
          </div>
        )}

        {loading && (
          <div className="rounded-3xl bg-white p-5 shadow">Chargement...</div>
        )}

        {!loading && payouts.length === 0 && (
          <div className="rounded-3xl bg-white p-5 shadow">
            Aucune demande de virement.
          </div>
        )}

        {payouts.map((p) => (
          <div key={p.id} className="space-y-3 rounded-3xl bg-white p-5 shadow">
            <p className="text-2xl font-bold">{euro(p.amount_cents)}</p>

            <p>Livreur : {p.profile?.full_name || "Nom non renseigné"}</p>
            <p>Email : {p.profile?.email || "-"}</p>
            <p>Téléphone : {p.profile?.phone || "-"}</p>

            <p>
              Statut : <b>{statusFr(p.status)}</b>
            </p>

            <p className="text-sm text-gray-500">
              Demande : {new Date(p.created_at).toLocaleString("fr-FR")}
            </p>

            {p.paid_at && (
              <p className="text-sm text-green-700">
                Payé le : {new Date(p.paid_at).toLocaleString("fr-FR")}
              </p>
            )}

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