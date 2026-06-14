"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [birthDate, setBirthDate] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [documentFile, setDocumentFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!documentFile) {
      setErrorMsg("Le document d'identité est obligatoire pour devenir livreur.");
      return;
    }

    setErrorMsg(null);
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: "https://helpflow.fr/login",
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Utilisateur non créé.");

      const userId = data.user.id;

      const ext = documentFile.name.split(".").pop() || "jpg";
      const path = `${userId}/identity-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("courier-documents")
        .upload(path, documentFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("courier-documents")
        .getPublicUrl(path);

      const fullName = `${firstName} ${lastName}`.trim();

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: userId,
        first_name: firstName,
        last_name: lastName,
        full_name: fullName,
        phone,
        city,
        address,
        date_of_birth: birthDate,
        role: "livreur",
        identity_document_path: publicUrlData.publicUrl,
        verification_status: "pending",
        stripe_onboarding_complete: false,
      });

      if (profileError) throw profileError;

      router.replace("/login");
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de la création du compte");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-500 flex items-center justify-center text-white text-2xl font-bold">
            <img
              src="/logo-helpflow.png"
              alt="HelpFlow"
              className="mx-auto h-16 w-16 rounded-2xl object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-white">Créer un compte livreur</h1>

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
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
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

          <div className="rounded-xl border border-slate-700 bg-slate-800 p-4">
            <label className="block text-white font-semibold mb-2">
              Document d'identité obligatoire
            </label>

            <input
              type="file"
              accept="image/*,.pdf"
              required
              onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
              className="w-full text-white"
            />

            {documentFile && (
              <p className="mt-2 text-emerald-400 text-sm">
                Document sélectionné : {documentFile.name}
              </p>
            )}
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-900/30 border border-red-700 text-red-300 px-4 py-3">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3"
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