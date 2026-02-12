"use client";

import { useState, useMemo } from "react";
import { createBrowserSupabaseClient } from "../../lib/supabase/client";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  async function onUpdatePassword(e: React.FormEvent) {
    e.preventDefault();

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
        <br /><br />
        <button type="submit">Valider</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}