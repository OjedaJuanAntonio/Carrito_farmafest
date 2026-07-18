/**
 * Genera datos de ejemplo realistas para desarrollo y testing:
 *   - data-src/stands.xlsx     (60 stands ↔ proveedores)
 *   - data-src/productos.xlsx  (~9.000 productos)
 *
 * Determinístico (PRNG con semilla fija): correrlo dos veces da lo mismo.
 * Uso: npm run sample-data
 */
import ExcelJS from "exceljs";
import { mkdirSync } from "fs";
import path from "path";

// ---------- PRNG determinístico (mulberry32) ----------
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260915);
const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
const randInt = (min: number, max: number) =>
  min + Math.floor(rnd() * (max - min + 1));

// ---------- EAN-13 con dígito verificador válido (prefijo 779 = Argentina) ----------
let eanSeq = 100000001;
function nextEan13(): string {
  const base = `779${String(eanSeq++).padStart(9, "0")}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(base[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return base + String(check);
}

// ---------- Proveedores (ficticios pero plausibles) ----------
const PROVEEDORES = [
  "Laboratorios Andino", "Laboratorios Austral", "Laboratorios del Plata",
  "Laboratorios Pampa Sur", "Laboratorios Cuyo", "Laboratorios Litoral",
  "Laboratorios Patagonia", "Laboratorios Aconcagua", "Laboratorios Iberá",
  "Laboratorios Mitre", "Farmacéutica Belgrano", "Farmacéutica del Sur",
  "Farmacéutica Rivadavia", "Farmacéutica Costanera", "Biogénesis Pharma",
  "Genfar Argentina", "Quimfarma", "Medipharma SA", "Innofarma",
  "Prontosalud Labs", "Droguería del Centro", "Droguería La Estrella",
  "Droguería San Martín", "Droguería del Litoral", "Droguería Continental",
  "Dermalia Cosmética", "Dermosur", "Piel & Sol Dermocosmética",
  "Belladerm", "Rostro Puro", "Esencia Vital Perfumería",
  "Aromas del Plata", "Perfumería Alameda", "Nutrivida Suplementos",
  "Fortex Nutrition", "ProteoLab Deportes", "Vitalfar Suplementos",
  "Omega Natural", "Herbolaria Andina", "Naturalis Fitoterapia",
  "Kindel Bebés", "Mamá & Bebé SRL", "Pequeños Pasos Infantil",
  "Nutribaby Argentina", "Sanix Descartables", "Insumed Hospitalario",
  "Botiquín Express", "Primeros Auxilios SA", "TecnoSalud Equipamiento",
  "OptiVisión Óptica", "Lentes del Sol SA", "Audiofarma",
  "Ortopedia Movilidad", "Cuidado Mayor SRL", "Higial Higiene",
  "Blancaflor Tocador", "Aquavital Cuidado Personal", "Puravit Wellness",
  "Farmax Genéricos", "Curapel Dermatología",
] as const;

// ---------- Marcas ficticias ----------
const MARCAS = [
  "Vitalfar", "Dermalia", "Nutrivida", "Farmax", "Puravit", "Sanix",
  "Biofem", "Kindel", "Aquavital", "Solarmed", "Fortex", "Naturalis",
  "Vidaplen", "Medifar", "Curapel", "Genbio", "Activlife", "Serenol",
  "Dermaqua", "Nutrimax", "Biosol", "Femina", "Pielsana", "Vigorplus",
] as const;

// ---------- Catálogo base por categoría ----------
interface Categoria {
  nombre: string;
  precioMin: number;
  precioMax: number;
  bases: readonly string[];
  variantes: readonly string[];
}

const CATEGORIAS: readonly Categoria[] = [
  {
    nombre: "otc",
    precioMin: 1800,
    precioMax: 28000,
    bases: [
      "Ibuprofeno 400mg", "Ibuprofeno 600mg", "Paracetamol 500mg",
      "Paracetamol 1g", "Aspirina 500mg", "Diclofenac gel 60g",
      "Loratadina 10mg", "Cetirizina 10mg", "Omeprazol 20mg",
      "Lansoprazol 30mg", "Vitamina C 500mg efervescente",
      "Complejo B", "Hierro + ácido fólico", "Magnesio 400mg",
      "Melatonina 3mg", "Carbón activado", "Sales de rehidratación oral",
      "Antiacido masticable", "Jarabe para la tos adultos 120ml",
      "Jarabe expectorante infantil 120ml", "Spray nasal descongestivo 20ml",
      "Gotas oftálmicas lubricantes 15ml", "Caramelos de propóleo",
      "Té digestivo hierbas serranas", "Crema para dolores musculares 100g",
    ],
    variantes: ["x10 comp", "x20 comp", "x30 comp", "x50 comp", ""],
  },
  {
    nombre: "dermo",
    precioMin: 6000,
    precioMax: 85000,
    bases: [
      "Crema facial hidratante 50g", "Crema antiage noche 50g",
      "Protector solar FPS 30 200ml", "Protector solar FPS 50 200ml",
      "Protector solar facial FPS 50 50ml", "Agua micelar 400ml",
      "Serum vitamina C 30ml", "Serum ácido hialurónico 30ml",
      "Contorno de ojos 15ml", "Gel de limpieza facial 150ml",
      "Exfoliante facial 100g", "Máscara facial hidratante 75ml",
      "Crema corporal reparadora 300ml", "Bálsamo labial FPS 30",
      "Crema para manos 75ml", "Aceite corporal nutritivo 125ml",
      "Locion post solar 200ml", "Crema despigmentante 30g",
      "Gel anticelulítico 200ml", "Roll-on ojeras 15ml",
    ],
    variantes: ["", "piel seca", "piel mixta", "piel sensible"],
  },
  {
    nombre: "higiene",
    precioMin: 2500,
    precioMax: 22000,
    bases: [
      "Shampoo anticaspa 400ml", "Shampoo nutrición 400ml",
      "Acondicionador 400ml", "Jabón líquido 250ml",
      "Desodorante roll-on 50ml", "Desodorante aerosol 150ml",
      "Talco corporal 100g", "Alcohol en gel 250ml",
      "Enjuague bucal 500ml", "Pasta dental blanqueadora 90g",
      "Pasta dental encías 90g", "Cepillo dental suave",
      "Cepillo dental medio x2", "Hilo dental 50m",
      "Toallitas húmedas x50", "Jabón de tocador x3",
      "Máquina de afeitar x3", "Espuma de afeitar 200ml",
      "Protectores diarios x20", "Toallas femeninas x16",
    ],
    variantes: ["", "aloe vera", "manzanilla", "sin perfume"],
  },
  {
    nombre: "infantil",
    precioMin: 4000,
    precioMax: 60000,
    bases: [
      "Pañales RN x36", "Pañales P x40", "Pañales M x60",
      "Pañales G x50", "Pañales XG x44", "Pañales XXG x40",
      "Leche de inicio 1 lata 800g", "Leche de continuación 2 lata 800g",
      "Leche de crecimiento 3 lata 800g", "Óleo calcáreo 200ml",
      "Crema para paspaduras 100g", "Chupete anatómico 0-6m",
      "Chupete anatómico +6m", "Mamadera anticólicos 250ml",
      "Toallitas húmedas bebé x80", "Shampoo bebé sin lágrimas 250ml",
      "Jabón líquido de glicerina bebé 250ml", "Aspirador nasal",
      "Termómetro digital pediátrico", "Colonia para bebé 100ml",
    ],
    variantes: ["", "pack x2", "hipoalergénico"],
  },
  {
    nombre: "botiquin",
    precioMin: 1200,
    precioMax: 45000,
    bases: [
      "Gasas estériles 10x10 x10", "Venda elástica 10cm",
      "Cinta hipoalergénica 2.5cm", "Apósitos adhesivos x20",
      "Termómetro digital", "Alcohol etílico 96% 500ml",
      "Agua oxigenada 10 vol 500ml", "Solución fisiológica 500ml",
      "Barbijo tricapa x50", "Guantes de nitrilo x100",
      "Jeringa descartable 5ml x10", "Test de embarazo",
      "Tensiómetro digital de brazo", "Oxímetro de pulso",
      "Bolsa de agua caliente 2L", "Collarín cervical blando",
      "Férula inmovilizadora de dedo", "Botiquín primeros auxilios completo",
      "Algodón hidrófilo 200g", "Antiséptico en spray 100ml",
    ],
    variantes: ["", "x2", "pack familiar", "uso hospitalario"],
  },
  {
    nombre: "suplementos",
    precioMin: 9000,
    precioMax: 120000,
    bases: [
      "Proteína whey vainilla 1kg", "Proteína whey chocolate 1kg",
      "Proteína vegetal 750g", "Creatina monohidrato 300g",
      "BCAA 2:1:1 x120 caps", "Barritas proteicas caja x12",
      "Colágeno hidrolizado 300g", "Omega 3 1000mg x60 caps",
      "Coenzima Q10 x30 caps", "Ginkgo biloba x60 comp",
      "Multivitamínico adultos x60", "Multivitamínico 50+ x60",
      "Ginseng coreano x30 caps", "Espirulina x90 comp",
      "Levadura de cerveza 500g", "Maca andina en polvo 250g",
      "Pre-entreno frutos rojos 300g", "Glutamina 300g",
      "Caseína micelar 900g", "ZMA x90 caps",
    ],
    variantes: ["", "sabor neutro", "premium", "pack x2"],
  },
  {
    nombre: "perfumeria",
    precioMin: 8000,
    precioMax: 95000,
    bases: [
      "Eau de toilette mujer 100ml", "Eau de toilette hombre 100ml",
      "Eau de parfum floral 50ml", "Body splash frutal 250ml",
      "Crema corporal perfumada 300ml", "Sales de baño relajantes 500g",
      "Espuma de baño 400ml", "Kit de regalo perfume + crema",
      "Aceite esencial de lavanda 15ml", "Difusor de aromas + varillas",
      "Vela aromática vainilla", "Jabón artesanal de caléndula",
      "Bruma para almohada 100ml", "Crema de manos perfumada 75ml",
    ],
    variantes: ["", "edición limitada", "kit x2"],
  },
  {
    nombre: "optica",
    precioMin: 5000,
    precioMax: 70000,
    bases: [
      "Lágrimas artificiales 15ml", "Solución multipropósito 360ml",
      "Estuche porta lentes de contacto", "Anteojos de lectura +1.00",
      "Anteojos de lectura +1.50", "Anteojos de lectura +2.00",
      "Anteojos de sol UV400 unisex", "Paño de microfibra x3",
      "Spray limpiador de lentes 60ml", "Cordón porta anteojos x2",
      "Gotas descongestivas oculares 15ml", "Parche ocular adhesivo x10",
    ],
    variantes: ["", "con estuche", "premium"],
  },
] as const;

// Qué categorías toca cada tipo de proveedor (heurística por nombre)
function categoriasDe(proveedor: string): Categoria[] {
  const p = proveedor.toLowerCase();
  const by = (...nombres: string[]) =>
    CATEGORIAS.filter((c) => nombres.includes(c.nombre));
  if (p.includes("dermo") || p.includes("piel") || p.includes("rostro") || p.includes("derm"))
    return by("dermo", "higiene");
  if (p.includes("perfum") || p.includes("aroma") || p.includes("esencia") || p.includes("tocador"))
    return by("perfumeria", "higiene");
  if (p.includes("suplemento") || p.includes("nutrition") || p.includes("nutri") || p.includes("proteo") || p.includes("omega") || p.includes("herbolaria") || p.includes("natural") || p.includes("wellness"))
    return by("suplementos", "otc");
  if (p.includes("bebé") || p.includes("bebe") || p.includes("infantil") || p.includes("baby") || p.includes("pasos"))
    return by("infantil", "higiene");
  if (p.includes("descartable") || p.includes("insumed") || p.includes("botiquín") || p.includes("botiquin") || p.includes("auxilios") || p.includes("tecnosalud") || p.includes("hospitalario") || p.includes("equipamiento"))
    return by("botiquin");
  if (p.includes("óptica") || p.includes("optica") || p.includes("visión") || p.includes("lentes") || p.includes("audio"))
    return by("optica", "botiquin");
  if (p.includes("droguería") || p.includes("drogueria"))
    return by("otc", "higiene", "botiquin");
  if (p.includes("higie") || p.includes("aquavital") || p.includes("blancaflor"))
    return by("higiene", "perfumeria");
  if (p.includes("ortopedia") || p.includes("mayor"))
    return by("botiquin", "otc");
  // laboratorios / farmacéuticas genéricas
  return by("otc", "dermo", "suplementos");
}

interface FilaProducto {
  codigo: string;
  descripcion: string;
  precio: number;
  stand: number;
  foto?: string;
  stock?: number;
}

function generarProductos(): FilaProducto[] {
  const filas: FilaProducto[] = [];
  PROVEEDORES.forEach((proveedor, i) => {
    const standId = i + 1;
    const cats = categoriasDe(proveedor);
    const marcas = [pick(MARCAS), pick(MARCAS), pick(MARCAS), pick(MARCAS)];
    // objetivo ~150 promedio → ~9.000 en total, con algo de variedad
    let objetivo = randInt(125, 190);
    if (standId === 7) objetivo = 45; // un stand chico, para probar UI
    if (standId === 23) objetivo = 260; // un stand grande
    const vistas = new Set<string>();
    let intentos = 0;
    while (vistas.size < objetivo && intentos < objetivo * 30) {
      intentos++;
      const cat = pick(cats);
      const base = pick(cat.bases);
      const marca = pick(marcas);
      const variante = pick(cat.variantes);
      const descripcion = [marca, base, variante].filter(Boolean).join(" ");
      if (vistas.has(descripcion)) continue;
      vistas.add(descripcion);

      const bruto =
        cat.precioMin + rnd() * rnd() * (cat.precioMax - cat.precioMin);
      const precio = Math.round(bruto / 50) * 50;

      const fila: FilaProducto = {
        codigo: nextEan13(),
        descripcion,
        precio: Math.max(precio, cat.precioMin),
        stand: standId,
      };
      if (rnd() < 0.12) fila.foto = `/img/demo/prod-${randInt(1, 8)}.svg`;
      if (rnd() < 0.5) fila.stock = rnd() < 0.06 ? 0 : randInt(1, 250);
      filas.push(fila);
    }
  });
  return filas;
}

async function main() {
  const outDir = path.join(process.cwd(), "data-src");
  mkdirSync(outDir, { recursive: true });

  // ---- stands.xlsx ----
  const wbStands = new ExcelJS.Workbook();
  const wsStands = wbStands.addWorksheet("Stands");
  wsStands.addRow(["Stand", "Proveedor"]);
  PROVEEDORES.forEach((proveedor, i) => {
    wsStands.addRow([i + 1, proveedor]);
  });
  await wbStands.xlsx.writeFile(path.join(outDir, "stands.xlsx"));

  // ---- productos.xlsx ----
  const productos = generarProductos();
  const wbProd = new ExcelJS.Workbook();
  const wsProd = wbProd.addWorksheet("Productos");
  wsProd.addRow([
    "Código de barras",
    "Descripción",
    "Precio",
    "Stand",
    "Foto",
    "Stock",
  ]);
  for (const p of productos) {
    wsProd.addRow([
      p.codigo,
      p.descripcion,
      p.precio,
      p.stand,
      p.foto ?? "",
      p.stock ?? "",
    ]);
  }
  await wbProd.xlsx.writeFile(path.join(outDir, "productos.xlsx"));

  console.log(`✔ data-src/stands.xlsx    → ${PROVEEDORES.length} stands`);
  console.log(`✔ data-src/productos.xlsx → ${productos.length} productos`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
