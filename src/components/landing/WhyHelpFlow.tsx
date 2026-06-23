import type { ReactNode } from "react";

function Line({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
      {children}
    </li>
  );
}

export default function WhyHelpFlow() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          C’est quoi HelpFlow ?
        </p>

        <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
          Une plateforme de livraison locale pour les achats, colis, documents
          et objets du quotidien.
        </h2>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          HelpFlow permet aux utilisateurs de publier une demande pour récupérer
          ou faire livrer un achat local, une commande Marketplace, un colis, un
          document ou un objet important.
        </p>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          Le service est pensé pour gagner du temps, éviter les déplacements
          inutiles et organiser facilement une livraison de proximité.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-7">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les utilisateurs
          </h2>

          <p className="mt-3 text-slate-600">
            Une solution pratique pour récupérer, transporter ou déposer ce dont
            vous avez besoin au quotidien.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Récupérer un achat local</Line>
            <Line>Récupérer une commande Marketplace, Leboncoin ou réseaux sociaux</Line>
            <Line>Faire livrer un colis ou une commande</Line>
            <Line>Envoyer ou récupérer un document</Line>
            <Line>Récupérer un objet oublié</Line>
            <Line>Déposer un objet chez un proche</Line>
            <Line>Gagner du temps au quotidien</Line>
            <Line>Trouver une solution en cas d’imprévu</Line>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-7">
          <h2 className="text-2xl font-black text-slate-900">
            Revenu complémentaire avec HelpFlow
          </h2>

          <p className="mt-3 text-slate-600">
            Les livreurs acceptent des missions locales selon leurs
            disponibilités, leur ville et leur moyen de déplacement.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Choisir les missions qui vous conviennent</Line>
            <Line>Intervenir près de chez vous</Line>
            <Line>À pied, vélo, scooter, voiture ou utilitaire</Line>
            <Line>Compléter vos revenus</Line>
            <Line>Organiser votre temps librement</Line>
            <Line>Recevoir des missions locales</Line>
          </ul>
        </div>
      </div>
    </section>
  );
}