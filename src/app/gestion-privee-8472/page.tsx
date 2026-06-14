"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function GestionPriveePage() {
  const [livreurs, setLivreurs] = useState<any[]>([]);

  async function loadLivreurs() {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "livreur")
      .order("created_at", { ascending: false });

    setLivreurs(data || []);
  }

  async function approveLivreur(id: string) {
    await supabase
      .from("profiles")
      .update({ verification_status: "approved" })
      .eq("id", id);

    loadLivreurs();
  }

  async function rejectLivreur(id: string) {
    await supabase
      .from("profiles")
      .update({ verification_status: "rejected" })
      .eq("id", id);

    loadLivreurs();
  }

  useEffect(() => {
    loadLivreurs();
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold mb-6">
        Gestion privée HelpFlow
      </h1>

      {livreurs.map((livreur) => (
        <div
          key={livreur.id}
          className="bg-white p-4 rounded-xl shadow mb-4"
        >
          <p>
            <strong>Nom :</strong> {livreur.full_name}
          </p>

          <p>
            <strong>Téléphone :</strong> {livreur.phone}
          </p>

          <p>
            <strong>Statut :</strong>{" "}
            {livreur.verification_status}
          </p>

          <p>
            <strong>Document :</strong>{" "}
            {livreur.identity_document_path}
          </p>

          <div className="mt-4 flex gap-2">
            <button
              onClick={() => approveLivreur(livreur.id)}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Valider
            </button>

            <button
              onClick={() => rejectLivreur(livreur.id)}
              className="bg-red-600 text-white px-4 py-2 rounded"
            >
              Refuser
            </button>
          </div>
        </div>
      ))}
    </main>
  );
}