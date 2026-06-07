"use client";

import Link from "next/link";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { Eye, EyeOff } from "lucide-react";
function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const nextUrl = useMemo(() => {
    const raw = searchParams.get("next") || "/client";
    if (!raw.startsWith("/")) return "/client";
    return raw;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();

        if (cancelled) return;

        if (userData?.user) {
          router.replace(nextUrl);
          return;
        }

        setChecking(false);
      } catch {
        setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [supabase, router, nextUrl]);

 async function onLogin(e: React.FormEvent) {
  e.preventDefault();

  setLoading(true);
  setError(null);

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    const { data: s } = await supabase.auth.getSession();

    if (!s.session) {
      throw new Error("Session non créée.");
    }

    router.replace(nextUrl);

  } catch (err: any) {
    if (
      err?.message?.includes("Invalid login credentials")
    ) {
      setError("Email ou mot de passe incorrect.");
    } else {
      setError(err?.message || "Erreur de connexion");
    }
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
        redirectTo: "https://www.helpflow.fr/reset-password",
      });

      if (error) throw error;

      setInfo("Email de réinitialisation envoyé. Vérifie ta boîte mail.");
    } catch (err: any) {
      setError(err?.message || "Erreur réinitialisation mot de passe");
    } finally {
      setResetLoading(false);
    }
  }

  if (checking) return <div className="p-4">Chargement…</div>;

  return (
    <main className="p-4 max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-4">Connexion</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}
      {info && <p className="text-green-600 mb-2">{info}</p>}

      <form onSubmit={onLogin} className="grid gap-3">
        <input
          className="border p-2 rounded"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

         <div className="relative">
          <input
            className="border p-2 rounded w-full pr-12"
            type={showPassword ? "text" : "password"}
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
           
          >className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <button
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <div className="mt-4 grid gap-2 text-sm">
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={resetLoading}
          className="text-left text-blue-600 disabled:opacity-60"
        >
          {resetLoading ? "Envoi..." : "Mot de passe oublié ?"}
        </button>

        <Link href="/signup" className="text-blue-600">
          Créer un compte
        </Link>
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