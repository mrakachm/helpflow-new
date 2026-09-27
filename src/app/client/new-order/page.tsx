"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { useRouter } from "next/navigation";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

import { calculatePrice, type VehicleType } from "@/lib/pricing";

import GoogleMapsScript from "@/components/GoogleMapsScript";

function formatEuro(cents: number) {

  return `${(cents / 100).toLocaleString("fr-FR", {

    minimumFractionDigits: 0,

    maximumFractionDigits: 2,

  })} €`;

}

function cleanSimpleAddress(text: string) {

  return String(text || "")

    .replace(/\b(RDC|DRC|rez-de-chaussée|rez de chaussée)\b/gi, "")

    .replace(/[,.]+/g, " ")

    .replace(/\s+/g, " ")

    .trim();

}

function containsPhoneNumber(text: string) {

  const normalized = String(text || "").replace(/[\s.**\\\**-_/()+]/g, "");

  return /0[67]\d{8}/.test(normalized) || /\d{8,}/.test(normalized);

}

function getAddressPart(

  components: any[] | undefined,

  type: string

) {

  return (

    components?.find((component) => component.types?.includes(type))

      ?.long_name || ""

  );

}

function extractGoogleAddress(place: any) {

  const components = place?.address_components || [];

  const streetNumber = getAddressPart(components, "street_number");

  const route = getAddressPart(components, "route");

  const city =

    getAddressPart(components, "locality") ||

    getAddressPart(components, "postal_town") ||

    getAddressPart(components, "administrative_area_level_2");

  const street = [streetNumber, route].filter(Boolean).join(" ").trim();

  return {

    address: street || place?.formatted_address || "",

    city,

  };

}

function vehicleToPricingType(value: string): VehicleType {

  if (value === "Voiture") return "voiture";

  if (value === "Utilitaire") return "camion";

  return "velo";

}

function buildFullAddress(address: string, city: string) {

  return `${cleanSimpleAddress(address)}, ${city.trim()}, France`;

}

async function waitForGoogleMaps(timeoutMs = 10000) {

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {

    const google = (window as any).google;

    if (google?.maps?.DirectionsService) {

      return google;

    }

    await new Promise((resolve) => window.setTimeout(resolve, 150));

  }

  throw new Error(

    "Google Maps n’est pas encore disponible. Actualisez la page puis réessayez."

  );

}

async function getDrivingDistanceMeters(origin: string, destination: string) {

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

      "Impossible de calculer la distance entre ces deux adresses. Vérifiez les adresses."

    );

  }

  return distanceMeters;

}

export default function NewOrderPage() {

  const router = useRouter();

  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const senderSuggestionTimerRef = useRef<number | null>(null);
  const receiverSuggestionTimerRef = useRef<number | null>(null);

  const PARCEL_TYPES = [

    "Courses / alimentation",

    "Repas / nourriture",

    "Vêtements",

    "Pressing / linge",

    "Achats / shopping",

    "Fleurs / cadeau",

    "Produits de beauté",

    "Produits de pharmacie",

    "Café / boissons",

    "Petit équipement maison",

    "Électroménager",

    "Petit mobilier",

    "Matériel professionnel",

    "Pièces détachées",

    "Moteur / pièce mécanique",

    "Autre",

  ];

  const IMPORTANT_PARCEL_TYPES = [

    "Téléphone",

    "Tablette",

    "Ordinateur portable",

    "Lunettes",

    "Documents importants",

    "Clés",

    "Montre / bijoux",

    "Électronique",

    "Objet fragile",

    "Autre",

  ];

  const FLOOR_OPTIONS = [

    "Maison / RDC",

    "Garage",

    "1er étage",

    "2e étage",

    "3e étage",

    "4e étage",

    "5e étage",

    "6e étage ou plus",

  ];

  const ELEVATOR_OPTIONS = [

    { label: "Oui", value: "true" },

    { label: "Non", value: "false" },

  ];

  const BAG_OPTIONS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10+"];

  const BASE_PRICE_CENTS = 500;

  const MIN_PRICE_CENTS = 500;

  const MAX_PHOTO_SIZE = 5 * 1024 * 1024;

  function getVehicleMinimumPriceCents(value: string) {

    if (value === "Voiture") return 800;

    if (value === "Utilitaire") return 2000;

    return MIN_PRICE_CENTS;

  }

  function elevatorValueToBoolean(value: string) {

    if (value === "true") return true;

    if (value === "false") return false;

    return null;

  }

  function bagCountToNumber(value: string) {

    if (value === "10+") return 10;

    return Number(value || 0);

  }

  const [parcelType, setParcelType] = useState("");

  const [isImportantParcel, setIsImportantParcel] = useState(false);

  const [importantParcelType, setImportantParcelType] = useState("");

  const [parcelNote, setParcelNote] = useState("");

  const [parcelPhoto, setParcelPhoto] = useState<File | null>(null);

  const [parcelPhotoPreview, setParcelPhotoPreview] = useState<string | null>(

    null

  );

  const [senderName, setSenderName] = useState("");

  const [senderPhone, setSenderPhone] = useState("");

  const [senderAddress, setSenderAddress] = useState("");

  const [senderCity, setSenderCity] = useState("");
  const [senderSuggestions, setSenderSuggestions] = useState<any[]>([]);
  const [senderSuggestionsLoading, setSenderSuggestionsLoading] = useState(false);

  const [pickupFloor, setPickupFloor] = useState("");

  const [pickupHasElevator, setPickupHasElevator] = useState("");

  const [receiverName, setReceiverName] = useState("");

  const [receiverPhone, setReceiverPhone] = useState("");

  const [receiverAddress, setReceiverAddress] = useState("");

  const [receiverCity, setReceiverCity] = useState("");
  const [receiverSuggestions, setReceiverSuggestions] = useState<any[]>([]);
  const [receiverSuggestionsLoading, setReceiverSuggestionsLoading] = useState(false);

  const [dropoffFloor, setDropoffFloor] = useState("");

  const [dropoffHasElevator, setDropoffHasElevator] = useState("");

  const [bagCount, setBagCount] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");

  const [clientProposedPrice, setClientProposedPrice] = useState("5");

  const [vehicleRequired, setVehicleRequired] = useState("");

  const [parcelSize, setParcelSize] = useState("");

  const [loading, setLoading] = useState(false);

  const [msg, setMsg] = useState<string | null>(null);

  const [estimateVisible, setEstimateVisible] = useState(false);

  const [estimateError, setEstimateError] = useState<string | null>(null);

  const [estimateLoading, setEstimateLoading] = useState(false);

  const [estimatedDistanceMeters, setEstimatedDistanceMeters] =

    useState<number | null>(null);

  const [routeMinimumPriceCents, setRouteMinimumPriceCents] =

    useState<number | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  const [recipientEmail, setRecipientEmail] = useState("");

  const vehicleMinimumPriceCents = vehicleRequired

    ? getVehicleMinimumPriceCents(vehicleRequired)

    : BASE_PRICE_CENTS;

  const effectiveMinimumPriceCents =

    routeMinimumPriceCents ?? vehicleMinimumPriceCents;

  useEffect(() => {

    (async () => {

      const { data } = await supabase.auth.getUser();

      setUserId(data.user?.id ?? null);

    })();

  }, [supabase]);

  async function fetchAddressSuggestions(
    query: string,
    target: "sender" | "receiver"
  ) {
    const trimmed = query.trim();

    if (trimmed.length < 3) {
      if (target === "sender") setSenderSuggestions([]);
      else setReceiverSuggestions([]);
      return;
    }

    if (target === "sender") setSenderSuggestionsLoading(true);
    else setReceiverSuggestionsLoading(true);

    try {
      const google = await waitForGoogleMaps();

      if (!google?.maps?.places?.AutocompleteService) {
        throw new Error("Service de suggestions Google indisponible.");
      }

      const service = new google.maps.places.AutocompleteService();

      const predictions = await new Promise<any[]>((resolve, reject) => {
        service.getPlacePredictions(
          {
            input: trimmed,
            componentRestrictions: { country: "fr" },
            types: ["address"],
          },
          (results: any[] | null, status: string) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK ||
              status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
            ) {
              resolve(results || []);
              return;
            }

            reject(
              new Error(
                "Les suggestions Google sont momentanément indisponibles."
              )
            );
          }
        );
      });

      if (target === "sender") setSenderSuggestions(predictions);
      else setReceiverSuggestions(predictions);
    } catch (error) {
      console.error("GOOGLE ADDRESS SUGGESTIONS ERROR =>", error);

      // La saisie libre reste toujours disponible.
      if (target === "sender") setSenderSuggestions([]);
      else setReceiverSuggestions([]);
    } finally {
      if (target === "sender") setSenderSuggestionsLoading(false);
      else setReceiverSuggestionsLoading(false);
    }
  }

  function scheduleAddressSuggestions(
    query: string,
    target: "sender" | "receiver"
  ) {
    const ref =
      target === "sender"
        ? senderSuggestionTimerRef
        : receiverSuggestionTimerRef;

    if (ref.current) {
      window.clearTimeout(ref.current);
    }

    ref.current = window.setTimeout(() => {
      void fetchAddressSuggestions(query, target);
    }, 250);
  }

  async function selectAddressSuggestion(
    prediction: any,
    target: "sender" | "receiver"
  ) {
    try {
      const google = await waitForGoogleMaps();

      const placesService = new google.maps.places.PlacesService(
        document.createElement("div")
      );

      const place = await new Promise<any>((resolve, reject) => {
        placesService.getDetails(
          {
            placeId: prediction.place_id,
            fields: ["address_components", "formatted_address"],
          },
          (result: any, status: string) => {
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              result
            ) {
              resolve(result);
              return;
            }

            reject(
              new Error(
                "Impossible de récupérer les détails de cette adresse."
              )
            );
          }
        );
      });

      const parsed = extractGoogleAddress(place);

      if (target === "sender") {
        setSenderAddress(parsed.address || prediction.description || "");
        setSenderCity(parsed.city || "");
        setSenderSuggestions([]);
      } else {
        setReceiverAddress(parsed.address || prediction.description || "");
        setReceiverCity(parsed.city || "");
        setReceiverSuggestions([]);
      }
    } catch (error) {
      console.error("GOOGLE ADDRESS DETAILS ERROR =>", error);

      if (target === "sender") {
        setSenderAddress(prediction.description || senderAddress);
        setSenderSuggestions([]);
      } else {
        setReceiverAddress(prediction.description || receiverAddress);
        setReceiverSuggestions([]);
      }
    }
  }

  const pricingView = useMemo(() => {

    const proposedPriceCents =

      clientProposedPrice && Number(clientProposedPrice) > 0

        ? Math.round(Number(clientProposedPrice) * 100)

        : null;

    const finalPriceCents = proposedPriceCents

      ? Math.max(effectiveMinimumPriceCents, proposedPriceCents)

      : effectiveMinimumPriceCents;

    const platformFeeCents = Math.round(finalPriceCents * 0.2);

    const courierEarningsCents = Math.max(

      0,

      finalPriceCents - platformFeeCents

    );

    return {

      proposedPriceCents,

      finalPriceCents,

      platformFeeCents,

      courierEarningsCents,

    };

  }, [clientProposedPrice, effectiveMinimumPriceCents]);

  async function calculateRouteEstimate() {

    if (!senderAddress.trim() || !senderCity.trim()) {

      throw new Error(

        "Renseignez l’adresse et la ville de départ pour estimer la livraison."

      );

    }

    if (!receiverAddress.trim() || !receiverCity.trim()) {

      throw new Error(

        "Renseignez l’adresse et la ville d’arrivée pour estimer la livraison."

      );

    }

    if (!vehicleRequired) {

      throw new Error(

        "Choisissez le véhicule requis pour afficher l’estimation."

      );

    }

    const origin = buildFullAddress(senderAddress, senderCity);

    const destination = buildFullAddress(receiverAddress, receiverCity);

    const distanceMeters = await getDrivingDistanceMeters(

      origin,

      destination

    );

    const priceResult = calculatePrice(

      distanceMeters,

      vehicleToPricingType(vehicleRequired)

    );

    return {

      distanceMeters,

      distanceKm: priceResult.distanceKm,

      minimumPriceCents: Math.round(priceResult.price * 100),

    };

  }

  async function showEstimate() {

    setEstimateError(null);

    setEstimateVisible(false);

    setEstimateLoading(true);

    try {

      const result = await calculateRouteEstimate();

      setEstimatedDistanceMeters(result.distanceMeters);

      setRouteMinimumPriceCents(result.minimumPriceCents);

      const proposedPrice = Number(clientProposedPrice);

      const minimumPriceEuros = result.minimumPriceCents / 100;

      if (

        !clientProposedPrice ||

        Number.isNaN(proposedPrice) ||

        proposedPrice < minimumPriceEuros

      ) {

        setClientProposedPrice(String(Math.ceil(minimumPriceEuros)));

      }

      setEstimateVisible(true);

    } catch (error: unknown) {

      setEstimateError(

        error instanceof Error

          ? error.message

          : "Impossible de calculer l’estimation."

      );

    } finally {

      setEstimateLoading(false);

    }

  }

  useEffect(() => {

    setEstimateVisible(false);

    setEstimateError(null);

    setEstimatedDistanceMeters(null);

    setRouteMinimumPriceCents(null);

  }, [

    senderAddress,

    senderCity,

    receiverAddress,

    receiverCity,

    vehicleRequired,

  ]);

  useEffect(() => {

    setEstimateVisible(false);

    setEstimateError(null);

  }, [clientProposedPrice]);

  function validate(): string | null {

    if (!userId) return "Vous devez être connecté pour créer une commande.";

    if (!senderName.trim()) return "Nom expéditeur manquant.";

    if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";

    if (!senderAddress.trim() || !senderCity.trim())

      return "Adresse expéditeur incomplète.";

    if (!pickupHasElevator)

      return "Veuillez indiquer si le retrait possède un ascenseur.";

    if (!pickupFloor) return "Étage de retrait manquant.";

    if (!receiverName.trim()) return "Nom receveur manquant.";

    if (!receiverPhone.trim()) return "Téléphone receveur manquant.";

    if (!receiverAddress.trim() || !receiverCity.trim())

      return "Adresse receveur incomplète.";

    if (!dropoffHasElevator)

      return "Veuillez indiquer si la livraison possède un ascenseur.";

    if (!dropoffFloor) return "Étage de livraison manquant.";

    if (!bagCount) return "Nombre de sacs / colis manquant.";

    if (!vehicleRequired)

      return "Veuillez choisir le véhicule requis pour cette livraison.";

    if (isImportantParcel && !importantParcelType)

      return "Veuillez choisir le type de colis important.";

    return null;

  }

  function validateSender(): string | null {

    if (!senderName.trim()) return "Nom expéditeur manquant.";

    if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";

    if (!senderAddress.trim() || !senderCity.trim())

      return "Adresse expéditeur incomplète.";

    return null;

  }

  function handleParcelPhotoChange(file: File | null) {

    setMsg(null);

    if (!file) {

      setParcelPhoto(null);

      setParcelPhotoPreview(null);

      return;

    }

    if (!file.type.startsWith("image/")) {

      setMsg("La photo du colis doit être une image.");

      setParcelPhoto(null);

      setParcelPhotoPreview(null);

      return;

    }

    if (file.size > MAX_PHOTO_SIZE) {

      setMsg("La photo du colis ne doit pas dépasser 5 MB.");

      setParcelPhoto(null);

      setParcelPhotoPreview(null);

      return;

    }

    setParcelPhoto(file);

    setParcelPhotoPreview(URL.createObjectURL(file));

  }

  async function uploadParcelPhoto(): Promise<string | null> {

    if (!parcelPhoto || !userId) return null;

    try {

      const extension =

        parcelPhoto.name.split(".").pop()?.toLowerCase() || "jpg";

      const safeExtension =

        extension.replace(/[^a-z0-9]/g, "") || "jpg";

      const path = `${userId}/${Date.now()}.${safeExtension}`;

      const { error } = await supabase.storage

        .from("parcel-photos")

        .upload(path, parcelPhoto, {

          cacheControl: "3600",

          upsert: false,

          contentType: parcelPhoto.type,

        });

      if (error) {

        console.error("UPLOAD PHOTO ERROR =>", error);

        return null;

      }

      const { data } = supabase.storage

        .from("parcel-photos")

        .getPublicUrl(path);

      return data.publicUrl || null;

    } catch (error) {

      console.error("UPLOAD PHOTO FAILED =>", error);

      return null;

    }

  }

  async function onSubmit(e: React.FormEvent) {

    e.preventDefault();

    setMsg(null);

    const err = validate();

    if (err) {

      setMsg(err);

      return;

    }

    if (containsPhoneNumber(parcelNote)) {

      setMsg(

        "Les numéros de téléphone sont interdits dans la description du colis."

      );

      return;

    }

    let routeEstimate;

    try {

      routeEstimate = await calculateRouteEstimate();

    } catch (error: unknown) {

      setMsg(

        error instanceof Error

          ? error.message

          : "Impossible de calculer la distance de la livraison."

      );

      return;

    }

    const proposedPrice = Number(clientProposedPrice);

    const minimumPriceEuros =

      routeEstimate.minimumPriceCents / 100;

    if (

      !clientProposedPrice ||

      Number.isNaN(proposedPrice) ||

      proposedPrice < minimumPriceEuros

    ) {

      setMsg(

        `Le tarif minimum calculé pour cette distance est de ${formatEuro(

          routeEstimate.minimumPriceCents

        )}.`

      );

      return;

    }

    if (!Number.isInteger(proposedPrice)) {

      setMsg(

        "Le tarif proposé doit être un montant entier en euros : 5 €, 6 €, 7 €, 8 €..."

      );

      return;

    }

    const proposedPriceCents = Math.round(proposedPrice * 100);

    const finalPriceCents = Math.max(

      routeEstimate.minimumPriceCents,

      proposedPriceCents

    );

    const platformFeeCents = Math.round(finalPriceCents * 0.2);

    const courierEarningsCents = Math.max(

      0,

      finalPriceCents - platformFeeCents

    );

    setLoading(true);

    try {

      const parcelPhotoUrl = await uploadParcelPhoto();

      const payload: any = {

        client_id: userId,

        sender_name: senderName.trim(),

        sender_phone: senderPhone.trim(),

        pickup_address: cleanSimpleAddress(senderAddress),

        pickup_city: senderCity.trim(),

        pickup_floor: pickupFloor,

        pickup_has_elevator:

          elevatorValueToBoolean(pickupHasElevator),

        receiver_name: receiverName.trim(),

        receiver_phone: receiverPhone.trim(),

        recipient_email: recipientEmail.trim(),

        dropoff_address: cleanSimpleAddress(receiverAddress),

        dropoff_city: receiverCity.trim(),

        dropoff_floor: dropoffFloor,

        dropoff_has_elevator:

          elevatorValueToBoolean(dropoffHasElevator),

        bag_count: bagCountToNumber(bagCount),

        distance_km: Number((routeEstimate.distanceMeters / 1000).toFixed(2)),

        scheduled_at: scheduledAt || null,

        parcel_type: parcelType || null,

        is_important_parcel: isImportantParcel,

        important_parcel_type: isImportantParcel

          ? importantParcelType || null

          : null,

        parcel_note: parcelNote || null,

        parcel_photo_url: parcelPhotoUrl,

        vehicle_required: vehicleRequired || null,

        parcel_size: parcelSize || null,

        price_cents: finalPriceCents,

        client_proposed_price_cents: proposedPriceCents,

        platform_fee_cents: platformFeeCents,

        courier_earnings_cents: courierEarningsCents,

        pricing_mode: "client_proposal",

        // La commande ne devient visible aux livreurs qu'après confirmation Stripe.

        status: "PAYMENT_PENDING",

        payment_status: "pending",

        otp_code: null,

      };

      const { data, error } = await supabase

        .from("orders")

        .insert(payload)

        .select("id")

        .single();

      if (error || !data?.id) {

        console.error("CREATE ORDER ERROR =>", error);

        setMsg(

          "Impossible de créer la commande. Vérifiez les informations puis réessayez."

        );

        setLoading(false);

        return;

      }

      const checkoutResponse = await fetch("/api/checkout", {

        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({

          orderId: data.id,

          paymentType: "INITIAL",

        }),

      });

      const checkoutResult = await checkoutResponse

        .json()

        .catch(() => ({}));

      if (!checkoutResponse.ok || !checkoutResult?.url) {

        console.error(

          "CREATE CHECKOUT ERROR =>",

          checkoutResult

        );

        setMsg(

          checkoutResult?.error ||

            `Commande créée (${data.id}), mais le paiement Stripe n'a pas pu s'ouvrir.`

        );

        setLoading(false);

        return;

      }

      window.location.assign(checkoutResult.url);

    } catch (e: unknown) {

      const message =

        e instanceof Error

          ? e.message

          : "Erreur pendant la création de la commande.";

      console.error("NEW ORDER UNCAUGHT ERROR =>", e);

      setMsg(message);

      setLoading(false);

    }

  }

  return (

    <>

      <GoogleMapsScript />

      <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-xl px-4 py-6">

        <div className="mb-5 flex items-center gap-3">

          <img

            src="/logo-jalin.png"

            alt="Jalin Livraison"

            className="h-10 w-10 rounded-xl object-contain"

          />

          <div>

            <h1 className="text-xl font-semibold">

              Créer une commande

            </h1>

            <p className="text-sm text-gray-600">

              Remplis les infos pour créer ta livraison.

            </p>

            <p className="mt-1 text-xs font-medium text-green-700">

              Vous pouvez estimer le prix avant d’enregistrer la commande.

            </p>

          </div>

        </div>

        {msg && (

          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm">

            {msg}

          </div>

        )}

        <form onSubmit={onSubmit} className="space-y-4">

          <section className="rounded-2xl border border-gray-200 bg-white p-4">

            <div className="mb-3 flex items-center justify-between">

              <h2 className="text-base font-semibold">

                Expéditeur

              </h2>

              <button

                type="button"

                onClick={() => {

                  const err = validateSender();

                  if (err) setMsg(err);

                  else setMsg("✅ Expéditeur validé.");

                }}

                className="rounded-xl bg-black px-3 py-2 text-sm font-medium text-white"

              >

                Valider expéditeur

              </button>

            </div>

            <div className="grid grid-cols-1 gap-3">

              <input

                value={senderName}

                onChange={(e) =>

                  setSenderName(e.target.value)

                }

                placeholder="Nom + Prénom"

                className="w-full rounded-xl border border-gray-200 px-3 py-2"

              />

              <input

                type="tel"

                value={senderPhone}

                onChange={(e) =>

                  setSenderPhone(e.target.value)

                }

                placeholder="Téléphone"

                className="w-full rounded-xl border border-gray-200 px-3 py-2"

              />

              <div className="relative">
                <input
                  value={senderAddress}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSenderAddress(value);
                    setSenderCity("");
                    scheduleAddressSuggestions(value, "sender");
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setSenderSuggestions([]), 180);
                  }}
                  placeholder="Commencez à taper l’adresse de départ"
                  autoComplete="off"
                  inputMode="text"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />

                {senderSuggestionsLoading ? (
                  <p className="mt-1 px-1 text-xs text-gray-500">
                    Recherche d’adresses…
                  </p>
                ) : null}

                {senderSuggestions.length > 0 ? (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                    {senderSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          selectAddressSuggestion(suggestion, "sender")
                        }
                        className="block w-full border-b border-gray-100 px-3 py-3 text-left text-sm last:border-b-0 hover:bg-gray-50"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <input

                value={senderCity}

                onChange={(e) =>

                  setSenderCity(e.target.value)

                }

                placeholder="Ville (automatique, modifiable si besoin)"

                className="w-full rounded-xl border border-gray-200 px-3 py-2"

              />

              <select

                value={pickupHasElevator}

                onChange={(e) =>

                  setPickupHasElevator(e.target.value)

                }

                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"

              >

                <option value="">

                  Ascenseur retrait ?

                </option>

                {ELEVATOR_OPTIONS.map((option) => (

                  <option

                    key={option.value}

                    value={option.value}

                  >

                    {option.label}

                  </option>

                ))}

              </select>

              <select

                value={pickupFloor}

                onChange={(e) =>

                  setPickupFloor(e.target.value)

                }

                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"

              >

                <option value="">

                  Étage / lieu retrait

                </option>

                {FLOOR_OPTIONS.map((floor) => (

                  <option key={floor} value={floor}>

                    {floor}

                  </option>

                ))}

              </select>

            </div>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">

            <h2 className="mb-3 text-base font-semibold">

              Receveur

            </h2>

            <div className="grid grid-cols-1 gap-3">

              <input

                value={receiverName}

                onChange={(e) =>

                  setReceiverName(e.target.value)

                }

                placeholder="Nom + Prénom"

                className="w-full rounded-xl border border-gray-200 px-3 py-2"

              />

              <input

                type="tel"

                value={receiverPhone}

                onChange={(e) =>

                  setReceiverPhone(e.target.value)

                }

                placeholder="Téléphone"

                className="w-full rounded-xl border border-gray-200 px-3 py-2"

              />

              <input

                type="email"

                value={recipientEmail}

                onChange={(e) =>

                  setRecipientEmail(e.target.value)

                }

                placeholder="Email du receveur"

                className="w-full rounded-xl border border-gray-200 px-3 py-2"

              />

              <div className="relative">
                <input
                  value={receiverAddress}
                  onChange={(e) => {
                    const value = e.target.value;
                    setReceiverAddress(value);
                    setReceiverCity("");
                    scheduleAddressSuggestions(value, "receiver");
                  }}
                  onBlur={() => {
                    window.setTimeout(() => setReceiverSuggestions([]), 180);
                  }}
                  placeholder="Commencez à taper l’adresse de livraison"
                  autoComplete="off"
                  inputMode="text"
                  className="w-full rounded-xl border border-gray-200 px-3 py-2"
                />

                {receiverSuggestionsLoading ? (
                  <p className="mt-1 px-1 text-xs text-gray-500">
                    Recherche d’adresses…
                  </p>
                ) : null}

                {receiverSuggestions.length > 0 ? (
                  <div className="absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                    {receiverSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.place_id}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() =>
                          selectAddressSuggestion(suggestion, "receiver")
                        }
                        className="block w-full border-b border-gray-100 px-3 py-3 text-left text-sm last:border-b-0 hover:bg-gray-50"
                      >
                        {suggestion.description}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <input

                value={receiverCity}

                onChange={(e) =>

                  setReceiverCity(e.target.value)

                }

                placeholder="Ville (automatique, modifiable si besoin)"

                className="w-full rounded-xl border border-gray-200 px-3 py-2"

              />

              <select

                value={dropoffHasElevator}

                onChange={(e) =>

                  setDropoffHasElevator(e.target.value)

                }

                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"

              >

                <option value="">

                  Ascenseur livraison ?

                </option>

                {ELEVATOR_OPTIONS.map((option) => (

                  <option

                    key={option.value}

                    value={option.value}

                  >

                    {option.label}

                  </option>

                ))}

              </select>

              <select

                value={dropoffFloor}

                onChange={(e) =>

                  setDropoffFloor(e.target.value)

                }

                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"

              >

                <option value="">

                  Étage / lieu livraison

                </option>

                {FLOOR_OPTIONS.map((floor) => (

                  <option key={floor} value={floor}>

                    {floor}

                  </option>

                ))}

              </select>

            </div>

          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">

            <h2 className="mb-3 text-base font-semibold">

              Colis & Livraison

            </h2>

            <div className="grid grid-cols-1 gap-3">

              <select

                value={bagCount}

                onChange={(e) =>

                  setBagCount(e.target.value)

                }

                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"

              >

                <option value="">

                  Nombre de sacs / colis

                </option>

                {BAG_OPTIONS.map((count) => (

                  <option key={count} value={count}>

                    {count}

                  </option>

                ))}

              </select>

              <select

                value={vehicleRequired}

                onChange={(e) => {

                  const nextVehicle = e.target.value;

                  setVehicleRequired(nextVehicle);

                  setEstimatedDistanceMeters(null);

                  setRouteMinimumPriceCents(null);

                  const nextMinimumCents = nextVehicle

                    ? getVehicleMinimumPriceCents(

                        nextVehicle

                      )

                    : BASE_PRICE_CENTS;

                  setClientProposedPrice(

                    String(nextMinimumCents / 100)

                  );

                }}

                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"

              >

                <option value="">

                  Véhicule requis

                </option>

                <option value="Petit transport">

                  À pied / Vélo / Moto — à partir de 5 €

                </option>

                <option value="Voiture">

                  Voiture — à partir de 8 €

                </option>

                <option value="Utilitaire">

                  Camionnette / Camion — à partir de 20 €

                </option>

              </select>

              <select

                value={parcelSize}

                onChange={(e) =>

                  setParcelSize(e.target.value)

                }

                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2"

              >

                <option value="">

                  Taille du colis (optionnelle)

                </option>

                <option value="Petit">Petit</option>

                <option value="Moyen">Moyen</option>

                <option value="Grand">Grand</option>

                <option value="Très grand">

                  Très grand

                </option>

              </select>

            </div>

            <div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 space-y-3">

              <h3 className="text-lg font-semibold">

                Description du colis

              </h3>

              <div className="rounded-xl border border-amber-200 bg-amber-50">

                <button

                  type="button"

                  onClick={() => {

                    setIsImportantParcel((current) => {

                      if (current)

                        setImportantParcelType("");

                      return !current;

                    });

                  }}

                  className="flex w-full items-center justify-between px-3 py-3 text-left font-semibold"

                  aria-expanded={isImportantParcel}

                >

                  <span>Colis important</span>

                  <span

                    aria-hidden="true"

                    className="text-lg"

                  >

                    {isImportantParcel ? "▾" : "›"}

                  </span>

                </button>

                {isImportantParcel ? (

                  <div className="border-t border-amber-200 p-3">

                    <label className="mb-2 block text-sm font-medium text-gray-700">

                      Type de colis important

                    </label>

                    <select

                      value={importantParcelType}

                      onChange={(e) =>

                        setImportantParcelType(

                          e.target.value

                        )

                      }

                      className="w-full rounded-xl border border-gray-200 bg-white p-3"

                    >

                      <option value="">

                        Choisir…

                      </option>

                      {IMPORTANT_PARCEL_TYPES.map(

                        (type) => (

                          <option

                            key={type}

                            value={type}

                          >

                            {type}

                          </option>

                        )

                      )}

                    </select>

                    <div className="mt-3 space-y-2 rounded-xl border border-amber-200 bg-white p-3">

                      <p className="text-sm font-semibold text-gray-900">

                        🔒 Confidentialité du contenu

                      </p>

                      <p className="text-xs leading-5 text-gray-700">

                        Avant l’acceptation de la mission,

                        le livreur voit uniquement la

                        mention « Colis important ». Le

                        détail précis de votre colis

                        devient accessible seulement après

                        qu’un livreur a accepté la mission.

                      </p>

                      <p className="pt-1 text-sm font-semibold text-gray-900">

                        🪪 Vérification du livreur au retrait

                      </p>

                      <p className="text-xs leading-5 text-gray-700">

                        Avant de remettre votre colis, vous

                        pouvez vérifier que la personne

                        présente correspond bien au profil

                        du livreur affiché dans Jalin

                        Livraison. Vous pouvez lui demander

                        de présenter une pièce d’identité

                        afin de vérifier son identité.

                      </p>

                      <div className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-gray-800">

                        ✓ Conseil sécurité : ne remettez le

                        colis qu’après avoir vérifié que le

                        livreur correspond au profil affiché

                        dans l’application.

                      </div>

                    </div>

                  </div>

                ) : null}

              </div>

              <select

                value={parcelType}

                onChange={(e) =>

                  setParcelType(e.target.value)

                }

                className="w-full rounded-xl border border-gray-200 bg-white p-3"

              >

                <option value="">

                  Type de colis courant…

                </option>

                {PARCEL_TYPES.map((t) => (

                  <option key={t} value={t}>

                    {t}

                  </option>

                ))}

              </select>

              <textarea

                value={parcelNote}

                onChange={(e) =>

                  setParcelNote(e.target.value)

                }

                placeholder="Exemple : fragile, ne pas pencher, petit colis, sac léger, objet à manipuler avec soin..."

                className="w-full rounded-xl border border-gray-200 p-3"

              />

              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">

                <p className="mb-2 text-sm font-medium">

                  Photo du colis optionnelle — appareil photo

                </p>

                <input

                  type="file"

                  accept="image/*"

                  capture="environment"

                  onChange={(e) =>

                    handleParcelPhotoChange(

                      e.target.files?.[0] || null

                    )

                  }

                  className="w-full text-sm"

                />

                <p className="mt-2 text-xs text-gray-500">

                  Sur téléphone, vous pouvez prendre la photo directement. Taille maximum : 5 MB.

                </p>

                {parcelPhotoPreview ? (

                  <div className="mt-3">

                    <img

                      src={parcelPhotoPreview}

                      alt="Aperçu du colis"

                      className="max-h-56 w-full rounded-2xl object-cover"

                    />

                    <button

                      type="button"

                      onClick={() =>

                        handleParcelPhotoChange(null)

                      }

                      className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm"

                    >

                      Retirer la photo

                    </button>

                  </div>

                ) : null}

              </div>

            </div>

            <div className="mt-4">

              <label className="mb-2 block text-sm font-semibold text-gray-700">

                Date et heure souhaitées pour la livraison

              </label>

              <input

                type="datetime-local"

                value={scheduledAt}

                onChange={(e) =>

                  setScheduledAt(e.target.value)

                }

                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900"

              />

              <p className="mt-1 text-xs text-gray-500">

                Optionnel : laissez vide si la livraison

                peut être effectuée dès qu’un livreur est

                disponible.

              </p>

            </div>

            <div className="mt-4 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

              <div className="flex items-start justify-between gap-3">

                <div>

                  <h3 className="text-base font-semibold text-gray-900">

                    Proposez votre tarif

                  </h3>

                  <p className="mt-1 text-xs leading-5 text-gray-600">

                    Choisissez librement votre tarif pour

                    cette livraison.

                  </p>

                </div>

                <span className="shrink-0 rounded-full bg-white px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">

                  Minimum{" "}

                  {formatEuro(effectiveMinimumPriceCents)}

                </span>

              </div>

              <div className="mt-4 flex items-stretch gap-2">

                <button

                  type="button"

                  aria-label="Diminuer le tarif de 1 euro"

                  disabled={

                    Number(

                      clientProposedPrice ||

                        effectiveMinimumPriceCents / 100

                    ) <=

                    effectiveMinimumPriceCents / 100

                  }

                  onClick={() => {

                    const minimum =

                      effectiveMinimumPriceCents / 100;

                    const current = Number(

                      clientProposedPrice || minimum

                    );

                    const next = Math.max(

                      minimum,

                      (Number.isFinite(current)

                        ? Math.floor(current)

                        : minimum) - 1

                    );

                    setClientProposedPrice(

                      String(next)

                    );

                  }}

                  className="h-12 w-12 shrink-0 rounded-xl border border-gray-200 bg-white text-2xl font-medium text-gray-700 disabled:cursor-not-allowed disabled:opacity-40"

                >

                  −

                </button>

                <div className="relative min-w-0 flex-1">

                  <input

                    type="number"

                    inputMode="numeric"

                    min={

                      effectiveMinimumPriceCents / 100

                    }

                    step="1"

                    required

                    value={clientProposedPrice}

                    onChange={(e) =>

                      setClientProposedPrice(

                        e.target.value

                      )

                    }

                    aria-label="Tarif proposé en euros"

                    aria-describedby="price-help"

                    className="h-12 w-full rounded-xl border border-gray-300 bg-white px-12 text-center text-lg font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"

                  />

                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">

                    €

                  </span>

                </div>

                <button

                  type="button"

                  aria-label="Augmenter le tarif de 1 euro"

                  onClick={() => {

                    const minimum =

                      effectiveMinimumPriceCents / 100;

                    const current = Number(

                      clientProposedPrice || minimum

                    );

                    const next =

                      (Number.isFinite(current)

                        ? Math.floor(current)

                        : minimum) + 1;

                    setClientProposedPrice(

                      String(

                        Math.max(minimum, next)

                      )

                    );

                  }}

                  className="h-12 w-12 shrink-0 rounded-xl border border-gray-200 bg-white text-2xl font-medium text-gray-700"

                >

                  +

                </button>

              </div>

              <p

                id="price-help"

                className="mt-3 text-xs leading-5 text-gray-600"

              >

                Un tarif plus élevé peut rendre votre

                demande plus attractive pour un livreur.

                Le montant choisi sera confirmé avant le

                paiement.

              </p>

              <div className="mt-4 border-t border-blue-100 pt-4">

                <button

                  type="button"

                  onClick={showEstimate}

                  disabled={estimateLoading}

                  className="w-full rounded-xl border-2 border-green-600 bg-white px-4 py-3 font-bold text-green-700 disabled:cursor-wait disabled:opacity-60"

                >

                  {estimateLoading

                    ? "Calcul de la distance..."

                    : "Estimer ma livraison avant de créer"}

                </button>

                <p className="mt-2 text-xs leading-5 text-gray-600">

                  Cette estimation n’enregistre aucune commande et ne lance aucun paiement.

                </p>

                {estimateError ? (

                  <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">

                    {estimateError}

                  </div>

                ) : null}

                {estimateVisible ? (

                  <div className="mt-3 rounded-2xl border border-green-200 bg-green-50 p-4">

                    <p className="text-sm font-semibold text-green-800">

                      Estimation de votre livraison

                    </p>

                    <p className="mt-1 text-3xl font-bold text-green-900">

                      {formatEuro(pricingView.finalPriceCents)}

                    </p>

                    <p className="mt-2 text-sm font-semibold text-green-900">

                      Distance routière :{" "}

                      {estimatedDistanceMeters

                        ? `${(estimatedDistanceMeters / 1000).toFixed(1)} km`

                        : "—"}

                    </p>

                    <p className="mt-1 text-xs text-green-800">

                      Minimum calculé selon la distance :{" "}

                      {formatEuro(effectiveMinimumPriceCents)}

                    </p>

                    <p className="mt-2 text-xs leading-5 text-green-800">

                      Départ : {cleanSimpleAddress(senderAddress)}, {senderCity.trim()}

                      <br />

                      Arrivée : {cleanSimpleAddress(receiverAddress)}, {receiverCity.trim()}

                    </p>

                    <p className="mt-2 text-xs text-green-800">

                      Google Maps calcule la distance routière. Vous pouvez proposer

                      un tarif entier supérieur au minimum calculé. La distance réelle

                      sera enregistrée avec la commande.

                    </p>

                  </div>

                ) : null}

              </div>

            </div>

          </section>

          <button

            type="submit"

            disabled={loading}

            className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60"

          >

            {loading

              ? "Création..."

              : "Créer la commande"}

          </button>

        </form>

      </div>

      </main>

    </>

  );

}
