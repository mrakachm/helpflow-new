import Link from "next/link";

const steps = [
  [
    "1",
    "Publiez votre demande",
    "Indiquez le retrait, la destination et les informations utiles.",
  ],
  [
    "2",
    "Un livreur accepte",
    "Un livreur disponible à proximité choisit votre mission.",
  ],
  [
    "3",
    "Suivez la livraison",
    "Le colis est récupéré puis remis à l’adresse indiquée avec les validations prévues.",
  ],
];

export default function WhyHelpFlow() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pb-12">
      <div
        id="helpflow"
        className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10"
      >
        <div className="grid gap-8 lg:grid-cols-[1.2fr_.8fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-wider text-blue-600">
              C’est quoi Jalin Livraison ?
            </p>

            <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
              La livraison de proximité pensée pour la vie quotidienne.
            </h2>

            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              Jalin Livraison est une plateforme qui permet de publier une
              demande pour récupérer ou faire livrer un achat, une commande,
              un colis ou un objet. Elle met en relation les utilisateurs avec
              des livreurs disponibles à proximité.
            </p>
          </div>

          <div className="grid gap-3">
            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="font-black">📍 Proximité</p>
              <p className="mt-1 text-sm text-slate-600">
                Des missions locales adaptées aux besoins du quotidien.
              </p>
            </div>

            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="font-black">🛡️ Sécurité</p>
              <p className="mt-1 text-sm text-slate-600">
                Suivi de mission, validations et paiement sécurisé.
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="font-black">🤝 Utile à tous</p>
              <p className="mt-1 text-sm text-slate-600">
                Particuliers, familles et commerces de proximité.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div id="fonctionnement" className="py-12">
        <div className="text-center">
          <p className="text-sm font-black uppercase tracking-wider text-blue-600">
            Simple à utiliser
          </p>

          <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
            Comment ça marche ?
          </h2>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {steps.map(([n, t, d]) => (
            <div
              key={n}
              className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600 text-lg font-black text-white">
                {n}
              </div>

              <h3 className="mt-4 text-xl font-black">{t}</h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">{d}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[2rem] bg-slate-950 p-8 text-center text-white shadow-lg sm:p-10">
        <h2 className="text-3xl font-black sm:text-4xl">
          Un besoin aujourd’hui ? Jalin Livraison vous rapproche de la solution.
        </h2>

        <p className="mx-auto mt-4 max-w-2xl text-lg leading-8 text-slate-300">
          Publiez votre demande ou rejoignez Jalin Livraison comme livreur de
          proximité.
        </p>

        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            href="/login?next=/client/new-order"
            className="rounded-2xl bg-blue-600 px-7 py-3.5 font-black"
          >
            Créer une commande
          </Link>

          <Link
            href="/livreur/signup"
            className="rounded-2xl bg-white px-7 py-3.5 font-black text-slate-950"
          >
            Devenir livreur
          </Link>
        </div>
      </div>
    </section>
  );
}