"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import GoogleMapsScript from "@/components/GoogleMapsScript";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { calculatePrice, type VehicleType } from "@/lib/pricing";

type Target = "pickup" | "dropoff";

type Suggestion = {
  description: string;
  placeId: string;
  prediction: any;
};

type EstimateData = {
  pickupAddress: string;
  pickupCity: string;
  dropoffAddress: string;
  dropoffCity: string;
  vehicleRequired: string;
  distanceKm: number;
  distanceMeters: number;
  minimumPriceCents: number;
  deliveryMode: "standard" | "scheduled";
  scheduledAt: string | null;
  createdAt: string;
};

function formatEuro(cents: number) {
  return `${(cents / 100).toLocaleString("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} €`;
}

function cleanAddress(text: string) {
  return String(text || "")
    .replace(/\b(RDC|DRC|rez-de-chaussée|rez de chaussée)\b/gi, "")
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function componentText(component: any) {
  return (
    component?.longText ||
    component?.long_name ||
    component?.shortText ||
    component?.short_name ||
    ""
  );
}

function getAddressPart(components: any[] | undefined, type: string) {
  const component = components?.find((item) =>
    item?.types?.includes(type)
  );

  return componentText(component);
}

function extractAddressPartsFromComponents(
  components: any[] | undefined,
  formattedAddress = ""
) {
  const streetNumber = getAddressPart(components, "street_number");
  const route = getAddressPart(components, "route");

  const city =
    getAddressPart(components, "locality") ||
    getAddressPart(components, "postal_town") ||
    getAddressPart(components, "administrative_area_level_3") ||
    getAddressPart(components, "administrative_area_level_2");

  const postalCode = getAddressPart(components, "postal_code");

  const street = [streetNumber, route].filter(Boolean).join(" ").trim();

  return {
    address: street || formattedAddress || "",
    city,
    postalCode,
    cityLabel: [postalCode, city].filter(Boolean).join(" ").trim(),
  };
}

function vehicleToPricingType(value: string): VehicleType {
  if (value === "Voiture") return "voiture";
  if (value === "Utilitaire") return "camion";
  return "velo";
}

async function waitForGoogleMaps(timeoutMs = 10000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const google = (window as any).google;

    if (
      google?.maps?.DirectionsService &&
      google?.maps?.Geocoder &&
      google?.maps?.importLibrary
    ) {
      return google;
    }

    await new Promise((resolve) => window.setTimeout(resolve, 150));
  }

  throw new Error(
    "Google Maps n’est pas encore disponible. Actualisez la page puis réessayez."
  );
}

async function geocodeFrenchAddress(address: string, cityOrPostal: string) {
  const google = await waitForGoogleMaps();
  const geocoder = new google.maps.Geocoder();

  const query = [cleanAddress(address), cityOrPostal.trim(), "France"]
    .filter(Boolean)
    .join(", ");

  const response = await geocoder.geocode({
    address: query,
    region: "FR",
    componentRestrictions: { country: "FR" },
  });

  const result = response?.results?.[0];

  if (!result?.geometry?.location) {
    throw new Error(
      `Adresse introuvable : ${address}. Choisissez une suggestion Google ou vérifiez l’adresse.`
    );
  }

  const parsed = extractAddressPartsFromComponents(
    result.address_components,
    result.formatted_address
  );

  return {
    location: result.geometry.location,
    address: parsed.address || cleanAddress(address),
    city: parsed.city,
    postalCode: parsed.postalCode,
    cityLabel:
      parsed.cityLabel ||
      cityOrPostal.trim(),
    formattedAddress: result.formatted_address || query,
  };
}

async function getDrivingDistanceMeters(origin: any, destination: any) {
  const google = await waitForGoogleMaps();
  const service = new google.maps.DirectionsService();

  const result = await service.route({
    origin,
    destination,
    travelMode: google.maps.TravelMode.DRIVING,
    region: "FR",
  });

  const legs = result?.routes?.[0]?.legs || [];
  const distanceMeters = legs.reduce(
    (total: number, leg: any) =>
      total + Number(leg?.distance?.value || 0),
    0
  );

  if (!distanceMeters || !Number.isFinite(distanceMeters)) {
    throw new Error(
      "Impossible de calculer la distance entre ces deux adresses. Choisissez les adresses proposées par Google."
    );
  }

  return distanceMeters;
}

export default function HomeEstimator() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const pickupTimerRef = useRef<number | null>(null);
  const dropoffTimerRef = useRef<number | null>(null);
  const pickupSessionTokenRef = useRef<any>(null);
  const dropoffSessionTokenRef = useRef<any>(null);

  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");

  const [pickupSuggestions, setPickupSuggestions] = useState<Suggestion[]>([]);
  const [dropoffSuggestions, setDropoffSuggestions] = useState<Suggestion[]>([]);
  const [pickupSuggestionsLoading, setPickupSuggestionsLoading] =
    useState(false);
  const [dropoffSuggestionsLoading, setDropoffSuggestionsLoading] =
    useState(false);

  const [vehicleRequired, setVehicleRequired] = useState("Petit transport");

  const [deliveryMode, setDeliveryMode] =
    useState<"standard" | "scheduled">("standard");
  const [scheduledAt, setScheduledAt] = useState("");

  const [estimateLoading, setEstimateLoading] = useState(false);
  const [estimateError, setEstimateError] = useState<string | null>(null);
  const [estimatedDistanceMeters, setEstimatedDistanceMeters] =
    useState<number | null>(null);
  const [estimatedPriceCents, setEstimatedPriceCents] =
    useState<number | null>(null);

  async function fetchSuggestions(query: string, target: Target) {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      if (target === "pickup") setPickupSuggestions([]);
      else setDropoffSuggestions([]);
      return;
    }

    if (target === "pickup") setPickupSuggestionsLoading(true);
    else setDropoffSuggestionsLoading(true);

    try {
      const google = await waitForGoogleMaps();
      const placesLibrary: any = await google.maps.importLibrary("places");

      const {
        AutocompleteSuggestion,
        AutocompleteSessionToken,
      } = placesLibrary;

      const tokenRef =
        target === "pickup"
          ? pickupSessionTokenRef
          : dropoffSessionTokenRef;

      if (!tokenRef.current) {
        tokenRef.current = new AutocompleteSessionToken();
      }

      const { suggestions } =
        await AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          includedRegionCodes: ["fr"],
          language: "fr",
          region: "fr",
          sessionToken: tokenRef.current,
        });

      const predictions: Suggestion[] = (suggestions || [])
        .map((item: any) => item?.placePrediction)
        .filter(Boolean)
        .slice(0, 6)
        .map((prediction: any) => ({
          description: prediction.text?.toString?.() || "",
          placeId: prediction.placeId || "",
          prediction,
        }))
        .filter((item: Suggestion) => item.description);

      if (target === "pickup") setPickupSuggestions(predictions);
      else setDropoffSuggestions(predictions);
    } catch (error) {
      console.error("HOME ESTIMATOR SUGGESTIONS ERROR =>", error);

      if (target === "pickup") setPickupSuggestions([]);
      else setDropoffSuggestions([]);

      setEstimateError(
        "Les suggestions d’adresse Google ne sont pas disponibles. Vérifiez que Places API (New) est activée dans Google Cloud."
      );
    } finally {
      if (target === "pickup") setPickupSuggestionsLoading(false);
      else setDropoffSuggestionsLoading(false);
    }
  }

  function scheduleSuggestions(query: string, target: Target) {
    const ref =
      target === "pickup" ? pickupTimerRef : dropoffTimerRef;

    if (ref.current) {
      window.clearTimeout(ref.current);
    }

    ref.current = window.setTimeout(() => {
      void fetchSuggestions(query, target);
    }, 250);
  }

  async function selectSuggestion(
    suggestion: Suggestion,
    target: Target
  ) {
    try {
      const place = suggestion.prediction.toPlace();

      await place.fetchFields({
        fields: [
          "addressComponents",
          "formattedAddress",
          "location",
        ],
      });

      const parsed = extractAddressPartsFromComponents(
        place.addressComponents,
        place.formattedAddress || suggestion.description
      );

      const finalAddress =
        parsed.address ||
        place.formattedAddress ||
        suggestion.description;

      const finalCity =
        parsed.cityLabel ||
        parsed.city ||
        "";

      if (target === "pickup") {
        setPickupAddress(finalAddress);
        setPickupCity(finalCity);
        setPickupSuggestions([]);
        pickupSessionTokenRef.current = null;
      } else {
        setDropoffAddress(finalAddress);
        setDropoffCity(finalCity);
        setDropoffSuggestions([]);
        dropoffSessionTokenRef.current = null;
      }

      clearEstimate();
    } catch (error) {
      console.error("HOME ESTIMATOR PLACE DETAILS ERROR =>", error);

      if (target === "pickup") {
        setPickupAddress(suggestion.description);
        setPickupSuggestions([]);
        pickupSessionTokenRef.current = null;
      } else {
        setDropoffAddress(suggestion.description);
        setDropoffSuggestions([]);
        dropoffSessionTokenRef.current = null;
      }

      setEstimatedDistanceMeters(null);
      setEstimatedPriceCents(null);
      setEstimateError(
        "Impossible de récupérer automatiquement cette adresse. Essayez une autre suggestion."
      );
    }
  }

  function clearEstimate() {
    setEstimateError(null);
    setEstimatedDistanceMeters(null);
    setEstimatedPriceCents(null);
  }

  async function calculateEstimate() {
    setEstimateError(null);
    setEstimatedDistanceMeters(null);
    setEstimatedPriceCents(null);

    if (!pickupAddress.trim()) {
      setEstimateError("Renseignez l’adresse de départ.");
      return;
    }

    if (!dropoffAddress.trim()) {
      setEstimateError("Renseignez l’adresse d’arrivée.");
      return;
    }

    if (!vehicleRequired) {
      setEstimateError("Choisissez le véhicule adapté à votre colis.");
      return;
    }

    if (deliveryMode === "scheduled" && !scheduledAt) {
      setEstimateError(
        "Choisissez la date et l’heure souhaitées pour la livraison."
      );
      return;
    }

    setEstimateLoading(true);

    try {
      const [pickupResolved, dropoffResolved] = await Promise.all([
        geocodeFrenchAddress(pickupAddress, pickupCity),
        geocodeFrenchAddress(dropoffAddress, dropoffCity),
      ]);

      setPickupAddress(pickupResolved.address);
      setPickupCity(pickupResolved.cityLabel);
      setDropoffAddress(dropoffResolved.address);
      setDropoffCity(dropoffResolved.cityLabel);

      const distanceMeters = await getDrivingDistanceMeters(
        pickupResolved.location,
        dropoffResolved.location
      );

      const pricing = calculatePrice(
        distanceMeters,
        vehicleToPricingType(vehicleRequired)
      );

      setEstimatedDistanceMeters(distanceMeters);
      setEstimatedPriceCents(Math.round(pricing.price * 100));
    } catch (error: unknown) {
      console.error("HOME ESTIMATOR CALCULATION ERROR =>", error);

      setEstimateError(
        error instanceof Error
          ? error.message
          : "Impossible de calculer l’estimation."
      );
    } finally {
      setEstimateLoading(false);
    }
  }

  async function continueOrder() {
    if (
      estimatedDistanceMeters === null ||
      estimatedPriceCents === null
    ) {
      setEstimateError(
        "Calculez d’abord votre estimation avant de continuer."
      );
      return;
    }

    const estimate: EstimateData = {
      pickupAddress: cleanAddress(pickupAddress),
      pickupCity: pickupCity.trim(),
      dropoffAddress: cleanAddress(dropoffAddress),
      dropoffCity: dropoffCity.trim(),
      vehicleRequired,
      distanceKm: Number(
        (estimatedDistanceMeters / 1000).toFixed(2)
      ),
      distanceMeters: estimatedDistanceMeters,
      minimumPriceCents: estimatedPriceCents,
      deliveryMode,
      scheduledAt:
        deliveryMode === "scheduled" && scheduledAt
          ? scheduledAt
          : null,
      createdAt: new Date().toISOString(),
    };

    sessionStorage.setItem(
      "jalin_pending_estimate",
      JSON.stringify(estimate)
    );

    const { data } = await supabase.auth.getUser();

    if (data.user) {
      router.push("/client/new-order?from=estimate");
      return;
    }

    router.push("/signup?from=estimate&next=/client/new-order");
  }

  return (
    <>
      <GoogleMapsScript />

      <section className="w-full py-4">
        <div className="overflow-hidden rounded-[2rem] border border-blue-200 bg-gradient-to-br from-blue-600 via-blue-700 to-slate-900 shadow-xl">
          <div className="px-4 py-7 text-white sm:px-8 sm:py-10">
            <div className="mx-auto max-w-3xl text-center">
              <span className="inline-flex rounded-full bg-white/15 px-4 py-2 text-sm font-semibold ring-1 ring-white/20">
                Estimation rapide
              </span>

              <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                Estimez votre livraison avant de vous inscrire
              </h2>

              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-blue-50 sm:text-base">
                Indiquez le départ, l’arrivée et le véhicule adapté à
                votre colis. Jalin calcule la distance routière et le
                tarif minimum avant la création de votre compte.
              </p>
            </div>

            <div className="mx-auto mt-7 max-w-3xl rounded-[1.7rem] bg-white p-4 text-slate-900 shadow-2xl sm:p-6">
              <div className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Adresse de départ
                  </label>

                  <div className="relative">
                    <input
                      value={pickupAddress}
                      onChange={(e) => {
                        const value = e.target.value;
                        setPickupAddress(value);
                        setPickupCity("");
                        clearEstimate();
                        scheduleSuggestions(value, "pickup");
                      }}
                      onBlur={() => {
                        window.setTimeout(
                          () => setPickupSuggestions([]),
                          180
                        );
                      }}
                      placeholder="Ex. 10 rue de Vesle"
                      autoComplete="off"
                      inputMode="text"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    {pickupSuggestionsLoading ? (
                      <p className="mt-1 px-1 text-xs text-slate-500">
                        Recherche d’adresses…
                      </p>
                    ) : null}

                    {pickupSuggestions.length > 0 ? (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                        {pickupSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              selectSuggestion(
                                suggestion,
                                "pickup"
                              )
                            }
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50"
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <input
                    value={pickupCity}
                    onChange={(e) => {
                      setPickupCity(e.target.value);
                      clearEstimate();
                    }}
                    placeholder="Ville / code postal (automatique après sélection)"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Adresse d’arrivée
                  </label>

                  <div className="relative">
                    <input
                      value={dropoffAddress}
                      onChange={(e) => {
                        const value = e.target.value;
                        setDropoffAddress(value);
                        setDropoffCity("");
                        clearEstimate();
                        scheduleSuggestions(value, "dropoff");
                      }}
                      onBlur={() => {
                        window.setTimeout(
                          () => setDropoffSuggestions([]),
                          180
                        );
                      }}
                      placeholder="Ex. 4 rue du Commerce"
                      autoComplete="off"
                      inputMode="text"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />

                    {dropoffSuggestionsLoading ? (
                      <p className="mt-1 px-1 text-xs text-slate-500">
                        Recherche d’adresses…
                      </p>
                    ) : null}

                    {dropoffSuggestions.length > 0 ? (
                      <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-xl">
                        {dropoffSuggestions.map((suggestion) => (
                          <button
                            key={suggestion.placeId}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() =>
                              selectSuggestion(
                                suggestion,
                                "dropoff"
                              )
                            }
                            className="block w-full border-b border-slate-100 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50"
                          >
                            {suggestion.description}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <input
                    value={dropoffCity}
                    onChange={(e) => {
                      setDropoffCity(e.target.value);
                      clearEstimate();
                    }}
                    placeholder="Ville / code postal (automatique après sélection)"
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Véhicule adapté au colis
                  </label>

                  <select
                    value={vehicleRequired}
                    onChange={(e) => {
                      setVehicleRequired(e.target.value);
                      clearEstimate();
                    }}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                  >
                    <option value="Petit transport">
                      Petit transport — sac, courses, documents, petit colis — à partir de 5 €
                    </option>
                    <option value="Voiture">
                      Voiture — TV, colis volumineux ou fragile — à partir de 8 €
                    </option>
                    <option value="Utilitaire">
                      Utilitaire — meuble, électroménager, gros volume — à partir de 20 €
                    </option>
                  </select>

                  <p className="mt-2 text-xs leading-5 text-slate-500">
                    Choisissez selon la taille et les besoins réels du colis,
                    pas uniquement selon le prix.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Quand souhaitez-vous la livraison ?
                  </label>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMode("standard");
                        setScheduledAt("");
                        clearEstimate();
                      }}
                      className={`rounded-xl border px-4 py-3 text-left ${
                        deliveryMode === "standard"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="block font-bold">
                        Standard
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Dès qu’un livreur est disponible
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setDeliveryMode("scheduled");
                        clearEstimate();
                      }}
                      className={`rounded-xl border px-4 py-3 text-left ${
                        deliveryMode === "scheduled"
                          ? "border-blue-600 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <span className="block font-bold">
                        Programmer
                      </span>
                      <span className="mt-1 block text-xs text-slate-500">
                        Choisir une date et une heure
                      </span>
                    </button>
                  </div>

                  {deliveryMode === "scheduled" ? (
                    <input
                      type="datetime-local"
                      value={scheduledAt}
                      onChange={(e) => {
                        setScheduledAt(e.target.value);
                        clearEstimate();
                      }}
                      className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500"
                    />
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={calculateEstimate}
                  disabled={estimateLoading}
                  className="mt-1 w-full rounded-xl bg-blue-600 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60"
                >
                  {estimateLoading
                    ? "Calcul de la distance..."
                    : "Estimer ma livraison"}
                </button>

                {estimateError ? (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {estimateError}
                  </div>
                ) : null}

                {estimatedDistanceMeters !== null &&
                estimatedPriceCents !== null ? (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <p className="text-sm font-bold text-emerald-800">
                      Votre estimation
                    </p>

                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs text-slate-500">
                          Distance routière
                        </p>
                        <p className="mt-1 text-xl font-black text-slate-900">
                          {(estimatedDistanceMeters / 1000).toFixed(1)} km
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-3">
                        <p className="text-xs text-slate-500">
                          À partir de
                        </p>
                        <p className="mt-1 text-xl font-black text-emerald-700">
                          {formatEuro(estimatedPriceCents)}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-emerald-900">
                      Le tarif dépend de la distance réelle et du véhicule
                      adapté au colis. Vous pourrez compléter les détails de
                      la commande avant le paiement.
                    </p>

                    <button
                      type="button"
                      onClick={continueOrder}
                      className="mt-4 w-full rounded-xl bg-slate-950 px-5 py-4 font-black text-white"
                    >
                      Continuer ma commande
                    </button>

                    <p className="mt-2 text-center text-xs text-slate-500">
                      Si vous n’avez pas encore de compte, nous vous
                      demanderons d’abord de vous inscrire, puis vous
                      reprendrez directement cette commande.
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
