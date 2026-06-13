import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 p-8 text-white shadow-xl sm:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />

        <div className="relative max-w-3xl">
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-blue-50">
            Livraison locale • Courses • Objets oubliés • Documents
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Gagnez du temps avec une solution locale simple et rapide.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
            HelpFlow vous aide à trouver rapidement un livreur local pour
            récupérer un objet oublié, transporter un document urgent, livrer un
            colis ou retirer un achat en magasin.
          </p>

          <p className="mt-3 max-w-2xl text-base leading-7 text-blue-100">
            Publiez votre besoin en quelques clics, suivez votre mission et
            gagnez en tranquillité, même si vous n'êtes pas véhiculé.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/client/new-order"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3 font-bold text-blue-700 shadow hover:bg-blue-50"
            >
              Créer une livraison
            </Link>

            <Link
              href="/livreur/missions"
              className="inline-flex items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-6 py-3 font-bold text-white hover:bg-white/20"
            >
              Devenir livreur
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}