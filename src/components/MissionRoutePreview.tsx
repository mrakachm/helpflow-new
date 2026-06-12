"use client";

type Props = {
  pickupAddress?: string | null;
  pickupCity?: string | null;
  dropoffAddress?: string | null;
  dropoffCity?: string | null;
};

export default function MissionRoutePreview({
  pickupAddress,
  pickupCity,
  dropoffAddress,
  dropoffCity,
}: Props) {
  const origin = `${pickupAddress || ""} ${pickupCity || ""}`.trim();
  const destination = `${dropoffAddress || ""} ${dropoffCity || ""}`.trim();

  if (!origin || !destination) {
    return (
      <div className="rounded-2xl bg-gray-100 p-4 text-sm text-gray-500">
        Trajet indisponible pour cette mission.
      </div>
    );
  }

  const openUrl =
    "https://www.google.com/maps/dir/?api=1" +
    `&origin=${encodeURIComponent(origin)}` +
    `&destination=${encodeURIComponent(destination)}` +
    "&travelmode=driving";

  return (
    <div className="overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-5">
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-4 w-4 rounded-full border-2 border-blue-600 bg-white" />
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Point retrait
              </p>
              <p className="font-semibold text-gray-900">{origin}</p>
            </div>
          </div>

          <div className="ml-2 my-3 h-12 border-l-4 border-blue-600" />

          <div className="flex items-start gap-3">
            <div className="mt-1 h-4 w-4 rounded-full bg-red-600" />
            <div>
              <p className="text-xs font-bold uppercase text-gray-500">
                Point livraison
              </p>
              <p className="font-semibold text-gray-900">{destination}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3">
        <a
          href={openUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white"
        >
          Ouvrir l’itinéraire
        </a>
      </div>
    </div>
  );
}