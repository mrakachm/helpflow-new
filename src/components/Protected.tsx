"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user, ready } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Tant que l’auth n’est pas prête -> on n’affiche rien
  if (!ready) return null;

  useEffect(() => {
    // Pas connecté -> login
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
      return;
    }

    // Vérifie rôle selon l’URL (si tu utilises user_metadata.role)
    const need =
      pathname?.startsWith("/admin") ? "admin" :
      pathname?.startsWith("/livreur") ? "livreur" :
      pathname?.startsWith("/client") ? "client" :
      null;

    const role = (user.user_metadata?.role as string | undefined) ?? null;

    if (need && role !== need) {
      router.replace("/");
    }
  }, [ready, user, pathname, router]);

  // Si prêt mais pas connecté (le useEffect va rediriger) -> rien
  if (!user) return null;

  return <>{children}</>;
}
