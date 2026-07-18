"use client";

import { useState } from "react";

const PLACEHOLDER = "/img/placeholder-producto.svg";

/**
 * Imagen de producto con fallback: si no hay foto o la foto falla al cargar,
 * muestra el placeholder. Ningún flujo depende de que exista la imagen.
 */
export function ProductImage({
  src,
  alt,
  className,
}: {
  src?: string;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const url = !src || failed ? PLACEHOLDER : src;
  return (
    // eslint-disable-next-line @next/next/no-img-element -- export estático: img nativa con lazy loading
    <img
      src={url}
      alt={alt}
      loading="lazy"
      decoding="async"
      width={96}
      height={96}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
