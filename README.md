# Carrito Farmafest

App web para el evento **Farmafest** (15–17/09/2026, a confirmar) de la red de
farmacias: ~60 stands de proveedores, ~9.000 productos, pensada para usarse
desde el teléfono en el predio, **con señal mala o sin señal**.

- **100% estática** (Next.js `output: 'export'`): se sirve como archivos
  planos desde Vercel/CDN. Sin backend.
- **PWA offline**: tras la primera visita, todo el catálogo funciona sin
  conexión.
- **Precios actualizables durante el evento sin redeploy** (ver runbook).
- **Carrito local por stand** con checkout por caja de stand (QR).

## Cómo se usa (flujo del evento)

1. El cliente escanea el **QR del stand** → `/stand/12/` (mini-tienda del
   proveedor) o un **QR de pasillo** → `/` (buscador global).
2. Arma el carrito en su teléfono (localStorage, agrupado por stand).
3. En la caja del stand toca **"Pasar por la caja"** → la app muestra un QR
   (o una lista legible) para que el cajero cobre. Sin pasarela de pagos.

## Desarrollo

```bash
npm install
npm run sample-data   # genera Excel de ejemplo (60 stands, ~9.200 productos)
npm run ingest        # Excel → JSON en public/data/
npm run dev           # http://localhost:3000
```

Con Docker:

```bash
docker compose up dev           # desarrollo con hot reload en :3000
docker compose up --build web   # build de producción con nginx en :8080
```

Verificación completa (los cuatro gates):

```bash
npm run build   # export estático + service worker (sin errores ni warnings)
npm test        # ingesta con datos rotos, búsqueda, carrito, QR
npm run lint
npm run preview # sirve out/ en :4173 para probar offline/Lighthouse
```

---

## Runbook del evento

### Publicar un cambio de precio EN CALIENTE (sin redeploy)

1. Corregí el Excel (`data-src/productos.xlsx`, o el archivo real que uses).
2. Un solo comando:

   ```bash
   npm run publish:data
   ```

   Esto corre la ingesta (valida y regenera `public/data/`), commitea **solo
   los JSON de datos** y pushea. Vercel los sirve en ~1 minuto.

3. Los teléfonos toman el precio nuevo en la próxima carga o revalidación
   (la app lee los datos por fetch en runtime, nunca del bundle). Sin señal,
   muestran el último precio conocido y avisan "sin conexión".

Si la ingesta encuentra filas rotas, las descarta y te muestra **fila y
motivo** (también en `reports/ingesta-report.txt`). Revisá antes de publicar.

### Cargar el Excel real (reemplazar los datos de ejemplo)

1. Poné los archivos en `data-src/`:
   - `productos.xlsx` — columnas: **Código de barras, Descripción, Precio,
     Stand** y opcionales **Foto, Stock**. Los encabezados se matchean con
     tolerancia (mayúsculas, acentos, variantes tipo "EAN" o "Nº de stand").
   - `stands.xlsx` — columnas: **Stand, Proveedor**.
2. `npm run ingest` y revisá el reporte (filas descartadas, advertencias).
3. Como cambió la lista de stands: `npm run build` y deploy completo
   (`git push` — Vercel rebuildea). Los QR por stand apuntan a
   `https://<dominio>/stand/<numero>/`.

Reglas de la ingesta:
- Códigos: 6–14 dígitos; duplicados se descartan (gana la primera fila).
- Precio: número de Excel o texto AR ("$ 1.234,50"); inválido → fila afuera.
- Stand inexistente en `stands.xlsx` → fila afuera.
- Foto y Stock son **opcionales por diseño**: sin foto se ve un placeholder
  digno; sin stock no se muestra nada. Nunca bloquean un flujo.

### Cambiar la variante de QR del checkout

Un solo punto de cambio: **`src/lib/checkout/config.ts`**

```ts
export const CHECKOUT_VARIANT: CheckoutVariantId = "qr-codigos";
```

| Valor | Qué ve el cajero |
|---|---|
| `"pantalla"` | Lista legible (cantidad, descripción, código grande, total) para leer/tipear |
| `"qr-codigos"` | QR de texto plano: un renglón `código;cantidad` por producto |
| `"qr-compacto"` | QR con payload importable `FF1\|stand\|totalCentavos\|código:cant,...` |

Después del cambio: `npm run build` + deploy. Para **probar** una variante sin
deployar: agregá `?variante=pantalla` (o `qr-codigos`/`qr-compacto`) a la URL
de la caja. Las variantes con QR muestran siempre la lista legible como
respaldo por si el lector falla.

Cuando se defina la integración con POSBerry, el formato compacto se toca
**solo** en `src/lib/checkout/compact-encoder.ts` (incluye el parser de
referencia para el lado del POS).

### Cambiar branding (paleta / logos / nombre)

Todo en **`src/config/branding.ts`**: colores, nombre, tagline, rutas de
logos (poner los archivos en `public/img/`). Nada más que tocar; rebuild y
listo.

La app ya usa la **identidad FarmaFest real** derivada del sitio oficial:
wordmark en `public/img/logo-farmafest.svg`, mark compacto "fa" en
`logo-f.svg` / `icon-f.svg`, tipografía Poppins y la paleta multicolor
(tokens en `branding.festival`, solo uso decorativo — para texto usar
`colors.*`, que ya pasa contraste AA). La landing del evento vive en
**`/evento`** (`src/app/evento/page.tsx`); el buscador sigue en `/` y los
QR de pasillo no cambian.

Pendiente para marketing: PNG 192/512 para el ícono PWA y apple-touch-icon
(iOS no acepta SVG); se agregan en `src/app/manifest.ts`.

---

## Arquitectura (resumen)

```
data-src/*.xlsx ──(npm run ingest)──▶ public/data/
                                       ├── manifest.json    versión de datos
                                       ├── stands.json      directorio
                                       ├── stand/<id>.json  productos por stand
                                       └── index.json       índice de búsqueda
```

- Las páginas son estáticas; **los datos se leen en runtime por fetch** con
  revalidación (`no-cache` + ETag) → publicar JSON nuevos actualiza precios.
- El service worker (generado post-build) precachea el shell completo y
  cachea `/data/` con network-first (timeout 3,5 s → fallback a cache).
- La app "prima" el catálogo completo unos segundos después de la primera
  visita: los 60 stands quedan disponibles offline aunque no se visiten.
- Carrito en localStorage; búsqueda client-side sobre índice compacto
  (insensible a acentos, también por código de barras).

Métricas (Lighthouse mobile, build de producción): performance 97,
accesibilidad 100, best practices 100. Offline verificado de punta a punta.

Más contexto y por qué de cada decisión: **[DECISIONS.md](DECISIONS.md)**.

## Deploy

- **Vercel**: importar el repo, framework Next.js, sin variables de entorno.
  `vercel.json` ya configura los `Cache-Control` de `/data/` y `sw.js`.
- **Cualquier hosting estático**: servir `out/` (ver `docker/nginx.conf` como
  referencia de headers).
