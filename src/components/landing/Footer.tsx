import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="rounded-3xl bg-slate-900 p-8 text-center text-white">
        <h2 className="text-xl font-bold">HelpFlow</h2>

        <p className="mt-2 text-sm text-slate-300">
          Plateforme locale pour gagner du temps, réduire le stress et trouver
          un livreur rapidement.
        </p>

        <div className="mt-5 flex flex-wrap justify-center gap-4 text-sm">
          <Link href="/">Accueil</Link>
          <Link href="/client/new-order">Créer une livraison</Link>
          <Link href="/livreur/missions">Espace livreur</Link>
          <Link href="/cgu">CGU</Link>
        </div>

        <p className="mt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} HelpFlow — Plateforme de livraison locale
        </p>
      </div>
    </footer>
  );
}