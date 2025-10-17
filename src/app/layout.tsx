import type { Metadata, Viewport } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "HelpFlow",
  description: "Livraison simple, rapide, efficace",
manifest: "/manifest.json",        // ✅ lien complet, toujours à la racine /public
};

export const viewport: Viewport = {
  themeColor: "#0ea5e9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">
        <header><Nav /></header>
        <main className="max-w-4xl mx-auto px-4 py-8">
          <AuthProvider>{children}</AuthProvider>
        </main>
        <footer className="text-center text-gray-500 text-sm mt-10">
          © {new Date().getFullYear()} HelpFlow
        </footer>

        {/* Enregistrement SW (simple) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ("serviceWorker" in navigator) {
                window.addEventListener("load", () => {
                  navigator.serviceWorker.register("/service-worker.js")
                    .then(() => console.log("✅ Service Worker registered"))
                    .catch(() => console.log("❌ Service Worker registration failed"));
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}