export default function HistoriquePage() {
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          Historique de mes livraisons
        </h1>

        <p className="text-gray-500 mb-6">
          Retrouvez ici toutes vos missions terminées.
        </p>

        <div className="bg-white rounded-3xl shadow p-6 text-center">
          Aucune livraison terminée pour le moment.
        </div>

      </div>
    </main>
  );
}
