import type { Metadata } from "next";
import { branding } from "@/config/branding";
import { VenueMap } from "@/components/VenueMap";

export const metadata: Metadata = {
  title: "Mapa del predio",
  description: `Ubicación de cada stand en el predio de ${branding.name}. Tocá un stand para ver sus productos.`,
};

/**
 * Página dedicada del mapa del predio (/mapa), en paralelo a /evento. El mapa
 * entra completo en pantalla (es lo único de la página) y cada stand es
 * clickeable → /stand/<id>.
 */
export default function MapaPage() {
  return (
    <div className="pt-4">
      <h1 className="text-xl font-bold px-1">Mapa del predio</h1>
      <p className="text-sm text-ink-muted mt-1 px-1">
        Tocá un stand para ver sus productos. Pellizcá para acercarte.
      </p>
      <div className="mt-3">
        <VenueMap />
      </div>
    </div>
  );
}
