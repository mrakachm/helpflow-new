"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LivreurSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [iban, setIban] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [acceptedCgu, setAcceptedCgu] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!documentFile) {
      setErrorMsg("La pièce d'identité est obligatoire.");
      return;
    }

    if (!acceptedCgu) {
      setErrorMsg("Tu dois accepter les CGU pour créer ton compte livreur.");
      return;
    }

    setLoading(true);

    try {
     const { data, error } = await supabase.auth.signUp({
  email,
  password,
});

if (error) throw error;
if (!data.user) throw new Error("Compte non créé.");

const { error: loginError } = await supabase.auth.signInWithPassword({
  email,
  password,
});

if (loginError) throw loginError;

      const ext = documentFile.name.split(".").pop() || "jpg";
      const path = `${data.user.id}/identity-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("courier-documents")
        .upload(path, documentFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("courier-documents")
        .getPublicUrl(path);

      const identityUrl = publicUrlData.publicUrl;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        date_of_birth: dateOfBirth,
        phone,
        address,
        city,
        iban,
        role: "livreur",
        verification_status: "pending",
        identity_document_path: identityUrl,
      });

      if (profileError) throw profileError;

      alert("Compte livreur créé. En attente de validation admin.");
      router.replace("/login");
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de la création du compte livreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
        <div className="text-center mb-8">
          <img
            src="/logo-helpflow.png"
            alt="HelpFlow"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain"
          />

          <h1 className="text-3xl font-bold text-white">
            Créer un compte livreur
          </h1>

          <p className="mt-2 text-slate-400">
            Inscription obligatoire avec document d'identité.
          </p>
        </div>

        <form onSubmit={onSubmit} className="grid gap-4">
          <input
            type="text"
            placeholder="Prénom"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="text"
            placeholder="Nom"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="tel"
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="text"
            placeholder="Adresse"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="text"
            placeholder="Ville"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="text"
            placeholder="IBAN"
            value={iban}
            onChange={(e) => setIban(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            type="password"
            placeholder="Mot de passe (6 caractères minimum)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white"
          />

          <input
            ref={fileRef}
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
            required
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white"
          >
            {documentFile
              ? "Document ajouté : " + documentFile.name
              : "Ajouter ma pièce d'identité"}
          </button>

          <label className="flex gap-3 text-sm text-slate-300">
            <input
              type="checkbox"
              checked={acceptedCgu}
              onChange={(e) => setAcceptedCgu(e.target.checked)}
              required
            />
            <span>
              J'accepte les{" "}
              <Link href="/cgu" className="text-emerald-400 underline">
                CGU
              </Link>{" "}
              et les conditions livreur HelpFlow.
            </span>
          </label>

          {errorMsg && (
            <div className="rounded-xl bg-red-900/30 border border-red-700 text-red-300 px-4 py-3">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer mon compte livreur"}
          </button>
        </form>

        <div className="mt-6 text-center text-slate-400">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-emerald-400 font-semibold">
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}