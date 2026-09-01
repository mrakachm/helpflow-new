"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function Header() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    supabase.auth
      .getUser()
      .then(({ data }) => setConnected(!!data.user));
  }, [supabase]);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <header className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 bg-white px-5 py-4 shadow-sm">

        <Link href="/" className="flex min-w-0 items-center gap-3">
          <div className="h-16 w-28 shrink-0 overflow-hidden rounded-2xl bg-white">
            <Image
              src="/logo-jalin.png"
              alt="Jalin Livraison"
              width={300}
              height={180}
              className="h-full w-full scale-125 object-contain"
              priority
            />
          </div>

          <div className="hidden sm:block">
            <p className="text-lg font-black text-slate-950">
              Jalin Livraison
            </p>

            <p className="text-xs font-semibold text-blue-600">
              Livraison simple, rapide, efficace
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-semibold text-slate-600 md:flex">
          <a href="#helpflow" className="hover:text-blue-700">
            C’est quoi Jalin Livraison ?
          </a>

          <a href="#services" className="hover:text-blue-700">
            Nos services
          </a>

          <a href="#fonctionnement" className="hover:text-blue-700">
            Comment ça marche ?
          </a>
        </nav>

        {connected ? (
          <button
            type="button"
            onClick={logout}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-50"
          >
            Déconnexion
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-blue-700"
          >
            Connexion
          </Link>
        )}
      </div>
    </header>
  );
}