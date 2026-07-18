import { readFileSync } from "fs";
import path from "path";

/**
 * Wordmark FarmaFest inlineado en el HTML (solo build time, páginas server).
 * Inlinearlo evita un request extra en la ruta crítica: el hero (elemento
 * LCP) pinta junto con el primer render, sin esperar la descarga del SVG.
 */

let cached: string | null = null;

export function loadWordmarkSvg(): string {
  if (cached) return cached;
  const file = path.join(process.cwd(), "public", "img", "logo-farmafest.svg");
  let svg = readFileSync(file, "utf8");
  // ancho fluido: manda el contenedor, la relación de aspecto la da el viewBox
  svg = svg
    .replace(/\s(width|height)="[^"]*"/g, "")
    .replace("<svg ", '<svg style="width:100%;height:auto;display:block" ');
  cached = svg;
  return cached;
}
