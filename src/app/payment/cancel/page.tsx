export default function PaymentCancelPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          ❌ Paiement annulé
        </h1>

        <p className="mt-3 text-gray-700">
          Le paiement n’a pas été finalisé.
          <br />
          Vous pouvez réessayer à tout moment.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <a
            href="/client/new-order"
            className="btn-primary"
          >
            👉 Revenir à la commande
          </a>

          <a
            href="/"
            className="btn-secondary"
          >
            👉 Retour à l’accueil
          </a>
        </div>
      </div>
    </main>
  );
}
