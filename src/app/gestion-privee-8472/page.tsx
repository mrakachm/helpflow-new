"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GestionPriveePage() {
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function loadLivreurs() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "livreur")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erreur chargement : " + error.message);
      return;
    }

    setLivreurs(data || []);
  }

  async function updateStatus(id: string, status: "approved" | "rejected") {
    setLoadingId(id);

    const { data, error } = await supabase
      .from("profiles")
      .update({ verification_status: status })
      .eq("id", id)
      .select("id, verification_status");

    setLoadingId(null);

    if (error) {
      alert("Erreur Supabase : " + error.message);
      return;
    }

    if (!data || data.length === 0) {
      alert("Aucune ligne modifiée. Problème RLS Supabase.");
      return;
    }

    alert(status === "approved" ? "Livreur validé" : "Livreur refusé");
    await loadLivreurs();
  }

  useEffect(() => {
    loadLivreurs();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">Gestion privée HelpFlow</h1>

      {livreurs.length === 0 && <p>Aucun livreur trouvé.</p>}

      {livreurs.map((livreur) => (
        <div key={livreur.id} className="bg-white p-4 rounded-xl shadow mb-4">
          <p><strong>Nom :</strong> {livreur.full_name || "Non renseigné"}</p>
          <p><strong>Téléphone :</strong> {livreur.phone || "Non renseigné"}</p>
          <p><strong>Statut :</strong> {livreur.verification_status}</p>
          <p><strong>Document :</strong> {livreur.identity_document_path || "Aucun document"}</p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={loadingId === livreur.id}
              onClick={() => updateStatus(livreur.id, "approved")}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Valider
            </button>

            <button
              type="button"
              disabled={loadingId === livreur.id}
              onClick={() => updateStatus(livreur.id, "rejected")}
              className="bg-red-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Refuser
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}