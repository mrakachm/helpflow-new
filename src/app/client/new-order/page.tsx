"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/useAuth";

export default function NewOrderPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Adresses
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupCity, setPickupCity] = useState("");
  const [pickupPostalCode, setPickupPostalCode] = useState("");

  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffCity, setDropoffCity] = useState("");
  const [dropoffPostalCode, setDropoffPostalCode] = useState("");

  // Détails
  const [weightKg, setWeightKg] = useState("1");
  const [bagsCount, setBagsCount] = useState("1");
  const [description, setDescription] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (loading) return <p className="p-6">Chargement…</p>;
  if (!user) {
    router.push("/login");
    return null;
  }

  // Construit un lien Google Maps pour le livreur
  const buildMapsUrl = () => {
    const q = encodeURIComponent(
      `${dropoffAddress}, ${dropoffPostalCode} ${dropoffCity}`
    );
    return `https://www.google.com/maps/search/?api=1&query=${q}`;
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    // Validations simples
    if (
      !pickupAddress ||
      !pickupCity ||
      !pickupPostalCode ||
      !dropoffAddress ||
      !dropoffCity ||
      !dropoffPostalCode
    ) {
      setErrorMsg("Merci de remplir toutes les adresses avec ville et code postal.");
      return;
    }

    setSubmitting(true);
    const weightNumber = Number(weightKg || "0");
    const bagsNumber = Number(bagsCount || "0");

    const { error } = await supabase.from("orders").insert({
      // expéditeur
      pickup_address: pickupAddress,
      pickup_city: pickupCity,
      pickup_postal_code: pickupPostalCode,

      // destinataire
      dropoff_address: dropoffAddress,
      dropoff_city: dropoffCity,
      dropoff_postal_code: dropoffPostalCode,

      // compat : si ta liste client lit encore ces 2 colonnes
      city: dropoffCity,
      postal_code: dropoffPostalCode,

      // détails
      weight_kg: isNaN(weightNumber) ? null : weightNumber,
      bags_count: isNaN(bagsNumber) ? null : bagsNumber,
      description,

      // statut & auteurs
      status: "CREATED",
      created_by: user.id,

      // petite aide pour le livreur (facultatif) :
      maps_url: buildMapsUrl(), // ajoute la colonne text `maps_url` si tu veux stocker
    });

    setSubmitting(false);

    if (error) {
      console.error(error);
      setErrorMsg("Une erreur est survenue lors de la création de la commande.");
      return;
    }

    router.push("/client");
  }

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Nouvelle commande</h1>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* EXPÉDITEUR */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Adresse de départ (expéditeur)</h2>
          <input
            className="w-full border rounded p-3"
            placeholder="Adresse de départ"
            value={pickupAddress}
            onChange={(e) => setPickupAddress(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full border rounded p-3"
              placeholder="Ville"
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              required
            />
            <input
              className="w-full border rounded p-3"
              placeholder="Code postal"
              value={pickupPostalCode}
              onChange={(e) => setPickupPostalCode(e.target.value)}
              required
            />
          </div>
        </section>

        {/* DESTINATAIRE */}
        <section className="space-y-3">
          <h2 className="text-lg font-medium">Adresse d’arrivée (destinataire)</h2>
          <input
            className="w-full border rounded p-3"
            placeholder="Adresse de livraison"
            value={dropoffAddress}
            onChange={(e) => setDropoffAddress(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input
              className="w-full border rounded p-3"
              placeholder="Ville"
              value={dropoffCity}
              onChange={(e) => setDropoffCity(e.target.value)}
              required
            />
            <input
              className="w-full border rounded p-3"
              placeholder="Code postal"
              value={dropoffPostalCode}
              onChange={(e) => setDropoffPostalCode(e.target.value)}
              required
            />
          </div>
        </section>

        {/* DÉTAILS COLIS */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm mb-1">Poids (kg)</label>
            <input
              className="w-full border rounded p-3"
              type="number"
              min="0"
              step="0.1"
              value={weightKg}
              onChange={(e) => setWeightKg(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Nombre de sacs</label>
            <input
              className="w-full border rounded p-3"
              type="number"
              min="0"
              step="1"
              value={bagsCount}
              onChange={(e) => setBagsCount(e.target.value)}
            />
          </div>
        </section>

        <textarea
          className="w-full border rounded p-3"
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        {errorMsg && <p className="text-red-600">{errorMsg}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full md:w-auto px-5 py-3 rounded bg-blue-600 text-white disabled:opacity-60"
        >
          {submitting ? "Création…" : "Créer la commande"}
        </button>
      </form>
    </main>
  );
}

