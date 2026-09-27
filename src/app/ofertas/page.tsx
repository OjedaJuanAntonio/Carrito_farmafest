import type { Metadata } from "next";
import { branding } from "@/config/branding";
import { OfertasView } from "@/components/OfertasView";

export const metadata: Metadata = {
  title: "Ofertas",
  description: `Todas las ofertas y descuentos del evento ${branding.name}: precios rebajados, 2x1, combos y lanzamientos.`,
};

/** Página de Ofertas (/ofertas): todos los productos en promoción del evento. */
export default function OfertasPage() {
  return <OfertasView />;
}
