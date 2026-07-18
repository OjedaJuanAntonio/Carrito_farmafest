import { CHECKOUT_VARIANT } from "./config";
import { STRATEGIES } from "./variants";
import type { CheckoutStrategy, CheckoutVariantId } from "./types";

export type { CheckoutInput, CheckoutPayload, CheckoutStrategy, CheckoutVariantId } from "./types";
export { CHECKOUT_VARIANT } from "./config";
export { STRATEGIES } from "./variants";

/** Devuelve la estrategia configurada (o la pedida explícitamente, si es válida). */
export function getStrategy(id?: string | null): CheckoutStrategy {
  if (id && id in STRATEGIES) {
    return STRATEGIES[id as CheckoutVariantId];
  }
  return STRATEGIES[CHECKOUT_VARIANT];
}
