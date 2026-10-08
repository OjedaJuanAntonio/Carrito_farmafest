import { describe, expect, it } from "vitest";
import {
  ALIAS_PRODUCTOS_POSBERRY,
  aFraccion,
  esFormatoPosberry,
  mapearColumnas,
  normalizarCuit,
  normalizarFamilia,
  procesarFamilias,
  procesarProductos,
  procesarStands,
  type FilaCruda,
  type FilaCrudaFamilia,
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

// Tabla de familias de ejemplo, como vendría de data-src/familias.csv.
const FILAS_FAMILIAS: FilaCrudaFamilia[] = [
  { fila: 2, familia: "40%", tipo: "PORCENTAJE", valor: "0.40" },
  { fila: 3, familia: "2X1", tipo: "2X1", etiqueta: "2x1" },
  { fila: 4, familia: "2DO70%", tipo: "SEGUNDO", valor: "0.70", etiqueta: "2do al 70%" },
  // Sin columna Tipo: se infiere del nombre.
  { fila: 5, familia: "25%" },
];

describe("aFraccion", () => {
  it("acepta fracción, porcentaje y %", () => {
    expect(aFraccion("0.4")).toBeCloseTo(0.4);
    expect(aFraccion("0,4")).toBeCloseTo(0.4);
    expect(aFraccion("40")).toBeCloseTo(0.4);
    expect(aFraccion("40%")).toBeCloseTo(0.4);
  });
  it("vacío o inválido → null", () => {
    expect(aFraccion("")).toBeNull();
    expect(aFraccion("abc")).toBeNull();
    expect(aFraccion("100")).toBeNull(); // 100% no válido
    expect(aFraccion("0")).toBeNull();
  });
});

describe("normalizarFamilia", () => {
  it("mayúsculas y sin espacios", () => {
    expect(normalizarFamilia("2do 70%")).toBe("2DO70%");
    expect(normalizarFamilia(" 40% ")).toBe("40%");
  });
});

describe("normalizarCuit", () => {
  it("deja solo dígitos", () => {
    expect(normalizarCuit("20-11111112-5")).toBe("20111111125");
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
    expect(mapa.get("codigo")).toBe(2);
  });
  it("precio, cuit y familia bien mapeados", () => {
    expect(mapa.get("precio")).toBe(6);
    expect(mapa.get("cuit")).toBe(9);
    expect(mapa.get("familia")).toBe(4);
  });
});

describe("procesarFamilias", () => {
  it("clasifica por columna Tipo e infiere las que no la traen", () => {
    const { familias, errores } = procesarFamilias(FILAS_FAMILIAS);
    expect(errores).toEqual([]);
    expect(familias.get("40%")).toMatchObject({ tipo: "PORCENTAJE", valor: 0.4 });
    expect(familias.get("2X1")).toMatchObject({ tipo: "2X1", etiqueta: "2x1" });
    expect(familias.get("2DO70%")).toMatchObject({ tipo: "SEGUNDO", valor: 0.7, etiqueta: "2do al 70%" });
    // "25%" sin Tipo → inferido como PORCENTAJE 0.25
    expect(familias.get("25%")).toMatchObject({ tipo: "PORCENTAJE", valor: 0.25 });
  });
  it("infiere '2do al N%' del nombre", () => {
    const { familias } = procesarFamilias([{ fila: 2, familia: "2DO50%" }]);
    expect(familias.get("2DO50%")).toMatchObject({ tipo: "SEGUNDO", valor: 0.5 });
  });
  it("marca error si no se puede determinar la mecánica", () => {
    const { familias, errores } = procesarFamilias([{ fila: 2, familia: "COMBO VERANO" }]);
    expect(familias.size).toBe(0);
    expect(errores).toHaveLength(1);
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
    expect(cuitToStand.get("301112")).toBe(6);
    expect(cuitToStand.get("209991")).toBe(8);
  });
});

describe("procesarProductos (POSBerry: stand por CUIT + familia)", () => {
  const stands = [
    { id: 8, proveedor: "Cuenca" },
    { id: 6, proveedor: "Beauty Solutions" },
  ];
  const cuitToStand = new Map<string, number>([
    ["20999", 8],
    ["30111", 6],
  ]);
  const { familias } = procesarFamilias(FILAS_FAMILIAS);
  const opts = { cuitToStand, familias };

  it("PORCENTAJE: tacha regular y calcula el final", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Prod A", precio: 100, cuit: "20-999", familia: "40%" },
      { fila: 3, codigo: "7793008009337", descripcion: "Prod B", precio: 50, cuit: "30-111", familia: "" },
    ];
    const r = procesarProductos(filas, stands, opts);
    const a = r.productos.find((p) => p.codigo === "7793008008910")!;
    expect(a.stand).toBe(8);
    expect(a.precioAnterior).toBe(100);
    expect(a.precio).toBe(60); // 100 × (1 − 0.40)
    const b = r.productos.find((p) => p.codigo === "7793008009337")!;
    expect(b.stand).toBe(6);
    expect(b.precioAnterior).toBeUndefined();
    expect(b.precio).toBe(50);
    expect(b.oferta).toBeUndefined();
  });

  it("2X1: precio a la mitad, regular tachado, etiqueta 2x1", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Prod", precio: 100, cuit: "20-999", familia: "2X1" },
    ];
    const p = procesarProductos(filas, stands, opts).productos[0];
    expect(p.precioAnterior).toBe(100);
    expect(p.precio).toBe(50);
    expect(p.oferta).toBe("2x1");
  });

  it("SEGUNDO (2do al N%): no cambia el precio ni tacha, solo badge", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Prod", precio: 100, cuit: "20-999", familia: "2DO70%" },
    ];
    const p = procesarProductos(filas, stands, opts).productos[0];
    expect(p.precio).toBe(100);
    expect(p.precioAnterior).toBeUndefined();
    expect(p.oferta).toBe("2do al 70%");
  });

  it("PORCENTAJE con centavos", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Prod", precio: 99.9, cuit: "20-999", familia: "40%" },
    ];
    const p = procesarProductos(filas, stands, opts).productos[0];
    expect(p.precio).toBe(59.94); // 99.9 × 0.60
  });

  it("familia desconocida → sin oferta + advertencia; el producto se publica", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Prod", precio: 100, cuit: "20-999", familia: "RARA" },
    ];
    const r = procesarProductos(filas, stands, opts);
    expect(r.productos).toHaveLength(1);
    expect(r.productos[0].precio).toBe(100);
    expect(r.productos[0].oferta).toBeUndefined();
    expect(r.advertencias).toHaveLength(1);
  });

  it("descarta producto sin CUIT o con CUIT no mapeado", () => {
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7793008008910", descripcion: "Sin cuit", precio: 100, cuit: "" },
      { fila: 3, codigo: "7793008009337", descripcion: "Cuit desconocido", precio: 100, cuit: "99-999" },
    ];
    const r = procesarProductos(filas, stands, opts);
    expect(r.productos).toHaveLength(0);
    expect(r.errores).toHaveLength(2);
  });
});

describe("match por nombre de proveedor (POSBerry sin CUIT)", () => {
  const { proveedorToStand } = procesarStands([
    { fila: 2, stand: 8, proveedor: "Cuenca" },
    { fila: 3, stand: 1, proveedor: "Vamma - Bioderma", alias: "VAMMA|BIODERMA" },
    { fila: 4, stand: 44, proveedor: "Loreal", alias: "LOREAL MAQ" },
  ]);

  it("arma proveedorToStand desde el nombre y los alias POSBerry", () => {
    expect(proveedorToStand.get("CUENCA")).toBe(8);
    expect(proveedorToStand.get("VAMMA")).toBe(1);
    expect(proveedorToStand.get("BIODERMA")).toBe(1);
    expect(proveedorToStand.get("LOREALMAQ")).toBe(44);
  });

  it("asigna el stand por proveedor cuando el producto no trae CUIT", () => {
    const stands = [
      { id: 1, proveedor: "Vamma - Bioderma" },
      { id: 8, proveedor: "Cuenca" },
      { id: 44, proveedor: "Loreal" },
    ];
    const filas: FilaCruda[] = [
      { fila: 2, codigo: "7791000000017", descripcion: "A", precio: 100, proveedor: "BIODERMA" },
      { fila: 3, codigo: "7791000000024", descripcion: "B", precio: 100, proveedor: "LOREAL MAQ" },
      { fila: 4, codigo: "7791000000031", descripcion: "C", precio: 100, proveedor: "Desconocido SA" },
    ];
    const r = procesarProductos(filas, stands, { proveedorToStand });
    expect(r.productos.find((p) => p.codigo === "7791000000017")!.stand).toBe(1);
    expect(r.productos.find((p) => p.codigo === "7791000000024")!.stand).toBe(44);
    expect(r.errores).toHaveLength(1);
    expect(r.errores[0].motivo).toContain("sin stand asignado");
  });
});
