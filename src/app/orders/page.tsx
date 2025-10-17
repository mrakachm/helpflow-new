"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import StatusBadge from "@/components/ui/StatusBadge";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

type Status =
  | "CREATED"
  | "ACCEPTED"
  | "OUT_FOR_DELIVERY"
  | "DELIVERED"
  | "CANCELLED";

type Order = {
  id: string;
  description: string | null;

  // anciens champs (compat)
  city?: string | null;
  postal_code?: string | null;

  // nouveaux champs
  pickup_address?: string | null;
  pickup_city?: string | null;
  pickup_postal_code?: string | null;

  dropoff_address?: string | null;
  dropoff_city?: string | null;
  dropoff_postal_code?: string | null;

  weight_kg?: number | null;
  bags_count?: number | null;

  status: Status;
  created_at: string;
  created_by: string;
  accepted_by?: string | null;
};

function mapsUrl(o: Partial<Order>) {
  const addr = o.dropoff_address ?? "";
  const cp = o.dropoff_postal_code ?? o.postal_code ?? "";
  const city = o.dropoff_city ?? o.city ?? "";
  const q = encodeURIComponent(`${addr}, ${cp} ${city}`.trim());
  return `https://www.google.com/maps/search/?api=1&query=${q}`;
}

export default function OrdersHistoryPage() {
  const { user, loading } = useAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<Status | "ALL">("ALL");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(true);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<10 | 20 | 50>(10);

  const loadOrders = useCallback(async () => {
    if (!user?.id) return;
    setBusy(true);

    let query = supabase
      .from("orders")
      .select("*")
      .eq("created_by", user.id)
      .order("created_at", { ascending: sortDir === "asc" });

    if (statusFilter !== "ALL") query = query.eq("status", statusFilter);

    if (q.trim()) {
      const like = `%${q.trim()}%`;
      query = query.or(
        [
          `description.ilike.${like}`,
          `pickup_address.ilike.${like}`,
          `dropoff_address.ilike.${like}`,
          `pickup_city.ilike.${like}`,
          `dropoff_city.ilike.${like}`,
        ].join(",")
      );
    }

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error } = await query.range(from, to);

    setBusy(false);
    if (!error && data) setOrders(data as Order[]);
  }, [user?.id, statusFilter, sortDir, q, page, pageSize]);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    loadOrders();
  }, [user, loading, loadOrders]);

  const hasResults = orders.length > 0;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Mes commandes</h1>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 items-center">
        <input
          className="border rounded p-2 flex-1 min-w-[220px]"
          placeholder="Recherche (adresse, ville, description)"
          value={q}
          onChange={(e) => {
            setPage(1);
            setQ(e.target.value);
          }}
        />

        <select
          className="border rounded p-2"
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value as any);
          }}
        >
          {(["ALL","CREATED","ACCEPTED","OUT_FOR_DELIVERY","DELIVERED","CANCELLED"] as const).map((s) => (
            <option key={s} value={s}>
              {s === "ALL" ? "Tous les statuts" : s}
            </option>
          ))}
        </select>

        <select
          className="border rounded p-2"
          value={sortDir}
          onChange={(e) => setSortDir(e.target.value as "asc" | "desc")}
        >
          <option value="desc">Plus récentes d’abord</option>
          <option value="asc">Plus anciennes d’abord</option>
        </select>

        <select
          className="border rounded p-2"
          value={pageSize}
          onChange={(e) => {
            setPage(1);
            setPageSize(Number(e.target.value) as any);
          }}
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>
      </div>

      {/* Skeleton */}
      {busy && (
        <div className="space-y-3">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {/* Vide */}
      {!busy && !hasResults && (
        <EmptyState title="Aucune commande pour le moment.">
          <a className="inline-block mt-4" href="/client/new-order">
            <Button>+ Nouvelle commande</Button>
          </a>
        </EmptyState>
      )}

      {/* Liste */}
      {!busy && hasResults && (
        <div className="space-y-3">
          {orders.map((o) => (
            <Card key={o.id}>
              <CardHeader className="flex items-center justify-between gap-4">
                <div className="font-medium">
                  <span className="opacity-60 mr-2">#{o.id.slice(0, 8)}</span>
                  <StatusBadge status={o.status} />
                </div>
                <div className="text-sm opacity-70">
                  {new Date(o.created_at).toLocaleString()}
                </div>
              </CardHeader>

              <CardBody className="space-y-2">
                <div className="text-sm">
                  <div>
                    <strong>Départ :</strong>{" "}
                    {o.pickup_address} — {o.pickup_postal_code} {o.pickup_city}
                  </div>
                  <div>
                    <strong>Arrivée :</strong>{" "}
                    {o.dropoff_address} —{" "}
                    {(o.dropoff_postal_code ?? o.postal_code) ?? ""}{" "}
                    {(o.dropoff_city ?? o.city) ?? ""}
                  </div>
                </div>

                <div className="text-sm opacity-80">
                  <strong>Détails :</strong>{" "}
                  {o.weight_kg != null ? `${o.weight_kg} kg` : "—"} •{" "}
                  {o.bags_count != null ? `${o.bags_count} sac(s)` : "—"}
                </div>

                {o.description && (
                  <div className="text-sm italic opacity-80">{o.description}</div>
                )}

                <div className="pt-2">
                  <a href={mapsUrl(o)} target="_blank" rel="noreferrer" className="inline-flex">
                    <Button variant="secondary">Ouvrir dans Google Maps</Button>
                  </a>
                </div>
              </CardBody>
            </Card>
          ))}

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="secondary"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Précédent
            </Button>
            <div className="text-sm opacity-70">Page {page}</div>
            <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
              Suivant →
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
