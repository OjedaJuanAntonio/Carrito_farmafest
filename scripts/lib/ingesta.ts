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

/** Celdas crudas de una fila de productos, tal como salen del Excel. */
export interface FilaCruda {
  /** Número de fila en el Excel (para reportar errores) */
  fila: number;
  codigo?: unknown;
  descripcion?: unknown;
  precio?: unknown;
  stand?: unknown;
  foto?: unknown;
  stock?: unknown;
}

export interface FilaCrudaStand {
  fila: number;
  stand?: unknown;
  proveedor?: unknown;
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

// ---------- Procesamiento de stands ----------

export function procesarStands(filas: FilaCrudaStand[]): {
  stands: Stand[];
  errores: Problema[];
} {
  const stands: Stand[] = [];
  const errores: Problema[] = [];
  const vistos = new Map<number, number>(); // id → fila

  for (const f of filas) {
    const proveedor = celdaTexto(f.proveedor);
    const idRaw = celdaTexto(f.stand);
    if (!idRaw && !proveedor) continue; // fila vacía: se ignora en silencio

    const id = Number(idRaw);
    if (!Number.isInteger(id) || id <= 0) {
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
  }
  stands.sort((a, b) => a.id - b.id);
  return { stands, errores };
}

// ---------- Procesamiento de productos ----------

export function procesarProductos(
  filas: FilaCruda[],
  stands: Stand[]
): ResultadoIngesta {
  const standIds = new Set(stands.map((s) => s.id));
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
    const standId = Number(standRaw);
    if (!Number.isInteger(standId) || !standIds.has(standId)) {
      errores.push({
        fila: f.fila,
        motivo: `stand «${standRaw}» inexistente (no figura en la tabla de stands)`,
        contexto: descripcion,
      });
      continue;
    }

    const producto: Product = {
      codigo,
      descripcion,
      precio: Math.round(precio * 100) / 100,
      stand: standId,
    };

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
      if (/^(https?:\/\/|\/)[^\s]+$/i.test(foto)) {
        producto.foto = foto;
      } else {
        advertencias.push({
          fila: f.fila,
          motivo: `foto «${foto}» no parece una URL válida; se ignora`,
          contexto: descripcion,
        });
      }
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

  const entries: IndexEntry[] = productos.map((p) => [
    p.codigo,
    p.descripcion,
    p.precio,
    p.stand,
  ]);

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
};

const ALIAS_STANDS: Record<string, readonly string[]> = {
  stand: ["stand", "numerodestand", "nrostand", "numstand", "numero", "nro"],
  proveedor: ["proveedor", "nombre", "razonsocial", "empresa"],
};

export function mapearColumnas(
  headers: string[],
  alias: Record<string, readonly string[]>
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
  const requeridos =
    alias === ALIAS_STANDS ? ["stand", "proveedor"] : ["codigo", "descripcion", "precio", "stand"];
  const faltantes = requeridos.filter((c) => !mapa.has(c));
  return { mapa, faltantes };
}

export { ALIAS_PRODUCTOS, ALIAS_STANDS };
