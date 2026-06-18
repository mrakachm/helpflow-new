import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body className="relative min-h-screen bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}