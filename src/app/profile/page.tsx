"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function ProfilePage() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [loading, setLoading] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadSession() {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user ?? null);
      setSessionChecked(true);
    }

    loadSession();
  }, [supabase]);

  async function addBankAccount() {
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    const currentUser = data.session?.user;

    if (!currentUser) {
      setLoading(false);
      window.location.href = "/login?next=/profile";
      return;
    }

    const res = await fetch("/api/stripe-connect/onboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: currentUser.id,
        email: currentUser.email,
      }),
    });

    const result = await res.json();
    setLoading(false);

    if (result.url) {
      window.location.href = result.url;
    } else {
      alert(result.error || "Impossible d'ajouter le compte bancaire.");
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-xl space-y-5 rounded-3xl bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Mon profil</h1>

        <Link
          href="/profile/edit"
          className="block rounded-2xl border px-4 py-3 font-semibold text-slate-800"
        >
          Modifier mon profil
        </Link>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
          <h2 className="text-xl font-bold text-slate-900">
            Ajouter mon compte bancaire
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Ajoutez votre compte bancaire pour recevoir l'argent de vos livraisons.
          </p>

          <button
            type="button"
            onClick={addBankAccount}
            disabled={loading || !sessionChecked}
            className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-4 font-bold text-white disabled:opacity-60"
          >
            {loading ? "Ouverture..." : "Ajouter mon compte bancaire"}
          </button>
        </div>
      </div>
    </main>
  );
}