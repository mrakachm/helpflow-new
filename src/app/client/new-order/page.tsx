
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

function formatEuro(cents: number) {
  return (cents / 100).toFixed(2) + " €";
}

function cleanSimpleAddress(text: string) {
  return String(text || "")
    .replace(/\b(RDC|DRC|rez-de-chaussée|rez de chaussée)\b/gi, "")
    .replace(/[,.]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsPhoneNumber(text: string) {
  const normalized = String(text || "").replace(/[\s.\-_/()+]/g, "");
  return /0[67]\d{8}/.test(normalized) || /\d{8,}/.test(normalized);
}

export default function NewOrderPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const PARCEL_TYPES = [
    "Documents",
    "Électronique",
    "Téléphone",
    "Ordinateur portable",
    "Tablette",
    "Télévision",
    "Gâteau / alimentaire fragile",
    "Courses",
    "Fragile (verre/vaisselle)",
    "Électroménager",
    "Cafetière",
    "Imprimante",
    "Vêtements",
    "Garde-robe",
    "Armoire",
    "Petit mobilier",
    "Matériel professionnel",
    "Pièces détachées",
    "Moteur / pièce mécanique",
    "Clés",
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
  const [parcelNote, setParcelNote] = useState("");
  const [parcelPhoto, setParcelPhoto] = useState<File | null>(null);
  const [parcelPhotoPreview, setParcelPhotoPreview] = useState<string | null>(null);

  const [senderName, setSenderName] = useState("");
  const [senderPhone, setSenderPhone] = useState("");
  const [senderAddress, setSenderAddress] = useState("");
  const [senderCity, setSenderCity] = useState("");
  const [pickupFloor, setPickupFloor] = useState("");
  const [pickupHasElevator, setPickupHasElevator] = useState("");

  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [receiverAddress, setReceiverAddress] = useState("");
  const [receiverCity, setReceiverCity] = useState("");
  const [dropoffFloor, setDropoffFloor] = useState("");
  const [dropoffHasElevator, setDropoffHasElevator] = useState("");

  const [bagCount, setBagCount] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [clientProposedPrice, setClientProposedPrice] = useState("5");

  const [vehicleRequired, setVehicleRequired] = useState("");
const [parcelSize, setParcelSize] = useState("");

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data.user?.id ?? null);
    })();
  }, [supabase]);

  const pricingView = useMemo(() => {
    const proposedPriceCents =
      clientProposedPrice && Number(clientProposedPrice) > 0
        ? Math.round(Number(clientProposedPrice) * 100)
        : null;

    const finalPriceCents = proposedPriceCents
      ? Math.max(MIN_PRICE_CENTS, proposedPriceCents)
      : BASE_PRICE_CENTS;

    const platformFeeCents = Math.round(finalPriceCents * 0.2);
    const courierEarningsCents = Math.max(0, finalPriceCents - platformFeeCents);

    return {
      proposedPriceCents,
      finalPriceCents,
      platformFeeCents,
      courierEarningsCents,
    };
  }, [clientProposedPrice]);

  function validate(): string | null {
    if (!userId) return "Tu dois être connecté pour créer une commande.";
    if (!senderName.trim()) return "Nom expéditeur manquant.";
    if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";
    if (!senderAddress.trim() || !senderCity.trim()) return "Adresse expéditeur incomplète.";
    if (!pickupHasElevator) return "Indique si le retrait possède un ascenseur.";
    if (!pickupFloor) return "Étage de retrait manquant.";

    if (!receiverName.trim()) return "Nom receveur manquant.";
    if (!receiverPhone.trim()) return "Téléphone receveur manquant.";
    if (!recipientEmail.trim()) return "Email du receveur manquant pour envoyer le code OTP.";
    if (!receiverAddress.trim() || !receiverCity.trim()) return "Adresse receveur incomplète.";
    if (!dropoffHasElevator) return "Indique si la livraison possède un ascenseur.";
    if (!dropoffFloor) return "Étage de livraison manquant.";

    if (!bagCount) return "Nombre de sacs / colis manquant.";
if (!vehicleRequired) return "Choisis le véhicule requis pour cette livraison.";
    return null;
  }

  function validateSender(): string | null {
    if (!senderName.trim()) return "Nom expéditeur manquant.";
    if (!senderPhone.trim()) return "Téléphone expéditeur manquant.";
    if (!senderAddress.trim() || !senderCity.trim()) return "Adresse expéditeur incomplète.";
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
    const extension = parcelPhoto.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExtension = extension.replace(/[^a-z0-9]/g, "") || "jpg";
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

    const { data } = supabase.storage.from("parcel-photos").getPublicUrl(path);
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
      setMsg("Les numéros de téléphone sont interdits dans la description du colis.");
      return;
    }

    if (clientProposedPrice && Number(clientProposedPrice) < 5) {
      setMsg("Le prix minimum est 5 €.");
      return;
    }

    setLoading(true);

    try {
      const parcelPhotoUrl = await uploadParcelPhoto();
      const otp = Math.floor(1000 + Math.random() * 9000).toString();

      const payload: any = {
        client_id: userId,

        sender_name: senderName.trim(),
        sender_phone: senderPhone.trim(),
        pickup_address: cleanSimpleAddress(senderAddress),
        pickup_city: senderCity.trim(),
        pickup_floor: pickupFloor,
        pickup_has_elevator: elevatorValueToBoolean(pickupHasElevator),

        receiver_name: receiverName.trim(),
        receiver_phone: receiverPhone.trim(),
        recipient_email: recipientEmail.trim(),
        dropoff_address: cleanSimpleAddress(receiverAddress),
        dropoff_city: receiverCity.trim(),
        dropoff_floor: dropoffFloor,
        dropoff_has_elevator: elevatorValueToBoolean(dropoffHasElevator),

        bag_count: bagCountToNumber(bagCount),
        distance_km: 1,
        scheduled_at: scheduledAt || null,
        parcel_type: parcelType || null,
        parcel_note: parcelNote || null,
        parcel_photo_url: parcelPhotoUrl,
vehicle_required: vehicleRequired || null,
parcel_size: parcelSize || null,


        price_cents: pricingView.finalPriceCents,
        client_proposed_price_cents: pricingView.proposedPriceCents,
        platform_fee_cents: pricingView.platformFeeCents,
        courier_earnings_cents: pricingView.courierEarningsCents,
        pricing_mode: pricingView.proposedPriceCents ? "client_proposal" : "standard",

       status: "PUBLISHED",
        payment_status: "paid",
        otp_code: otp,
      };

      const { data, error } = await supabase
        .from("orders")
        .insert(payload)
        .select("id, otp_code, recipient_email")
        .single();

      if (error) {
        setMsg(error.message || JSON.stringify(error));
        setLoading(false);
        return;
      }

      try {
        await fetch("/api/send-otp-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: data.recipient_email || recipientEmail.trim(),
            otp: data.otp_code || otp,
            orderId: data.id,
          }),
        });
      } catch {}

      router.push(`/client/orders/${data.id}`);
    } catch (e: any) {
      setMsg(e?.message || "Erreur pendant la création de la commande.");
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-xl px-4 py-6">
        <div className="mb-5 flex items-center gap-3">
          <img src="/logo-helpflow.png" alt="HelpFlow" className="h-10 w-10 rounded-xl object-cover" />
          <div>
            <h1 className="text-xl font-semibold">Créer une commande</h1>
            <p className="text-sm text-gray-600">Remplis les infos pour créer ta livraison.</p>
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
              <h2 className="text-base font-semibold">Expéditeur</h2>
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
              <input value={senderName} onChange={(e) => setSenderName(e.target.value)} placeholder="Nom + Prénom" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              <input type="tel" value={senderPhone} onChange={(e) => setSenderPhone(e.target.value)} placeholder="Téléphone" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              <input value={senderAddress} onChange={(e) => setSenderAddress(e.target.value)} onBlur={(e) => setSenderAddress(cleanSimpleAddress(e.target.value))} placeholder="Adresse départ" autoComplete="off" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              <input value={senderCity} onChange={(e) => setSenderCity(e.target.value)} placeholder="Ville" className="w-full rounded-xl border border-gray-200 px-3 py-2" />

              <select value={pickupHasElevator} onChange={(e) => setPickupHasElevator(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
                <option value="">Ascenseur retrait ?</option>
                {ELEVATOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select value={pickupFloor} onChange={(e) => setPickupFloor(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
                <option value="">Étage / lieu retrait</option>
                {FLOOR_OPTIONS.map((floor) => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Receveur</h2>

            <div className="grid grid-cols-1 gap-3">
              <input value={receiverName} onChange={(e) => setReceiverName(e.target.value)} placeholder="Nom + Prénom" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              <input type="tel" value={receiverPhone} onChange={(e) => setReceiverPhone(e.target.value)} placeholder="Téléphone" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              <input type="email" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} placeholder="Email du receveur" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              <input value={receiverAddress} onChange={(e) => setReceiverAddress(e.target.value)} onBlur={(e) => setReceiverAddress(cleanSimpleAddress(e.target.value))} placeholder="Adresse livraison" autoComplete="off" className="w-full rounded-xl border border-gray-200 px-3 py-2" />
              <input value={receiverCity} onChange={(e) => setReceiverCity(e.target.value)} placeholder="Ville" className="w-full rounded-xl border border-gray-200 px-3 py-2" />

              <select value={dropoffHasElevator} onChange={(e) => setDropoffHasElevator(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
                <option value="">Ascenseur livraison ?</option>
                {ELEVATOR_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>

              <select value={dropoffFloor} onChange={(e) => setDropoffFloor(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2">
                <option value="">Étage / lieu livraison</option>
                {FLOOR_OPTIONS.map((floor) => (
                  <option key={floor} value={floor}>{floor}</option>
                ))}
              </select>
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-4">
            <h2 className="mb-3 text-base font-semibold">Colis & Livraison</h2>

          

<select
  value={vehicleRequired}
  onChange={(e) => setVehicleRequired(e.target.value)}
  className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
>
  <option value="">Véhicule requis</option>
  <option value="À pied">À pied</option>
  <option value="Vélo">Vélo</option>
  <option value="Scooter">Scooter</option>
  <option value="Voiture">Voiture</option>
  <option value="Utilitaire">Utilitaire</option>
</select>

<select
  value={parcelSize}
  onChange={(e) => setParcelSize(e.target.value)}
  className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-3 py-2"
>
  <option value="">Taille du colis (optionnelle)</option>
  <option value="Petit">Petit</option>
  <option value="Moyen">Moyen</option>
  <option value="Grand">Grand</option>
  <option value="Très grand">Très grand</option>
</select>

<div className="mt-3 rounded-2xl border border-gray-200 bg-white p-4 space-y-3">
              <h3 className="text-lg font-semibold">Description du colis</h3>

              <select value={parcelType} onChange={(e) => setParcelType(e.target.value)} className="w-full rounded-xl border border-gray-200 bg-white p-3">
                <option value="">Choisir…</option>
                {PARCEL_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <textarea
                value={parcelNote}
                onChange={(e) => setParcelNote(e.target.value)}
                placeholder="Exemple : fragile, ne pas pencher, petit colis, sac léger, objet à manipuler avec soin..."
                className="w-full rounded-xl border border-gray-200 p-3"
              />

              <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-3">
                <p className="mb-2 text-sm font-medium">Photo du colis optionnelle</p>

                <input type="file" accept="image/*" onChange={(e) => handleParcelPhotoChange(e.target.files?.[0] || null)} className="w-full text-sm" />

                <p className="mt-2 text-xs text-gray-500">Image facultative. Taille maximum : 5 MB.</p>

                {parcelPhotoPreview ? (
                  <div className="mt-3">
                    <img src={parcelPhotoPreview} alt="Aperçu du colis" className="max-h-56 w-full rounded-2xl object-cover" />
                    <button type="button" onClick={() => handleParcelPhotoChange(null)} className="mt-2 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                      Retirer la photo
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-3 text-sm text-gray-600">
              Prix : <span className="font-semibold">{formatEuro(pricingView.finalPriceCents)}</span>
            </div>

            <div className="mt-3">
  <label className="mb-2 block text-sm font-semibold text-gray-700">
    Date et heure souhaitées pour la livraison
  </label>

  <input
    type="datetime-local"
    value={scheduledAt}
    onChange={(e) => setScheduledAt(e.target.value)}
    className="w-full rounded-xl border border-gray-300 bg-white px-3 py-3 text-gray-900"
  />

  <p className="mt-1 text-xs text-gray-500">
    Optionnel : laisse vide si la livraison peut être faite dès qu’un livreur est disponible.
  </p>
</div>
          </section>

          <input
            type="number"
            inputMode="decimal"
            min="5"
            step="0.5"
            value={clientProposedPrice}
            onChange={(e) => setClientProposedPrice(e.target.value)}
            placeholder="Prix proposé utilisateur, minimum 5 €"
            className="w-full rounded-xl border border-gray-200 px-3 py-2"
          />

          <button type="submit" disabled={loading} className="w-full rounded-xl bg-black px-4 py-3 text-white disabled:opacity-60">
            {loading ? "Création..." : "Créer la commande"}
          </button>
        </form>
      </div>
    </main>
  );
}