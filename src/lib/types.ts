/** Producto tal como viaja en los JSON de datos. */
export interface Product {
  /** Código de barras (string para preservar ceros a la izquierda) */
  codigo: string;
  descripcion: string;
  /** Precio (de evento / vigente) en pesos argentinos */
  precio: number;
  /** Número de stand al que pertenece */
  stand: number;
  /** URL o ruta de la foto. Opcional por diseño. */
  foto?: string;
  /** Stock disponible. Opcional por diseño: si no viene, se ignora. */
  stock?: number;
  /**
   * Precio anterior / de lista, para mostrar el ahorro (tachado). Opcional:
   * solo se guarda si es mayor que `precio`. Habilita el badge "-X%".
   */
  precioAnterior?: number;
  /**
   * Etiqueta de oferta libre ("2x1", "Lanzamiento", "Combo"…). Opcional.
   * Si no viene pero hay `precioAnterior`, el UI muestra el descuento "-X%".
   */
  oferta?: string;
}

/** Stand / proveedor. */
export interface Stand {
  id: number;
  proveedor: string;
  /** Cantidad de productos (solo en stands.json, informativo) */
  productos?: number;
}

/** Datos completos de un stand (public/data/stand/<id>.json). */
export interface StandData {
  id: number;
  proveedor: string;
  actualizado: string;
  productos: Product[];
}

/**
 * Entrada del índice global de búsqueda (formato compacto para achicar el JSON).
 * Largo variable: la mayoría de las filas son de 4 elementos; las que están en
 * oferta agregan precio anterior y etiqueta, para no inflar el índice entero.
 *   [codigo, descripcion, precio, standId]
 *   [codigo, descripcion, precio, standId, precioAnterior, oferta]
 */
export type IndexEntry =
  | [string, string, number, number]
  | [string, string, number, number, number, string];

/** Índice global (public/data/index.json). */
export interface SearchIndexFile {
  version: string;
  entries: IndexEntry[];
}

/** Manifest de datos (public/data/manifest.json). */
export interface DataManifest {
  version: string;
  generatedAt: string;
  stands: number;
  productos: number;
}
