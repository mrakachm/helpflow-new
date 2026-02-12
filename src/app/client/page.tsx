"use client";

import Link from "next/link";

export default function ClientHomePage() {
  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Espace client</h1>

      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/client/new-order"
          className="border rounded-lg p-4 hover:bg-gray-50 transition"
        >
          ➕ Créer une nouvelle commande
        </Link>

        <Link
          href="/client/orders"
          className="border rounded-lg p-4 hover:bg-gray-50 transition"
        >
          📦 Voir mes commandes
        </Link>
      </div>
    </div>
  );
}