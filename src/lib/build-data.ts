import { promises as fs } from "fs";
import path from "path";
import type { Stand, StandData } from "./types";

/**
 * Lectura de datos en BUILD TIME (generateStaticParams / metadata / snapshot
 * inicial). Los precios SIEMPRE se refrescan en runtime vía fetch; el snapshot
 * horneado en el HTML es solo para el primer pintado (LCP inmediato).
 */

let standsCache: Promise<Stand[]> | null = null;

export function loadStandsAtBuild(): Promise<Stand[]> {
  if (!standsCache) {
    const file = path.join(process.cwd(), "public", "data", "stands.json");
    standsCache = fs.readFile(file, "utf8").then((raw) => {
      const stands = JSON.parse(raw) as Stand[];
      if (!Array.isArray(stands) || stands.length === 0) {
        throw new Error(
          "public/data/stands.json está vacío. Corré `npm run ingest` antes de buildear."
        );
      }
      return stands;
    });
  }
  return standsCache;
}

/**
 * Snapshot de los productos de un stand en build time (para el primer pintado).
 * Devuelve null si el archivo no existe todavía (la app cae al fetch runtime).
 */
export async function loadStandDataAtBuild(
  id: number | string
): Promise<StandData | null> {
  const file = path.join(process.cwd(), "public", "data", "stand", `${id}.json`);
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as StandData;
  } catch {
    return null;
  }
}
