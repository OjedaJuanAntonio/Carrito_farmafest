import type { Metadata } from "next";
import { branding } from "@/config/branding";

export const metadata: Metadata = {
  title: "Stands",
  description: `Listado de stands y marcas de ${branding.name} (segunda edición).`,
};

/**
 * Sección "Stands" (/stands): listado oficial de stands y marcas de la segunda
 * edición, tal cual el diseño provisto por marketing. Es informativa y NO afecta
 * los enlaces de los QR (siguen apuntando a /stand/<n>/).
 */
export default function StandsPage() {
  return (
    <div className="pt-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- export estático: img nativa */}
      <img
        src="/img/stands-2da-edicion.webp"
        alt="Listado de stands de Farmafest (segunda edición): número de stand y marcas de cada uno."
        width={947}
        height={2000}
        className="block w-full h-auto rounded-xl shadow-sm"
      />
    </div>
  );
}
