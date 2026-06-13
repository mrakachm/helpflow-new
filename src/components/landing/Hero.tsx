import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 p-8 text-white shadow-xl sm:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />

        <div className="relative max-w-4xl">
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-blue-50">
            Moderne • Simple • Flexible • Efficace • Local
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            HelpFlow simplifie les imprévus du quotidien.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-blue-50">
            Gagnez du temps, réduisez le stress et trouvez rapidement une
            solution locale pour récupérer un objet, transporter un document,
            retirer un achat ou aider un proche.
          </p>

          <p className="mt-3 max-w-3xl text-base leading-7 text-blue-100">
            En quelques clics, publiez votre besoin et trouvez un livreur de
            proximité selon la distance et les disponibilités.
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