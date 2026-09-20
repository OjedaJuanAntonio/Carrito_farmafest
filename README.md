# Carrito Farmafest

App web para el evento **Farmafest** (15–17/09/2026, a confirmar) de la red de
farmacias: ~60 stands de proveedores, ~9.000 productos, pensada para usarse
desde el teléfono en el predio, **con señal mala o sin señal**.

- **100% estática** (Next.js `output: 'export'`): se sirve como archivos
  planos desde Cloudflare Pages / cualquier CDN. Sin backend.
- **PWA offline**: tras la primera visita, todo el catálogo funciona sin
  conexión.
- **Precios y ofertas se editan en un Google Sheet y se publican con un
  botón** (ver runbook), sin tocar el repo.
- **Ofertas**: precio anterior tachado + badge `-X%` / etiqueta (`2x1`…).
- **Carrito local por stand** con checkout por caja de stand (QR). *(El
  carrito quedó en segundo plano; el foco es el catálogo de precios y fotos.)*

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

### Publicar precios y ofertas EN CALIENTE (recomendado: Google Sheets)

1. Editá la planilla de Google (precio, precio anterior, oferta, stock…).
2. En la planilla: menú **FarmaFest → Publicar precios**.
3. En 2–3 minutos los precios están online. Sin señal, los teléfonos muestran
   el último precio conocido y avisan "sin conexión".

Nadie toca el repo. El botón dispara un GitHub Action que corre la ingesta
(validación incluida) y publica; Cloudflare Pages redeploya solo. El reporte
de filas descartadas queda en la pestaña **Actions** del repo.

**Puesta a punto (una vez)**: seguí **[apps-script/README.md](apps-script/README.md)**
— armar la planilla, publicarla como CSV, cargar las URLs como *Variables* del
repo y pegar el script del botón.

**Columnas de la planilla `Productos`**: **Código de barras, Descripción,
Precio, Stand** (requeridas) y opcionales **Precio anterior, Oferta, Foto,
Stock**. Los encabezados toleran mayúsculas, acentos y variantes ("EAN",
"Nº de stand", "Promo"…).

### Publicar por Excel (respaldo, sin planilla)

1. Corregí `data-src/productos.xlsx` (o el archivo real).
2. `npm run publish:data` — corre la ingesta y publica `public/data`.

También podés apuntar la ingesta a una planilla publicada sin el botón:

```bash
SHEET_PRODUCTOS_URL="https://…output=csv" SHEET_STANDS_URL="https://…output=csv" npm run ingest
```

Reglas de la ingesta (iguales para Excel, CSV o planilla):
- Códigos: 6–14 dígitos; duplicados se descartan (gana la primera fila).
- Precio: número o texto AR ("$ 1.234,50"); inválido → fila afuera.
- **Precio anterior**: solo se usa si es mayor al precio (genera el `-X%`).
- **Oferta**: etiqueta libre; con baja de precio el badge muestra el `-X%`.
- Stand inexistente → fila afuera.
- Foto y Stock **opcionales**: sin foto, placeholder; sin stock, no se muestra.
  Nunca bloquean un flujo. **La foto se vincula por código de barras**: se
  nombra el archivo `<código>.jpg` y se deja en `public/img/productos/`, sin
  llenar la columna Foto (ver apps-script/README.md → Imágenes).

> **Alta/baja de stands** cambia las rutas estáticas: eso sí requiere `git
> push` con rebuild (CF Pages) — no es un cambio "en caliente". Los precios y
> ofertas sí lo son.

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
Google Sheet ──(botón)──▶ GitHub Action ──(npm run ingest)──▶ public/data/
  o Excel/CSV local        (valida + commit)                   ├── manifest.json
                                    │                           ├── stands.json
                                    ▼                           ├── stand/<id>.json
                          Cloudflare Pages redeploya            └── index.json
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

- **Cloudflare Pages** (recomendado): conectar el repo. Build command
  `npm run build`, output directory `out`. Sin variables de entorno para la
  app; `public/_headers` ya configura los `Cache-Control`. Para el botón de la
  planilla, cargar `SHEET_PRODUCTOS_URL` / `SHEET_STANDS_URL` (y opcional
  `IMAGE_BASE_URL`) como *Variables* del repo en GitHub (ver
  [apps-script/README.md](apps-script/README.md)).
- **Cualquier hosting estático**: servir `out/` (ver `docker/nginx.conf` como
  referencia de headers).
- **Imágenes de productos**: se recomienda un bucket **Cloudflare R2** público
  y poner su URL como `IMAGE_BASE_URL`; así la planilla lleva solo el nombre
  del archivo.
