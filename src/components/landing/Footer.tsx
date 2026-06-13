import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 pb-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-xl font-black text-slate-900">HelpFlow</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              Plateforme locale pour gagner du temps, réduire le stress et
              trouver un livreur disponible rapidement.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">Accès rapide</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <Link href="/" className="block">Accueil</Link>
              <Link href="/client/new-order" className="block">Créer une livraison</Link>
              <Link href="/livreur/missions" className="block">Espace livreur</Link>
              <Link href="/login" className="block">Connexion</Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-slate-900">Informations</h3>
            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <Link href="/cgu" className="block">CGU</Link>
              <Link href="/mentions-legales" className="block">Mentions légales</Link>
              <Link href="/confidentialite" className="block">Confidentialité</Link>
              <Link href="/contact" className="block">Contact</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-200 pt-5 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} HelpFlow — Simple. Rapide. Fiable.
        </div>
      </div>
    </footer>
  );
}