"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const nextUrl = useMemo(() => {
    const raw = searchParams.get("next");
    return raw && raw.startsWith("/") ? raw : null;
  }, [searchParams]);

  const roleTarget = useMemo(() => {
    const raw = searchParams.get("role");
    return raw === "client" || raw === "livreur" ? raw : null;
  }, [searchParams]);

  const signupHref = useMemo(() => {
    if (roleTarget === "livreur") return "/livreur/signup";
    if (nextUrl) return `/signup?next=${encodeURIComponent(nextUrl)}`;
    return "/signup";
  }, [nextUrl, roleTarget]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function redirectByRole(userId: string) {
    if (nextUrl) {
      router.replace(nextUrl);
      return;
    }

    if (roleTarget === "client") {
      router.replace("/client");
      return;
    }

    if (roleTarget === "livreur") {
      router.replace("/livreur/missions");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (profile?.role === "livreur") {
      router.replace("/livreur/missions");
    } else {
      router.replace("/client");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (cancelled) return;

      if (data.user) {
        await redirectByRole(data.user.id);
        return;
      }

      setChecking(false);
    }

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [supabase, nextUrl, roleTarget]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email ou mot de passe incorrect.");
        }
        throw error;
      }

      if (!data.user) throw new Error("Utilisateur introuvable.");

      await redirectByRole(data.user.id);
    } catch (err: any) {
      setError(err?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }

  async function onForgotPassword() {
    setError(null);
    setInfo(null);

    if (!email.trim()) {
      setError("Entre ton email avant de demander la réinitialisation.");
      return;
    }

    try {
      setResetLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: "https://www.helpflow.fr/update-password",
      });

      if (error) throw error;

      setInfo("Email de réinitialisation envoyé. Vérifie ta boîte mail.");
    } catch (err: any) {
      setError(err?.message || "Erreur réinitialisation mot de passe");
    } finally {
      setResetLoading(false);
    }
  }

  if (checking) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500 text-2xl font-bold text-white">
          <img
            src="/logo-helpflow.png"
            alt="HelpFlow"
            className="mx-auto h-16 w-16 rounded-2xl object-contain"
          />
        </div>

        <h1 className="text-center text-3xl font-bold text-white">
          Connexion
        </h1>

        <p className="mt-2 text-center text-slate-300">
          Connectez-vous à votre espace HelpFlow.
        </p>

        {error && (
          <p className="mt-4 rounded-xl bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </p>
        )}

        {info && (
          <p className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-300">
            {info}
          </p>
        )}

        <form onSubmit={onLogin} className="mt-6 grid gap-4">
          <input
            className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 text-white outline-none placeholder:text-slate-400 focus:border-emerald-400"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <input
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 pr-14 text-white outline-none placeholder:text-slate-400 focus:border-emerald-400"
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-300"
            >
              👁️
            </button>
          </div>

          <button
            className="rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white disabled:opacity-60"
            disabled={loading}
            type="submit"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <div className="mt-5 grid gap-3 text-center text-sm">
          <button
            type="button"
            onClick={onForgotPassword}
            disabled={resetLoading}
            className="text-emerald-300 disabled:opacity-60"
          >
            {resetLoading ? "Envoi..." : "Mot de passe oublié ?"}
          </button>

          <Link href={signupHref} className="font-semibold text-emerald-400">
            Créer un compte utilisateur
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginPageInner />
    </Suspense>
  );
}