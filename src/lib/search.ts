import type { IndexEntry } from "./types";

/**
 * Búsqueda global client-side sobre ~9.000 productos.
 *
 * Sin dependencias: un escaneo lineal sobre texto normalizado alcanza de sobra
 * para este volumen (<5 ms por consulta en un teléfono medio) y es 100%
 * predecible. Insensible a mayúsculas y acentos ("ibuprofeno" == "Ibuprofeno").
 */

/** Minúsculas, sin acentos, espacios colapsados. */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export interface SearchDoc {
  codigo: string;
  descripcion: string;
  precio: number;
  stand: number;
  /** descripción normalizada, precomputada una sola vez */
  norm: string;
}

/** Prepara los documentos a partir del índice compacto descargado. */
export function prepareDocs(entries: IndexEntry[]): SearchDoc[] {
  return entries.map(([codigo, descripcion, precio, stand]) => ({
    codigo,
    descripcion,
    precio,
    stand,
    norm: normalizeText(descripcion),
  }));
}

/**
 * Busca `query` en los documentos. Todos los tokens de la consulta deben
 * aparecer (AND). También matchea por código de barras exacto o por prefijo.
 * Devuelve hasta `limit` resultados ordenados por relevancia.
 */
export function searchDocs(
  docs: SearchDoc[],
  query: string,
  limit = 60
): SearchDoc[] {
  const q = normalizeText(query);
  if (q.length < 2) return [];

  // Búsqueda por código de barras (solo dígitos, 4+): exacto o prefijo.
  if (/^\d{4,}$/.test(q)) {
    const byCode = docs.filter((d) => d.codigo.startsWith(q));
    byCode.sort((a, b) => a.codigo.length - b.codigo.length);
    return byCode.slice(0, limit);
  }

  const tokens = q.split(" ").filter(Boolean);
  const scored: { doc: SearchDoc; score: number }[] = [];

  outer: for (const doc of docs) {
    let score = 0;
    for (const token of tokens) {
      const idx = doc.norm.indexOf(token);
      if (idx === -1) continue outer;
      if (idx === 0) {
        score += 3; // arranca con el token
      } else if (doc.norm[idx - 1] === " ") {
        score += 2; // matchea al inicio de una palabra
      } else {
        score += 1; // substring interno
      }
    }
    // desempate: descripciones más cortas primero (match más "puro")
    scored.push({ doc, score: score * 1000 - doc.norm.length });
  }

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.doc);
}
