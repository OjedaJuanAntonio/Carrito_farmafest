import type { MetadataRoute } from "next";
import { branding } from "@/config/branding";

export const dynamic = "force-static";

/** Manifest PWA generado en build a partir del branding centralizado. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${branding.name} · Carrito`,
    short_name: branding.name,
    description: `Buscá productos, armá tu carrito y pasá por la caja del stand. ${branding.eventDates}.`,
    start_url: "/",
    display: "standalone",
    background_color: branding.colors.surface,
    theme_color: branding.colors.surface,
    lang: "es-AR",
    icons: [
      {
        src: branding.logoIcon,
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
