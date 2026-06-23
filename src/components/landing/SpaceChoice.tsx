import Link from "next/link";

type CardProps = {
  href: string;
  title: string;
  desc: string;
  button: string;
};

function Card({ href, title, desc, button }: CardProps) {
  return (
    <Link href={href} className="block">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-blue-300 hover:shadow-lg">
        <h3 className="text-xl font-black text-slate-900">{title}</h3>

        <p className="mt-3 text-sm leading-6 text-slate-600">{desc}</p>

        <span className="mt-5 inline-flex rounded-2xl bg-blue-600 px-5 py-3 text-sm font-bold text-white">
          {button}
        </span>
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
          Publiez une demande ou acceptez des missions locales.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card
          href="/login?next=/client/new-order"
          title="Espace utilisateur"
          desc="Créer une demande pour récupérer un achat local, une commande Marketplace, un colis, un document ou un objet du quotidien."
          button="Créer une commande"
        />

        <Card
          href="/livreur/signup"
          title="Espace livreur"
          desc="Créer votre profil, compléter vos informations et recevoir des missions locales pour générer un revenu complémentaire."
          button="Devenir livreur"
        />
      </div>
    </section>
  );
}