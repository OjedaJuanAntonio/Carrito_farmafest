import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { ProductImage } from "./ProductImage";
import { OfferBadge } from "./OfferBadge";

/**
 * Umbral (inclusive) por debajo del cual el stock se considera "poco".
 * El número exacto de stock no se muestra: solo el nivel (hay / poco / sin).
 * Cambiá este valor si querés que "poco stock" arranque en otra cantidad.
 */
const POCO_STOCK_MAX = 5;

/**
 * Muestra el stock por NIVEL en vez del número exacto: "Hay stock",
 * "Poco stock" o "Sin stock". Devuelve null cuando no vino el dato (no se
 * muestra nada, igual que antes). Cada nivel trae su clase de color/énfasis.
 */
function nivelStock(stock: number | undefined) {
  if (stock === undefined) return null;
  if (stock <= 0) return { label: "Sin stock", className: "text-danger font-medium" };
  if (stock <= POCO_STOCK_MAX)
    return { label: "Poco stock", className: "text-warning font-medium" };
  return { label: "Hay stock", className: "text-success font-medium" };
}

/**
 * Tarjeta de producto para la página de stand.
 * Diseñada para verse bien con o sin foto y con o sin stock.
 */
export function ProductCard({
  product,
  action,
}: {
  product: Product;
  action?: React.ReactNode;
}) {
  const stock = nivelStock(product.stock);
  return (
    <article className="flex gap-3 rounded-xl bg-surface border border-border-c p-3 shadow-sm">
      <div className="relative shrink-0">
        <ProductImage
          src={product.foto}
          alt={product.descripcion}
          className="w-20 h-20 rounded-lg object-cover bg-bg"
        />
        <OfferBadge product={product} className="absolute -top-1.5 -left-1.5 shadow" />
      </div>
      <div className="flex flex-col min-w-0 flex-1">
        <h2 className="text-sm font-medium leading-snug line-clamp-2">
          {product.descripcion}
        </h2>
        <p className="text-[11px] text-ink-muted mt-0.5 font-mono">
          {product.codigo}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            {product.precioAnterior !== undefined && (
              <p className="text-[11px] text-ink-muted line-through leading-none">
                {formatPrice(product.precioAnterior)}
              </p>
            )}
            <p className="text-lg font-bold text-brand-dark leading-none mt-0.5">
              {formatPrice(product.precio)}
            </p>
            {stock && (
              <p className={`text-[11px] mt-1 ${stock.className}`}>
                {stock.label}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
