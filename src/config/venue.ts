/**
 * Distribución del predio (mapa del evento). Coordenadas en el sistema del
 * `viewBox` del SVG (ver VenueMap), derivadas del plano oficial guardado en
 * `data-src/plano-predio.png`. Reordenar/mover un stand = editar acá.
 *
 * - `stands`: cajas de proveedores, clickeables → /stand/<id>. `nombre` es el
 *   rótulo corto del plano (para mostrar en el mapa; el nombre "oficial" vive
 *   en data-src/stands.csv).
 * - `patios`: "Patio de comidas" (52–55). Se dibujan como referencia, NO son
 *   clickeables (no son stands de productos).
 * - `zonas`: baños, oficina, barra, etc. Solo para orientarse.
 */

export const VENUE_VIEWBOX = { w: 1307, h: 641 } as const;

export interface VenueBox {
  id: number;
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export const VENUE_STANDS: VenueBox[] = [
  // Fila superior (1–17)
  { id: 1, nombre: "Vamma / Bioderma", x: 87, y: 16, w: 66, h: 54 },
  { id: 2, nombre: "Dorothy Gray", x: 158, y: 16, w: 66, h: 54 },
  { id: 3, nombre: "Dorothy Gray", x: 228, y: 16, w: 66, h: 54 },
  { id: 4, nombre: "Algabo", x: 299, y: 16, w: 66, h: 54 },
  { id: 5, nombre: "Parallel (Chicco-Avent)", x: 369, y: 16, w: 66, h: 54 },
  { id: 6, nombre: "Beauty Solutions / Disney", x: 440, y: 16, w: 66, h: 54 },
  { id: 7, nombre: "Bagó", x: 510, y: 16, w: 66, h: 54 },
  { id: 8, nombre: "Cuenca", x: 581, y: 16, w: 66, h: 54 },
  { id: 9, nombre: "Beauty Solutions / Oreiro", x: 651, y: 16, w: 66, h: 54 },
  { id: 10, nombre: "Loval", x: 722, y: 16, w: 66, h: 54 },
  { id: 11, nombre: "Combe", x: 792, y: 16, w: 66, h: 54 },
  { id: 12, nombre: "Caviahue", x: 863, y: 16, w: 66, h: 54 },
  { id: 13, nombre: "Johnson Family", x: 933, y: 16, w: 66, h: 54 },
  { id: 14, nombre: "Comimpar", x: 1004, y: 16, w: 66, h: 54 },
  { id: 15, nombre: "Active Cosmetic", x: 1074, y: 16, w: 66, h: 54 },
  { id: 16, nombre: "Ayudín", x: 1145, y: 16, w: 66, h: 54 },
  { id: 17, nombre: "Eurolab / Viasek", x: 1216, y: 16, w: 74, h: 54 },

  // Columna derecha (18–20)
  { id: 18, nombre: "Bernabó", x: 1243, y: 195, w: 58, h: 62 },
  { id: 19, nombre: "Laboratorios ENA", x: 1243, y: 262, w: 58, h: 62 },
  { id: 20, nombre: "Elea / Adermicin", x: 1243, y: 330, w: 58, h: 62 },

  // Fila 2 (50–42, de izquierda a derecha)
  { id: 50, nombre: "Andrómaco", x: 127, y: 100, w: 88, h: 98 },
  { id: 49, nombre: "Papelera", x: 247, y: 100, w: 88, h: 98 },
  { id: 48, nombre: "Johnson / Neutrogena", x: 367, y: 100, w: 88, h: 98 },
  { id: 47, nombre: "Nivea / Eucerin", x: 487, y: 100, w: 88, h: 98 },
  { id: 46, nombre: "Unilever Rexona", x: 607, y: 100, w: 88, h: 98 },
  { id: 45, nombre: "Loreal / Maquillajes", x: 728, y: 100, w: 88, h: 98 },
  { id: 44, nombre: "Essity", x: 855, y: 100, w: 82, h: 98 },
  { id: 43, nombre: "By Derm / Star", x: 965, y: 100, w: 88, h: 98 },
  { id: 42, nombre: "Colgate", x: 1092, y: 100, w: 98, h: 98 },

  // Fila 3 (33–41, de izquierda a derecha)
  { id: 33, nombre: "Cdimex", x: 127, y: 238, w: 88, h: 98 },
  { id: 34, nombre: "Nestlé", x: 247, y: 238, w: 88, h: 98 },
  { id: 35, nombre: "Procter", x: 367, y: 238, w: 88, h: 98 },
  { id: 36, nombre: "Unilever Limpieza / Ala", x: 487, y: 238, w: 88, h: 98 },
  { id: 37, nombre: "Unilever Capilar / Sedal", x: 607, y: 238, w: 88, h: 98 },
  { id: 38, nombre: "Biferdil", x: 728, y: 238, w: 88, h: 98 },
  { id: 39, nombre: "Kimberly", x: 855, y: 238, w: 82, h: 98 },
  { id: 40, nombre: "Cannon", x: 965, y: 238, w: 88, h: 98 },
  { id: 41, nombre: "Coty", x: 1092, y: 238, w: 98, h: 98 },

  // Stand 32 (izquierda)
  { id: 32, nombre: "BIC", x: 38, y: 300, w: 62, h: 64 },

  // Fila 4 (parte inferior)
  { id: 31, nombre: "Loreal / Dermo", x: 90, y: 378, w: 64, h: 54 },
  { id: 30, nombre: "Biosintex", x: 157, y: 378, w: 64, h: 54 },
  { id: 29, nombre: "Lancôme", x: 223, y: 378, w: 64, h: 54 },
  { id: 28, nombre: "ACF", x: 289, y: 378, w: 64, h: 54 },
  { id: 27, nombre: "Buhl", x: 458, y: 378, w: 64, h: 54 },
  { id: 26, nombre: "Ferrini / Max", x: 527, y: 378, w: 64, h: 54 },
  { id: 25, nombre: "Plumari / Estereocolor", x: 705, y: 378, w: 64, h: 54 },
  { id: 24, nombre: "SISCOM", x: 772, y: 378, w: 64, h: 54 },
  { id: 23, nombre: "Improm (Contigo / Nuk)", x: 950, y: 378, w: 64, h: 54 },
  { id: 22, nombre: "Genoma", x: 1020, y: 378, w: 64, h: 54 },
  { id: 21, nombre: "IDI", x: 1183, y: 378, w: 58, h: 54 },

  // Sueltos
  { id: 51, nombre: "Farmar", x: 712, y: 436, w: 96, h: 38 },
  { id: 56, nombre: "Facor", x: 378, y: 560, w: 80, h: 48 },
];

/** Patios de comida (52–55): referencia, no clickeables. */
export const VENUE_PATIOS: VenueBox[] = [
  { id: 52, nombre: "Patio de comidas", x: 950, y: 436, w: 64, h: 54 },
  { id: 53, nombre: "Patio de comidas", x: 1020, y: 436, w: 64, h: 54 },
  { id: 54, nombre: "Patio de comidas", x: 1183, y: 436, w: 58, h: 54 },
  { id: 55, nombre: "Patio de comidas", x: 853, y: 503, w: 70, h: 52 },
];

export interface VenueZone {
  nombre: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Texto vertical (para columnas angostas como BARRA o STREAMING). */
  vertical?: boolean;
}

/** Zonas de servicio: solo para orientarse (no clickeables). */
export const VENUE_ZONES: VenueZone[] = [
  { nombre: "BARRA", x: 28, y: 210, w: 32, h: 100, vertical: true },
  { nombre: "BAÑOS", x: 25, y: 485, w: 132, h: 115 },
  { nombre: "OFICINA", x: 163, y: 485, w: 112, h: 115 },
  { nombre: "STREAMING", x: 283, y: 440, w: 42, h: 135, vertical: true },
  { nombre: "FOTOS", x: 458, y: 428, w: 152, h: 64 },
];

/** Accesos (entradas / salida): rótulos de referencia. */
export const VENUE_ACCESS: { nombre: string; x: number; y: number }[] = [
  { nombre: "SALIDA", x: 410, y: 366 },
  { nombre: "ENTRADA", x: 410, y: 478 },
  { nombre: "ENTRADA", x: 650, y: 478 },
  { nombre: "ENTRADA", x: 890, y: 478 },
];
