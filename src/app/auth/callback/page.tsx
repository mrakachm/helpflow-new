"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";


export default function AuthCallback() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    const code = params.get("code");
    const next = params.get("next") || "/client";

    if (!code) {
      router.replace("/login");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        console.error("Callback error:", error.message);
        router.replace("/login");
        return;
      }
      router.replace(next);
    });
  }, [params, router]);

  return (
    <div className="p-6 text-center">
      Connexion en cours...
    </div>
  );
}
