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
            <h3 className="font-bold text-white">Informations légales</h3>

            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <Link href="/cgu" className="block hover:text-white">
                Conditions Générales d'Utilisation (CGU)
              </Link>

              <Link
                href="/conditions-generales"
                className="block hover:text-white"
              >
                Conditions Générales
              </Link>

              <Link
                href="/confidentialite"
                className="block hover:text-white"
              >
                Politique de confidentialité
              </Link>

              <Link href="/contact" className="block hover:text-white">
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white">HelpFlow</h3>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Service de mise en relation entre clients et livreurs pour les
              livraisons locales, documents, achats, objets oubliés et besoins
              urgents.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} HelpFlow — Tous droits réservés
        </div>
      </div>
    </footer>
  );
}