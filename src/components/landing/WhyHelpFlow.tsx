import type { ReactNode } from "react";

function Line({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-2xl bg-white/75 px-4 py-3 text-sm font-medium text-slate-700">
      {children}
    </li>
  );
}

export default function WhyHelpFlow() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="rounded-[2rem] border border-blue-100 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          C'est quoi HelpFlow ?
        </p>

        <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
          Une plateforme locale pour les achats, les récupérations, les colis et
          les services de proximité.
        </h2>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          HelpFlow met en relation les utilisateurs avec des livreurs de
          proximité pour récupérer un achat local, une commande Marketplace, un
          colis, un document ou un objet important.
        </p>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          L'objectif est de rendre les échanges locaux plus simples :
          commerçants, artisans, particuliers, familles et professionnels
          peuvent trouver rapidement une solution sans se déplacer inutilement.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-7">
          <h2 className="text-2xl font-black text-slate-900">
            Avantages utilisateurs
          </h2>

          <p className="mt-3 text-slate-600">
            Une solution simple pour récupérer, transporter ou déposer ce dont
            vous avez besoin, sans perdre votre journée.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Récupérer un achat local</Line>
            <Line>Récupérer une commande Marketplace</Line>
            <Line>Faire transporter un colis ou une commande</Line>
            <Line>Déposer ou récupérer un document</Line>
            <Line>Récupérer un objet oublié</Line>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-green-100 bg-green-50 p-7">
          <h2 className="text-2xl font-black text-slate-900">
            Avantages livreurs
          </h2>

          <p className="mt-3 text-slate-600">
            Les livreurs acceptent des missions locales selon leurs
            disponibilités, leur secteur et leurs moyens de déplacement.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Récupérer des achats, colis ou documents</Line>
            <Line>Choisir les missions qui vous conviennent</Line>
            <Line>Intervenir à pied, vélo, scooter, voiture ou utilitaire</Line>
            <Line>Gagner un revenu complémentaire</Line>
            <Line>Rester libre de son temps</Line>
          </ul>
        </div>
      </div>
    </section>
  );
}