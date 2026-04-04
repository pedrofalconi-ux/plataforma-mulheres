import type { Metadata } from "next";
import { SpeedInsights } from '@vercel/speed-insights/next';
import 'leaflet/dist/leaflet.css';
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { CookieConsent } from "@/components/ui/CookieConsent";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `${BRAND_NAME} | Plataforma de formação e comunidade`,
  description: `${BRAND_NAME} é uma plataforma de formação, comunidade e impacto social com uma experiência mais humana, leve e contemporânea.`,
  keywords: ["dignare", "formação", "comunidade", "educação", "impacto social", "trilhas"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="text-stone-900 antialiased">
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="motion-page flex-grow">
              {children}
            </main>
            <Footer />
            <CookieConsent />
            <SpeedInsights />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
