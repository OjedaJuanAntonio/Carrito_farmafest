import type { Metadata, Viewport } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { branding, brandingCssVars } from "@/config/branding";
import { Header } from "@/components/Header";
import { SwRegister } from "@/components/SwRegister";
import { DataPrefetcher } from "@/components/DataPrefetcher";
import { OfflineBanner } from "@/components/OfflineBanner";

// Tipografía de marca (la misma del sitio del evento). next/font la
// descarga en build y la sirve desde el propio hosting → funciona offline.
// display "optional": en la PRIMERA visita con red mala pinta ya mismo con
// la fuente del sistema (sin re-render al llegar Poppins); desde la segunda
// visita el service worker la sirve de cache y Poppins aparece siempre.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "optional",
  // Sin <link rel=preload>: no compite con el primer render en 4G mala;
  // el service worker las deja cacheadas para todas las visitas siguientes.
  preload: false,
});

export const metadata: Metadata = {
  title: {
    default: `${branding.name} · Carrito`,
    template: `%s · ${branding.name}`,
  },
  description: `Buscá productos, armá tu carrito y pasá por la caja del stand. ${branding.eventDates}.`,
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // Header blanco → la barra de estado acompaña
  themeColor: branding.colors.surface,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es-AR"
      style={brandingCssVars()}
      className={poppins.variable}
    >
      <body className="min-h-dvh flex flex-col">
        <Header />
        <OfflineBanner />
        <main className="flex-1 w-full max-w-lg mx-auto px-3 pb-24">
          {children}
        </main>
        <footer className="w-full max-w-lg mx-auto px-4 py-6 text-center text-xs text-ink-muted">
          {branding.name} · {branding.eventDates}
        </footer>
        <SwRegister />
        <DataPrefetcher />
      </body>
    </html>
  );
}
