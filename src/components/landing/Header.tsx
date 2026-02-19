import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="mx-auto w-full max-w-5xl px-6 pt-8">
      <div className="flex items-center justify-between rounded-2xl bg-white/70 backdrop-blur border border-slate-200 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-xl bg-white ring-1 ring-slate-200">
            <Image
              src="/logo-helpflow.png"
              alt="HelpFlow"
              width={40}
              height={40}
              className="h-full w-full object-contain p-1"
              priority
            />
          </div>
          <div className="leading-tight">
            <p className="font-semibold text-slate-900">HelpFlow</p>
            <p className="text-xs text-slate-500">
              Simple • Rapide • Efficace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/client/new-order"
            className="hidden sm:inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Créer une livraison
          </Link>
          <Link
            href="/login"
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-50"
          >
            Connexion
          </Link>
        </div>
      </div>
    </header>
  );
}