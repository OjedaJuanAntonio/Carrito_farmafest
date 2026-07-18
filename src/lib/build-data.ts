import { promises as fs } from "fs";
import path from "path";
import type { Stand } from "./types";

/**
 * Lectura de datos en BUILD TIME (generateStaticParams / metadata).
 * Solo se usa la lista de stands para enumerar las rutas estáticas;
 * los precios y productos SIEMPRE se leen en runtime vía fetch.
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
