import type { Product } from "@/lib/types";
import { formatPrice } from "@/lib/data";
import { ProductImage } from "./ProductImage";

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
  const sinStock = product.stock !== undefined && product.stock <= 0;
  return (
    <article className="flex gap-3 rounded-xl bg-surface border border-border-c p-3 shadow-sm">
      <ProductImage
        src={product.foto}
        alt={product.descripcion}
        className="w-20 h-20 rounded-lg object-cover shrink-0 bg-bg"
      />
      <div className="flex flex-col min-w-0 flex-1">
        <h3 className="text-sm font-medium leading-snug line-clamp-2">
          {product.descripcion}
        </h3>
        <p className="text-[11px] text-ink-muted mt-0.5 font-mono">
          {product.codigo}
        </p>
        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <p className="text-lg font-bold text-brand-dark leading-none">
              {formatPrice(product.precio)}
            </p>
            {product.stock !== undefined && (
              <p
                className={`text-[11px] mt-1 ${
                  sinStock ? "text-danger font-medium" : "text-ink-muted"
                }`}
              >
                {sinStock ? "Sin stock" : `Stock: ${product.stock}`}
              </p>
            )}
          </div>
          {action}
        </div>
      </div>
    </article>
  );
}
