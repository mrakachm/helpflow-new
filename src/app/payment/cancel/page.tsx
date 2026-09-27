import Link from "next/link";

export default function PaymentCancelPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10">
      <div className="mx-auto max-w-lg">
        <div className="overflow-hidden rounded-3xl border border-amber-200 bg-white shadow-sm">
          <div className="bg-amber-50 px-6 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
              ↩️
            </div>

            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              Paiement annulé
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Aucun paiement n’a été confirmé. Votre commande reste accessible
              dans vos commandes et vous pourrez reprendre le paiement si vous
              le souhaitez.
            </p>
          </div>

          <div className="space-y-3 p-6">
            <Link
              href="/client/orders"
              className="block w-full rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white"
            >
              Retour à mes commandes
            </Link>

            <Link
              href="/client/new-order"
              className="block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-center font-semibold text-gray-800"
            >
              Créer une nouvelle livraison
            </Link>

            <p className="pt-2 text-center text-xs leading-5 text-gray-500">
              Si vous aviez annulé le paiement d’un retour, ouvrez simplement la
              commande concernée dans « Mes commandes » pour reprendre le
              paiement ou choisir de renoncer au retour.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}