"use client";

type OrderStatus = "PENDING" | "ACCEPTED" | "OUT_FOR_DELIVERY" | "DELIVERED";

const STYLES: Record<OrderStatus, string> = {
  PENDING: "bg-yellow-50 text-yellow-800 border border-yellow-200",
  ACCEPTED: "bg-blue-50 text-blue-800 border border-blue-200",
  OUT_FOR_DELIVERY: "bg-purple-50 text-purple-800 border border-purple-200",
  DELIVERED: "bg-green-50 text-green-800 border border-green-200",
};

const LABELS: Record<OrderStatus, string> = {
  PENDING: "En attente",
  ACCEPTED: "Acceptée",
  OUT_FOR_DELIVERY: "En livraison",
  DELIVERED: "Livrée",
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-medium ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}