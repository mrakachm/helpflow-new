"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string|null>(null);
const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);

    if (error) { setErrorMsg(error.message); return; }
    // succès : on renvoie vers /login
    router.replace("/login");
  }

  return (
    <main style={{ padding: 24, fontFamily: "sans-serif", maxWidth: 420 }}>
      <h1>Créer un compte</h1>
      <form onSubmit={onSubmit}>
        <label> Email
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width:"100%", padding:8, display:"block" }}
          />
        </label>
        <label style={{ marginTop:12 }}> Mot de passe
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width:"100%", padding:8, display:"block" }}
          />
        </label>

        {errorMsg && <p style={{ color:"crimson", marginTop:8 }}>{errorMsg}</p>}

        <button type="submit" disabled={loading} style={{ marginTop:12, padding:"8px 12px" }}>
          {loading ? "Création..." : "Créer mon compte"}
        </button>
      </form>

      <p style={{ marginTop:16 }}>
        Déjà inscrit ? <a href="/login">Se connecter</a>
      </p>
    </main>
  );
}