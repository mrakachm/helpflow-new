"use client";

import { ReactNode, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from '@/lib/supabase'

type Props = { children: ReactNode };

export default function Protected({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const redirected = useRef(false);
 

  useEffect(() => {
    if (loading || redirected.current) return;

    async function run() {
      // Pas connecté -> /login
      if (!user) {
        redirected.current = true;
        router.replace("/login");
        return;
      }

      // Vérifie le rôle vs route
      const need =
        pathname.startsWith("/admin") ? "admin" :
        pathname.startsWith("/client") ? "client" :
        pathname.startsWith("/livreur") ? "livreur" : null;

      const role = String(user.user_metadata?.role ?? "").toLowerCase();
      if (need && role && role !== need) {
        redirected.current = true;
        router.replace("/login");
        return;
      }

      // Si on est sur /client ou /livreur -> profil doit être complet
      if (pathname.startsWith("/client") || pathname.startsWith("/livreur")) {
        const { data } = await supabase
          .from("profiles")
          .select("first_name,last_name,address,phone")
          .eq("user_id", user.id)
          .maybeSingle();

        const incomplete =
          !data ||
          !data.first_name ||
          !data.last_name ||
          !data.address ||
          !data.phone;

        if (incomplete) {
          redirected.current = true;
          router.replace("/profile");
          return;
        }
      }
    }

    run();
  }, [user, loading, pathname]);

  return <>{children}</>;
}


