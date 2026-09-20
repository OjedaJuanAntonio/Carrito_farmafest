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
import {
  mkdirSync,
  rmSync,
  writeFileSync,
  existsSync,
  readFileSync,
  readdirSync,
} from "fs";
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
import { parseCsv } from "./lib/csv";

function arg(name: string, def: string): string {
  const i = process.argv.indexOf(`--${name}`);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

const esUrl = (s: string) => /^https?:\/\//i.test(s);
const esCsv = (s: string) => /output=csv|[?&]format=csv|\.csv(\?|$)/i.test(s);

const EXT_FOTO = new Set([
  ".webp",
  ".avif",
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".svg",
]);

/**
 * Arma un resolver de fotos por código de barras escaneando un directorio
 * local (por defecto public/img/productos). Cada archivo <codigo>.<ext> se
 * mapea a su ruta pública. Sin celda Foto, el producto toma su imagen de acá.
 * Devuelve undefined si no hay carpeta o no hay imágenes.
 */
function construirResolverFotos():
  | ((codigo: string) => string | undefined)
  | undefined {
  const dir = process.env.PHOTOS_DIR || path.join("public", "img", "productos");
  if (!existsSync(dir)) return undefined;

  const rel = path.relative("public", dir).split(path.sep).join("/");
  if (rel.startsWith("..")) {
    console.warn(
      `⚠ PHOTOS_DIR (${dir}) está fuera de public/; no se puede servir. Se ignora.`
    );
    return undefined;
  }
  const publicBase = "/" + rel;

  const porCodigo = new Map<string, string>();
  for (const name of readdirSync(dir)) {
    const ext = path.extname(name).toLowerCase();
    if (!EXT_FOTO.has(ext)) continue;
    const codigo = path.basename(name, path.extname(name));
    if (!/^\d{6,14}$/.test(codigo)) continue;
    if (!porCodigo.has(codigo)) porCodigo.set(codigo, `${publicBase}/${name}`);
  }
  if (porCodigo.size === 0) return undefined;
  console.log(
    `✔ Fotos por código de barras: ${porCodigo.size} imágenes en ${dir}`
  );
  return (codigo) => porCodigo.get(codigo);
}

/**
 * Lee una fuente de datos que puede ser: un .xlsx local, un .csv local, o una
 * URL (típicamente un Google Sheet "Publicado en la web → CSV"). Devuelve
 * encabezados + filas crudas, sin interpretar tipos.
 */
async function leerHoja(
  fuente: string
): Promise<{ headers: string[]; filas: unknown[][] }> {
  // ---- CSV (archivo local o URL de planilla publicada) ----
  if (esCsv(fuente) || (!esUrl(fuente) && /\.csv$/i.test(fuente))) {
    const text = esUrl(fuente)
      ? await descargarTexto(fuente)
      : readFileSync(fuente, "utf8");
    const rows = parseCsv(text);
    const headers = (rows[0] ?? []).map((h) => String(h ?? ""));
    return { headers, filas: rows.slice(1) };
  }

  // Una URL siempre debe ser CSV (planilla publicada como CSV).
  if (esUrl(fuente)) {
    throw new Error(
      `La URL ${fuente} no parece CSV. Publicá la planilla como CSV ` +
        `(Archivo → Compartir → Publicar en la web → CSV, la URL trae output=csv).`
    );
  }

  // ---- xlsx local ----
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(fuente);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error(`${fuente} no tiene hojas`);
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

async function descargarTexto(url: string): Promise<string> {
  const res = await fetch(url, { redirect: "follow" });
  if (!res.ok) throw new Error(`No se pudo descargar ${url} (HTTP ${res.status})`);
  return res.text();
}

async function main() {
  // Fuentes: flag CLI > variable de entorno > archivo local por defecto.
  // Las variables SHEET_*_URL permiten apuntar a un Google Sheet publicado
  // como CSV (usado por el Action de publicación); no hay que tocar código.
  const productosPath = arg(
    "productos",
    process.env.SHEET_PRODUCTOS_URL || path.join("data-src", "productos.xlsx")
  );
  const standsPath = arg(
    "stands",
    process.env.SHEET_STANDS_URL || path.join("data-src", "stands.xlsx")
  );
  const outDir = arg("out", path.join("public", "data"));

  for (const p of [productosPath, standsPath]) {
    if (!esUrl(p) && !existsSync(p)) {
      console.error(`✖ No existe el archivo ${p}`);
      console.error(
        "  Tip: corré `npm run sample-data` para generar datos de ejemplo, o pasá una URL de planilla publicada."
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
  const col = (nombre: string, v: unknown[]) =>
    colProd.mapa.has(nombre) ? v[colProd.mapa.get(nombre)!] : undefined;
  const filasProd: FilaCruda[] = hojaProd.filas.map((v, i) => ({
    fila: i + 2,
    codigo: v[colProd.mapa.get("codigo")!],
    descripcion: v[colProd.mapa.get("descripcion")!],
    precio: v[colProd.mapa.get("precio")!],
    stand: v[colProd.mapa.get("stand")!],
    foto: col("foto", v),
    stock: col("stock", v),
    precioAnterior: col("precioAnterior", v),
    oferta: col("oferta", v),
  }));
  const resultado = procesarProductos(filasProd, stands, {
    imageBase: process.env.IMAGE_BASE_URL,
    fotoPorCodigo: construirResolverFotos(),
  });

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
