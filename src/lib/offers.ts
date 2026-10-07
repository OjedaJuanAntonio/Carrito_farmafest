/**
 * Lógica de ofertas, compartida entre UI y tests. Sin dependencias de React
 * ni del DOM para poder testearla como función pura.
 */

export interface ConOferta {
  precio: number;
  precioAnterior?: number;
  oferta?: string;
}

/** Porcentaje de descuento (entero) si hay precio anterior mayor; si no, null. */
export function descuentoPct(p: ConOferta): number | null {
  if (!p.precioAnterior || p.precioAnterior <= p.precio) return null;
  return Math.round((1 - p.precio / p.precioAnterior) * 100);
}

/** ¿El producto está en oferta? (tiene etiqueta o precio anterior válido). */
export function tieneOferta(p: ConOferta): boolean {
  return Boolean(p.oferta) || descuentoPct(p) !== null;
}

/**
 * Texto del badge de oferta. Prioriza la etiqueta EXPLÍCITA de mecánica
 * ("2x1", "2do al 70%", "Combo"): describe la promo tal como se cobra, que en
 * mecánicas tipo 2x1 no equivale a un simple "-N%". Si no hay etiqueta pero sí
 * una baja de precio, muestra el descuento calculado "-30%". null si no hay
 * oferta.
 */
export function ofertaLabel(p: ConOferta): string | null {
  if (p.oferta) return p.oferta;
  const pct = descuentoPct(p);
  return pct !== null ? `-${pct}%` : null;
}

/**
 * ¿La oferta es un 2x1? En ese caso el precio mostrado es por unidad y el UI
 * agrega "c/u" al lado del precio.
 */
export function esDosPorUno(p: ConOferta): boolean {
  return (
    typeof p.oferta === "string" &&
    p.oferta.trim().toLowerCase().replace(/\s+/g, "") === "2x1"
  );
}
