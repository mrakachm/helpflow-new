"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Mission = {
  id: string;
  pickup_address: string | null;
  pickup_city: string | null;
  dropoff_address: string | null;
  dropoff_city: string | null;
  distance_km: number | null;
  scheduled_at: string | null;
  price_cents: number | null;
  parcel_type: string | null;
  parcel_note: string | null;
};

function formatEuro(cents?: number | null) {
  if (typeof cents !== "number") return "—";
  return (cents / 100).toFixed(2) + " €";
}

export default function MissionsPage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string>("");

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setMsg("");

      try {
        const { data, error } = await supabase
          .from("orders")
          .select(
            `
            id,
            pickup_address,
            pickup_city,
            dropoff_address,
            dropoff_city,
            distance_km,
            scheduled_at,
            price_cents,
            parcel_type,
            parcel_note
          `
          )
        .eq("status", "PUBLISHED")
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (isMounted) setMissions((data as Mission[]) || []);
      } catch (e: any) {
        if (isMounted) setMsg(e?.message || "Erreur chargement missions");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-xl font-semibold">Missions disponibles</h1>

      {msg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {msg}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-500">Chargement…</div>
      ) : missions.length === 0 ? (
        <div className="text-sm text-gray-500">Aucune mission.</div>
      ) : (
        <div className="space-y-3">
          {missions.map((m) => (
            <div key={m.id} className="border rounded-xl p-4 space-y-2">
              <div>
                <div className="font-medium">
                  {m.pickup_address || "—"} {m.pickup_city ? `(${m.pickup_city})` : ""}
                </div>
                <div className="text-sm text-gray-600">
                  → {m.dropoff_address || "—"} {m.dropoff_city ? `(${m.dropoff_city})` : ""}
                </div>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  <span className="font-medium text-gray-900">Type :</span>{" "}
                  {m.parcel_type || "—"}
                </div>

                {m.parcel_note ? (
                  <div className="mt-1">
                    <span className="font-medium text-gray-900">Note :</span>{" "}
                    <span className="line-clamp-2">{m.parcel_note}</span>
                  </div>
                ) : null}

                <div className="mt-1">
                  <span className="font-medium text-gray-900">Prix :</span>{" "}
                  {formatEuro(m.price_cents)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}