import Link from "next/link";

export default function Hero() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-10">
      <div className="relative overflow-hidden rounded-3xl border border-blue-100 bg-gradient-to-b from-blue-50 to-white p-8 shadow-sm">
        <div className="pointer-events-none absolute -top-20 left-1/2 h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-blue-200/50 blur-3xl" />

        <h1 className="relative text-4xl sm:text-5xl font-bold tracking-tight text-slate-900">
          La solution simple et fiable pour vos livraisons locales.
        </h1>

        <p className="relative mt-4 max-w-2xl text-base sm:text-lg leading-7 text-slate-600">
          Gagnez du temps, publiez une mission en quelques minutes, et trouvez un livreur
          rapidement — en toute clarté.
        </p>

        <div className="relative mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            href="/client/new-order"
            className="inline-flex items-center justify-center rounded-2xl bg-blue-600 px-6 py-3 font-semibold text-white shadow hover:bg-blue-700"
          >
            Créer une livraison
          </Link>
          <Link
            href="/livreur/missions"
            className="inline-flex items-center justify-center rounded-2xl border border-blue-200 bg-white px-6 py-3 font-semibold text-blue-700 hover:bg-blue-50"
          >
            Devenir livreur
          </Link>
        </div>
      </div>
    </section>
  );
}