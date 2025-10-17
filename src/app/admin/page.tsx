"use client";

import { useEffect, useState } from "react";
import { supabase } from '@/lib/supabase'

type Order = {
  id: string;
  description: string | null;
  weightkg: number | null;
  status: "CREATED" | "ACCEPTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | string;
  created_at: string | null;
  created_by: string | null;
  accepted_by: string | null;
};

export default function AdminPage() {
  const [rows, setRows] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setErr(null);

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) setErr(error.message);
    else setRows((data ?? []) as Order[]);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin – Toutes les commandes</h1>
      {loading && <p>Chargement…</p>}
      {err && <p className="text-red-600">{err}</p>}

      <ul className="space-y-2">
        {rows.map((o) => (
          <li key={o.id} className="border rounded p-3">
            <div className="font-medium">{o.description ?? "(sans description)"}</div>
            <div className="text-sm text-gray-600">
              {o.weightkg ?? "?"} kg — {o.status}
            </div>
            <div className="text-xs text-gray-500">
              créé par {o.created_by ?? "?"} • accepté par {o.accepted_by ?? "—"}
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}