import Link from "next/link";

type CardProps = {
  href: string;
  title: string;
  desc: string;
};

function Card({ href, title, desc }: CardProps) {
  return (
    <Link href={href} className="block">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Pastille pro (sans emoji) */}
            <div className="h-10 w-10 shrink-0 rounded-xl bg-blue-50 border border-blue-100" />

            <div>
              <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-600">{desc}</p>
            </div>
          </div>

          <span className="inline-flex items-center rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white">
            Ouvrir →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function SpaceChoice() {
  return (
    <section className="mx-auto w-full max-w-5xl px-6 pt-10">
      <h2 className="text-2xl font-bold text-slate-900">Choisissez votre espace</h2>
      <p className="mt-2 text-sm text-slate-600">
        Accédez à votre interface en un clic.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Card
          href="/client/new-order"
          title="Espace client"
          desc="Créer une mission, voir le prix et suivre la livraison."
        />

        <Card
          href="/livreur/missions"
          title="Espace livreur"
          desc="Voir les missions disponibles et accepter une livraison."
        />
      </div>
    </section>
  );
}