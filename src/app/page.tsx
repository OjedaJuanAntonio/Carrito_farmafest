"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { branding } from "@/config/branding";
import { fetchSearchIndex, fetchStands, formatPrice } from "@/lib/data";
import { prepareDocs, searchDocs, type SearchDoc } from "@/lib/search";
import type { Stand } from "@/lib/types";

/**
 * Home: buscador global sobre todos los productos del evento.
 * Los QR de los pasillos apuntan acá. Muestra en qué stand está cada
 * producto y a qué precio, con link directo al stand.
 */
export default function HomePage() {
  const [docs, setDocs] = useState<SearchDoc[] | null>(null);
  const [stands, setStands] = useState<Stand[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    let cancelled = false;
    setLoadError(false);
    Promise.all([fetchSearchIndex(), fetchStands()])
      .then(([index, standsList]) => {
        if (cancelled) return;
        setDocs(prepareDocs(index.entries));
        setStands(standsList);
      })
      .catch(() => {
        if (!cancelled) setLoadError(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const standName = useMemo(() => {
    const map = new Map<number, string>();
    for (const s of stands ?? []) map.set(s.id, s.proveedor);
    return map;
  }, [stands]);

  const results = useMemo(() => {
    if (!docs || deferredQuery.trim().length < 2) return null;
    return searchDocs(docs, deferredQuery);
  }, [docs, deferredQuery]);

  const searching = query.trim().length >= 2;

  return (
    <div className="pt-4">
      {!searching && (
        <div className="flex flex-col items-center text-center pt-6 pb-4">
          <Image
            src={branding.logoLarge}
            alt={branding.name}
            width={88}
            height={88}
            priority
          />
          <h1 className="text-2xl font-bold mt-3">{branding.name}</h1>
          <p className="text-ink-muted text-sm mt-1">{branding.tagline}</p>
        </div>
      )}

      <div className="sticky top-14 z-10 -mx-3 px-3 py-2 bg-bg/95 backdrop-blur">
        <input
          type="search"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar entre todos los productos…"
          aria-label="Buscar productos en todo el evento"
          className="w-full h-12 rounded-xl border border-border-c bg-surface px-4 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand-soft shadow-sm"
        />
      </div>

      {loadError && (
        <p className="text-center text-ink-muted text-sm py-6">
          No pudimos cargar el catálogo. Revisá la conexión y recargá la
          página.
        </p>
      )}

      {searching && results && (
        <>
          <p className="text-xs text-ink-muted px-1 py-2">
            {results.length === 0
              ? "Sin resultados"
              : `${results.length} resultado${results.length === 1 ? "" : "s"}`}
          </p>
          <ul className="flex flex-col gap-2">
            {results.map((r) => (
              <li key={r.codigo}>
                <SearchResultCard
                  doc={r}
                  proveedor={standName.get(r.stand) ?? `Stand ${r.stand}`}
                />
              </li>
            ))}
          </ul>
        </>
      )}

      {searching && !results && !loadError && (
        <p className="text-center text-ink-muted text-sm py-6">
          Cargando catálogo…
        </p>
      )}

      {!searching && (
        <section className="mt-4">
          <h2 className="text-sm font-semibold text-ink-muted uppercase tracking-wide px-1 mb-2">
            Stands del evento
          </h2>
          {stands ? (
            <ul className="grid grid-cols-2 gap-2">
              {stands.map((s) => (
                <li key={s.id}>
                  <Link
                    href={`/stand/${s.id}/`}
                    className="block rounded-xl bg-surface border border-border-c p-3 h-full shadow-sm active:bg-brand-soft"
                  >
                    <p className="text-[11px] font-semibold text-brand uppercase tracking-wide">
                      Stand {s.id}
                    </p>
                    <p className="text-sm font-medium leading-snug mt-0.5">
                      {s.proveedor}
                    </p>
                    {s.productos !== undefined && (
                      <p className="text-[11px] text-ink-muted mt-1">
                        {s.productos} productos
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          ) : !loadError ? (
            <ul className="grid grid-cols-2 gap-2" aria-hidden>
              {Array.from({ length: 6 }).map((_, i) => (
                <li
                  key={i}
                  className="h-20 rounded-xl bg-surface border border-border-c animate-pulse"
                />
              ))}
            </ul>
          ) : null}
        </section>
      )}
    </div>
  );
}

function SearchResultCard({
  doc,
  proveedor,
}: {
  doc: SearchDoc;
  proveedor: string;
}) {
  return (
    <Link
      href={`/stand/${doc.stand}/`}
      className="flex items-center gap-3 rounded-xl bg-surface border border-border-c p-3 shadow-sm active:bg-brand-soft"
    >
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">
          {doc.descripcion}
        </p>
        <p className="text-[11px] text-brand font-semibold mt-1">
          Stand {doc.stand} · {proveedor}
        </p>
      </div>
      <p className="text-base font-bold text-brand-dark whitespace-nowrap">
        {formatPrice(doc.precio)}
      </p>
    </Link>
  );
}
