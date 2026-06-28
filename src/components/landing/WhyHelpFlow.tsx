import Link from "next/link";
import type { ReactNode } from "react";

function Line({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm">
      {children}
    </li>
  );
}

function Step({
  number,
  title,
  desc,
}: {
  number: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">
        {number}
      </div>

      <h3 className="text-xl font-black text-slate-900">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

function Faq({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-black text-slate-900">{question}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-600">{answer}</p>
    </div>
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
          Une plateforme de livraison locale pour vos achats, colis, documents
          et objets du quotidien.
        </h2>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          HelpFlow permet de publier une demande pour faire récupérer ou livrer
          rapidement un achat local, une commande Marketplace, un colis, un
          document ou un objet important.
        </p>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          La plateforme met en relation les utilisateurs avec des livreurs de
          proximité disponibles, afin de gagner du temps et d’éviter les
          déplacements inutiles.
        </p>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-7">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les utilisateurs
          </h2>

          <p className="mt-3 text-slate-600">
            Une solution simple pour récupérer ou envoyer ce dont vous avez
            besoin au quotidien.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Récupérer un achat local</Line>
            <Line>Faire livrer une commande Marketplace ou Leboncoin</Line>
            <Line>Envoyer ou récupérer un document</Line>
            <Line>Faire transporter un colis ou un objet</Line>
            <Line>Éviter un déplacement inutile</Line>
            <Line>Trouver une solution rapide en cas d’imprévu</Line>
          </ul>
        </div>

        <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-7">
          <h2 className="text-2xl font-black text-slate-900">
            Pour les livreurs
          </h2>

          <p className="mt-3 text-slate-600">
            Une opportunité de réaliser des missions locales selon vos
            disponibilités.
          </p>

          <ul className="mt-5 space-y-3">
            <Line>Choisir les missions qui vous conviennent</Line>
            <Line>Intervenir près de chez vous</Line>
            <Line>Utiliser votre moyen de déplacement</Line>
            <Line>Compléter vos revenus</Line>
            <Line>Organiser votre temps librement</Line>
            <Line>Recevoir des demandes locales</Line>
          </ul>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
            Comment ça marche ?
          </h2>

          <p className="mt-3 text-lg text-slate-600">
            Une demande, un livreur disponible, une livraison locale simple.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Step
            number="1"
            title="Publiez votre demande"
            desc="Indiquez ce qu’il faut récupérer ou livrer, l’adresse de départ, l’adresse d’arrivée et les informations utiles."
          />

          <Step
            number="2"
            title="Un livreur accepte"
            desc="Un livreur de proximité disponible accepte votre mission selon vos besoins et votre zone."
          />

          <Step
            number="3"
            title="Votre livraison est effectuée"
            desc="Votre achat, colis, document ou objet est récupéré puis livré à l’adresse indiquée."
          />
        </div>
      </div>

      <div className="mt-10 rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-9">
        <p className="text-sm font-bold uppercase tracking-wide text-blue-600">
          Pourquoi choisir HelpFlow ?
        </p>

        <h2 className="mt-3 text-3xl font-black text-slate-900">
          Une solution pensée pour la proximité, la rapidité et la simplicité.
        </h2>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <Line>Idéal pour les achats Marketplace, Leboncoin et locaux</Line>
          <Line>Pratique pour les colis, documents et objets du quotidien</Line>
          <Line>Un service adapté aux besoins urgents ou imprévus</Line>
          <Line>Des livreurs locaux disponibles selon leur zone</Line>
          <Line>Une expérience simple pour publier une demande</Line>
          <Line>Une alternative utile aux déplacements inutiles</Line>
        </div>
      </div>

      <div className="mt-10">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
            Questions fréquentes
          </h2>

          <p className="mt-3 text-lg text-slate-600">
            Les réponses simples aux questions les plus courantes.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Faq
            question="Que puis-je faire livrer avec HelpFlow ?"
            answer="Vous pouvez faire récupérer ou livrer des achats locaux, commandes Marketplace, achats Leboncoin, colis, documents, vêtements, cadeaux ou objets du quotidien."
          />

          <Faq
            question="HelpFlow est-il réservé aux colis ?"
            answer="Non. HelpFlow est aussi utile pour les achats entre particuliers, les commandes en magasin, les objets oubliés ou les documents importants."
          />

          <Faq
            question="Comment devenir livreur ?"
            answer="Vous pouvez créer votre profil livreur, compléter vos informations et accepter les missions disponibles près de chez vous."
          />

          <Faq
            question="Est-ce adapté aux livraisons de proximité ?"
            answer="Oui. HelpFlow est pensé pour les besoins locaux : récupérer, déposer ou transporter rapidement un objet dans une même ville ou à proximité."
          />
        </div>
      </div>

      <div className="mt-10 rounded-[2rem] bg-slate-950 p-8 text-center text-white shadow-lg sm:p-10">
        <h2 className="text-3xl font-black sm:text-4xl">
          Besoin de récupérer ou faire livrer quelque chose ?
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          Publiez votre demande sur HelpFlow et trouvez un livreur de proximité
          pour vos achats, colis, documents ou objets du quotidien.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login?next=/client/new-order"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-blue-700"
          >
            Créer une commande
          </Link>

          <Link
            href="/livreur/signup"
            className="inline-flex items-center justify-center rounded-2xl border-2 border-white bg-white px-6 py-3 font-bold text-slate-950 shadow-sm hover:bg-slate-100"
          >
            Devenir livreur
          </Link>
        </div>
      </div>
    </section>
  );
}