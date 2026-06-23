import Link from "next/link";

const purchaseSources = [
  "Marketplace",
  "Leboncoin",
  "Réseaux sociaux",
  "Commerces locaux",
  "Entre particuliers",
  "Commandes en magasin",
];

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <p className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
          HelpFlow Livraison
        </p>

        <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          La solution simple et fiable pour récupérer ou faire livrer vos achats
          et colis de proximité
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
          HelpFlow facilite la récupération et la livraison de vos achats
          locaux, commandes Marketplace, colis, documents et objets du
          quotidien.
        </p>

        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Vous avez acheté un article sur Leboncoin, Facebook Marketplace, les
          réseaux sociaux, en magasin, chez un artisan ou auprès d’un
          particulier ? Publiez une demande et trouvez un livreur disponible
          pour récupérer ou livrer votre commande localement.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {purchaseSources.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-700"
            >
              {item}
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login?next=/client/new-order"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-blue-700"
          >
            Créer une commande
          </Link>

          <Link
            href="/livreur/signup"
            className="inline-flex items-center justify-center rounded-2xl border-2 border-blue-600 bg-white px-6 py-3 font-bold text-blue-700 shadow-sm hover:bg-blue-50"
          >
            Devenir livreur
          </Link>
        </div>
      </div>
    </section>
  );
}