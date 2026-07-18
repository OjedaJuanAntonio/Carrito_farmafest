/**
 * Ingesta: lee los Excel de productos y stands, valida fila por fila y genera
 * los JSON que consume la app en runtime.
 *
 * Uso:
 *   npm run ingest
 *   npm run ingest -- --productos otra/ruta.xlsx --stands otra/stands.xlsx
 *
 * Salidas (public/data/):
 *   manifest.json   versión + timestamp de los datos
 *   stands.json     lista de stands con proveedor y cantidad de productos
 *   stand/<id>.json productos de cada stand
 *   index.json      índice global compacto para el buscador
 *
 * Reporte de problemas: consola + reports/ingesta-report.txt
 * Códigos de salida: 0 ok (aunque haya filas descartadas), 1 sin productos
 * válidos, 2 error de archivos/columnas.
 */
import ExcelJS from "exceljs";
import { mkdirSync, rmSync, writeFileSync, existsSync } from "fs";
import path from "path";
import {
  ALIAS_PRODUCTOS,
  ALIAS_STANDS,
  generarSalidas,
  mapearColumnas,
  procesarProductos,
  procesarStands,
  type FilaCruda,
  type FilaCrudaStand,
  type Problema,
} from "./lib/ingesta";

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

async function leerHoja(
  archivo: string
): Promise<{ headers: string[]; filas: unknown[][] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(archivo);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error(`${archivo} no tiene hojas`);
  const filas: unknown[][] = [];
  let headers: string[] = [];
  ws.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    // row.values es 1-indexado (el [0] viene undefined)
    const valores = (row.values as unknown[]).slice(1);
    if (rowNumber === 1) {
      headers = valores.map((v) => String(v ?? ""));
    } else {
      filas.push(valores);
    }
  });
  return { headers, filas };
}

async function main() {
  const productosPath = arg("productos", path.join("data-src", "productos.xlsx"));
  const standsPath = arg("stands", path.join("data-src", "stands.xlsx"));
  const outDir = arg("out", path.join("public", "data"));

  for (const p of [productosPath, standsPath]) {
    if (!existsSync(p)) {
      console.error(`✖ No existe el archivo ${p}`);
      console.error(
        "  Tip: corré `npm run sample-data` para generar datos de ejemplo."
      );
      process.exit(2);
    }
  }

  // ---------- Stands ----------
  const hojaStands = await leerHoja(standsPath);
  const colStands = mapearColumnas(hojaStands.headers, ALIAS_STANDS);
  if (colStands.faltantes.length > 0) {
    console.error(
      `✖ ${standsPath}: faltan columnas requeridas: ${colStands.faltantes.join(", ")}`
    );
    console.error(`  Encabezados encontrados: ${hojaStands.headers.join(" | ")}`);
    process.exit(2);
  }
  const filasStands: FilaCrudaStand[] = hojaStands.filas.map((v, i) => ({
    fila: i + 2, // +2: 1-indexado y salteamos el header
    stand: v[colStands.mapa.get("stand")!],
    proveedor: v[colStands.mapa.get("proveedor")!],
  }));
  const { stands, errores: erroresStands } = procesarStands(filasStands);

  // ---------- Productos ----------
  const hojaProd = await leerHoja(productosPath);
  const colProd = mapearColumnas(hojaProd.headers, ALIAS_PRODUCTOS);
  if (colProd.faltantes.length > 0) {
    console.error(
      `✖ ${productosPath}: faltan columnas requeridas: ${colProd.faltantes.join(", ")}`
    );
    console.error(`  Encabezados encontrados: ${hojaProd.headers.join(" | ")}`);
    process.exit(2);
  }
  const filasProd: FilaCruda[] = hojaProd.filas.map((v, i) => ({
    fila: i + 2,
    codigo: v[colProd.mapa.get("codigo")!],
    descripcion: v[colProd.mapa.get("descripcion")!],
    precio: v[colProd.mapa.get("precio")!],
    stand: v[colProd.mapa.get("stand")!],
    foto: colProd.mapa.has("foto") ? v[colProd.mapa.get("foto")!] : undefined,
    stock: colProd.mapa.has("stock") ? v[colProd.mapa.get("stock")!] : undefined,
  }));
  const resultado = procesarProductos(filasProd, stands);

  // ---------- Reporte ----------
  const lineas: string[] = [];
  const log = (s: string) => {
    lineas.push(s);
    console.log(s);
  };

  log(`Ingesta Farmafest — ${new Date().toLocaleString("es-AR")}`);
  log("");
  log(`Stands:    ${filasStands.length} filas leídas → ${stands.length} válidos`);
  log(
    `Productos: ${filasProd.length} filas leídas → ${resultado.productos.length} válidos`
  );
  log("");

  const dump = (titulo: string, problemas: Problema[], origen: string) => {
    if (problemas.length === 0) return;
    log(`${titulo} (${problemas.length}):`);
    for (const p of problemas) {
      const ctx = p.contexto ? ` — «${p.contexto}»` : "";
      log(`  Fila ${p.fila} [${origen}]: ${p.motivo}${ctx}`);
    }
    log("");
  };

  dump("✖ ERRORES en stands (filas descartadas)", erroresStands, "stands");
  dump("✖ ERRORES en productos (filas descartadas)", resultado.errores, "productos");
  dump("⚠ Advertencias (filas aceptadas)", resultado.advertencias, "productos");

  if (stands.length === 0) {
    console.error("✖ No hay stands válidos; no se genera nada.");
    process.exit(1);
  }
  if (resultado.productos.length === 0) {
    console.error("✖ No hay productos válidos; no se genera nada.");
    process.exit(1);
  }

  // ---------- Escritura de salidas ----------
  const salidas = generarSalidas(resultado.productos, stands);

  const standDir = path.join(outDir, "stand");
  rmSync(standDir, { recursive: true, force: true });
  mkdirSync(standDir, { recursive: true });

  writeFileSync(
    path.join(outDir, "manifest.json"),
    JSON.stringify(salidas.manifest, null, 2)
  );
  writeFileSync(path.join(outDir, "stands.json"), JSON.stringify(salidas.standsJson));
  writeFileSync(path.join(outDir, "index.json"), JSON.stringify(salidas.indexJson));
  for (const [id, data] of salidas.standFiles) {
    writeFileSync(path.join(standDir, `${id}.json`), JSON.stringify(data));
  }

  mkdirSync("reports", { recursive: true });
  writeFileSync(path.join("reports", "ingesta-report.txt"), lineas.join("\n"));

  log(
    `✔ Generado en ${outDir}: manifest.json, stands.json, index.json y ${salidas.standFiles.size} archivos de stand`
  );
  log(`✔ Versión de datos: ${salidas.manifest.version}`);
  log(`✔ Reporte guardado en reports/ingesta-report.txt`);

  const descartadas = erroresStands.length + resultado.errores.length;
  if (descartadas > 0) {
    log(
      `⚠ Atención: ${descartadas} filas descartadas. Revisá el reporte antes de publicar.`
    );
  }
}

main().catch((err) => {
  console.error("✖ Error inesperado en la ingesta:", err);
  process.exit(2);
});
