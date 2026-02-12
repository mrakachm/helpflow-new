"use client";

import { useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import GoogleMapsScript from "@/components/GoogleMapsScript";

type Msg = { type: "ok" | "err"; text: string };

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-8">
        <header className="flex items-center gap-3">
          <img src="/logo-helpflow.png" alt="HelpFlow" className="h-10 w-10 rounded-xl" />
          <div>
            <h1 className="text-xl font-semibold">HelpFlow</h1>
            <p className="text-sm text-gray-600">Livraison locale rapide et solidaire</p>
          </div>
        </header>

        <div className="mt-6 rounded-2xl bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Envoyer un colis, simplement</h2>
          <p className="mt-1 text-sm text-gray-600">
            Choisissez une heure, suivez votre livraison, et trouvez un livreur près de chez vous.
          </p>

          <div className="mt-4 grid gap-3">
            <a
              href="/client/new-order"
              className="rounded-xl bg-black px-4 py-3 text-center text-white font-medium"
            >
              Créer une commande
            </a>
            <a
              href="/login"
              className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-center font-medium"
            >
              Se connecter
            </a>
          </div>
        </div>

        <div className="mt-6 grid gap-3">
          {[
            { t: "1) Renseignez les infos", d: "Expéditeur, receveur, poids, distance, date." },
            { t: "2) Prix clair", d: "Tarif client + commission + montant livreur." },
            { t: "3) Livraison", d: "Un livreur accepte et vous suivez la mission." },
          ].map((x) => (
            <div key={x.t} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold">{x.t}</p>
              <p className="text-sm text-gray-600 mt-1">{x.d}</p>
            </div>
          ))}
        </div>

        <footer className="mt-8 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} HelpFlow
        </footer>
      </div>
    </main>
  );
}
