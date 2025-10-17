"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";
import Button from "@/components/ui/Button";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";

type Status = "CREATED" | "ACCEPTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

type Order = {
  id: string;
  description: string | null;

  pickup_address?: string | null;
  pickup_city?: string | null;
  pickup_postal_code?: string | null;

  dropoff_address?: string | null;
  dropoff_city?: string | null;
  dropoff_postal_code?: string | null;
  city?: string | null;         // compat
  postal_code?: string | null;  // compat

  weight_kg?: number | null;
  bags_count?: number | null;

  status: Status;
  created_at: string;
  created_by: string;
  accepted_by?: string | null;
};

function mapsUrl(o: Partial<Order>) {
  const q = encodeURIComponent(
    `${o.dropoff_address ?? ""}, ${(o.dropoff_postal_code ?? o.postal_code) ?? ""} ${(o.dropoff_city ?? o.city) ?? ""}`.trim()
  );
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function LivreurPage() {
  const { user, loading } = useAuth();

  const [toAccept, setToAccept] = useState<Order[]>([]);
  const [inProgress, setInProgress] = useState<Order[]>([]);
  const [delivered, setDelivered] = useState<Order[]>([]);
  const [busy, setBusy] = useState(true);

  async function reload() {
    setBusy(true);

    const [r1, r2, r3] = await Promise.all([
      supabase.from("orders").select("*").is("accepted_by", null).eq("status", "CREATED").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("accepted_by", user?.id ?? "").in("status", ["ACCEPTED", "OUT_FOR_DELIVERY"]).order("created_at", { ascending: false }),
      supabase.from("orders").select("*").eq("accepted_by", user?.id ?? "").eq("status", "DELIVERED").order("created_at", { ascending: false }).limit(10),
    ]);

    if (!r1.error && r1.data) setToAccept(r1.data as Order[]);
    if (!r2.error && r2.data) setInProgress(r2.data as Order[]);
    if (!r3.error && r3.data) setDelivered(r3.data as Order[]);
    setBusy(false);
  }

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    reload();

    // petit realtime (optionnel)
    const ch = supabase
      .channel("livreur-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, reload)
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [user, loading]);

  async function accept(o: Order) {
    await supabase.from("orders").update({ accepted_by: user?.id, status: "ACCEPTED" }).eq("id", o.id);
    reload();
  }

  async function setOutForDelivery(o: Order) {
    await supabase.from("orders").update({ status: "OUT_FOR_DELIVERY" }).eq("id", o.id);
    reload();
  }

  async function setDeliveredStatus(o: Order) {
    await supabase.from("orders").update({ status: "DELIVERED" }).eq("id", o.id);
    reload();
  }

  if (loading) return <p className="p-6">Chargement…</p>;
  if (!user) return <p className="p-6">Veuillez vous connecter.</p>;

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Tableau du livreur</h1>

      {/* À accepter */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">À accepter</h2>
        {busy ? (
          <div className="space-y-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : toAccept.length === 0 ? (
          <EmptyState title="Rien à accepter pour le moment." />
        ) : (
          toAccept.map((o) => (
            <Card key={o.id}>
              <CardHeader className="flex items-center justify-between">
                <div className="font-medium">
                  <span className="opacity-60 mr-2">#{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <a href={mapsUrl(o)} target="_blank" rel="noreferrer">
                  <Button variant="secondary">Google Maps</Button>
                </a>
              </CardHeader>
              <CardBody className="text-sm space-y-1">
                <div><strong>Départ :</strong> {o.pickup_address} — {o.pickup_postal_code} {o.pickup_city}</div>
                <div><strong>Arrivée :</strong> {o.dropoff_address} — {(o.dropoff_postal_code ?? o.postal_code) ?? ""} {(o.dropoff_city ?? o.city) ?? ""}</div>
                <div className="pt-2">
                  <Button onClick={() => accept(o)}>Accepter</Button>
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </section>

      {/* En cours */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">En cours</h2>
        {busy ? (
          <div className="space-y-2">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : inProgress.length === 0 ? (
          <EmptyState title="Aucune commande en cours." />
        ) : (
          inProgress.map((o) => (
            <Card key={o.id}>
              <CardHeader className="flex items-center justify-between">
                <div className="font-medium">
                  <span className="opacity-60 mr-2">#{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <a href={mapsUrl(o)} target="_blank" rel="noreferrer">
                  <Button variant="secondary">Google Maps</Button>
                </a>
              </CardHeader>
              <CardBody className="text-sm space-y-2">
                <div><strong>Départ :</strong> {o.pickup_address} — {o.pickup_postal_code} {o.pickup_city}</div>
                <div><strong>Arrivée :</strong> {o.dropoff_address} — {(o.dropoff_postal_code ?? o.postal_code) ?? ""} {(o.dropoff_city ?? o.city) ?? ""}</div>

                <div className="flex gap-2 pt-2">
                  {o.status === "ACCEPTED" && (
                    <Button onClick={() => setOutForDelivery(o)}>Passer « En livraison »</Button>
                  )}
                  {o.status === "OUT_FOR_DELIVERY" && (
                    <Button onClick={() => setDeliveredStatus(o)}>Marquer « Livrée »</Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ))
        )}
      </section>

      {/* Livrées */}
      <section className="space-y-3">
        <h2 className="text-lg font-medium">Livrées (10 dernières)</h2>
        {busy ? (
          <Skeleton className="h-24" />
        ) : delivered.length === 0 ? (
          <EmptyState title="Aucune commande livrée pour l’instant." />
        ) : (
          delivered.map((o) => (
            <Card key={o.id}>
              <CardHeader className="flex items-center justify-between">
                <div className="font-medium">
                  <span className="opacity-60 mr-2">#{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <a href={mapsUrl(o)} target="_blank" rel="noreferrer">
                  <Button variant="secondary">Google Maps</Button>
                </a>
              </CardHeader>
              <CardBody className="text-sm">
                <div><strong>Arrivée :</strong> {o.dropoff_address} — {(o.dropoff_postal_code ?? o.postal_code) ?? ""} {(o.dropoff_city ?? o.city) ?? ""}</div>
              </CardBody>
            </Card>
          ))
        )}
      </section>
    </main>
  );
}
async function accept(o: { id: string }) {
  const { user } = useAuth(); // ou récupère user.id comme tu le fais déjà
  const { error } = await supabase
    .from("orders")
    .update({
      accepted_by: user!.id,
      status: "ACCEPTED",
    })
    .eq("id", o.id)
    // ces garde-fous aident et évitent les races :
    .eq("status", "CREATED")
    .is("accepted_by", null);

  if (error) alert("Erreur acceptation : " + error.message);
}
async function start(o: { id: string }) {
  const { user } = useAuth();
  const { error } = await supabase
    .from("orders")
    .update({ status: "OUT_FOR_DELIVERY" })
    .eq("id", o.id)
    .eq("accepted_by", user!.id);

  if (error) alert("Erreur démarrage : " + error.message);
}
async function delivered(o: { id: string }) {
  const { user } = useAuth();
  const { error } = await supabase
    .from("orders")
    .update({ status: "DELIVERED" })
    .eq("id", o.id)
    .eq("accepted_by", user!.id);

  if (error) alert("Erreur livraison : " + error.message);
}