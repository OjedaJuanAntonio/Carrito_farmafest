import { describe, expect, it } from "vitest";
import {
  ALIAS_PRODUCTOS_POSBERRY,
  esFormatoPosberry,
  mapearColumnas,
  normalizarCuit,
  parsearDescuento,
  procesarProductos,
  procesarStands,
  type FilaCruda,
  type FilaCrudaStand,
} from "../scripts/lib/ingesta";

// Encabezados reales del export de POSBerry (subconjunto/orden real).
const HEADERS_POSBERRY = [
  "*Codigo",
  "*Descripcion",
  "Codigo de Barras",
  "Codigo de Barras 2",
  "Familia",
  "*Costo",
  "*Precio de Venta",
  "IVA",
  "Proveedor",
  "CUIT Proveedor",
];

describe("parsearDescuento", () => {
  it("vacío o cero → 0 (sin descuento)", () => {
    expect(parsearDescuento("")).toBe(0);
    expect(parsearDescuento("0")).toBe(0);
    expect(parsearDescuento(null)).toBe(0);
  });
  it("fracción 0.3 / 0,3 → 0.3", () => {
    expect(parsearDescuento("0.3")).toBeCloseTo(0.3);
    expect(parsearDescuento("0,3")).toBeCloseTo(0.3);
    expect(parsearDescuento(0.3)).toBeCloseTo(0.3);
  });
  it("porcentaje entero (30, 50) → fracción", () => {
    expect(parsearDescuento("30")).toBeCloseTo(0.3);
    expect(parsearDescuento("50")).toBeCloseTo(0.5);
  });
  it("inválido → null", () => {
    expect(parsearDescuento("abc")).toBeNull();
    expect(parsearDescuento("100")).toBeNull(); // 100% no válido
  });
});

describe("normalizarCuit", () => {
  it("deja solo dígitos", () => {
    expect(normalizarCuit("20-11111112-5")).toBe("20111111125");
    expect(normalizarCuit(" 30 12345678 9 ")).toBe("30123456789");
    expect(normalizarCuit("")).toBe("");
  });
});

describe("esFormatoPosberry", () => {
  it("detecta headers de POSBerry", () => {
    expect(esFormatoPosberry(HEADERS_POSBERRY)).toBe(true);
  });
  it("no confunde el formato propio", () => {
    expect(
      esFormatoPosberry(["Código de barras", "Descripción", "Precio", "Stand"])
    ).toBe(false);
  });
});

describe("mapearColumnas (POSBerry)", () => {
  const { mapa, faltantes } = mapearColumnas(HEADERS_POSBERRY, ALIAS_PRODUCTOS_POSBERRY);
  it("no faltan columnas requeridas", () => {
    expect(faltantes).toEqual([]);
  });
  it("código = 'Codigo de Barras' (NO '*Codigo' interno)", () => {
    expect(mapa.get("codigo")).toBe(2); // índice de "Codigo de Barras"
  });
  it("precio = 'Precio de Venta', cuit y descuento (Familia) bien mapeados", () => {
    expect(mapa.get("precio")).toBe(6);
    expect(mapa.get("cuit")).toBe(9);
    expect(mapa.get("descuento")).toBe(4); // "Familia"
  });
});

describe("procesarStands con CUIT", () => {
  it("arma cuitToStand y ante CUIT repetido gana el stand menor", () => {
    const filas: FilaCrudaStand[] = [
      { fila: 2, stand: 6, proveedor: "Beauty Solutions / Disney", cuit: "30-111-2" },
      { fila: 3, stand: 9, proveedor: "Beauty Solutions / Oreiro", cuit: "30-111-2" },
      { fila: 4, stand: 8, proveedor: "Cuenca", cuit: "20-999-1" },
    ];
    const { stands, cuitToStand } = procesarStands(filas);
    expect(stands.length).toBe(3);
    expect(cuitToStand.get("301112")).toBe(6); // menor entre 6 y 9
    expect(cuitToStand.get("209991")).toBe(8);
  });
});

describe("procesarProductos (POSBerry: stand por CUIT + descuento)", () => {
  const stands = [
    { id: 8, proveedor: "Cuenca" },
    { id: 6, proveedor: "Beauty Solutions" },
  ];
  const cuitToStand = new Map<string, number>([
    ["20999", 8],
    ["30111", 6],
  ]);

  it("asigna stand por CUIT y aplica descuento de Familia", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Prod A", precio: 100, cuit: "20-999", descuento: "0.3" },
      { fila: 3, codigo: "7793008009337", descripcion: "Prod B", precio: 50, cuit: "30-111", descuento: "" },
    ];
    const r = procesarProductos(filas, stands, { cuitToStand });
    expect(r.productos).toHaveLength(2);
    const a = r.productos.find((p) => p.codigo === "7793008008910")!;
    expect(a.stand).toBe(8);
    expect(a.precioAnterior).toBe(100);
    expect(a.precio).toBe(70); // 100 × (1 − 0.3)
    const b = r.productos.find((p) => p.codigo === "7793008009337")!;
    expect(b.stand).toBe(6);
    expect(b.precioAnterior).toBeUndefined();
    expect(b.precio).toBe(50);
  });

  it("descuento con centavos", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Prod", precio: 99.9, cuit: "20-999", descuento: "0.15" },
    ];
    const r = procesarProductos(filas, stands, { cuitToStand });
    expect(r.productos[0].precio).toBe(84.92); // 99.9 × 0.85 = 84.915 → 84.92
  });

  it("descarta producto sin CUIT o con CUIT no mapeado", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Sin cuit", precio: 100, cuit: "" },
      { fila: 3, codigo: "7793008009337", descripcion: "Cuit desconocido", precio: 100, cuit: "99-999" },
    ];
    const r = procesarProductos(filas, stands, { cuitToStand });
    expect(r.productos).toHaveLength(0);
    expect(r.errores).toHaveLength(2);
  });
});
