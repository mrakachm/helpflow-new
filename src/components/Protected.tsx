"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

/**
 * Composant de protection de page :
 * - Redirige vers /login si l'utilisateur n'est pas connecté
 * - Vérifie le rôle selon le chemin d'accès (/admin, /livreur, /client)
 */
export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // En attente de chargement → on ne fait rien
    if (loading) return;

    // Utilisateur non connecté → redirection vers /login
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
      return;
    }

    // Vérifie le rôle selon l’URL
    const need =
      pathname?.startsWith("/admin") ? "admin" :
      pathname?.startsWith("/livreur") ? "livreur" :
      pathname?.startsWith("/client") ? "client" :
      null;

    const role = (user.user_metadata?.role as string) || "client";

    // Si le rôle ne correspond pas à la route demandée → redirection
    if (need && role !== need) {
      router.replace("/");
    }
  }, [loading, user, pathname, router]);

  // Si non connecté ou en chargement → rien à afficher
  if (loading || !user) return null;

  // Si tout est bon → on affiche le contenu protégé
  return <>{children}</>;
}
