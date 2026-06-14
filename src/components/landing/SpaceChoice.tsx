import Link from "next/link";

type CardProps = {
  href: string;
  title: string;
  desc: string;
};

function Card({ href, title, desc }: CardProps) {
  return (
    <Link href={href} className="block">
      <div className="rounded-3xl border border-blue-100 bg-white p-6 shadow-sm transition hover:shadow-lg hover:border-blue-300">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 shadow-md" />

            <div>
              <h3 className="text-xl font-bold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                {desc}
              </p>
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
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-black text-slate-900 sm:text-4xl">
          Choisissez votre espace
        </h2>

        <p className="mt-3 text-lg text-slate-600">
          Que vous ayez besoin de récupérer un achat ou que vous souhaitiez
          effectuer des missions locales, accédez rapidement à votre interface.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          href="/client/new-order"
          title="Espace client"
          desc="Publier une demande pour récupérer un achat local, une commande Marketplace, un colis, un document ou un objet oublié."
        />

        <Card
          href="/livreur/missions"
          title="Espace livreur"
          desc="Accepter des missions locales, récupérer des achats, colis ou documents et gagner un revenu complémentaire selon vos disponibilités."
        />
      </div>
    </section>
  );
}