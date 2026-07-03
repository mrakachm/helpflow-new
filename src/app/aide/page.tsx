import Link from "next/link";

export default function AidePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-3xl space-y-5">
        <h1 className="text-3xl font-bold text-gray-900">Centre d’aide</h1>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Aide livreur</h2>
          <div className="mt-4 space-y-4 text-gray-700">
            <p><b>Comment recevoir une mission ?</b><br />Mettez votre statut sur En ligne. Les missions disponibles apparaissent automatiquement.</p>
            <p><b>Pourquoi je ne reçois aucune mission ?</b><br />Vérifiez que vous êtes en ligne, que votre zone est correcte et que les notifications sont activées.</p>
            <p><b>Comment mettre les missions en pause ?</b><br />Appuyez sur le bouton En ligne / Pause en haut de la page livreur.</p>
            <p><b>Comment accepter une livraison ?</b><br />Appuyez sur une mission disponible puis confirmez la prise en charge.</p>
            <p><b>Comment terminer une livraison ?</b><br />Entrez le code de validation donné par l’utilisateur.</p>
            <p><b>Où voir mes revenus ?</b><br />Allez dans Portefeuille pour voir votre solde et vos revenus.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Aide utilisateur</h2>
          <div className="mt-4 space-y-4 text-gray-700">
            <p><b>Comment créer une livraison ?</b><br />Indiquez les adresses, les informations du colis puis validez la demande.</p>
            <p><b>Comment suivre ma livraison ?</b><br />Vous pouvez suivre l’état de votre commande depuis votre espace.</p>
            <p><b>À quoi sert le code de livraison ?</b><br />Donnez ce code au livreur uniquement lorsque la livraison est effectuée.</p>
            <p><b>Je n’ai pas reçu ma livraison, que faire ?</b><br />Vérifiez l’état de votre commande ou contactez l’assistance HelpFlow.</p>
            <p><b>Comment annuler une mission ?</b><br />Vous pouvez annuler avant que le livreur commence la mission.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Paiement</h2>
          <div className="mt-4 space-y-4 text-gray-700">
            <p><b>Le paiement est-il sécurisé ?</b><br />Oui, les paiements sont sécurisés.</p>
            <p><b>Quand le livreur reçoit son argent ?</b><br />Après validation de la livraison, le montant apparaît dans son portefeuille.</p>
            <p><b>Comment demander un virement ?</b><br />Le livreur pourra demander un virement depuis son portefeuille.</p>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Contact</h2>
          <p className="mt-3 text-gray-700">
            Besoin d’aide ? Contactez l’équipe HelpFlow depuis l’assistance.
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