import { ofertaLabel, type ConOferta } from "@/lib/offers";

/**
 * Badge de oferta: muestra la etiqueta explícita ("2x1") o el descuento
 * calculado ("-30%"). Usa el magenta apto para texto (#d80060, AA con blanco).
 * No renderiza nada si el producto no está en oferta.
 */
export function OfferBadge({
  product,
  className = "",
}: {
  product: ConOferta;
  className?: string;
}) {
  const label = ofertaLabel(product);
  if (!label) return null;
  return (
    <span
      className={`inline-flex items-center rounded-md bg-fest-magenta-texto px-1.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white ${className}`}
    >
      {label}
    </span>
  );
}
