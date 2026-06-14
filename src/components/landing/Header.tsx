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
    <header className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="flex items-center justify-between gap-3 rounded-3xl border border-blue-100 bg-white/95 px-5 py-4 shadow-sm backdrop-blur">
        <Link href="/" className="flex items-center gap-3">
          <div className="h-11 w-11 overflow-hidden rounded-xl bg-white ring-1 ring-blue-100">
            <Image
              src="/logo-helpflow.png"
              alt="HelpFlow"
              width={44}
              height={44}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>

          <div>
            <p className="font-extrabold text-slate-900">
              HelpFlow
            </p>

            <p className="text-xs font-medium text-blue-600">
              Achats locaux • Marketplace • Colis
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {connected ? (
            <button
              onClick={logout}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Déconnexion
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}