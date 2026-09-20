import { execFileSync } from "child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import ExcelJS from "exceljs";
import type { SearchIndexFile, StandData } from "../src/lib/types";

/**
 * E2E de la ingesta: genera Excel reales con filas rotas, corre el CLI
 * completo (npx tsx scripts/ingest.ts) y valida salidas + reporte.
 */

let dir: string;
let salida: string;
let stdout: string;

beforeAll(async () => {
  dir = mkdtempSync(path.join(tmpdir(), "farmafest-ingesta-"));
  salida = path.join(dir, "out-data");

  const wbStands = new ExcelJS.Workbook();
  const ws = wbStands.addWorksheet("Stands");
  ws.addRow(["Stand", "Proveedor"]);
  ws.addRow([1, "Laboratorios Test"]);
  ws.addRow([2, "Droguería Test"]);
  ws.addRow(["dos", "Proveedor Roto"]); // stand inválido
  await wbStands.xlsx.writeFile(path.join(dir, "stands.xlsx"));

  const wbProd = new ExcelJS.Workbook();
  const wp = wbProd.addWorksheet("Productos");
  // encabezados con variantes reales (mayúsculas, acentos, espacios) +
  // columnas de oferta al final (se mapean por nombre, no por posición).
  wp.addRow(["Código de Barras", "DESCRIPCIÓN", "Precio", "Nº de Stand", "Foto", "Stock", "Precio anterior", "Oferta"]);
  wp.addRow(["7791000000017", "Ibuprofeno 400mg x10", 3500, 1, "", 12]); // ok
  wp.addRow(["7791000000024", "Paracetamol 500mg", "$ 2.100,50", 2, "", ""]); // ok, precio texto AR
  wp.addRow(["7791000000024", "Duplicado del anterior", 999, 1, "", ""]); // código duplicado
  wp.addRow(["7791000000031", "Precio roto", "gratis", 1, "", ""]); // precio inválido
  wp.addRow(["7791000000048", "Stand fantasma", 500, 99, "", ""]); // stand inexistente
  wp.addRow(["ABC", "Código roto", 500, 1, "", ""]); // código inválido
  wp.addRow(["", "", "", "", "", ""]); // fila vacía → se ignora
  wp.addRow(["7791000000055", "", 500, 1, "", ""]); // sin descripción
  wp.addRow(["7791000000062", "Con stock roto", 800, 2, "", "muchos"]); // advertencia
  wp.addRow(["7791000000079", "En oferta 30%", 700, 2, "", "", 1000, ""]); // precio anterior válido
  wp.addRow(["7791000000086", "Precio anterior menor", 900, 2, "", "", 800, ""]); // anterior <= precio → se ignora
  wp.addRow(["7791000000093", "Combo sin baja", 500, 1, "", "", "", "2x1"]); // etiqueta sin precio anterior
  await wbProd.xlsx.writeFile(path.join(dir, "productos.xlsx"));

  stdout = execFileSync(
    "npx",
    [
      "tsx", "scripts/ingest.ts",
      "--productos", path.join(dir, "productos.xlsx"),
      "--stands", path.join(dir, "stands.xlsx"),
      "--out", salida,
    ],
    { encoding: "utf8", shell: process.platform === "win32", cwd: process.cwd() }
  );
}, 120_000);

afterAll(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("ingesta E2E con datos rotos", () => {
  it("genera todas las salidas", () => {
    for (const f of ["manifest.json", "stands.json", "index.json"]) {
      expect(existsSync(path.join(salida, f)), f).toBe(true);
    }
    expect(existsSync(path.join(salida, "stand", "1.json"))).toBe(true);
    expect(existsSync(path.join(salida, "stand", "2.json"))).toBe(true);
  });

  it("acepta solo las filas válidas", () => {
    const index = JSON.parse(
      readFileSync(path.join(salida, "index.json"), "utf8")
    ) as SearchIndexFile;
    const codigos = index.entries.map((e) => e[0]).sort();
    expect(codigos).toEqual([
      "7791000000017",
      "7791000000024",
      "7791000000062",
      "7791000000079",
      "7791000000086",
      "7791000000093",
    ]);
  });

  it("procesa ofertas: precio anterior válido, etiqueta, y descarta anterior menor", () => {
    const index = JSON.parse(
      readFileSync(path.join(salida, "index.json"), "utf8")
    ) as SearchIndexFile;
    const byCode = new Map(index.entries.map((e) => [e[0], e]));

    // precio anterior válido → entrada de largo 6 con el anterior
    const oferta = byCode.get("7791000000079")!;
    expect(oferta).toHaveLength(6);
    expect(oferta[4]).toBe(1000);

    // etiqueta sin baja de precio → largo 6 con oferta y anterior 0
    const combo = byCode.get("7791000000093")!;
    expect(combo).toHaveLength(6);
    expect(combo[5]).toBe("2x1");

    // precio anterior <= precio → se ignora (entrada normal de largo 4)
    expect(byCode.get("7791000000086")).toHaveLength(4);

    const stand2 = JSON.parse(
      readFileSync(path.join(salida, "stand", "2.json"), "utf8")
    ) as StandData;
    expect(
      stand2.productos.find((p) => p.codigo === "7791000000079")?.precioAnterior
    ).toBe(1000);
    expect(
      stand2.productos.find((p) => p.codigo === "7791000000086")?.precioAnterior
    ).toBeUndefined();
  });

  it("parsea el precio en formato argentino", () => {
    const stand2 = JSON.parse(
      readFileSync(path.join(salida, "stand", "2.json"), "utf8")
    ) as StandData;
    const paracetamol = stand2.productos.find(
      (p) => p.codigo === "7791000000024"
    );
    expect(paracetamol?.precio).toBe(2100.5);
  });

  it("reporta cada fila rota con su motivo", () => {
    expect(stdout).toContain("duplicado");
    expect(stdout).toContain("precio inválido");
    expect(stdout).toContain("inexistente");
    expect(stdout).toContain("código de barras inválido");
    expect(stdout).toContain("sin descripción");
    expect(stdout).toContain("número de stand inválido"); // en stands
    expect(stdout).toMatch(/stock .* se ignora/);
  });

  it("el manifest refleja los datos limpios", () => {
    const manifest = JSON.parse(
      readFileSync(path.join(salida, "manifest.json"), "utf8")
    );
    expect(manifest.productos).toBe(6);
    expect(manifest.stands).toBe(2);
    expect(manifest.version).toMatch(/^[0-9a-f]{10}$/);
  });
});
