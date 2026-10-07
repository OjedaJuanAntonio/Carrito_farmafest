import { execFileSync } from "child_process";
import { readFileSync, mkdtempSync, rmSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import type { StandData } from "../src/lib/types";

/**
 * E2E del formato POSBerry: un solo archivo de productos (con "Familia" y
 * "CUIT Proveedor") + tabla de stands con CUIT + tabla de familias (CSV).
 * Corre el CLI completo y valida stand-por-CUIT y el cálculo de cada mecánica.
 */

let dir: string;
let salida: string;
let stdout: string;

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "farmafest-posberry-"));
  salida = path.join(dir, "out-data");

  const wbStands = new ExcelJS.Workbook();
  const ws = wbStands.addWorksheet("Stands");
  ws.addRow(["Stand", "Proveedor", "CUIT"]);
  ws.addRow([8, "Cuenca", "20-11111112-5"]);
  ws.addRow([6, "Beauty Solutions", "30-22222223-9"]);
  await wbStands.xlsx.writeFile(path.join(dir, "stands.xlsx"));

  const wbProd = new ExcelJS.Workbook();
  const wp = wbProd.addWorksheet("Productos");
  wp.addRow([
    "*Codigo", "*Descripcion", "Codigo de Barras", "Familia",
    "*Costo", "*Precio de Venta", "IVA", "Proveedor", "CUIT Proveedor",
  ]);
  // interno / descr / EAN / familia / costo / precio venta (REGULAR) / iva / prov / cuit
  wp.addRow(["A1", "Crema 40%", "7791000000017", "40%", 100, 100, 21, "Cuenca", "20-11111112-5"]);
  wp.addRow(["A2", "Shampoo 2x1", "7791000000024", "2X1", 100, 100, 21, "Cuenca", "20-11111112-5"]);
  wp.addRow(["A3", "Jabón 2do 70%", "7791000000031", "2DO70%", 100, 100, 21, "Beauty Solutions", "30-22222223-9"]);
  wp.addRow(["A4", "Sin oferta", "7791000000048", "", 100, 100, 21, "Beauty Solutions", "30-22222223-9"]);
  wp.addRow(["A5", "Familia rara", "7791000000055", "COMBO", 100, 100, 21, "Cuenca", "20-11111112-5"]);
  await wbProd.xlsx.writeFile(path.join(dir, "productos.xlsx"));

  writeFileSync(
    path.join(dir, "familias.csv"),
    "Familia,Tipo,Valor,Etiqueta\n" +
      "40%,PORCENTAJE,0.40,\n" +
      "2X1,2X1,,2x1\n" +
      "2DO70%,SEGUNDO,0.70,2do al 70%\n"
  );

  stdout = execFileSync(
    "npx",
    [
      "tsx", "scripts/ingest.ts",
      "--productos", path.join(dir, "productos.xlsx"),
      "--stands", path.join(dir, "stands.xlsx"),
      "--familias", path.join(dir, "familias.csv"),
      "--out", salida,
    ],
    { encoding: "utf8", shell: process.platform === "win32", cwd: process.cwd() }
  );
}, 120_000);

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

function prod(stand: number, codigo: string) {
  const data = JSON.parse(
    readFileSync(path.join(salida, "stand", `${stand}.json`), "utf8")
  ) as StandData;
  return data.productos.find((p) => p.codigo === codigo);
}

describe("ingesta E2E formato POSBerry", () => {
  it("detecta el formato y carga las familias", () => {
    expect(stdout).toContain("Formato POSBerry detectado");
    expect(stdout).toContain("Familias cargadas: 3");
  });

  it("asigna el stand por CUIT", () => {
    expect(prod(8, "7791000000017")).toBeDefined(); // Cuenca
    expect(prod(6, "7791000000031")).toBeDefined(); // Beauty Solutions
  });

  it("PORCENTAJE: regular tachado + precio final", () => {
    const p = prod(8, "7791000000017")!;
    expect(p.precioAnterior).toBe(100);
    expect(p.precio).toBe(60);
  });

  it("2X1: mitad de precio + etiqueta 2x1", () => {
    const p = prod(8, "7791000000024")!;
    expect(p.precioAnterior).toBe(100);
    expect(p.precio).toBe(50);
    expect(p.oferta).toBe("2x1");
  });

  it("SEGUNDO: precio sin cambio + badge, sin tachado", () => {
    const p = prod(6, "7791000000031")!;
    expect(p.precio).toBe(100);
    expect(p.precioAnterior).toBeUndefined();
    expect(p.oferta).toBe("2do al 70%");
  });

  it("sin familia: precio regular sin oferta", () => {
    const p = prod(6, "7791000000048")!;
    expect(p.precio).toBe(100);
    expect(p.oferta).toBeUndefined();
  });

  it("familia desconocida: se publica sin oferta + advertencia", () => {
    const p = prod(8, "7791000000055")!;
    expect(p.precio).toBe(100);
    expect(p.oferta).toBeUndefined();
    expect(stdout).toContain("no está en la tabla de familias");
  });
});
