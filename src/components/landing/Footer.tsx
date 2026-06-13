import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mx-auto w-full max-w-6xl px-6 py-10">
      <div className="rounded-3xl bg-slate-900 p-6 text-center text-white">
        <p className="font-bold">HelpFlow</p>
        <p className="mt-2 text-sm text-slate-300">
          © {new Date().getFullYear()} HelpFlow — Plateforme de livraison locale
        </p>

        <div className="mt-4 flex flex-wrap justify-center gap-4 text-sm text-slate-300">
          <Link href="/">Accueil</Link>
          <Link href="/client/new-order">Créer une livraison</Link>
          <Link href="/livreur/missions">Devenir livreur</Link>
          <Link href="/cgu">CGU</Link>
        </div>
      </div>
    </footer>
  );
}