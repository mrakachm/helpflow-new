"use client";

import Link from "next/link";

export default function ProfilePage() {
  return (
    <main className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">Mon profil</h1>
      <Link href="/profile/edit" className="underline">Modifier mon profil</Link>
    </main>
  );
}