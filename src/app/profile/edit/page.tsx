"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

type Profile = {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  vehicle_type?: string | null;
  vehicle_details?: string | null;
  city?: string | null;
  intervention_radius?: number | null;
  long_distance?: boolean | null;
  identity_document_path?: string | null;
  verification_status?: string | null;
};

const TRANSPORT_OPTIONS = [
  "À pied",
  "Vélo",
  "Trottinette",
  "Moto",
  "Voiture",
  "Camionnette",
  "Camion",
];

export default function ProfileEditPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [form, setForm] = useState<Profile>({
    full_name: "",
    phone: "",
    avatar_url: "",
    vehicle_type: "",
    vehicle_details: "",
    city: "",
    intervention_radius: 0,
    long_distance: false,
    identity_document_path: "",
    verification_status: "pending",
  });

  function updateField(name: keyof Profile, value: string | number | boolean) {
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function selectedTransports() {
    return (form.vehicle_type || "").split("|").filter(Boolean);
  }

  function toggleTransport(option: string) {
    const selected = new Set(selectedTransports());

    if (selected.has(option)) {
      selected.delete(option);
    } else {
      selected.add(option);
    }

    updateField("vehicle_type", Array.from(selected).join("|"));
  }

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setMsg(null);

      const { data: userData, error: userError } =
        await supabase.auth.getUser();

      if (userError) {
        setMsg(userError.message);
        setLoading(false);
        return;
      }

      const uid = userData.user?.id;

      if (!uid) {
        router.push("/login");
        return;
      }

      setUserId(uid);

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", uid)
        .maybeSingle();

      if (error) {
        setMsg(error.message);
        setLoading(false);
        return;
      }

      if (data) {
        setForm({
          full_name: data.full_name || "",
          phone: data.phone || "",
          avatar_url: data.avatar_url || "",
          vehicle_type: data.vehicle_type || "",
          vehicle_details: data.vehicle_details || "",
          city: data.city || "",
          intervention_radius: data.intervention_radius ?? 0,
          long_distance: data.long_distance ?? false,
          identity_document_path: data.identity_document_path || "",
          verification_status: data.verification_status || "pending",
        });
      }

      setLoading(false);
    }

    loadProfile();
  }, [router, supabase]);

  async function uploadAvatar(file: File) {
    if (!userId) {
      setMsg("Utilisateur non connecté.");
      return;
    }

    setUploading(true);
    setMsg(null);

    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/avatar-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });

    if (error) {
      setMsg(error.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);

    updateField("avatar_url", data.publicUrl);
    setUploading(false);
    setMsg("Photo ajoutée. Clique sur Enregistrer mon profil.");
  }

async function uploadIdentityDocument(file: File) {
  if (!userId) {
    setMsg("Utilisateur non connecté.");
    return;
  }

  setUploadingDocument(true);
  setMsg(null);

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${userId}/identity-${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from("courier-documents")
    .upload(path, file, { upsert: true });

  if (error) {
    setMsg(error.message);
    setUploadingDocument(false);
    return;
  }

  const { data } = supabase.storage
    .from("courier-documents")
    .getPublicUrl(path);

  setForm((prev) => ({
    ...prev,
    identity_document_path: data.publicUrl,
    verification_status: "pending",
  }));

  setUploadingDocument(false);
  setMsg("Document d'identité ajouté. Clique sur Enregistrer mon profil.");
}
  async function saveProfile() {
    if (!userId) {
      setMsg("Utilisateur non connecté.");
      return;
    }

    setSaving(true);
    setMsg(null);

    const payload = {
      id: userId,
      full_name: form.full_name || null,
      phone: form.phone || null,
      avatar_url: form.avatar_url || null,
      vehicle_type: form.vehicle_type || null,
      vehicle_details: form.vehicle_details || null,
      city: form.city || null,
      intervention_radius: form.intervention_radius ?? 0,
      long_distance: form.long_distance ?? false,
      identity_document_path: form.identity_document_path || null,
     verification_status: form.verification_status || "pending",
      role: "livreur",
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    setSaving(false);

    if (error) {
      setMsg(error.message);
      return;
    }

    router.push("/livreur/missions");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-xl rounded-3xl bg-white p-6">
          Chargement du profil...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-xl space-y-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-xl border bg-white px-4 py-2"
        >
          ← Retour
        </button>

        <section className="rounded-3xl bg-blue-600 p-6 text-white">
          <h1 className="text-3xl font-bold">Modifier mon profil livreur</h1>
          <p className="mt-2 text-blue-100">
            Complète ton profil pour recevoir des missions adaptées.
          </p>
        </section>

        {msg && (
          <div className="rounded-2xl bg-white p-4 text-sm text-red-600">
            {msg}
          </div>
        )}

        <section className="space-y-4 rounded-3xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-4">
            {form.avatar_url ? (
              <img
                src={form.avatar_url}
                alt="Photo profil"
                className="h-32 w-32 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-full bg-blue-50 ring-4 ring-white shadow-sm">
                <svg
                  className="h-20 w-20 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.8}
                    d="M5.121 17.804A9 9 0 1118.88 17.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </div>
            )}

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar(file);
                }}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
              >
                {uploading ? "Chargement..." : "Ajouter / changer ma photo"}
              </button>

              <p className="mt-2 text-xs text-gray-500">
                Photo facultative pour le lancement.
              </p>
            </div>
          </div>

          <input
            value={form.full_name || ""}
            onChange={(e) => updateField("full_name", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Nom complet"
          />

          <input
            value={form.phone || ""}
            onChange={(e) => updateField("phone", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Téléphone"
          />

          <section className="rounded-3xl border border-blue-100 bg-blue-50 p-4">
            <h2 className="font-bold text-gray-900">
              Vérification d'identité
            </h2>

            <p className="mt-2 text-sm leading-6 text-gray-700">
              Document officiel accepté : carte d'identité, passeport, titre de
              séjour ou document équivalent.
            </p>

            <input
              ref={documentInputRef}
              type="file"
              accept="image/*,.pdf"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadIdentityDocument(file);
              }}
            />

            <button
              type="button"
              onClick={() => documentInputRef.current?.click()}
              disabled={uploadingDocument}
              className="mt-4 w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
            >
              {uploadingDocument
                ? "Téléchargement..."
                : form.identity_document_path
                ? "Remplacer le document d'identité"
                : "Télécharger un document d'identité"}
            </button>

            <div className="mt-3 rounded-2xl bg-white p-3 text-sm">
              {form.identity_document_path ? (
                <p className="font-semibold text-green-700">
                  Document ajouté — vérification en attente.
                </p>
              ) : (
                <p className="font-semibold text-orange-700">
                  Aucun document ajouté.
                </p>
              )}

              <p className="mt-1 text-gray-600">
                Statut :{" "}
                <span className="font-semibold">
                  {form.verification_status === "approved"
                    ? "Compte vérifié"
                    : form.verification_status === "rejected"
                    ? "Vérification refusée"
                    : "Vérification en attente"}
                </span>
              </p>
            </div>
          </section>

          <section className="rounded-3xl border bg-white p-4">
            <h2 className="font-bold text-gray-900">
              Moyens de transport disponibles
            </h2>

            <p className="mt-2 text-sm text-gray-600">
              Tu peux sélectionner plusieurs moyens de transport.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {TRANSPORT_OPTIONS.map((option) => (
                <label
                  key={option}
                  className="flex items-center gap-3 rounded-2xl border bg-gray-50 p-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedTransports().includes(option)}
                    onChange={() => toggleTransport(option)}
                    className="h-5 w-5"
                  />
                  <span className="font-semibold text-gray-800">{option}</span>
                </label>
              ))}
            </div>
          </section>

          <input
            value={form.vehicle_details || ""}
            onChange={(e) => updateField("vehicle_details", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Détail véhicule : 3008, Kangoo, vélo cargo..."
          />

          <input
            value={form.city || ""}
            onChange={(e) => updateField("city", e.target.value)}
            className="w-full rounded-xl border px-4 py-3"
            placeholder="Ville actuelle : Reims"
          />

          <div>
            <label className="text-sm font-semibold">
              Zone d'intervention
            </label>

            <input
              type="range"
              min="0"
              max="40"
              step="5"
              value={form.intervention_radius ?? 0}
              onChange={(e) =>
                updateField("intervention_radius", Number(e.target.value))
              }
              className="mt-3 w-full"
            />

            <div className="mt-2 text-center font-semibold text-blue-600">
              {form.intervention_radius ?? 0} km
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-2xl border bg-blue-50 p-4">
            <input
              type="checkbox"
              checked={form.long_distance || false}
              onChange={(e) => updateField("long_distance", e.target.checked)}
              className="h-5 w-5"
            />
            <span className="font-semibold text-gray-800">
              J'accepte les missions longue distance au départ de ma zone
            </span>
          </label>

          <button
            type="button"
            onClick={saveProfile}
            disabled={saving || uploading || uploadingDocument}
            className="w-full rounded-2xl bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            {saving ? "Enregistrement..." : "Enregistrer mon profil"}
          </button>
        </section>
      </div>
    </main>
  );
}