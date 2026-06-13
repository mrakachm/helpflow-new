import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-6">
      <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-lg">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-2xl font-black">HelpFlow</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Plateforme locale moderne pour simplifier les imprévus du
              quotidien, gagner du temps et trouver une solution de proximité.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white">Accès rapide</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <Link href="/" className="block hover:text-white">
                Accueil
              </Link>
              <Link href="/client/new-order" className="block hover:text-white">
                Créer une livraison
              </Link>
              <Link href="/livreur/missions" className="block hover:text-white">
                Espace livreur
              </Link>
              <Link href="/cgu" className="block hover:text-white">
                CGU
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white">HelpFlow</h3>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Objets oubliés, documents, achats locaux, commerçants, artisans,
              repas, cadeaux ou besoins urgents : HelpFlow rapproche les
              personnes grâce à une solution simple, flexible, efficace et
              locale.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} HelpFlow — Plateforme de livraison locale
        </div>
      </div>
    </footer>
  );
}