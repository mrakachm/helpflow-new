"use client";

import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ClientHomePage() {
  async function logout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Espace client</h1>

        <button
          onClick={logout}
          className="px-4 py-2 rounded-xl border"
        >
          Déconnexion
        </button>
      </div>

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