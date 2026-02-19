function Item({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{desc}</p>
    </div>
  );
}

export default function WhyHelpFlow() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-10">
      <h2 className="text-2xl font-bold text-slate-900">Pourquoi HelpFlow ?</h2>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Item
          title="Simple"
          desc="Un parcours clair : créer → publier → livraison."
        />
        <Item
          title="Rapide"
          desc="Une mission publiée en quelques minutes."
        />
        <Item
          title="Fiable"
          desc="Un cadre propre, des infos visibles, et un suivi de mission."
        />
      </div>

      <div className="mt-6 rounded-3xl border border-blue-100 bg-blue-50 p-6">
        <p className="font-semibold text-slate-900">
          La solidarité ne reste pas à la maison.
        </p>
        <p className="mt-1 text-slate-700">Elle marche avec toi.</p>
      </div>
    </section>
  );
}