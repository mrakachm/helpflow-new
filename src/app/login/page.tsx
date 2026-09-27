"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const requestedNextUrl = useMemo(() => {
    const raw = searchParams.get("next");
    return raw && raw.startsWith("/") ? raw : null;
  }, [searchParams]);

  const fromEstimate = searchParams.get("from") === "estimate";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  function getSafeStoredPath() {
    if (typeof window === "undefined") return null;

    const stored = sessionStorage.getItem("jalin_after_login_path");

    if (!stored || !stored.startsWith("/")) {
      return null;
    }

    return stored;
  }

  function hasPendingEstimate() {
    if (typeof window === "undefined") return false;

    try {
      const raw = sessionStorage.getItem("jalin_pending_estimate");
      if (!raw) return false;

      const parsed = JSON.parse(raw);

      return Boolean(
        parsed?.pickupAddress &&
          parsed?.dropoffAddress &&
          parsed?.vehicleRequired
      );
    } catch {
      return false;
    }
  }

  function resolveNextUrl() {
    if (requestedNextUrl) {
      return requestedNextUrl;
    }

    const storedPath = getSafeStoredPath();

    if (storedPath) {
      return storedPath;
    }

    if (fromEstimate || hasPendingEstimate()) {
      return "/client/new-order?from=estimate";
    }

    return "/client";
  }

  function clearLoginRedirectIfUsed(destination: string) {
    if (
      destination === "/client/new-order?from=estimate" ||
      destination.startsWith("/client/new-order")
    ) {
      sessionStorage.removeItem("jalin_after_login_path");
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function checkUser() {
      const { data } = await supabase.auth.getUser();

      if (cancelled) return;

      if (data.user) {
        const destination = resolveNextUrl();
        clearLoginRedirectIfUsed(destination);
        router.replace(destination);
        return;
      }

      setChecking(false);
    }

    checkUser();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, requestedNextUrl, fromEstimate]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw new Error("Email ou mot de passe incorrect.");
      }

      const destination = resolveNextUrl();

      clearLoginRedirectIfUsed(destination);

      router.replace(destination);
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
      setError(
        "Entre ton email avant de demander la réinitialisation."
      );
      return;
    }

    try {
      setResetLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo:
            "https://www.jalinlivraison.fr/update-password",
        }
      );

      if (error) throw error;

      setInfo(
        "Email de réinitialisation envoyé. Vérifie ta boîte mail."
      );
    } catch (err: any) {
      setError(
        err?.message || "Erreur réinitialisation mot de passe"
      );
    } finally {
      setResetLoading(false);
    }
  }

  const signupHref =
    fromEstimate || requestedNextUrl?.includes("/client/new-order")
      ? "/signup?from=estimate&next=/client/new-order"
      : "/signup";

  if (checking) {
    return <div className="p-4">Chargement...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 flex items-center justify-center">
      <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500">
          <img
            src="/logo-jalin.png"
            alt="Jalin Livraison"
            className="h-16 w-16 rounded-2xl object-contain"
          />
        </div>

        <h1 className="text-center text-3xl font-bold text-white">
          Connexion
        </h1>

        <p className="mt-2 text-center text-slate-300">
          Connectez-vous à votre espace Jalin Livraison.
        </p>

        {(fromEstimate || hasPendingEstimate()) && (
          <div className="mt-4 rounded-xl border border-blue-500/30 bg-blue-500/10 p-3 text-sm text-blue-200">
            Votre estimation est conservée. Après connexion, vous
            reprendrez directement votre commande.
          </div>
        )}

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
            autoComplete="email"
            required
          />

          <div className="relative">
            <input
              className="w-full rounded-xl border border-slate-600 bg-slate-800 px-4 py-3 pr-14 text-white outline-none placeholder:text-slate-400 focus:border-emerald-400"
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-slate-300"
              aria-label={
                showPassword
                  ? "Masquer le mot de passe"
                  : "Afficher le mot de passe"
              }
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
            {resetLoading
              ? "Envoi..."
              : "Mot de passe oublié ?"}
          </button>

          <Link
            href={signupHref}
            className="font-semibold text-emerald-400"
          >
            Créer un compte
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
