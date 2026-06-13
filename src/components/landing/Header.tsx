"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function Header() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setConnected(!!data.user);
    });
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="mx-auto w-full max-w-5xl px-6 pt-8">
      <div className="flex items-center justify-between rounded-2xl bg-white/80 backdrop-blur border border-slate-200 px-4 py-3 shadow-sm">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <Image
              src="/logo-helpflow.png"
              alt="HelpFlow"
              width={40}
              height={40}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>

          <div>
            <p className="font-semibold text-slate-900">HelpFlow</p>
            <p className="text-xs text-slate-500">Simple • Rapide • Efficace</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/client"
            className="hidden sm:inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Espace client
          </Link>

          <Link
            href="/livreur/missions"
            className="hidden sm:inline-flex rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Espace livreur
          </Link>

          {connected ? (
            <button
              onClick={logout}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}