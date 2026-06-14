import type { ReactNode } from "react";

function Line({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-2xl bg-white/75 px-4 py-3 text-sm font-medium text-slate-700">
      {children}
    </li>
  );
}

function MissionBlock({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="rounded-2xl bg-white/15 p-4">
      <summary className="cursor-pointer font-semibold">{title}</summary>
      <div className="mt-3 text-sm leading-6 text-blue-50">{children}</div>
    </details>
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
          HelpFlow met en relation les clients avec des livreurs de proximité
          pour récupérer un achat local, une commande Marketplace, un colis, un
          document ou un objet important.
        </p>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          L'objectif est de rendre les échanges locaux plus simples :
          commerçants, artisans, particuliers, familles et professionnels
          peuvent trouver rapidement une solution sans se déplacer inutilement.
        </p>
      </div>

      <div className="mt-8 rounded-[2rem] bg-gradient-to-br from-blue-600 to-violet-600 p-7 text-white shadow-lg sm:p-8">
        <h2 className="text-3xl font-black">Nos services</h2>

        <p className="mt-3 max-w-3xl text-blue-50">
          HelpFlow couvre surtout les achats locaux, les récupérations, les
          colis, les documents et les besoins pratiques du quotidien.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <MissionBlock title="Achats locaux">
            Retrait chez un commerçant, artisan, marché, boutique de proximité,
            pressing, fleuriste, pâtissier, couturier ou autre professionnel
            local.
          </MissionBlock>

          <MissionBlock title="Marketplace et ventes entre particuliers">
            Facebook Marketplace, Leboncoin, Vinted, Instagram, Snapchat,
            groupe local ou vente entre particuliers à récupérer près de chez
            vous.
          </MissionBlock>

          <MissionBlock title="Colis et commandes">
            Colis à récupérer, commande à déposer, achat en magasin, retrait
            local, petit transport ou livraison de proximité.
          </MissionBlock>

          <MissionBlock title="Documents et démarches">
            Document administratif, courrier important, dossier professionnel,
            justificatif, papier à déposer ou document à récupérer.
          </MissionBlock>

          <MissionBlock title="Objets oubliés">
            Lunettes, clés, téléphone, portefeuille, sac, papiers importants ou
            objet personnel resté à la maison, au travail ou chez un proche.
          </MissionBlock>

          <MissionBlock title="Repas, cadeaux et aide ponctuelle">
            Repas préparé par un proche, gâteau fait maison, cadeau à remettre,
            colis familial ou besoin simple du quotidien.
          </MissionBlock>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-7">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les clients
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
            Pour les livreurs
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