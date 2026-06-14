import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-8 text-white shadow-xl sm:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />

        <div className="relative max-w-4xl">
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
            Achats locaux • Marketplace • Colis • Documents • Proximité
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            HelpFlow facilite les achats locaux, les récupérations et les
            livraisons de proximité.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/95">
            Trouvez rapidement une personne disponible près de chez vous pour
            récupérer un achat, une commande Marketplace, un colis, un document
            ou un objet important.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-white/90">
            Achats chez un commerçant, commande chez un artisan, retrait en
            magasin, Facebook Marketplace, Leboncoin, Vinted, colis, documents,
            objets oubliés ou besoin ponctuel : HelpFlow simplifie vos
            déplacements du quotidien.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-white/90">
            Une solution locale moderne pour récupérer, transporter ou remettre
            ce dont vous avez besoin grâce à des livreurs proches de vous.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-bold text-indigo-700 shadow-lg transition hover:bg-slate-100"
            >
              Créer une commande
            </Link>

            <Link
              href="/livreur/signup"
              className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-6 py-3 font-bold text-white transition hover:bg-white/20"
            >
              Devenir livreur
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}