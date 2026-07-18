import type { StandGroup } from "../cart";

/**
 * Estrategias de checkout: cómo se le presenta la compra a la caja del stand.
 * La integración con el sistema de caja (POSBerry) todavía no está definida,
 * así que las tres variantes viven detrás de esta interfaz y se elige UNA en
 * config.ts (único punto de cambio).
 */

export type CheckoutVariantId = "pantalla" | "qr-codigos" | "qr-compacto";

export interface CheckoutInput {
  group: StandGroup;
  proveedor: string;
}

/** Lo que la página de caja tiene que mostrar. */
export type CheckoutPayload =
  /** Sin QR: pantalla legible para que el cajero lea/tipee. */
  | { kind: "screen" }
  /** QR para escanear + lista de respaldo por si no escanea. */
  | { kind: "qr"; data: string; hint: string };

export interface CheckoutStrategy {
  id: CheckoutVariantId;
  /** Nombre corto para UI/debug */
  titulo: string;
  /** Instrucción que ve el cliente en la pantalla de caja */
  instruccion: string;
  build(input: CheckoutInput): CheckoutPayload;
}
