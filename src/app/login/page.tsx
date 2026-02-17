"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  // ✅ next propre (sécurisé)
  const nextUrl = useMemo(() => {
    const raw = searchParams.get("next") || "/client";
    if (!raw.startsWith("/")) return "/client"; // évite redirect externe
    return raw;
  }, [searchParams]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  // ✅ une seule vérif de session au chargement
  useEffect(() => {
    (async () => {

      const { data } = await supabase.auth.getSession();
      if (data.session?.user) {
        router.replace(nextUrl);
        return;
      }
      setChecking(false);
    })();
  }, [router, nextUrl]);

  async function onLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);

    try {
      const supabase = createBrowserSupabaseClient();

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;

      // ✅ force lecture session juste après login
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) throw new Error("Session non créée (cookies/localStorage bloqué ?)");

      router.replace(nextUrl);
    } catch (err: any) {
      setError(err?.message || "Erreur de connexion");
    } finally {
      setLoading(false);
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

        <input
          className="border p-2 rounded"
          type="password"
          placeholder="Mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          className="px-4 py-2 rounded-xl bg-black text-white disabled:opacity-60"
          disabled={loading}
          type="submit"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
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