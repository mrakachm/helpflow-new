"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";

export default function EditProfilePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const [city, setCity] = useState("");
  const [postal, setPostal] = useState("");
  const [transport, setTransport] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("city, postal_code, transport_type")
        .eq("id", user.id) // ✅ la colonne est id, pas user_id
        .single();

      if (!error && data) {
        setCity(data.city ?? "");
        setPostal(data.postal_code ?? "");
        setTransport(data.transport_type ?? "");
      }
    })();
  }, [user]);

  if (loading) return <p>Chargement…</p>;
  if (!user) return <p>Veuillez vous connecter.</p>;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        city,
        postal_code: postal,
        transport_type: transport,
      })
      .eq("id", user.id); // ✅

    setSaving(false);
    setMsg(error ? error.message : "Profil mis à jour !");
  }

  return (
    <main className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Mon profil</h1>
      <form onSubmit={handleSave} className="space-y-4 bg-white rounded-2xl p-6 shadow">
        <input
          className="w-full border rounded-xl p-3"
          placeholder="Ville"
          value={city}
          onChange={(e) => setCity(e.target.value)}
        />
        <input
          className="w-full border rounded-xl p-3"
          placeholder="Code postal"
          value={postal}
          onChange={(e) => setPostal(e.target.value)}
        />
        <input
          className="w-full border rounded-xl p-3"
          placeholder="Type de transport (voiture, vélo…)"
          value={transport}
          onChange={(e) => setTransport(e.target.value)}
        />

        {msg && <p className="text-sm">{msg}</p>}

        <button
          disabled={saving}
          className="rounded-xl border px-5 py-3 shadow disabled:opacity-50"
        >
          {saving ? "Enregistrement…" : "Enregistrer"}
        </button>
      </form>
    </main>
  );
}