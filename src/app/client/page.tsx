"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import Link from "next/link";

<button
  onClick={async () => {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }}
  className="px-4 py-2 rounded-xl border"
>
  Déconnexion
</button>

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