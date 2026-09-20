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
 * Texto del badge de oferta. Prioriza el descuento concreto: si hay precio
 * anterior, muestra "-30%" (lo más vendedor y objetivo). Si no hay baja de
 * precio pero sí una etiqueta de mecánica ("2x1", "Combo"), muestra esa.
 * null si no hay oferta.
 */
export function ofertaLabel(p: ConOferta): string | null {
  const pct = descuentoPct(p);
  if (pct !== null) return `-${pct}%`;
  return p.oferta ? p.oferta : null;
}
