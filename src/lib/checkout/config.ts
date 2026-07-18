import type { CheckoutVariantId } from "./types";

/**
 * ÚNICO PUNTO DE CAMBIO de la estrategia de checkout.
 *
 * Valores posibles:
 *   "pantalla"     → lista legible para que el cajero lea/tipee
 *   "qr-codigos"   → QR con un renglón `código;cantidad` por producto
 *   "qr-compacto"  → QR con payload compacto importable (formato FF1)
 *
 * Cuando se defina la integración con POSBerry, cambiar este valor (y si hace
 * falta otro formato, tocar solo compact-encoder.ts).
 *
 * Para probar otra variante sin tocar código: agregar `?variante=pantalla`
 * (o qr-codigos / qr-compacto) a la URL de la página de caja.
 */
export const CHECKOUT_VARIANT: CheckoutVariantId = "qr-codigos";
