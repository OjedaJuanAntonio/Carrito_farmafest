/**
 * Distribución del predio (mapa del evento). Coordenadas en el sistema del
 * `viewBox` del SVG (ver VenueMap), derivadas del plano oficial del Centro de
 * Convenciones Corrientes guardado en `data-src/plano-predio-v3.jpg`.
 * Reordenar/mover un stand = editar acá.
 *
 * - `stands`: cajas de proveedores, clickeables → /stand/<id>. `nombre` es el
 *   proveedor (se muestra como rótulo sobre el box y en el aria-label).
 * - `patios`: "Patio de comidas" (52–55). Referencia, NO clickeables.
 */

export const VENUE_VIEWBOX = { w: 1200, h: 730 } as const;

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
  { id: 1, nombre: "Vamma / Bioderma", x: 234, y: 182, w: 42, h: 38 },
  { id: 2, nombre: "Dorothy Gray", x: 282, y: 182, w: 42, h: 38 },
  { id: 3, nombre: "Dorothy Gray", x: 330, y: 182, w: 42, h: 38 },
  { id: 4, nombre: "Algabo", x: 378, y: 182, w: 42, h: 38 },
  { id: 5, nombre: "Parallel (Chicco-Avent)", x: 426, y: 182, w: 42, h: 38 },
  { id: 6, nombre: "Beauty Solutions / Disney", x: 474, y: 182, w: 42, h: 38 },
  { id: 7, nombre: "Bagó", x: 522, y: 182, w: 42, h: 38 },
  { id: 8, nombre: "Cuenca", x: 570, y: 182, w: 42, h: 38 },
  { id: 9, nombre: "Beauty Solutions / Oreiro", x: 618, y: 182, w: 42, h: 38 },
  { id: 10, nombre: "Loval", x: 666, y: 182, w: 42, h: 38 },
  { id: 11, nombre: "Combe", x: 714, y: 182, w: 42, h: 38 },
  { id: 12, nombre: "Caviahue", x: 762, y: 182, w: 42, h: 38 },
  { id: 13, nombre: "Johnson Family", x: 810, y: 182, w: 42, h: 38 },
  { id: 14, nombre: "Comimpar", x: 885, y: 182, w: 42, h: 38 },
  { id: 15, nombre: "Active Cosmetic", x: 933, y: 182, w: 42, h: 38 },
  { id: 16, nombre: "Ayudín", x: 981, y: 182, w: 42, h: 38 },
  { id: 17, nombre: "Eurolab / Viasek", x: 1026, y: 182, w: 42, h: 38 },

  // Fila 2 (50–42), azul 5x5
  { id: 50, nombre: "Andrómaco", x: 258, y: 240, w: 72, h: 72 },
  { id: 49, nombre: "Papelera", x: 343, y: 240, w: 72, h: 72 },
  { id: 48, nombre: "Johnson / Neutrogena", x: 427, y: 240, w: 72, h: 72 },
  { id: 47, nombre: "Nivea / Eucerin", x: 512, y: 240, w: 72, h: 72 },
  { id: 46, nombre: "Unilever Rexona", x: 596, y: 240, w: 72, h: 72 },
  { id: 45, nombre: "Loreal / Maquillajes", x: 681, y: 240, w: 72, h: 72 },
  { id: 44, nombre: "Essity", x: 766, y: 240, w: 72, h: 72 },
  { id: 43, nombre: "By Derm / Star", x: 850, y: 240, w: 72, h: 72 },
  { id: 42, nombre: "Colgate", x: 935, y: 240, w: 72, h: 72 },

  // Fila 3 (33–41), azul 5x5
  { id: 33, nombre: "Cdimex", x: 258, y: 336, w: 72, h: 72 },
  { id: 34, nombre: "Nestlé", x: 343, y: 336, w: 72, h: 72 },
  { id: 35, nombre: "Procter", x: 427, y: 336, w: 72, h: 72 },
  { id: 36, nombre: "Unilever Limpieza / Ala", x: 512, y: 336, w: 72, h: 72 },
  { id: 37, nombre: "Unilever Capilar / Sedal", x: 596, y: 336, w: 72, h: 72 },
  { id: 38, nombre: "Biferdil", x: 681, y: 336, w: 72, h: 72 },
  { id: 39, nombre: "Kimberly", x: 766, y: 336, w: 72, h: 72 },
  { id: 40, nombre: "Cannon", x: 850, y: 336, w: 72, h: 72 },
  { id: 41, nombre: "Coty", x: 935, y: 336, w: 72, h: 72 },

  // Stand 32
  { id: 32, nombre: "BIC", x: 198, y: 372, w: 34, h: 40 },

  // Fila inferior
  { id: 31, nombre: "Loreal / Dermo", x: 240, y: 422, w: 42, h: 40 },
  { id: 30, nombre: "Biosintex", x: 285, y: 422, w: 42, h: 40 },
  { id: 29, nombre: "Lancôme", x: 330, y: 422, w: 42, h: 40 },
  { id: 28, nombre: "ACF", x: 372, y: 422, w: 42, h: 40 },
  { id: 27, nombre: "Buhl", x: 492, y: 422, w: 42, h: 40 },
  { id: 26, nombre: "Ferrini / Max", x: 537, y: 422, w: 42, h: 40 },
  { id: 25, nombre: "Plumari / Estereocolor", x: 663, y: 422, w: 42, h: 40 },
  { id: 24, nombre: "SISCOM", x: 708, y: 422, w: 42, h: 40 },
  { id: 23, nombre: "Improm (Contigo / Nuk)", x: 840, y: 422, w: 42, h: 40 },
  { id: 22, nombre: "Genoma", x: 885, y: 422, w: 42, h: 40 },
  { id: 21, nombre: "IDI", x: 1026, y: 422, w: 42, h: 40 },

  // Columna derecha
  { id: 18, nombre: "Bernabó", x: 1026, y: 300, w: 42, h: 50 },
  { id: 19, nombre: "Laboratorios ENA", x: 1026, y: 354, w: 42, h: 44 },
  { id: 20, nombre: "Elea", x: 1026, y: 402, w: 42, h: 40 },

  // Sueltos
  { id: 51, nombre: "Farmar", x: 666, y: 474, w: 48, h: 34 },
  { id: 56, nombre: "Facor", x: 438, y: 558, w: 60, h: 30 },
];

/** Patios de comida (52–55): referencia, no clickeables. */
export const VENUE_PATIOS: VenueBox[] = [
  { id: 52, nombre: "Patio de comidas", x: 840, y: 480, w: 42, h: 30 },
  { id: 53, nombre: "Patio de comidas", x: 885, y: 480, w: 42, h: 30 },
  { id: 54, nombre: "Patio de comidas", x: 1026, y: 480, w: 42, h: 30 },
  { id: 55, nombre: "Patio de comidas", x: 768, y: 516, w: 44, h: 32 },
];
