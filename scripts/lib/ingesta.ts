/**
 * Núcleo de la ingesta: validación y transformación de filas crudas de Excel
 * a los JSON que consume la app. Lógica pura (sin I/O) para poder testearla.
 */
import { createHash } from "crypto";
import type {
  DataManifest,
  IndexEntry,
  Product,
  Stand,
  StandData,
} from "../../src/lib/types";

// ---------- Tipos de entrada/salida ----------

/** Celdas crudas de una fila de productos, tal como salen del Excel/planilla. */
export interface FilaCruda {
  /** Número de fila en el Excel (para reportar errores) */
  fila: number;
  codigo?: unknown;
  descripcion?: unknown;
  precio?: unknown;
  stand?: unknown;
  foto?: unknown;
  stock?: unknown;
  precioAnterior?: unknown;
  oferta?: unknown;
  /** CUIT del proveedor (formato POSBerry): resuelve el stand vía cuitToStand. */
  cuit?: unknown;
  /**
   * Nombre de la familia de POSBerry (columna "Familia"): p. ej. "40%", "2X1",
   * "2DO70%". El precio de la fila es SIEMPRE el precio regular; la mecánica
   * (porcentaje, 2x1, 2do al N%) sale de la tabla de familias (ver
   * `procesarFamilias`), no de este campo.
   */
  familia?: unknown;
}

/** Config opcional del procesamiento de productos. */
export interface OpcionesProductos {
  /**
   * Base para fotos que vengan como nombre de archivo suelto (sin http ni "/").
   * Ej: base "https://cdn.farmafest/img/" + celda "ibu.jpg" → URL completa.
   */
  imageBase?: string;
  /**
   * Resolución de foto por código de barras: si la celda Foto está vacía, se
   * consulta acá con el código. Devuelve la URL/ruta de la imagen o undefined.
   * Lo arma la ingesta escaneando public/img/productos/<codigo>.<ext>.
   */
  fotoPorCodigo?: (codigo: string) => string | undefined;
  /**
   * Mapa CUIT normalizado → nº de stand (formato POSBerry). Si está presente,
   * el stand de cada producto se resuelve por su CUIT (no por columna Stand).
   * Si un CUIT quedó asociado a varios stands, gana el de número menor
   * (ver procesarStands).
   */
  cuitToStand?: Map<string, number>;
  /**
   * Tabla de familias (formato POSBerry): nombre de familia normalizado → regla
   * de oferta. Define cómo se calcula el precio mostrado a partir del precio
   * regular de la fila (ver `procesarFamilias` y `aplicarFamilia`).
   */
  familias?: Map<string, ReglaFamilia>;
}

export interface FilaCrudaStand {
  fila: number;
  stand?: unknown;
  proveedor?: unknown;
  /** CUIT del proveedor (opcional; habilita el match por CUIT en productos). */
  cuit?: unknown;
}

export interface Problema {
  fila: number;
  motivo: string;
  /** dato que ayuda a ubicar la fila en el Excel */
  contexto?: string;
}

export interface ResultadoIngesta {
  productos: Product[];
  stands: Stand[];
  /** filas descartadas */
  errores: Problema[];
  /** filas aceptadas con observaciones */
  advertencias: Problema[];
}

// ---------- Helpers de parseo ----------

/** Convierte una celda a string limpio ("" si viene vacía). */
function celdaTexto(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "object") {
    // exceljs puede devolver rich text / hyperlinks / fórmulas
    const o = v as { text?: unknown; result?: unknown; richText?: { text: string }[] };
    if (Array.isArray(o.richText)) return o.richText.map((r) => r.text).join("").trim();
    if (o.text !== undefined) return String(o.text).trim();
    if (o.result !== undefined) return String(o.result).trim();
    return "";
  }
  return String(v).trim();
}

/**
 * Parsea un precio que puede venir como número o como texto en formato
 * argentino ("1.234,50"), con o sin "$". Devuelve NaN si no se entiende.
 */
export function parsearPrecio(v: unknown): number {
  if (typeof v === "number") return v;
  let s = celdaTexto(v);
  if (!s) return NaN;
  s = s.replace(/\$/g, "").replace(/\s/g, "");
  const tienePunto = s.includes(".");
  const tieneComa = s.includes(",");
  if (tienePunto && tieneComa) {
    // el separador que aparece último es el decimal
    if (s.lastIndexOf(",") > s.lastIndexOf(".")) {
      s = s.replace(/\./g, "").replace(",", ".");
    } else {
      s = s.replace(/,/g, "");
    }
  } else if (tieneComa) {
    s = s.replace(",", ".");
  } else if (tienePunto) {
    // "1.234" (exactamente 3 dígitos tras un único punto) → separador de miles
    if (/^\d{1,3}\.\d{3}$/.test(s)) s = s.replace(".", "");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

/** Valida el dígito verificador de un EAN-13. */
export function ean13Valido(codigo: string): boolean {
  if (!/^\d{13}$/.test(codigo)) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(codigo[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10 === Number(codigo[12]);
}

function parsearEnteroPositivo(v: unknown): number | null {
  const n = typeof v === "number" ? v : Number(celdaTexto(v));
  if (!Number.isInteger(n) || n < 0) return null;
  return n;
}

/** Deja solo los dígitos de un CUIT ("20-11111112-5" → "20111111125"). */
export function normalizarCuit(v: unknown): string {
  return celdaTexto(v).replace(/\D/g, "");
}

/**
 * Convierte un valor de descuento a fracción (0,1). Acepta "0.4", "0,4", "40"
 * y "40%". Convención: un valor en (0,1) ya es fracción; ≥1 y <100 se toma como
 * porcentaje (40 → 0,40). Devuelve null si no es un descuento válido o viene
 * vacío (a diferencia del precio, acá "sin valor" no es 0 sino "no aplica").
 */
export function aFraccion(v: unknown): number | null {
  const s = celdaTexto(v).replace(/%/g, "");
  if (!s) return null;
  const n = parsearPrecio(s); // reusa el parseo de coma/punto decimal
  if (!Number.isFinite(n) || n <= 0) return null;
  const frac = n < 1 ? n : n / 100;
  if (frac <= 0 || frac >= 1) return null;
  return frac;
}

// ---------- Familias (mecánica de oferta, formato POSBerry) ----------

/**
 * Tipo de mecánica de una familia de POSBerry:
 *  - PORCENTAJE: N% off → precio = regular × (1 − valor), con precio regular tachado.
 *  - 2X1:        precio = regular ÷ 2 (por unidad, "c/u"), con regular tachado.
 *  - SEGUNDO:    "2do al N%" → NO cambia el precio ni tacha; solo badge informativo.
 *  - NINGUNA:    sin oferta.
 */
export type TipoFamilia = "PORCENTAJE" | "2X1" | "SEGUNDO" | "NINGUNA";

/** Regla de oferta de una familia, ya interpretada. */
export interface ReglaFamilia {
  /** Nombre de familia normalizado (clave de búsqueda). */
  familia: string;
  tipo: TipoFamilia;
  /** Fracción de descuento (0,1): obligatoria en PORCENTAJE; informativa en SEGUNDO. */
  valor?: number;
  /** Texto del badge a mostrar (si no viene, se deriva del tipo). */
  etiqueta?: string;
}

/** Fila cruda de la tabla de familias (CSV/planilla de config). */
export interface FilaCrudaFamilia {
  fila: number;
  familia?: unknown;
  /** Tipo explícito (PORCENTAJE / 2X1 / SEGUNDO / NINGUNA). Si falta, se infiere del nombre. */
  tipo?: unknown;
  /** Valor del descuento (0.40, 40, 40%). Si falta, se infiere del nombre cuando se puede. */
  valor?: unknown;
  /** Etiqueta/badge opcional. */
  etiqueta?: unknown;
}

/** Normaliza el nombre de una familia para matchear ("2do 70%" → "2DO70%"). */
export function normalizarFamilia(v: unknown): string {
  return celdaTexto(v).toUpperCase().replace(/\s+/g, "");
}

/** Deriva la etiqueta de un "2do al N%" a partir de la fracción. */
function etiquetaSegundo(frac: number | null | undefined): string {
  return frac ? `2do al ${Math.round(frac * 100)}%` : "2da unidad";
}

/**
 * Intenta clasificar una familia por su NOMBRE (fallback cuando no hay columna
 * Tipo). Reconoce "N%", "2X1" y "2do al N%". Devuelve null si no puede.
 */
function inferirDesdeNombre(nombre: string, etiqueta?: string): ReglaFamilia | null {
  const key = normalizarFamilia(nombre);
  const s = nombre.trim();
  if (/2\s*d[oa]/i.test(s)) {
    const m = s.match(/(\d+(?:[.,]\d+)?)\s*%/);
    const frac = m ? aFraccion(m[1]) : null;
    return { familia: key, tipo: "SEGUNDO", valor: frac ?? undefined, etiqueta: etiqueta ?? etiquetaSegundo(frac) };
  }
  if (/^2\s*[x×]\s*1$/i.test(s)) {
    return { familia: key, tipo: "2X1", etiqueta: etiqueta ?? "2x1" };
  }
  const mPct = s.match(/^(\d+(?:[.,]\d+)?)\s*%$/);
  if (mPct) {
    const frac = aFraccion(mPct[1]);
    if (frac) return { familia: key, tipo: "PORCENTAJE", valor: frac, etiqueta };
  }
  return null;
}

/**
 * Clasifica una familia usando la columna Tipo si viene; si no, infiere del
 * nombre. Devuelve null si no se puede determinar (familia inválida).
 */
function clasificarFamilia(
  nombre: string,
  tipoRaw: string,
  valorRaw: string,
  etiqueta?: string
): ReglaFamilia | null {
  const key = normalizarFamilia(nombre);
  const valor = valorRaw ? aFraccion(valorRaw) : null;
  const t = tipoRaw.toUpperCase().normalize("NFKD").replace(/[^A-Z0-9]/g, "");

  if (["PORCENTAJE", "PCT", "DESCUENTO", "PORCIENTO", "OFF"].includes(t)) {
    return { familia: key, tipo: "PORCENTAJE", valor: valor ?? inferirDesdeNombre(nombre)?.valor, etiqueta };
  }
  if (["2X1", "DOSPORUNO"].includes(t)) {
    return { familia: key, tipo: "2X1", etiqueta: etiqueta ?? "2x1" };
  }
  if (["SEGUNDO", "2DO", "SEGUNDAUNIDAD", "2DAUNIDAD", "2DA"].includes(t)) {
    return { familia: key, tipo: "SEGUNDO", valor: valor ?? inferirDesdeNombre(nombre)?.valor, etiqueta: etiqueta ?? etiquetaSegundo(valor ?? inferirDesdeNombre(nombre)?.valor) };
  }
  if (["NINGUNA", "SIN", "NONE", "NO"].includes(t)) {
    return { familia: key, tipo: "NINGUNA" };
  }
  // Sin tipo (o tipo no reconocido): inferir del nombre.
  return inferirDesdeNombre(nombre, etiqueta);
}

/**
 * Procesa la tabla de familias a un mapa nombre-normalizado → regla. Las filas
 * que no se pueden clasificar quedan como errores (no frenan la publicación: el
 * producto que use esa familia se publica sin oferta, con advertencia).
 */
export function procesarFamilias(filas: FilaCrudaFamilia[]): {
  familias: Map<string, ReglaFamilia>;
  errores: Problema[];
} {
  const familias = new Map<string, ReglaFamilia>();
  const errores: Problema[] = [];
  for (const f of filas) {
    const nombre = celdaTexto(f.familia);
    if (!nombre) continue; // fila vacía
    const regla = clasificarFamilia(
      nombre,
      celdaTexto(f.tipo),
      celdaTexto(f.valor),
      celdaTexto(f.etiqueta) || undefined
    );
    if (!regla) {
      errores.push({
        fila: f.fila,
        motivo: `familia «${nombre}»: no se pudo determinar la mecánica (completá la columna Tipo)`,
      });
      continue;
    }
    if (regla.tipo === "PORCENTAJE" && !regla.valor) {
      errores.push({ fila: f.fila, motivo: `familia «${nombre}» de tipo PORCENTAJE sin % de descuento` });
      continue;
    }
    familias.set(regla.familia, regla);
  }
  return { familias, errores };
}

/**
 * Aplica la regla de familia a un producto ya validado. El `producto.precio`
 * entra como precio REGULAR y sale ajustado según la mecánica.
 */
function aplicarFamilia(
  producto: Product,
  regla: ReglaFamilia,
  fila: number,
  contexto: string,
  advertencias: Problema[]
): void {
  switch (regla.tipo) {
    case "PORCENTAJE": {
      if (!regla.valor) {
        advertencias.push({ fila, motivo: `familia «${regla.familia}» sin % de descuento; se ignora`, contexto });
        return;
      }
      producto.precioAnterior = producto.precio;
      producto.precio = Math.round(producto.precio * (1 - regla.valor) * 100) / 100;
      // El badge "-N%" lo calcula la UI desde precioAnterior; si hay etiqueta, la usa.
      if (regla.etiqueta) producto.oferta = regla.etiqueta;
      return;
    }
    case "2X1": {
      producto.precioAnterior = producto.precio;
      producto.precio = Math.round((producto.precio / 2) * 100) / 100;
      producto.oferta = regla.etiqueta ?? "2x1";
      return;
    }
    case "SEGUNDO": {
      // No cambia el precio ni tacha: solo muestra la mecánica como badge.
      producto.oferta = regla.etiqueta ?? etiquetaSegundo(regla.valor);
      return;
    }
    case "NINGUNA":
    default:
      return;
  }
}

// ---------- Procesamiento de stands ----------

export function procesarStands(filas: FilaCrudaStand[]): {
  stands: Stand[];
  errores: Problema[];
  /** CUIT normalizado → nº de stand (menor, si un CUIT figura en varios). */
  cuitToStand: Map<string, number>;
} {
  const stands: Stand[] = [];
  const errores: Problema[] = [];
  const cuitToStand = new Map<string, number>();
  const vistos = new Map<number, number>(); // id → fila

  for (const f of filas) {
    const proveedor = celdaTexto(f.proveedor);
    const idRaw = celdaTexto(f.stand);
    if (!idRaw && !proveedor) continue; // fila vacía: se ignora en silencio

    // El stand 0 es válido (acordado con un proveedor). OJO: `Number("")` es 0,
    // así que una celda VACÍA no debe caer en stand 0 → se chequea el texto.
    if (idRaw === "") {
      errores.push({
        fila: f.fila,
        motivo: `falta el número de stand`,
        contexto: proveedor,
      });
      continue;
    }
    const id = Number(idRaw);
    if (!Number.isInteger(id) || id < 0) {
      errores.push({
        fila: f.fila,
        motivo: `número de stand inválido «${idRaw}»`,
        contexto: proveedor,
      });
      continue;
    }
    if (!proveedor) {
      errores.push({ fila: f.fila, motivo: `stand ${id} sin nombre de proveedor` });
      continue;
    }
    const filaPrevia = vistos.get(id);
    if (filaPrevia !== undefined) {
      errores.push({
        fila: f.fila,
        motivo: `stand ${id} duplicado (ya definido en fila ${filaPrevia})`,
        contexto: proveedor,
      });
      continue;
    }
    vistos.set(id, f.fila);
    stands.push({ id, proveedor });

    // Mapa CUIT→stand: si un CUIT aparece en más de un stand, gana el menor.
    const cuit = normalizarCuit(f.cuit);
    if (cuit) {
      const prev = cuitToStand.get(cuit);
      if (prev === undefined || id < prev) cuitToStand.set(cuit, id);
    }
  }
  stands.sort((a, b) => a.id - b.id);
  return { stands, errores, cuitToStand };
}

// ---------- Procesamiento de productos ----------

export function procesarProductos(
  filas: FilaCruda[],
  stands: Stand[],
  opciones: OpcionesProductos = {}
): ResultadoIngesta {
  const standIds = new Set(stands.map((s) => s.id));
  const imageBase = (opciones.imageBase ?? "").trim().replace(/\/+$/, "");
  const productos: Product[] = [];
  const errores: Problema[] = [];
  const advertencias: Problema[] = [];
  const codigosVistos = new Map<string, number>(); // código → fila

  for (const f of filas) {
    const codigo = celdaTexto(f.codigo);
    const descripcion = celdaTexto(f.descripcion);
    const standRaw = celdaTexto(f.stand);

    // fila completamente vacía → ignorar en silencio
    if (!codigo && !descripcion && !standRaw && celdaTexto(f.precio) === "") {
      continue;
    }

    if (!codigo) {
      errores.push({ fila: f.fila, motivo: "falta el código de barras", contexto: descripcion });
      continue;
    }
    if (!/^\d{6,14}$/.test(codigo)) {
      errores.push({
        fila: f.fila,
        motivo: `código de barras inválido «${codigo}» (se esperan 6 a 14 dígitos)`,
        contexto: descripcion,
      });
      continue;
    }
    const filaPrevia = codigosVistos.get(codigo);
    if (filaPrevia !== undefined) {
      errores.push({
        fila: f.fila,
        motivo: `código ${codigo} duplicado (ya usado en fila ${filaPrevia}); fila descartada`,
        contexto: descripcion,
      });
      continue;
    }
    if (!descripcion) {
      errores.push({ fila: f.fila, motivo: `producto ${codigo} sin descripción` });
      continue;
    }
    const precio = parsearPrecio(f.precio);
    if (!Number.isFinite(precio) || precio <= 0) {
      errores.push({
        fila: f.fila,
        motivo: `precio inválido «${celdaTexto(f.precio)}»`,
        contexto: descripcion,
      });
      continue;
    }
    // Stand: por CUIT (formato POSBerry) o por columna Stand (formato propio).
    let standId: number;
    if (opciones.cuitToStand) {
      const cuit = normalizarCuit(f.cuit);
      if (!cuit) {
        errores.push({ fila: f.fila, motivo: `producto ${codigo} sin CUIT`, contexto: descripcion });
        continue;
      }
      const sid = opciones.cuitToStand.get(cuit);
      if (sid === undefined) {
        errores.push({
          fila: f.fila,
          motivo: `CUIT ${cuit} sin stand asignado (no figura en la tabla de stands)`,
          contexto: descripcion,
        });
        continue;
      }
      standId = sid;
    } else {
      // Celda Stand vacía: NO debe caer en el stand 0 (`Number("")` es 0).
      if (standRaw === "") {
        errores.push({ fila: f.fila, motivo: `producto ${codigo} sin stand`, contexto: descripcion });
        continue;
      }
      standId = Number(standRaw);
      if (!Number.isInteger(standId) || !standIds.has(standId)) {
        errores.push({
          fila: f.fila,
          motivo: `stand «${standRaw}» inexistente (no figura en la tabla de stands)`,
          contexto: descripcion,
        });
        continue;
      }
    }

    const producto: Product = {
      codigo,
      descripcion,
      precio: Math.round(precio * 100) / 100,
      stand: standId,
    };

    // Oferta por familia (formato POSBerry): el precio de la fila es el REGULAR;
    // la mecánica (porcentaje, 2x1, 2do al N%) sale de la tabla de familias.
    const nombreFamilia = celdaTexto(f.familia);
    if (nombreFamilia !== "" && opciones.familias) {
      const regla = opciones.familias.get(normalizarFamilia(nombreFamilia));
      if (!regla) {
        advertencias.push({
          fila: f.fila,
          motivo: `familia «${nombreFamilia}» no está en la tabla de familias; se publica sin oferta`,
          contexto: descripcion,
        });
      } else {
        aplicarFamilia(producto, regla, f.fila, descripcion, advertencias);
      }
    }

    // EAN-13 con checksum incorrecto: se acepta (puede ser código interno),
    // pero se avisa por si es un error de tipeo.
    if (codigo.length === 13 && !ean13Valido(codigo)) {
      advertencias.push({
        fila: f.fila,
        motivo: `el código ${codigo} no verifica como EAN-13 (¿error de tipeo?); se acepta igual`,
        contexto: descripcion,
      });
    }

    const foto = celdaTexto(f.foto);
    if (foto) {
      // La celda Foto (si viene) siempre gana: permite excepciones y URLs.
      if (/^(https?:\/\/|\/)[^\s]+$/i.test(foto)) {
        producto.foto = foto;
      } else if (imageBase && !/\s/.test(foto)) {
        // nombre de archivo suelto (ej "ibu.jpg") + base configurada
        producto.foto = `${imageBase}/${foto.replace(/^\/+/, "")}`;
      } else {
        advertencias.push({
          fila: f.fila,
          motivo: imageBase
            ? `foto «${foto}» inválida (ni URL ni nombre de archivo); se ignora`
            : `foto «${foto}» no parece una URL válida; se ignora`,
          contexto: descripcion,
        });
      }
    } else if (opciones.fotoPorCodigo) {
      // Sin celda Foto: se busca la imagen nombrada con el código de barras.
      const auto = opciones.fotoPorCodigo(codigo);
      if (auto) producto.foto = auto;
    }

    // Precio anterior (para mostrar el ahorro): solo si es mayor al vigente.
    if (celdaTexto(f.precioAnterior) !== "") {
      const anterior = parsearPrecio(f.precioAnterior);
      if (!Number.isFinite(anterior) || anterior <= 0) {
        advertencias.push({
          fila: f.fila,
          motivo: `precio anterior «${celdaTexto(f.precioAnterior)}» inválido; se ignora`,
          contexto: descripcion,
        });
      } else if (anterior <= producto.precio) {
        advertencias.push({
          fila: f.fila,
          motivo: `precio anterior (${anterior}) no es mayor al precio (${producto.precio}); se ignora`,
          contexto: descripcion,
        });
      } else {
        producto.precioAnterior = Math.round(anterior * 100) / 100;
      }
    }

    // Etiqueta de oferta libre ("2x1", "Combo", "Lanzamiento"…).
    const oferta = celdaTexto(f.oferta);
    if (oferta) {
      producto.oferta = oferta.length > 24 ? oferta.slice(0, 24).trim() : oferta;
    }

    if (celdaTexto(f.stock) !== "") {
      const stock = parsearEnteroPositivo(f.stock);
      if (stock === null) {
        advertencias.push({
          fila: f.fila,
          motivo: `stock «${celdaTexto(f.stock)}» inválido; se ignora`,
          contexto: descripcion,
        });
      } else {
        producto.stock = stock;
      }
    }

    codigosVistos.set(codigo, f.fila);
    productos.push(producto);
  }

  return { productos, stands, errores, advertencias };
}

// ---------- Generación de salidas ----------

export interface SalidaIngesta {
  manifest: DataManifest;
  standsJson: Stand[];
  standFiles: Map<number, StandData>;
  indexJson: { version: string; entries: IndexEntry[] };
}

export function generarSalidas(
  productos: Product[],
  stands: Stand[],
  ahora: Date = new Date()
): SalidaIngesta {
  const porStand = new Map<number, Product[]>();
  for (const s of stands) porStand.set(s.id, []);
  for (const p of productos) porStand.get(p.stand)?.push(p);

  const generatedAt = ahora.toISOString();
  const version = createHash("sha1")
    .update(JSON.stringify(productos))
    .update(JSON.stringify(stands))
    .digest("hex")
    .slice(0, 10);

  const standsJson: Stand[] = stands.map((s) => ({
    ...s,
    productos: porStand.get(s.id)?.length ?? 0,
  }));

  const standFiles = new Map<number, StandData>();
  for (const s of stands) {
    const prods = (porStand.get(s.id) ?? []).slice();
    prods.sort((a, b) => a.descripcion.localeCompare(b.descripcion, "es"));
    standFiles.set(s.id, {
      id: s.id,
      proveedor: s.proveedor,
      actualizado: generatedAt,
      productos: prods,
    });
  }

  // Índice compacto: las filas en oferta agregan precio anterior + etiqueta
  // (largo 6); el resto queda en largo 4 para no inflar el índice global.
  const entries: IndexEntry[] = productos.map((p) =>
    p.precioAnterior !== undefined || p.oferta !== undefined
      ? [p.codigo, p.descripcion, p.precio, p.stand, p.precioAnterior ?? 0, p.oferta ?? ""]
      : [p.codigo, p.descripcion, p.precio, p.stand]
  );

  return {
    manifest: {
      version,
      generatedAt,
      stands: stands.length,
      productos: productos.length,
    },
    standsJson,
    standFiles,
    indexJson: { version, entries },
  };
}

// ---------- Mapeo de columnas por encabezado ----------

/** Normaliza un encabezado para matchear variantes. */
function normalizarHeader(h: string): string {
  return h
    .toLowerCase()
    // NFKD separa acentos en marcas combinantes y descompone símbolos de
    // compatibilidad ("º" → "o"); todo lo que no sea [a-z0-9] se elimina.
    .normalize("NFKD")
    .replace(/[^a-z0-9]/g, "");
}

const ALIAS_PRODUCTOS: Record<string, readonly string[]> = {
  codigo: ["codigodebarras", "codigobarras", "codigo", "ean", "codbarras", "barcode"],
  descripcion: ["descripcion", "producto", "detalle", "nombre"],
  precio: ["precio", "precioventa", "pvp", "importe"],
  stand: ["stand", "numerodestand", "nrostand", "numstand", "nrodestand", "nodestand", "ndestand"],
  foto: ["foto", "imagen", "urlfoto", "img"],
  stock: ["stock", "cantidad", "unidades"],
  precioAnterior: [
    "precioanterior",
    "preciolista",
    "preciolistas",
    "precioviejo",
    "precioregular",
    "antes",
    "listprice",
  ],
  oferta: ["oferta", "promo", "promocion", "etiqueta", "descuento", "combo"],
};

const ALIAS_STANDS: Record<string, readonly string[]> = {
  stand: ["stand", "numerodestand", "nrostand", "numstand", "numero", "nro"],
  proveedor: ["proveedor", "nombre", "razonsocial", "empresa"],
  cuit: ["cuit", "cuitproveedor", "cuitprov"],
};

/**
 * Alias para el formato de importación de POSBerry. Diferencias clave con el
 * formato propio: el código de barras es "Codigo de Barras" (NO "*Codigo", que
 * es el código interno), el precio es "Precio de Venta", el descuento viene en
 * "Familia" (campo reutilizado) y el stand se resuelve por "CUIT Proveedor".
 */
const ALIAS_PRODUCTOS_POSBERRY: Record<string, readonly string[]> = {
  codigo: ["codigodebarras", "codigobarras", "codigodebarras1"],
  descripcion: ["descripcion", "producto", "detalle", "nombre"],
  precio: ["preciodeventa", "precioventa", "pvp"],
  cuit: ["cuitproveedor", "cuit", "cuitprov"],
  familia: ["familia"],
  foto: ["urldelaimagen", "urlimagen", "foto", "imagen"],
};

/**
 * Alias para la tabla de familias (config de ofertas). Solo `familia` es
 * obligatoria; `tipo`/`valor`/`etiqueta` son opcionales (se infieren del nombre
 * cuando se puede).
 */
const ALIAS_FAMILIAS: Record<string, readonly string[]> = {
  familia: ["familia", "nombre", "nombrefamilia"],
  tipo: ["tipo", "mecanica", "clase"],
  valor: ["valor", "descuento", "porcentaje", "pct", "porciento"],
  etiqueta: ["etiqueta", "label", "texto", "badge"],
};

export function mapearColumnas(
  headers: string[],
  alias: Record<string, readonly string[]>,
  requeridos?: readonly string[]
): { mapa: Map<string, number>; faltantes: string[] } {
  const mapa = new Map<string, number>();
  headers.forEach((h, idx) => {
    const n = normalizarHeader(h);
    if (!n) return;
    for (const [campo, variantes] of Object.entries(alias)) {
      if (!mapa.has(campo) && variantes.includes(n)) {
        mapa.set(campo, idx);
      }
    }
  });
  const req =
    requeridos ??
    (alias === ALIAS_STANDS
      ? ["stand", "proveedor"]
      : alias === ALIAS_PRODUCTOS_POSBERRY
        ? ["codigo", "descripcion", "precio", "cuit"]
        : ["codigo", "descripcion", "precio", "stand"]);
  const faltantes = req.filter((c) => !mapa.has(c));
  return { mapa, faltantes };
}

/** ¿Los encabezados corresponden al formato de POSBerry? (tienen CUIT). */
export function esFormatoPosberry(headers: string[]): boolean {
  const set = new Set(headers.map(normalizarHeader));
  const tieneCuit = set.has("cuitproveedor") || set.has("cuit");
  const tieneVenta = set.has("preciodeventa");
  const tieneEan = set.has("codigodebarras") || set.has("codigobarras");
  return tieneCuit && (tieneVenta || tieneEan);
}

export { ALIAS_PRODUCTOS, ALIAS_STANDS, ALIAS_PRODUCTOS_POSBERRY, ALIAS_FAMILIAS };
