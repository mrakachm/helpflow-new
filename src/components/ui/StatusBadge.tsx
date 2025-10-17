"use client";

type Status = "CREATED" | "ACCEPTED" | "OUT_FOR_DELIVERY" | "DELIVERED" | "CANCELLED";

const LABELS: Record<Status, string> = {
  CREATED: "Créée",
  ACCEPTED: "Acceptée",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

const CLASSES: Record<Status, string> = {
  CREATED: "bg-gray-100 text-gray-700 ring-1 ring-gray-200",
  ACCEPTED: "bg-yellow-100 text-yellow-800 ring-1 ring-yellow-200",
  OUT_FOR_DELIVERY: "bg-blue-100 text-blue-800 ring-1 ring-blue-200",
  DELIVERED: "bg-green-100 text-green-800 ring-1 ring-green-200",
  CANCELLED: "bg-rose-100 text-rose-800 ring-1 ring-rose-200",
};

export default function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}