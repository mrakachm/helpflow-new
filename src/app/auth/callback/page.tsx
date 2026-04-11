// src/app/auth/callback/page.tsx
"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function CallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const next = searchParams.get("next") || "/";
    router.replace(next);
  }, [router, searchParams]);

  return <p className="p-4">Connexion en cours...</p>;
}

export default function Page() {
  return (
    <Suspense fallback={<p className="p-4">Chargement...</p>}>
      <CallbackInner />
    </Suspense>
  );
}