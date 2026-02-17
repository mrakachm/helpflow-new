import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-md px-4 py-8">

        <h1 className="text-2xl font-semibold mb-6">HelpFlow</h1>

        <p className="text-gray-600 mb-6">
          Choisissez votre espace :
        </p>

        <div className="grid gap-4">

          <Link
            href="/client"
            className="rounded-xl bg-white border p-4 text-center font-medium"
          >
            📦 Espace client
          </Link>

          <Link
            href="/livreur"
            className="rounded-xl bg-white border p-4 text-center font-medium"
          >
            🚴 Espace livreur
          </Link>

        </div>

      </div>
    </main>
  );
}
