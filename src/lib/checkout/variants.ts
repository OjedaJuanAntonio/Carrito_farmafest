import { encodeCompact } from "./compact-encoder";
import type { CheckoutStrategy } from "./types";

/**
 * Las tres variantes de checkout detrás de la misma interfaz.
 * Cuál se usa se decide en config.ts (único punto de cambio).
 */

/** (a) Pantalla legible: el cajero lee la lista y tipea/escanea del teléfono. */
export const variantePantalla: CheckoutStrategy = {
  id: "pantalla",
  titulo: "Pantalla para el cajero",
  instruccion: "Mostrale esta pantalla al cajero del stand.",
  build() {
    return { kind: "screen" };
  },
};

/**
 * (b) QR con la lista de códigos de barras: una línea por producto,
 * `codigo;cantidad`. Cualquier lector de QR lo muestra como texto plano
 * para escanear/tipear en el POS.
 */
export const varianteQrCodigos: CheckoutStrategy = {
  id: "qr-codigos",
  titulo: "QR con códigos de barras",
  instruccion: "Mostrale este QR al cajero para que escanee tu pedido.",
  build({ group }) {
    const data = group.items
      .map((i) => `${i.codigo};${i.qty}`)
      .join("\n");
    return {
      kind: "qr",
      data,
      hint: "El QR contiene un renglón por producto: código de barras;cantidad",
    };
  },
};

/** (c) QR con payload compacto importable (formato FF1, ver compact-encoder). */
export const varianteQrCompacto: CheckoutStrategy = {
  id: "qr-compacto",
  titulo: "QR compacto importable",
  instruccion: "Mostrale este QR al cajero para importar tu pedido.",
  build({ group }) {
    const data = encodeCompact({
      stand: group.stand,
      totalCents: Math.round(group.subtotal * 100),
      items: group.items.map((i) => ({ codigo: i.codigo, qty: i.qty })),
    });
    return {
      kind: "qr",
      data,
      hint: "El QR contiene el pedido completo en formato compacto (FF1)",
    };
  },
};

export const STRATEGIES: Record<CheckoutStrategy["id"], CheckoutStrategy> = {
  pantalla: variantePantalla,
  "qr-codigos": varianteQrCodigos,
  "qr-compacto": varianteQrCompacto,
};
