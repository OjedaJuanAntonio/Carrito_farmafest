import type { DataManifest, SearchIndexFile, Stand, StandData } from "./types";

/**
 * Acceso a los datos en runtime.
 *
 * Los JSON viven en /data/ (mismo hosting/CDN que la app) y se piden con
 * `cache: "no-cache"`: el navegador revalida contra el servidor (ETag → 304
 * si no cambió, respuesta nueva si se publicaron precios). El service worker
 * agrega el fallback offline: si no hay señal, sirve la última copia cacheada.
 * Publicar precios nuevos = regenerar los JSON y subirlos; sin rebuild de la app.
 */

const DATA_BASE = "/data";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${DATA_BASE}${path}`, { cache: "no-cache" });
  if (!res.ok) {
    throw new Error(`No se pudo cargar ${path} (HTTP ${res.status})`);
  }
  return (await res.json()) as T;
}

export function fetchManifest(): Promise<DataManifest> {
  return fetchJson<DataManifest>("/manifest.json");
}

export function fetchStands(): Promise<Stand[]> {
  return fetchJson<Stand[]>("/stands.json");
}

export function fetchStandData(id: number | string): Promise<StandData> {
  return fetchJson<StandData>(`/stand/${id}.json`);
}

export function fetchSearchIndex(): Promise<SearchIndexFile> {
  return fetchJson<SearchIndexFile>("/index.json");
}

/** Formatea un precio en pesos argentinos: $ 12.345,50 */
export function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
