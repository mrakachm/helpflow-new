"use client";

import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      router.replace("/login"); // tu peux changer: "/signup" ou "/"
    }, 1200);

    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <div className="rounded-3xl bg-white/5 border border-white/10 p-6 shadow-xl">
          <Image
            src="/branding/photo-logo-helpflow.png"
            alt="HelpFlow"
            width={260}
            height={260}
            priority
          />

          <p className="mt-4 text-sm text-white/70">
            Livraison simple et efficace
          </p>
        </div>

        <p className="mt-6 text-xs text-white/40">
          Chargement…
        </p>
      </div>
    </div>
  );
}
