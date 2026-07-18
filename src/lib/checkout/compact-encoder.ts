/**
 * Encoder del payload compacto importable (variante "qr-compacto").
 *
 * AISLADO A PROPÓSITO: cuando se defina la integración con POSBerry, el
 * formato se cambia acá (y solo acá). El QR lleva un string versionado:
 *
 *   FF1|<stand>|<total en centavos>|<codigo>:<cantidad>,<codigo>:<cantidad>,...
 *
 * Ejemplo: FF1|12|1234550|7791000016643:2,7791000016056:1
 *
 * - Prefijo "FF1" = formato Farmafest v1; permite evolucionar sin romper
 *   lectores viejos.
 * - Total en centavos para evitar decimales/locales.
 * - Solo caracteres alfanuméricos y | : , → QR compacto en modo byte y
 *   fácil de parsear desde cualquier lenguaje.
 */

export interface CompactPayload {
  stand: number;
  /** total en centavos */
  totalCents: number;
  items: { codigo: string; qty: number }[];
}

const VERSION = "FF1";

export function encodeCompact(payload: CompactPayload): string {
  const items = payload.items
    .map((i) => `${i.codigo}:${i.qty}`)
    .join(",");
  return `${VERSION}|${payload.stand}|${payload.totalCents}|${items}`;
}

/** Parser de referencia (para tests y para el futuro importador del POS). */
export function decodeCompact(data: string): CompactPayload {
  const [version, stand, totalCents, items] = data.split("|");
  if (version !== VERSION) {
    throw new Error(`Versión de payload desconocida: «${version}»`);
  }
  const standId = Number(stand);
  const total = Number(totalCents);
  if (!Number.isInteger(standId) || standId <= 0) {
    throw new Error(`Stand inválido en payload: «${stand}»`);
  }
  if (!Number.isInteger(total) || total < 0) {
    throw new Error(`Total inválido en payload: «${totalCents}»`);
  }
  const parsedItems = (items ? items.split(",") : []).map((chunk) => {
    const [codigo, qtyRaw] = chunk.split(":");
    const qty = Number(qtyRaw);
    if (!/^\d{6,14}$/.test(codigo ?? "") || !Number.isInteger(qty) || qty <= 0) {
      throw new Error(`Ítem inválido en payload: «${chunk}»`);
    }
    return { codigo, qty };
  });
  if (parsedItems.length === 0) {
    throw new Error("Payload sin ítems");
  }
  return { stand: standId, totalCents: total, items: parsedItems };
}
