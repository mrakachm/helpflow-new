import Link from "next/link";

const services = [
  {
    title: "Marchés & achats locaux",
    description:
      "Faites récupérer vos achats auprès d’un stand de marché, d’un commerçant ou d’une boutique locale, puis livrer à l’adresse de votre choix.",
    image:
      "https://flyimg.opencityitalia.it/upload/rf_1%2Co_auto%2Cw_2500%2Ch_2500/https%3A%2F%2Fs3-eu-west-1.amazonaws.com%2Fstatic.opencity.opencontent.it%2Fvar%2Fsanvincenzo%2Fstorage%2Fimages%2Fmedia%2Fimages%2Fcommercio-ia%2F67587-1-ita-IT%2Fcommercio-IA_reference.png",
  },
  {
    title: "Commerces de proximité",
    description:
      "Pressing, tailleur, fleuriste, artisan ou autre commerce : récupérez une commande prête sans vous déplacer.",
    image:
      "https://www.charenton-commerces.fr/eshop_data/eshop_retouches_data/upload/images/DM%20magasin/_thumbs/1920x_/IMG_2145_r.jpg",
  },
  {
    title: "Colis & proches",
    description:
      "Envoyez un colis, un vêtement, un cadeau ou un objet à un membre de votre famille ou à un proche.",
    image:
      "https://media.product.which.co.uk/prod/images/original/gm-5661f7a9-b609-4030-97a5-4237ba56a86e-buying-or-selling-second-hand-4.jpg",
  },
  {
    title: "Commandes à récupérer",
    description:
      "Une commande est prête en magasin ou au restaurant ? Faites-la récupérer et livrer simplement.",
    image:
      "https://itsmasalatime.com/wp-content/uploads/2024/08/restaurant-food-pickup-Gen-Z-1024x655.webp",
  },
  {
    title: "Objets oubliés",
    description:
      "Téléphone, clés, sac, lunettes ou autre objet oublié au restaurant, au travail, chez un proche ou dans un commerce.",
    image:
      "https://cdn.mos.cms.futurecdn.net/v2/t%3A0%2Cl%3A219%2Ccw%3A842%2Cch%3A842%2Cq%3A80%2Cw%3A842/7HQP87pJfSyhoPej38MaTV.jpg",
  },
  {
    title: "Marketplace & seconde main",
    description:
      "Faites récupérer un achat réalisé auprès d’un particulier ou sur une plateforme de seconde main, puis faites-le livrer.",
    image:
      "https://media.product.which.co.uk/prod/images/original/gm-5661f7a9-b609-4030-97a5-4237ba56a86e-buying-or-selling-second-hand-4.jpg",
  },
];

export default function SpaceChoice() {
  return (
    <section
      id="services"
      className="mx-auto w-full max-w-6xl px-6 py-16"
    >
      <div className="mx-auto max-w-3xl text-center">
        <p className="text-sm font-bold uppercase tracking-wider text-blue-600">
          Des solutions pour le quotidien
        </p>

        <h2 className="mt-3 text-3xl font-black text-slate-950 sm:text-4xl">
          HelpFlow pour vos besoins de proximité
        </h2>

        <p className="mt-4 text-lg leading-8 text-slate-600">
          Marché, commerce, colis ou objet oublié : trouvez un livreur de
          proximité pour récupérer et livrer ce dont vous avez besoin.
        </p>
      </div>

      <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <article
            key={service.title}
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <div className="h-48 w-full overflow-hidden bg-slate-100">
              <img
                src={service.image}
                alt={service.title}
                className="h-full w-full object-cover transition duration-500 hover:scale-105"
              />
            </div>

            <div className="p-6">
              <h3 className="text-xl font-black text-slate-950">
                {service.title}
              </h3>

              <p className="mt-3 leading-7 text-slate-600">
                {service.description}
              </p>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/login?next=/client/new-order"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-4 font-bold text-white shadow-sm transition hover:bg-blue-700"
        >
          Créer ma demande
        </Link>
      </div>
    </section>
  );
}