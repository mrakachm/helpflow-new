"use client";

type Order = {
  id: string;
  status: string | null;
  pickup_start: string | null;
  pickup_end: string | null;
  accepted_by: string | null;
  picked_up_at: string | null;
  pickup_address: string | null;
  dropoff_address: string | null;
};

export default function ClientOrderTimeline({ order }: { order: Order }) {
  const steps = [
    {
      key: "SCHEDULED",
      label: "Créneau choisi",
      done: Boolean(order.pickup_start || order.pickup_end),
    },
    {
      key: "AVAILABLE",
      label: "Disponible (prêt à envoyer)",
      done: order.status === "CREATED" || order.status === "PENDING" || !!order.status,
    },
    {
      key: "ACCEPTED",
      label: "Livreur accepté",
      done: Boolean(order.accepted_by) || order.status === "ACCEPTED",
    },
    {
      key: "PICKED_UP",
      label: "Colis récupéré",
      done: Boolean(order.picked_up_at),
    },
    {
      key: "ARRIVED",
      label: "Arrivé",
      done: order.status === "DELIVERED" || order.status === "ARRIVED",
    },
  ];

  return (
    <div className="rounded-xl border p-4 space-y-3">
      <div className="font-semibold">Suivi du colis</div>

      <div className="space-y-2">
        {steps.map((s) => (
          <div key={s.key} className="flex items-center gap-2">
            <span className="text-lg">{s.done ? "✅" : "⭕"}</span>
            <span className={s.done ? "font-medium" : "text-gray-500"}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      <div className="text-sm text-gray-600">
        Statut actuel : <b>{order.status ?? "—"}</b>
      </div>
    </div>
  );
}
