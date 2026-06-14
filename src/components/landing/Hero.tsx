import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 pt-10">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-400 via-indigo-400 to-violet-500 p-8 text-white shadow-xl sm:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-blue-200/20 blur-3xl" />

        <div className="relative max-w-4xl">
          <p className="mb-4 inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold text-white">
            Moderne • Simple • Flexible • Efficace • Local
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            HelpFlow simplifie les imprévus du quotidien.
          </h1>

          <p className="mt-5 max-w-3xl text-lg leading-8 text-white/95">
            Gagnez du temps, réduisez le stress et trouvez rapidement une
            solution locale pour récupérer un objet oublié, transporter un
            document, retirer un achat ou aider un proche.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-white/90">
            Objets précieux pour bébés et enfants, documents, clés, lunettes,
            achats en magasin, commandes chez un artisan, vêtements chez le
            tailleur, colis, courses ou achats sur les réseaux sociaux :
            HelpFlow vous met en relation avec une personne disponible près de
            chez vous.
          </p>

          <p className="mt-4 max-w-3xl text-base leading-7 text-white/90">
            Une solution locale qui peut parfois résoudre un problème en moins
            d'une heure, même tard le soir ou tôt le matin.
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