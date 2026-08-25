import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-6">
      <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
        <div className="grid items-center gap-10 p-6 md:p-10 lg:grid-cols-[1.15fr_0.85fr]">
          
          <div>
            <p className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-700">
              Livraison de proximité
            </p>

            <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-slate-950 sm:text-5xl">
              Vos besoins du quotidien, livrés simplement.
            </h1>

            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              Faites récupérer un colis, un achat, une commande ou un objet
              oublié. HelpFlow vous met en relation avec un livreur de proximité
              pour vous simplifier la vie.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/login?next=/client/new-order"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 font-bold text-white transition hover:bg-blue-700"
              >
                Demander une livraison
              </Link>

              <Link
                href="/livreur/signup"
                className="inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-800 transition hover:bg-slate-50"
              >
                Devenir livreur
              </Link>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
              <span>✓ Simple</span>
              <span>✓ Proximité</span>
              <span>✓ En toute sécurité</span>
            </div>
          </div>

          <div className="relative min-h-[340px] overflow-hidden rounded-[1.5rem] bg-slate-100">
            <img
              src="/helpflow-hero.jpg.png"
              alt="Livreuse de proximité HelpFlow"
              className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-x-5 bottom-5 rounded-2xl bg-white/95 p-4 shadow-lg">
              <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                HelpFlow
              </p>
              <p className="mt-1 font-bold text-slate-900">
                Livraison simple, rapide et efficace
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}