import type { OrderStatus } from "@/types/db";

export default function StatusBadge({ status }: { status: OrderStatus }) {
  const label =
    status === "CREATED" ? "Créée" :
    status === "PENDING" ? "En attente" :
    status === "ACCEPTED" ? "Acceptée" :
    status === "OUT_FOR_DELIVERY" ? "En livraison" :
    "Livrée";

  return (
    <span className="inline-block px-2 py-1 rounded bg-gray-100 text-xs font-medium">
      {label}
    </span>
  );
}
