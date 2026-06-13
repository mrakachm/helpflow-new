import Link from "next/link";

type CardProps = {
  href: string;
  title: string;
  desc: string;
};

function Card({ href, title, desc }: CardProps) {
  return (
    <Link href={href} className="block">
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-lg">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 shadow-md" />

            <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
            </div>
          </div>

          <span className="rounded-full bg-blue-600 px-5 py-3 text-sm font-bold text-white">
            Ouvrir →
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function SpaceChoice() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <h2 className="text-3xl font-bold text-slate-900">
        Choisissez votre espace
      </h2>

      <p className="mt-2 text-slate-600">
        Client ou livreur, accédez rapidement à votre interface.
      </p>

      <div className="mt-6 grid gap-5 md:grid-cols-2">
        <Card
          href="/client/new-order"
          title="Espace client"
          desc="Créer une mission, voir le prix et gagner du temps en quelques clics."
        />

        <Card
          href="/livreur/missions"
          title="Espace livreur"
          desc="Voir les missions disponibles, accepter une livraison et gagner de l’argent."
        />
      </div>
    </section>
  );
}