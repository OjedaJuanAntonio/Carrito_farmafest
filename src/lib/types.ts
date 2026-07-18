/** Producto tal como viaja en los JSON de datos. */
export interface Product {
  /** Código de barras (string para preservar ceros a la izquierda) */
  codigo: string;
  descripcion: string;
  /** Precio en pesos argentinos */
  precio: number;
  /** Número de stand al que pertenece */
  stand: number;
  /** URL o ruta de la foto. Opcional por diseño. */
  foto?: string;
  /** Stock disponible. Opcional por diseño: si no viene, se ignora. */
  stock?: number;
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
 * Entrada del índice global de búsqueda (formato compacto para achicar el JSON):
 * [codigo, descripcion, precio, standId]
 */
export type IndexEntry = [string, string, number, number];

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
