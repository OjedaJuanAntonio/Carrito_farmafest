import { describe, expect, it } from "vitest";
import {
  ALIAS_PRODUCTOS,
  ALIAS_STANDS,
  ean13Valido,
  generarSalidas,
  mapearColumnas,
  parsearPrecio,
  procesarProductos,
  procesarStands,
  type FilaCruda,
} from "../scripts/lib/ingesta";
import type { Stand } from "../src/lib/types";

const STANDS: Stand[] = [
  { id: 1, proveedor: "Laboratorios Andino" },
  { id: 2, proveedor: "Droguería del Centro" },
];

function fila(over: Partial<FilaCruda>, n = 2): FilaCruda {
  return {
    fila: n,
    codigo: "7791234567898",
    descripcion: "Ibuprofeno 400mg x10",
    precio: 3500,
    stand: 1,
    ...over,
  };
}

describe("parsearPrecio", () => {
  it("acepta números", () => {
    expect(parsearPrecio(1234.5)).toBe(1234.5);
  });
  it("acepta formato argentino con $ y miles", () => {
    expect(parsearPrecio("$ 1.234,50")).toBe(1234.5);
    expect(parsearPrecio("1.234")).toBe(1234);
    expect(parsearPrecio("12,50")).toBe(12.5);
  });
  it("acepta formato con punto decimal", () => {
    expect(parsearPrecio("1234.56")).toBe(1234.56);
    expect(parsearPrecio("1,234.56")).toBe(1234.56);
  });
  it("rechaza basura", () => {
    expect(parsearPrecio("abc")).toBeNaN();
    expect(parsearPrecio("")).toBeNaN();
    expect(parsearPrecio(undefined)).toBeNaN();
  });
});

describe("ean13Valido", () => {
  it("valida el dígito verificador", () => {
    expect(ean13Valido("7791000000017")).toBe(true);
    expect(ean13Valido("7791000000018")).toBe(false);
    expect(ean13Valido("123")).toBe(false);
  });
});

describe("procesarStands", () => {
  it("acepta stands válidos y ordena por id", () => {
    const { stands, errores } = procesarStands([
      { fila: 3, stand: 2, proveedor: "B" },
      { fila: 2, stand: 1, proveedor: "A" },
    ]);
    expect(errores).toHaveLength(0);
    expect(stands.map((s) => s.id)).toEqual([1, 2]);
  });

  it("descarta duplicados, ids inválidos y sin proveedor", () => {
    const { stands, errores } = procesarStands([
      { fila: 2, stand: 1, proveedor: "A" },
      { fila: 3, stand: 1, proveedor: "Otro" },
      { fila: 4, stand: "xx", proveedor: "C" },
      { fila: 5, stand: 3, proveedor: "" },
    ]);
    expect(stands).toHaveLength(1);
    expect(errores).toHaveLength(3);
    expect(errores[0].motivo).toContain("duplicado");
    expect(errores[0].motivo).toContain("fila 2");
  });

  it("ignora filas vacías en silencio", () => {
    const { stands, errores } = procesarStands([
      { fila: 2, stand: "", proveedor: "" },
    ]);
    expect(stands).toHaveLength(0);
    expect(errores).toHaveLength(0);
  });
});

describe("procesarProductos", () => {
  it("acepta una fila válida completa", () => {
    const r = procesarProductos(
      [fila({ foto: "/img/demo/prod-1.svg", stock: 12 })],
      STANDS
    );
    expect(r.errores).toHaveLength(0);
    expect(r.productos).toHaveLength(1);
    expect(r.productos[0]).toMatchObject({
      codigo: "7791234567898",
      precio: 3500,
      stand: 1,
      foto: "/img/demo/prod-1.svg",
      stock: 12,
    });
  });

  it("descarta códigos duplicados y reporta la fila original", () => {
    const r = procesarProductos(
      [fila({}, 2), fila({ descripcion: "Otro producto" }, 3)],
      STANDS
    );
    expect(r.productos).toHaveLength(1);
    expect(r.errores).toHaveLength(1);
    expect(r.errores[0].fila).toBe(3);
    expect(r.errores[0].motivo).toContain("duplicado");
    expect(r.errores[0].motivo).toContain("fila 2");
  });

  it("descarta precios inválidos (texto, cero, negativo)", () => {
    const r = procesarProductos(
      [
        fila({ codigo: "7791000000017", precio: "gratis" }, 2),
        fila({ codigo: "7791000000024", precio: 0 }, 3),
        fila({ codigo: "7791000000031", precio: -10 }, 4),
      ],
      STANDS
    );
    expect(r.productos).toHaveLength(0);
    expect(r.errores).toHaveLength(3);
    for (const e of r.errores) expect(e.motivo).toContain("precio inválido");
  });

  it("descarta stands inexistentes", () => {
    const r = procesarProductos([fila({ stand: 99 })], STANDS);
    expect(r.productos).toHaveLength(0);
    expect(r.errores[0].motivo).toContain("inexistente");
  });

  it("descarta códigos no numéricos o de longitud incorrecta", () => {
    const r = procesarProductos(
      [
        fila({ codigo: "ABC123" }, 2),
        fila({ codigo: "123" }, 3),
        fila({ codigo: "123456789012345678" }, 4),
        fila({ codigo: "" }, 5),
      ],
      STANDS
    );
    expect(r.productos).toHaveLength(0);
    expect(r.errores).toHaveLength(4);
  });

  it("descarta filas sin descripción, ignora filas totalmente vacías", () => {
    const r = procesarProductos(
      [
        fila({ descripcion: "" }, 2),
        { fila: 3 }, // vacía
      ],
      STANDS
    );
    expect(r.productos).toHaveLength(0);
    expect(r.errores).toHaveLength(1);
    expect(r.errores[0].motivo).toContain("sin descripción");
  });

  it("advierte (sin descartar) sobre EAN-13 con checksum inválido", () => {
    const r = procesarProductos([fila({ codigo: "7791000000018" })], STANDS);
    expect(r.productos).toHaveLength(1);
    expect(r.advertencias).toHaveLength(1);
    expect(r.advertencias[0].motivo).toContain("EAN-13");
  });

  it("ignora stock/foto inválidos con advertencia, sin descartar la fila", () => {
    const r = procesarProductos(
      [fila({ stock: "muchos", foto: "no es url" })],
      STANDS
    );
    expect(r.productos).toHaveLength(1);
    expect(r.productos[0].stock).toBeUndefined();
    expect(r.productos[0].foto).toBeUndefined();
    expect(r.advertencias).toHaveLength(2);
  });

  it("acepta precio en texto formato AR", () => {
    const r = procesarProductos([fila({ precio: "$ 12.345,50" })], STANDS);
    expect(r.productos[0].precio).toBe(12345.5);
  });
});

describe("generarSalidas", () => {
  const productos = procesarProductos(
    [
      fila({ codigo: "7791000000017", descripcion: "Zeta último" }, 2),
      fila({ codigo: "7791000000024", descripcion: "Alfa primero" }, 3),
      fila({ codigo: "7791000000031", descripcion: "Beta", stand: 2 }, 4),
    ],
    STANDS
  ).productos;

  it("agrupa por stand y ordena alfabéticamente", () => {
    const s = generarSalidas(productos, STANDS);
    expect(s.standFiles.get(1)!.productos.map((p) => p.descripcion)).toEqual([
      "Alfa primero",
      "Zeta último",
    ]);
    expect(s.standFiles.get(2)!.productos).toHaveLength(1);
    expect(s.standsJson.find((x) => x.id === 1)!.productos).toBe(2);
  });

  it("genera manifest coherente y versión estable por contenido", () => {
    const a = generarSalidas(productos, STANDS, new Date("2026-01-01"));
    const b = generarSalidas(productos, STANDS, new Date("2026-02-02"));
    expect(a.manifest.productos).toBe(3);
    expect(a.manifest.stands).toBe(2);
    expect(a.manifest.version).toBe(b.manifest.version); // no depende de la fecha
    expect(a.indexJson.entries).toHaveLength(3);
    expect(a.indexJson.entries[0]).toHaveLength(4);
  });
});

describe("mapearColumnas", () => {
  it("matchea encabezados con acentos y variantes", () => {
    const { mapa, faltantes } = mapearColumnas(
      ["Código de Barras", "DESCRIPCIÓN", "Precio ", "Nº de Stand", "Foto", "Stock"],
      ALIAS_PRODUCTOS
    );
    expect(faltantes).toHaveLength(0);
    expect(mapa.get("codigo")).toBe(0);
    expect(mapa.get("stand")).toBe(3);
  });

  it("reporta columnas requeridas faltantes", () => {
    const { faltantes } = mapearColumnas(["Descripción", "Precio"], ALIAS_PRODUCTOS);
    expect(faltantes).toContain("codigo");
    expect(faltantes).toContain("stand");
  });

  it("matchea la tabla de stands", () => {
    const { faltantes } = mapearColumnas(["Stand", "Proveedor"], ALIAS_STANDS);
    expect(faltantes).toHaveLength(0);
  });
});
