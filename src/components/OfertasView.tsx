"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchSearchIndex, fetchStands, formatPrice } from "@/lib/data";
import { prepareDocs, type SearchDoc } from "@/lib/search";
import { descuentoPct, tieneOferta } from "@/lib/offers";
import type { Stand } from "@/lib/types";
import { OfferBadge } from "./OfferBadge";

const LOTE = 40;

/**
 * Ofertas del evento: filtra del índice global los productos en promoción
 * (precio anterior con baja, o etiqueta tipo 2x1/combo) y los lista ordenados
 * por mayor descuento primero. Datos en runtime (mismos JSON que la búsqueda).
 */
export function OfertasView() {
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [stands, setStands] = useState<Stand[]>([]);
  const [error, setError] = useState(false);
  const [limite, setLimite] = useState(LOTE);

  useEffect(() => {
    let cancelled = false;
    Promise.all([fetchSearchIndex(), fetchStands()])
      .then(([index, standsList]) => {
        if (cancelled) return;
        setDocs(prepareDocs(index.entries));
        setStands(standsList);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const standName = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of stands) map.set(s.id, s.proveedor);
    return map;
  }, [stands]);

  const ofertas = useMemo(() => {
    if (!docs) return null;
    const list = docs.filter(tieneOferta);
    // Mayor descuento primero; las de solo etiqueta (sin %) van después.
    list.sort((a, b) => (descuentoPct(b) ?? -1) - (descuentoPct(a) ?? -1));
    return list;
  }, [docs]);

  return (
    <div className="pt-4">
      <div className="px-1">
        <h1 className="text-xl font-bold">Ofertas del evento</h1>
        <p className="text-sm text-ink-muted mt-1">
          {ofertas
            ? `${ofertas.length} ${ofertas.length === 1 ? "producto" : "productos"} en promoción`
            : "Cargando ofertas…"}
        </p>
      </div>

      {error && (
        <p className="text-center text-ink-muted text-sm py-10">
          No pudimos cargar las ofertas. Revisá la conexión y recargá la página.
        </p>
      )}

      {ofertas && ofertas.length === 0 && (
        <p className="text-center text-ink-muted text-sm py-10">
          Todavía no hay ofertas cargadas. Volvé a mirar durante el evento.
        </p>
      )}

      {ofertas && ofertas.length > 0 && (
        <>
          <ul className="flex flex-col gap-2 mt-3">
            {ofertas.slice(0, limite).map((o) => (
              <li key={o.codigo}>
                <OfertaCard
                  doc={o}
                  proveedor={standName.get(o.stand) ?? `Stand ${o.stand}`}
                />
              </li>
            ))}
          </ul>
          {limite < ofertas.length && (
            <button
              onClick={() => setLimite((l) => l + LOTE)}
              className="w-full py-4 mt-2 rounded-xl border border-border-c bg-surface text-sm font-semibold text-brand active:bg-brand-soft"
            >
              Ver más ofertas ({ofertas.length - limite} restantes)
            </button>
          )}
        </>
      )}
    </div>
  );
}

function OfertaCard({ doc, proveedor }: { doc: SearchDoc; proveedor: string }) {
  return (
    <Link
      href={`/stand/${doc.stand}/`}
      className="flex items-center gap-3 rounded-xl bg-surface border border-border-c p-3 shadow-sm active:bg-brand-soft"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium leading-snug line-clamp-2 min-w-0">
            {doc.descripcion}
          </p>
          <OfferBadge product={doc} className="shrink-0" />
        </div>
        <p className="text-[11px] text-brand font-semibold mt-1">
          Stand {doc.stand} · {proveedor}
        </p>
      </div>
      <div className="text-right whitespace-nowrap">
        {doc.precioAnterior !== undefined && (
          <p className="text-[11px] text-ink-muted line-through leading-none">
            {formatPrice(doc.precioAnterior)}
          </p>
        )}
        <p className="text-base font-bold text-brand-dark leading-none mt-0.5">
          {formatPrice(doc.precio)}
        </p>
      </div>
    </Link>
  );
}
