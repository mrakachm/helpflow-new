"use client";

import Link from "next/link";

export default function Nav() {
  return (
    <nav className="flex items-center gap-4 border-b border-gray-200 pb-3">
      <Link href="/" className="text-gray-700 hover:underline">Accueil</Link>
      <Link href="/client" className="text-gray-700 hover:underline">Client</Link>
      <Link href="/livreur" className="text-gray-700 hover:underline">Livreur</Link>
      <span className="flex-1" />
      <Link href="/login" className="text-blue-600 hover:underline">Login</Link>
    </nav>
  );
}