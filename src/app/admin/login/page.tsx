"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const supabase = createBrowserSupabaseClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  async function login() {
    setMessage("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user) {
      setMessage("Email ou mot de passe incorrect");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setMessage("Accès réservé administrateur");
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
      <div className="bg-white p-6 rounded-3xl shadow w-full max-w-md space-y-4">

        <h1 className="text-3xl font-bold">
          Admin HelpFlow
        </h1>

        <input
          className="border p-3 rounded-xl w-full"
          placeholder="Email admin"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="border p-3 rounded-xl w-full"
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {message && (
          <p className="text-red-600">{message}</p>
        )}

        <button
          onClick={login}
          className="bg-blue-600 text-white p-3 rounded-xl w-full font-bold"
        >
          Connexion administrateur
        </button>

      </div>
    </main>
  );
}