"use client";

import { useEffect, useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from '@/lib/supabase'

export default function UpdatePasswordPage() {

  const router = useRouter();
  const params = useSearchParams();

  const [pwd, setPwd] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Optionnel : vérifier qu’on vient bien d’un lien de reset
  useEffect(() => {
    const type = params.get("type");
    if (type !== "recovery") {
      // on autorise quand même pour simplifier le dev
    }
  }, [params]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pwd });
    setBusy(false);
    if (error) return setErr(error.message);
    setOk(true);
    setTimeout(() => router.replace("/login"), 1000);
  }

  return (
    <main className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-xl font-semibold mb-4">Nouveau mot de passe</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2"
          type="password"
          placeholder="Nouveau mot de passe"
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
        />
        <button
          type="submit"
          disabled={busy}
          className="w-full bg-black text-white rounded px-3 py-2"
        >
          Mettre à jour
        </button>
      </form>
      {err && <p className="text-red-600 mt-3">{err}</p>}
      {ok && <p className="text-green-600 mt-3">Mot de passe mis à jour ✔</p>}
    </main>
  );
}