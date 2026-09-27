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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [acceptedCgu, setAcceptedCgu] = useState(false);
  const [acceptedClientTerms, setAcceptedClientTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const allRequiredAccepted =
    acceptedCgu && acceptedClientTerms && acceptedPrivacy;

  function hasPendingEstimate() {
    if (typeof window === "undefined") return false;

    try {
      const raw = sessionStorage.getItem("jalin_pending_estimate");
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      return Boolean(
        parsed?.pickupAddress &&
          parsed?.dropoffAddress &&
          parsed?.vehicleRequired
      );
    } catch {
      return false;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrorMsg(null);

    if (!allRequiredAccepted) {
      setErrorMsg(
        "Vous devez accepter les CGU, les Conditions Clients et la Politique de confidentialité pour créer votre compte."
      );
      return;
    }

    setLoading(true);

    try {
      const pendingEstimate = hasPendingEstimate();

      if (pendingEstimate) {
        sessionStorage.setItem(
          "jalin_after_login_path",
          "/client/new-order?from=estimate"
        );
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: pendingEstimate
            ? "https://www.jalinlivraison.fr/login?from=estimate"
            : "https://www.jalinlivraison.fr/login",
        },
      });

      if (error) throw error;

      if (data.user) {
        const { error: profileError } = await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            full_name: `${firstName.trim()} ${lastName.trim()}`.trim(),
            phone: phone.trim(),
            city: city.trim(),
            role: "client",
          });

        if (profileError) {
          console.error("PROFILE UPSERT ERROR =>", profileError);
        }
      }

      if (data.session) {
        router.replace(
          pendingEstimate
            ? "/client/new-order?from=estimate"
            : "/client"
        );
        return;
      }

      router.replace(
        pendingEstimate
          ? "/login?from=estimate"
          : "/login"
      );
    } catch (err: any) {
      setErrorMsg(
        err?.message || "Erreur lors de la création du compte"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6">
        <div className="text-center mb-8">
          <img
            src="/logo-jalin.png"
            alt="Jalin Livraison"
            className="mx-auto mb-4 h-16 w-16 rounded-2xl object-contain"
          />

          <h1 className="text-3xl font-bold text-white">
            Créer un compte utilisateur
          </h1>

          <p className="mt-2 text-slate-400">
            Créez votre compte pour publier une commande.
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
            type="tel"
            placeholder="Téléphone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
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

          <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4 space-y-4">
            <p className="text-sm font-semibold text-white">
              Conditions obligatoires
            </p>

            <label className="flex items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={acceptedCgu}
                onChange={(e) => setAcceptedCgu(e.target.checked)}
                required
                className="mt-1 h-4 w-4"
              />
              <span>
                J&apos;accepte les{" "}
                <Link
                  href="/cgu"
                  target="_blank"
                  className="text-emerald-400 underline"
                >
                  Conditions Générales d&apos;Utilisation
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={acceptedClientTerms}
                onChange={(e) =>
                  setAcceptedClientTerms(e.target.checked)
                }
                required
                className="mt-1 h-4 w-4"
              />
              <span>
                J&apos;accepte les{" "}
                <Link
                  href="/cgu-clients"
                  target="_blank"
                  className="text-emerald-400 underline"
                >
                  Conditions Clients
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-3 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={acceptedPrivacy}
                onChange={(e) =>
                  setAcceptedPrivacy(e.target.checked)
                }
                required
                className="mt-1 h-4 w-4"
              />
              <span>
                J&apos;ai lu la{" "}
                <Link
                  href="/confidentialite"
                  target="_blank"
                  className="text-emerald-400 underline"
                >
                  Politique de confidentialité
                </Link>
                .
              </span>
            </label>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-red-900/30 border border-red-700 text-red-300 px-4 py-3">
              {errorMsg}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !allRequiredAccepted}
            className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Création..."
              : "Créer mon compte utilisateur"}
          </button>
        </form>

        <div className="mt-6 text-center text-slate-400">
          Déjà inscrit ?{" "}
          <Link
            href="/login"
            className="text-emerald-400 font-semibold"
          >
            Se connecter
          </Link>
        </div>
      </div>
    </main>
  );
}
