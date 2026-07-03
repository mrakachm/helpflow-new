"use client";

import { useState } from "react";
import Link from "next/link";

export default function AidePage() {
  const [question, setQuestion] = useState("");
  const [reponse, setReponse] = useState("");

  function demander() {
    const q = question.toLowerCase();

    if (q.includes("mission")) {
      setReponse(
        "Les livreurs reçoivent les missions disponibles quand ils sont en ligne. Les utilisateurs peuvent créer une livraison depuis leur espace."
      );
    } else if (q.includes("code") || q.includes("otp")) {
      setReponse(
        "Le code de livraison doit être donné au livreur uniquement après réception du colis."
      );
    } else if (q.includes("argent") || q.includes("virement")) {
      setReponse(
        "Les revenus apparaissent dans le portefeuille après une mission terminée. Le livreur peut demander un virement."
      );
    } else if (q.includes("pause") || q.includes("ligne")) {
      setReponse(
        "Le livreur peut passer En ligne ou Pause avec le bouton disponible dans son espace."
      );
    } else if (q.includes("annuler")) {
      setReponse(
        "Une livraison peut être annulée avant la prise en charge par un livreur."
      );
    } else if (q.includes("paiement")) {
      setReponse(
        "Les paiements HelpFlow sont sécurisés."
      );
    } else {
      setReponse(
        "Je n’ai pas trouvé la réponse exacte. Contactez l’assistance HelpFlow."
      );
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-5">

        <h1 className="text-3xl font-bold">
          Centre d’aide HelpFlow
        </h1>

        <section className="rounded-3xl bg-white p-5 shadow">
          <h2 className="text-xl font-bold mb-3">
            Assistant automatique
          </h2>

          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Posez votre question..."
            className="w-full rounded-xl border p-3"
          />

          <button
            onClick={demander}
            className="mt-3 w-full rounded-xl bg-blue-600 p-3 font-bold text-white"
          >
            Demander
          </button>

          {reponse && (
            <div className="mt-4 rounded-xl bg-green-50 p-4">
              {reponse}
            </div>
          )}
        </section>


        <section className="rounded-3xl bg-white p-5 shadow">
          <h2 className="text-xl font-bold">
            Questions fréquentes
          </h2>

          <div className="mt-4 space-y-4">

            <p>
              <b>Comment créer une livraison ?</b><br/>
              Remplissez les informations du colis et validez.
            </p>

            <p>
              <b>Comment devenir livreur ?</b><br/>
              Complétez votre profil et passez en ligne.
            </p>

            <p>
              <b>Comment suivre ma commande ?</b><br/>
              Le suivi est disponible depuis votre compte.
            </p>

            <p>
              <b>Comment recevoir mon argent ?</b><br/>
              Les gains arrivent dans votre portefeuille.
            </p>

          </div>
        </section>


        <Link
          href="/"
          className="block rounded-2xl bg-blue-600 p-4 text-center font-bold text-white"
        >
          Retour accueil
        </Link>

      </div>
    </main>
  );
}