"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-10">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-4 text-2xl font-semibold">Paiement validé</h1>

          {orderId ? (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 p-3 text-sm">
              Commande confirmée :{" "}
              <span className="font-medium">{orderId}</span>
            </div>
          ) : (
            <div className="mb-4 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm">
              Paiement terminé, mais aucun orderId n’a été trouvé dans l’URL.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {orderId && (
              <Link
                href={`/client/orders/${orderId}`}
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-white"
              >
                Voir la commande
              </Link>
            )}

            <Link
              href="/client/orders"
              className="inline-flex items-center justify-center rounded-xl border border-gray-300 px-4 py-3"
            >
              Retour à mes commandes
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}