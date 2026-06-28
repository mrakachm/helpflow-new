"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function LivreurSignupPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  const [showPassword, setShowPassword] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [iban, setIban] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [acceptedCgu, setAcceptedCgu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!acceptedCgu) {
      setErrorMsg("Tu dois accepter les CGU pour créer ton compte livreur.");
      return;
    }

    setLoading(true);

    try {
      const draft = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`.trim(),
        dateOfBirth,
        phone,
        address,
        city,
        iban,
        email: email.trim(),
        role: "livreur",
      };

      localStorage.setItem("helpflow_livreur_draft", JSON.stringify(draft));

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            phone,
            city,
            role: "livreur",
          },
          emailRedirectTo: "https://www.helpflow.fr/login?next=/profile/edit",
        },
      });

      if (error) throw error;
      if (!data.user) throw new Error("Compte non créé.");

      if (data.session) {
        await supabase.from("profiles").upsert(
          {
            id: data.user.id,
            email: email.trim(),
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`.trim(),
            date_of_birth: dateOfBirth,
            phone,
            address,
            city,
            iban,
            role: "livreur",
            verification_status: "pending",
          },
          { onConflict: "id" }
        );
      }

      setSuccess(true);
    } catch (err: any) {
      setErrorMsg(err?.message || "Erreur lors de la création du compte livreur");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 text-center">
          <img
            src="/logo-helpflow.png"
            alt="HelpFlow"
            className="mx-auto mb-4 h-20 w-20 rounded-2xl object-contain"
          />

          <h1 className="text-3xl font-bold text-white">
            Compte créé avec succès
          </h1>

          <div className="mt-5 rounded-2xl bg-emerald-500/10 border border-emerald-700 p-4 text-left text-emerald-200">
            <p className="font-semibold">Votre compte livreur a été créé.</p>
            <p className="mt-3">
              Vérifiez votre boîte mail et cliquez sur le lien de confirmation.
            </p>
            <p className="mt-3">
              Ensuite, connectez-vous pour <strong>compléter votre inscription</strong> :
              photo, pièce d'identité, véhicule et rayon d'intervention.
            </p>
          </div>

          <Link
            href="/login?next=/profile/edit"
            className="mt-6 inline-block w-full rounded-xl bg-emerald-500 px-4 py-3 font-semibold text-white"
          >
            Se connecter et compléter mon inscription
          </Link>
        </div>
      </main>
    );
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
            Créez votre compte. Vous compléterez ensuite votre dossier livreur après validation de votre email.
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

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe (6 caractères minimum)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-white"
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
            >
              👁
            </button>
          </div>

          <div className="rounded-2xl bg-blue-500/10 border border-blue-700 p-4 text-sm text-blue-200">
            La pièce d'identité sera demandée après confirmation de votre email,
            dans la page <strong>Compléter mon inscription</strong>.
          </div>

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
          <Link
            href="/login?next=/profile/edit"
            className="text-emerald-400 font-semibold"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}