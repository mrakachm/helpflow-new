import Link from "next/link";

const purchaseSources = [
  {
    title: "Marketplace",
    desc: "Vous avez acheté un article sur Facebook Marketplace ou une autre marketplace locale ? HelpFlow permet de faire récupérer votre achat par un livreur de proximité et de le recevoir rapidement sans vous déplacer.",
  },
  {
    title: "Leboncoin",
    desc: "Vous avez trouvé une bonne affaire sur Leboncoin ? Avec HelpFlow, un livreur récupère votre achat directement chez le vendeur et le livre jusqu'à votre domicile.",
  },
  {
    title: "Réseaux sociaux",
    desc: "Vous avez acheté un produit auprès d'un vendeur sur Facebook, Instagram ou d'autres réseaux sociaux ? HelpFlow récupère votre achat localement et vous le livre en toute simplicité.",
  },
  {
    title: "Commerces locaux",
    desc: "Pressing, tailleur, fleuriste, artisan ou tout autre commerce de proximité : faites récupérer vos achats ou objets sans perdre de temps.",
  },
  {
    title: "Entre particuliers",
    desc: "Envoyez facilement des clés, documents, vêtements, cadeaux ou objets à un proche ou entre particuliers grâce à un livreur local.",
  },
  {
    title: "Commandes en magasin",
    desc: "Votre commande est prête en magasin ? HelpFlow la récupère pour vous et vous la livre au moment qui vous convient.",
  },
];

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-blue-50 via-white to-blue-100 p-6 shadow-xl sm:p-10">
        <p className="mb-4 inline-flex rounded-full bg-blue-50 px-4 py-2 text-sm font-bold text-blue-700">
          HelpFlow Livraison
        </p>

        <h1 className="max-w-4xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-5xl">
          La solution simple et fiable pour récupérer ou faire livrer vos achats
          et colis de proximité
        </h1>

        <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
          HelpFlow met en relation les utilisateurs avec des livreurs de
          proximité pour récupérer ou livrer rapidement des achats locaux, des
          commandes Marketplace, des colis, des documents et des objets du
          quotidien.
        </p>

        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
          Vous achetez sur Leboncoin, Facebook Marketplace, les réseaux sociaux,
          en magasin ou auprès d’un particulier ? Publiez une demande, trouvez
          un livreur disponible et recevez votre achat sans vous déplacer.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {purchaseSources.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4"
            >
              <h3 className="text-sm font-black text-blue-700">
                {item.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                {item.desc}
              </p>
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