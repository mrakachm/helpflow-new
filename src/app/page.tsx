"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (user) {
      // Si l'utilisateur est connecté, redirige selon son rôle
      const role = user.user_metadata?.role; // le rôle est stocké dans le profil
      if (role === "livreur") {
        router.push("/livreur");
      } else {
        router.push("/client");
      }
    }
  }, [user, loading, router]);

  return (
    <main className="text-center py-20">
      <h1 className="text-3xl font-bold mb-4">Bienvenue sur HelpFlow</h1>
      <p className="text-gray-600">
        Connectez-vous pour gérer vos livraisons solidaires.
      </p>
    </main>
  );
}