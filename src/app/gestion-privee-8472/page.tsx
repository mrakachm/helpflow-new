"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GestionPriveePage() {
  const [livreurs, setLivreurs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function loadLivreurs() {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "livreur")
      .order("created_at", { ascending: false });

    if (error) {
      alert("Erreur chargement : " + error.message);
      console.error(error);
      return;
    }

    setLivreurs(data || []);
  }

  async function approveLivreur(id: string) {
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: "approved" })
      .eq("id", id);

    setLoading(false);

    if (error) {
      alert("Erreur validation : " + error.message);
      console.error(error);
      return;
    }

    alert("Livreur validé");
    await loadLivreurs();
  }

  async function rejectLivreur(id: string) {
    setLoading(true);

    const { error } = await supabase
      .from("profiles")
      .update({ verification_status: "rejected" })
      .eq("id", id);

    setLoading(false);

    if (error) {
      alert("Erreur refus : " + error.message);
      console.error(error);
      return;
    }

    alert("Livreur refusé");
    await loadLivreurs();
  }

  useEffect(() => {
    loadLivreurs();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">
        Gestion privée HelpFlow
      </h1>

      {livreurs.length === 0 && (
        <p>Aucun livreur trouvé.</p>
      )}

      {livreurs.map((livreur) => (
        <div
          key={livreur.id}
          className="bg-white p-4 rounded-xl shadow mb-4"
        >
          <p><strong>Nom :</strong> {livreur.full_name || "Non renseigné"}</p>
          <p><strong>Téléphone :</strong> {livreur.phone || "Non renseigné"}</p>
          <p><strong>Statut :</strong> {livreur.verification_status}</p>
          <p><strong>Document :</strong> {livreur.identity_document_path || "Aucun document"}</p>

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => approveLivreur(livreur.id)}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              Valider
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => rejectLivreur(livreur.id)}
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

