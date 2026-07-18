import type { Metadata, Viewport } from "next";
import "./globals.css";
import { branding, brandingCssVars } from "@/config/branding";
import { Header } from "@/components/Header";
import { SwRegister } from "@/components/SwRegister";
import { DataPrefetcher } from "@/components/DataPrefetcher";
import { OfflineBanner } from "@/components/OfflineBanner";

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
  themeColor: branding.colors.primary,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR" style={brandingCssVars()}>
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
