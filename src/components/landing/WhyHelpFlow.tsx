import type { ReactNode } from "react";

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-md" />
      <h3 className="text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

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
    <section className="mx-auto w-full max-w-6xl px-6 py-14">
      <div className="rounded-[2rem] border border-blue-100 bg-white p-8 shadow-sm sm:p-10">
        <div className="max-w-4xl">
          <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
            C'est quoi HelpFlow ?
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-900 sm:text-4xl">
            Une plateforme locale moderne pour simplifier les imprévus du quotidien.
          </h2>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            HelpFlow aide les particuliers, les familles, les professionnels,
            les commerçants et les artisans à trouver rapidement une solution
            locale lorsqu'un imprévu survient.
          </p>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Grâce à un réseau de livreurs de proximité, de nombreux besoins du
            quotidien peuvent trouver une solution rapidement, parfois en moins
            de deux heures selon la distance et les disponibilités.
          </p>

          <p className="mt-4 text-lg leading-8 text-slate-600">
            Objet oublié, document urgent, achat à récupérer, repas préparé par
            un proche, commande chez un commerçant ou besoin ponctuel : HelpFlow
            facilite les solutions locales du quotidien.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-3">
        <Card
          title="Gagnez du temps"
          desc="Évitez les déplacements inutiles. Publiez votre besoin en quelques clics et concentrez-vous sur l'essentiel."
        />

        <Card
          title="Réduisez le stress"
          desc="Un oubli, une urgence ou un besoin important ? HelpFlow vous aide à trouver une solution locale claire et rapide."
        />

        <Card
          title="Accessible sans véhicule"
          desc="Même sans voiture, vous pouvez faire transporter un objet, un colis, un achat ou un document important."
        />
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Card
          title="Utile à tout moment"
          desc="Tôt le matin, en journée ou tard le soir, HelpFlow peut vous aider à trouver une solution selon les disponibilités locales."
        />

        <Card
          title="Pour ceux qui travaillent loin"
          desc="Usines, entrepôts, hôpitaux, commerces, bureaux, chantiers : HelpFlow aide aussi les personnes qui ne peuvent pas facilement rentrer chez elles."
        />
      </div>

      <div className="mt-8 rounded-[2rem] bg-gradient-to-br from-blue-600 to-violet-600 p-8 text-white shadow-lg">
        <h2 className="text-3xl font-black">
          Exemples de missions possibles
        </h2>

        <p className="mt-3 max-w-3xl text-blue-50">
          Des petits besoins peuvent avoir une grande importance. Cliquez pour
          voir les exemples.
        </p>

        <div className="mt-6 grid gap-3 md:grid-cols-2">
          <MissionBlock title="Objets précieux pour bébés et enfants">
            Doudous, couvertures, biberons, jouets préférés, petites voitures,
            poupées, vêtements ou affaires importantes. Parce que certains
            objets ont une valeur bien plus grande que leur prix.
          </MissionBlock>

          <MissionBlock title="Objets oubliés">
            Lunettes, clés, téléphone, portefeuille, sac, papiers importants ou
            objet personnel resté à la maison, au travail ou chez un proche.
          </MissionBlock>

          <MissionBlock title="Documents et démarches">
            Document urgent, dossier administratif, papier à déposer, courrier à
            remettre ou document professionnel à récupérer.
          </MissionBlock>

          <MissionBlock title="Achats locaux et réseaux sociaux">
            Achat Facebook Marketplace, Leboncoin, Instagram, Snapchat, groupe
            local ou vente entre particuliers à récupérer près de chez vous.
          </MissionBlock>

          <MissionBlock title="Commerçants, marchés et artisans">
            Commande chez un commerçant local, marché, artisan, couturier,
            tailleur, pressing, fleuriste, pâtissier ou boutique de proximité.
          </MissionBlock>

          <MissionBlock title="Repas, gâteaux et cadeaux">
            Repas préparé par un proche, gâteau fait maison, cadeau à remettre,
            colis familial ou attention à livrer rapidement.
          </MissionBlock>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-8">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les clients
          </h2>

          <p className="mt-3 text-slate-600">
            Une solution simple pour faire transporter ce dont vous avez besoin,
            sans perdre votre journée.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Gagner du temps dans les déplacements</Line>
            <Line>Réduire le stress des imprévus</Line>
            <Line>Faire livrer même sans véhicule</Line>
            <Line>Récupérer un achat, un colis ou un document</Line>
            <Line>Aider un proche rapidement</Line>
            <Line>Trouver une solution locale et flexible</Line>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-green-100 bg-green-50 p-8">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les livreurs
          </h2>

          <p className="mt-3 text-slate-600">
            Chacun peut participer selon ses disponibilités et ses moyens de
            déplacement.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Gagner un revenu complémentaire</Line>
            <Line>Choisir les missions qui vous conviennent</Line>
            <Line>Participer même à pied selon la mission</Line>
            <Line>Intervenir à vélo, scooter, voiture ou utilitaire</Line>
            <Line>Rendre service près de chez soi</Line>
            <Line>Rester libre de son temps</Line>
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-5">
        <Card title="Moderne" desc="Une solution adaptée aux besoins d'aujourd'hui." />
        <Card title="Simple" desc="Un parcours clair et facile à comprendre." />
        <Card title="Flexible" desc="Des missions variées selon les besoins." />
        <Card title="Efficace" desc="Une solution locale pensée pour agir vite." />
        <Card title="Locale" desc="Des missions proches, humaines et utiles." />
      </div>

      <div className="mt-8 rounded-[2rem] bg-slate-900 p-8 text-center text-white shadow-lg">
        <h2 className="text-3xl font-black">
          HelpFlow rapproche les personnes.
        </h2>

        <p className="mx-auto mt-4 max-w-3xl text-slate-300">
          Notre objectif est simple : connecter rapidement les personnes qui ont
          besoin d'aide avec des livreurs disponibles autour d'elles, pour
          simplifier les imprévus du quotidien.
        </p>
      </div>
    </section>
  );
}