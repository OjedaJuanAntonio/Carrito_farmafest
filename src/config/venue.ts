/**
 * Distribución del predio (mapa del evento). Coordenadas en el sistema del
 * `viewBox` del SVG (ver VenueMap), derivadas del plano oficial del Centro de
 * Convenciones Corrientes guardado en `data-src/plano-predio-v2.jpg`.
 * Reordenar/mover un stand = editar acá.
 *
 * - `stands`: cajas de proveedores, clickeables → /stand/<id>. `nombre` es el
 *   proveedor (se muestra como rótulo sobre el box y en el aria-label).
 * - `patios`: "Patio de comidas" (52–55). Referencia, NO clickeables.
 */

export const VENUE_VIEWBOX = { w: 838, h: 461 } as const;

/** Ruta del plano oficial (imagen de fondo del mapa). */
export const VENUE_PLANO = "/img/plano-predio.webp";

export interface VenueBox {
  id: number;
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const VENUE_STANDS: VenueBox[] = [
  // Fila superior (1–17), rosa 4x3
  { id: 1, nombre: "Vamma / Bioderma", x: 145, y: 150, w: 24, h: 22 },
  { id: 2, nombre: "Dorothy Gray", x: 171, y: 150, w: 24, h: 22 },
  { id: 3, nombre: "Dorothy Gray", x: 198, y: 150, w: 24, h: 22 },
  { id: 4, nombre: "Algabo", x: 224, y: 150, w: 24, h: 22 },
  { id: 5, nombre: "Parallel (Chicco-Avent)", x: 251, y: 150, w: 24, h: 22 },
  { id: 6, nombre: "Beauty Solutions / Disney", x: 277, y: 150, w: 24, h: 22 },
  { id: 7, nombre: "Bagó", x: 304, y: 150, w: 24, h: 22 },
  { id: 8, nombre: "Cuenca", x: 330, y: 150, w: 24, h: 22 },
  { id: 9, nombre: "Beauty Solutions / Oreiro", x: 357, y: 150, w: 24, h: 22 },
  { id: 10, nombre: "Loval", x: 383, y: 150, w: 24, h: 22 },
  { id: 11, nombre: "Combe", x: 410, y: 150, w: 24, h: 22 },
  { id: 12, nombre: "Caviahue", x: 436, y: 150, w: 24, h: 22 },
  { id: 13, nombre: "Johnson Family", x: 463, y: 150, w: 24, h: 22 },
  { id: 14, nombre: "Comimpar", x: 490, y: 150, w: 24, h: 22 },
  { id: 15, nombre: "Active Cosmetic", x: 516, y: 150, w: 24, h: 22 },
  { id: 16, nombre: "Ayudín", x: 543, y: 150, w: 24, h: 22 },
  { id: 17, nombre: "Eurolab / Viasek", x: 569, y: 150, w: 24, h: 22 },

  // Fila 2 (50–42), azul 5x5
  { id: 50, nombre: "Andrómaco", x: 152, y: 188, w: 40, h: 42 },
  { id: 49, nombre: "Papelera", x: 199, y: 188, w: 40, h: 42 },
  { id: 48, nombre: "Johnson / Neutrogena", x: 246, y: 188, w: 40, h: 42 },
  { id: 47, nombre: "Nivea / Eucerin", x: 293, y: 188, w: 40, h: 42 },
  { id: 46, nombre: "Unilever Rexona", x: 340, y: 188, w: 40, h: 42 },
  { id: 45, nombre: "Loreal / Maquillajes", x: 387, y: 188, w: 40, h: 42 },
  { id: 44, nombre: "Essity", x: 434, y: 188, w: 40, h: 42 },
  { id: 43, nombre: "By Derm / Star", x: 481, y: 188, w: 40, h: 42 },
  { id: 42, nombre: "Colgate", x: 528, y: 188, w: 40, h: 42 },

  // Fila 3 (33–41), azul 5x5
  { id: 33, nombre: "Cdimex", x: 152, y: 238, w: 40, h: 42 },
  { id: 34, nombre: "Nestlé", x: 199, y: 238, w: 40, h: 42 },
  { id: 35, nombre: "Procter", x: 246, y: 238, w: 40, h: 42 },
  { id: 36, nombre: "Unilever Limpieza / Ala", x: 293, y: 238, w: 40, h: 42 },
  { id: 37, nombre: "Unilever Capilar / Sedal", x: 340, y: 238, w: 40, h: 42 },
  { id: 38, nombre: "Biferdil", x: 387, y: 238, w: 40, h: 42 },
  { id: 39, nombre: "Kimberly", x: 434, y: 238, w: 40, h: 42 },
  { id: 40, nombre: "Cannon", x: 481, y: 238, w: 40, h: 42 },
  { id: 41, nombre: "Coty", x: 528, y: 238, w: 40, h: 42 },

  // Stand 32
  { id: 32, nombre: "BIC", x: 127, y: 258, w: 22, h: 26 },

  // Fila inferior
  { id: 31, nombre: "Loreal / Dermo", x: 150, y: 286, w: 24, h: 22 },
  { id: 30, nombre: "Biosintex", x: 176, y: 286, w: 24, h: 22 },
  { id: 29, nombre: "Lancôme", x: 202, y: 286, w: 24, h: 22 },
  { id: 28, nombre: "ACF", x: 228, y: 286, w: 24, h: 22 },
  { id: 27, nombre: "Buhl", x: 285, y: 286, w: 24, h: 22 },
  { id: 26, nombre: "Ferrini / Max", x: 311, y: 286, w: 24, h: 22 },
  { id: 25, nombre: "Plumari / Estereocolor", x: 369, y: 286, w: 24, h: 22 },
  { id: 24, nombre: "SISCOM", x: 395, y: 286, w: 24, h: 22 },
  { id: 23, nombre: "Improm (Contigo / Nuk)", x: 462, y: 286, w: 24, h: 22 },
  { id: 22, nombre: "Genoma", x: 488, y: 286, w: 24, h: 22 },
  { id: 21, nombre: "IDI", x: 543, y: 286, w: 24, h: 22 },

  // Columna derecha
  { id: 18, nombre: "Bernabó", x: 568, y: 190, w: 22, h: 34 },
  { id: 19, nombre: "Laboratorios ENA", x: 568, y: 240, w: 22, h: 30 },
  { id: 20, nombre: "Elea", x: 568, y: 272, w: 22, h: 26 },

  // Sueltos
  { id: 51, nombre: "Farmar", x: 376, y: 306, w: 24, h: 18 },
  { id: 56, nombre: "Facor", x: 250, y: 356, w: 32, h: 18 },
];

/** Patios de comida (52–55): referencia, no clickeables. */
export const VENUE_PATIOS: VenueBox[] = [
  { id: 52, nombre: "Patio de comidas", x: 462, y: 308, w: 24, h: 18 },
  { id: 53, nombre: "Patio de comidas", x: 488, y: 308, w: 24, h: 18 },
  { id: 54, nombre: "Patio de comidas", x: 543, y: 308, w: 24, h: 18 },
  { id: 55, nombre: "Patio de comidas", x: 428, y: 334, w: 24, h: 18 },
];
