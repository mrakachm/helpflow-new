import Link from "next/link";

export default function AidePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-5">

        <h1 className="text-3xl font-bold text-gray-900">
          Centre d’aide
        </h1>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">
            Aide utilisateur
          </h2>

          <div className="mt-4 space-y-3 text-gray-700">
            <p>• Comment créer une commande ?</p>
            <p>• Comment suivre une livraison ?</p>
            <p>• Comment gérer mon compte ?</p>
          </div>
        </section>


        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">
            Aide livreur
          </h2>

          <div className="mt-4 space-y-3 text-gray-700">
            <p>• Comment accepter une mission ?</p>
            <p>• Comment terminer une livraison ?</p>
            <p>• Comment voir mes revenus ?</p>
          </div>
        </section>


        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">
            Paiement
          </h2>

          <div className="mt-4 space-y-3 text-gray-700">
            <p>• Paiement sécurisé</p>
            <p>• Portefeuille livreur</p>
            <p>• Demande de virement</p>
          </div>
        </section>


        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold">
            Contact
          </h2>

          <p className="mt-3 text-gray-700">
            Besoin d’aide ? Contactez le support HelpFlow.
          </p>
        </section>


        <Link
          href="/"
          className="block rounded-2xl bg-blue-600 p-4 text-center font-bold text-white"
        >
          Retour accueil
        </Link>

      </div>
    </main>
  );
}