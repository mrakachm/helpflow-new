"use client";
import Image from "next/image";
import Link from "next/link";

export default function Nav() {
  return (
    <header className="w-full border-b bg-white">
      <div className="max-w-6xl mx-auto flex items-center gap-3 p-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.png" alt="HelpFlow" width={32} height={32} priority />
          <span className="font-semibold">HelpFlow</span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/client">Client</Link>
          <Link href="/livreur">Livreur</Link>
        </nav>
      </div>
    </header>
  );
}