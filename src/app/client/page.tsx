"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

type Status = "CREATED" | "ACCEPTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

type Order = {
  id: string;
  description: string | null;
  pickup_address: string | null;
  pickup_city: string | null;
  pickup_postal_code: string | null;
  dropoff_address: string | null;
  dropoff_city: string | null;
  dropoff_postal_code: string | null;
  weight_kg: number | null;
  bags_count: number | null;
  status: Status;
  created_at: string;
};

export default function ClientPage() {
  const { user, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [pending, setPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user || loading) return;
    async function load() {
      setPending(true);
      setErrorMsg(null);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
        setErrorMsg("Erreur lors du chargement des commandes.");
      } else {
        setOrders(data || []);
      }
      setPending(false);
    }
    load();
  }, [user, loading]);

  function mapsUrl(o: Partial<Order>) {
    const q = encodeURIComponent(
      `${o.dropoff_address || ""}, ${o.dropoff_postal_code || ""} ${o.dropoff_city || ""}`
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  }

  if (loading) return <p className="p-6">Chargement...</p>;

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold mb-6">Mes commandes</h1>

      {errorMsg && <p className="text-red-600 mb-4">{errorMsg}</p>}

      {pending ? (
        <p>Chargement des commandes...</p>
      ) : orders.length === 0 ? (
        <div className="text-center text-gray-500">
          <p>Aucune commande pour le moment.</p>
          <Link href="/client/new-order">
            <Button className="mt-4">+ Nouvelle commande</Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="border rounded-xl p-4 shadow-sm bg-white space-y-2"
            >
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">
                  Créée le {new Date(o.created_at).toLocaleDateString("fr-FR")}
                </span>
                <span className="text-sm font-medium">{o.status}</span>
              </div>

              <p><strong>Départ :</strong> {o.pickup_address}, {o.pickup_postal_code} {o.pickup_city}</p>
              <p><strong>Arrivée :</strong> {o.dropoff_address}, {o.dropoff_postal_code} {o.dropoff_city}</p>

              <p><strong>Détails :</strong> {o.weight_kg} kg — {o.bags_count} sac(s)</p>

              {o.description && <p><strong>Description :</strong> {o.description}</p>}

              <a
                href={mapsUrl(o)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm inline-flex items-center gap-1"
              >
                🗺️ Ouvrir dans Google Maps
              </a>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}