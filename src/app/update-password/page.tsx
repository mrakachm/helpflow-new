"use client";

import { useEffect, useMemo, useState } from "react";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    let cancelled = false;

    async function preparePasswordRecovery() {
      try {
        // Si une session existe déjà, on peut continuer directement.
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          if (!cancelled) {
            setReady(true);
          }
          return;
        }

        // Sinon, on récupère le code présent dans le lien reçu par email.
        const params = new URLSearchParams(window.location.search);
        const code = params.get("code");

        if (!code) {
          if (!cancelled) {
            setMessage(
              "Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien."
            );
          }
          return;
        }

        // Le code est échangé contre une session Supabase.
        const { error } = await supabase.auth.exchangeCodeForSession(code);

        if (error) {
          throw error;
        }

        if (!cancelled) {
          setReady(true);
          setMessage(null);
        }
      } catch {
        if (!cancelled) {
          setMessage(
            "Lien de réinitialisation invalide ou expiré. Demandez un nouveau lien."
          );
        }
      }
    }

    preparePasswordRecovery();

    return () => {
      cancelled = true;
    };
  }, [supabase]);

  async function onUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!ready) {
      setMessage(
        "Le lien de réinitialisation n'est pas encore validé."
      );
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Mot de passe mis à jour. Vous pouvez vous reconnecter.");
    }
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>Nouveau mot de passe</h2>

      <form onSubmit={onUpdatePassword}>
        <input
          type="password"
          placeholder="Nouveau mot de passe"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <br />
        <br />

        <button type="submit" disabled={!ready}>
          Valider
        </button>
      </form>

      {!ready && !message && <p>Vérification du lien...</p>}

      {message && <p>{message}</p>}
    </div>
  );
}