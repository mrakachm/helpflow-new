import "./globals.css";
import GoogleMapsScript from "@/components/GoogleMapsScript";
import RegisterSW from "@/components/RegisterSW";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body className="relative min-h-screen bg-white text-gray-900">
        <GoogleMapsScript />
        <RegisterSW />
        {children}
      </body>
    </html>
  );
}