"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "../../../lib/supabase/client";

type OrderStatus = "DRAFT" | "PENDING" | "ACCEPTED" | "OUT_FOR_DELIVERY" | "DELIVERED";

type Order = {
  id: string;
  created_at: string;
  pickup_city: string | null;
  dropoff_city: string | null;
  bag_count: number | null;
  weight_kg: number | null;
  status: OrderStatus;
  courier_id?: string | null;
  courier_amount?: number | null; // ✅ ce que le livreur doit gagner
};

export default function LivreurPage() {
  const [pending, setPending] = useState<Order[]>([]);
  const [mine, setMine] = useState<Order[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  async function refresh() {
    setErr(null);

    // Commandes disponibles (PENDING)
    const { data: p, error: e1 } = await supabase
      .from("orders")
      .select("id, created_at, pickup_city, dropoff_city, bag_count, weight_kg, status, courier_amount")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (e1) return setErr(e1.message);
    setPending((p as any) || []);

    // Mes courses
    const { data: userRes } = await supabase.auth.getUser();
    const uid = userRes?.user?.id;
    if (!uid) return setErr("Non connecté.");

    const { data: m, error: e2 } = await supabase
      .from("orders")
      .select("id, created_at, pickup_city, dropoff_city, bag_count, weight_kg, status, courier_amount")
      .eq("courier_id", uid)
      .order("created_at", { ascending: false });

    if (e2) return setErr(e2.message);
    setMine((m as any) || []);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function accept(id: string) {
    try {
      setBusyId(id);
      setErr(null);

      const { data: userRes } = await supabase.auth.getUser();
      const uid = userRes?.user?.id;
      if (!uid) throw new Error("Non connecté.");

      const { error } = await supabase
        .from("orders")
        .update({ status: "ACCEPTED", courier_id: uid })
        .eq("id", id);

      if (error) throw error;
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  async function advance(id: string, from: OrderStatus) {
    const next: Record<OrderStatus, OrderStatus> = {
      DRAFT: "DRAFT",
      PENDING: "PENDING",
      ACCEPTED: "OUT_FOR_DELIVERY",
      OUT_FOR_DELIVERY: "DELIVERED",
      DELIVERED: "DELIVERED",
    };

    try {
      setBusyId(id);
      setErr(null);

      // Si on veut passer à DELIVERED -> demander OTP
      const goingTo = next[from];
      if (from === "OUT_FOR_DELIVERY" && goingTo === "DELIVERED") {
        const otp = window.prompt("Entrez le code OTP (4 chiffres) donné par le client :");
        if (!otp) throw new Error("OTP requis.");

        // Vérifie OTP en base (pour test : otp_code en clair)
        const { data: order, error: e1 } = await supabase
          .from("orders")
          .select("otp_code")
          .eq("id", id)
          .single();

        if (e1) throw e1;
        if ((order as any)?.otp_code !== otp.trim()) {
          throw new Error("OTP incorrect.");
        }
      }

      const { error } = await supabase
        .from("orders")
        .update({ status: goingTo })
        .eq("id", id);

      if (error) throw error;
      await refresh();
    } catch (e: any) {
      setErr(e?.message || "Erreur");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <main className="p-6 max-w-5xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Espace livreur</h1>

      {err && <p className="text-red-600">{err}</p>}

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Commandes disponibles</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Départ</th>
                <th className="p-2 border">Arrivée</th>
                <th className="p-2 border">Sacs / Poids</th>
                <th className="p-2 border">Gain livreur</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((o) => (
                <tr key={o.id}>
                  <td className="p-2 border">{o.id.slice(0, 8)}</td>
                  <td className="p-2 border">{o.pickup_city ?? "-"}</td>
                  <td className="p-2 border">{o.dropoff_city ?? "-"}</td>
                  <td className="p-2 border">
                    {o.bag_count ?? 0} sac(s) / {o.weight_kg ?? 0} kg
                  </td>
                  <td className="p-2 border">
                    {(o.courier_amount ?? 0).toFixed(2)} €
                  </td>
                  <td className="p-2 border">
                    <button
                      className="px-3 py-1 rounded bg-blue-600 text-white"
                      disabled={busyId === o.id}
                      onClick={() => accept(o.id)}
                    >
                      {busyId === o.id ? "..." : "Accepter"}
                    </button>
                  </td>
                </tr>
              ))}
              {pending.length === 0 && (
                <tr>
                  <td className="p-3 border text-center" colSpan={6}>
                    Aucune commande disponible
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Mes commandes</h2>
        <div className="overflow-auto">
          <table className="min-w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 border">#</th>
                <th className="p-2 border">Départ</th>
                <th className="p-2 border">Arrivée</th>
                <th className="p-2 border">Statut</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((o) => (
                <tr key={o.id}>
                  <td className="p-2 border">{o.id.slice(0, 8)}</td>
                  <td className="p-2 border">{o.pickup_city ?? "-"}</td>
                  <td className="p-2 border">{o.dropoff_city ?? "-"}</td>
                  <td className="p-2 border">{o.status}</td>
                  <td className="p-2 border">
                    {o.status === "ACCEPTED" && (
                      <button
                        className="px-3 py-1 rounded bg-amber-600 text-white"
                        disabled={busyId === o.id}
                        onClick={() => advance(o.id, o.status)}
                      >
                        Démarrer livraison
                      </button>
                    )}

                    {o.status === "OUT_FOR_DELIVERY" && (
                      <button
                        className="px-3 py-1 rounded bg-green-600 text-white"
                        disabled={busyId === o.id}
                        onClick={() => advance(o.id, o.status)}
                      >
                        Marquer livrée (OTP)
                      </button>
                    )}

                    {o.status === "DELIVERED" && (
                      <span className="text-green-700 font-semibold">Terminée ✅</span>
                    )}
                  </td>
                </tr>
              ))}
              {mine.length === 0 && (
                <tr>
                  <td className="p-3 border text-center" colSpan={5}>
                    Aucune commande
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
