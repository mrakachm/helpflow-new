"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import useAuth from "@/hooks/useAuth";

export default function Protected({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // ✅ Pendant le chargement initial (user pas encore connu)
  if (user === undefined) return null;

  useEffect(() => {
    // si toujours en "chargement", on ne fait rien
    if (user === undefined) return;

    // ✅ pas connecté => redirection login
    if (!user) {
      const next = encodeURIComponent(pathname || "/");
      router.replace(`/login?next=${next}`);
      return;
    }

    // ✅ rôle selon l'URL
    const need =
      pathname?.startsWith("/admin") ? "admin" :
      pathname?.startsWith("/livreur") ? "livreur" :
      pathname?.startsWith("/client") ? "client" :
      null;

    const role = (user as any)?.user_metadata?.role as string | undefined;

    if (need && role && role !== need) {
      router.replace("/");
    }
  }, [user, pathname, router]);

  // ✅ si pas connecté => rien à afficher (la redirection se fait)
  if (!user) return null;

  return <>{children}</>;
}