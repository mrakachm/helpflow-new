export default function AdminRevenusPage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-4xl space-y-5">

        <h1 className="text-3xl font-bold">
          💰 Revenus HelpFlow
        </h1>

        <div className="grid grid-cols-2 gap-4">

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-gray-500">
              Argent gagné
            </p>
            <h2 className="text-3xl font-bold text-green-600">
              0 €
            </h2>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow">
            <p className="text-gray-500">
              Missions terminées
            </p>
            <h2 className="text-3xl font-bold">
              0
            </h2>
          </div>

        </div>

        <section className="rounded-3xl bg-white p-5 shadow">
          <h2 className="text-xl font-bold mb-3">
            Historique commissions
          </h2>

          <p className="text-gray-500">
            Aucune commission pour le moment.
          </p>
        </section>

      </div>
    </main>
  );
}