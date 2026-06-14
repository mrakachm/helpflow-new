import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 pb-10 pt-6">
      <div className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-lg">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h2 className="text-2xl font-black">HelpFlow</h2>

            <p className="mt-3 text-sm leading-6 text-slate-300">
              Plateforme locale de mise en relation entre clients et livreurs
              pour les achats locaux, les commandes Marketplace, les colis,
              les documents, les services de proximité et la simplification
              des imprévus du quotidien.
            </p>
          </div>

          <div>
            <h3 className="font-bold text-white">
              Informations légales
            </h3>

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

              <Link
                href="/contact"
                className="block hover:text-white"
              >
                Contact
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-white">
              Nos services
            </h3>

            <p className="mt-4 text-sm leading-6 text-slate-300">
              Récupération d'achats locaux, commandes Marketplace,
              transport de colis, documents, objets oubliés,
              services de proximité et aide aux imprévus du quotidien
              grâce à un réseau de livreurs disponibles autour de vous.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-sm text-slate-400">
          © {new Date().getFullYear()} HelpFlow — Achats locaux • Marketplace • Colis • Documents • Services de proximité • Imprévus du quotidien
        </div>
      </div>
    </footer>
  );
}