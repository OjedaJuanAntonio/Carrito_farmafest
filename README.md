# Carrito Farmafest

App web para el evento **Farmafest** (15–17/09/2026, a confirmar) de la red de
farmacias: ~60 stands de proveedores, ~9.000 productos, pensada para usarse
desde el teléfono en el predio, **con señal mala o sin señal**.

- **100% estática** (Next.js `output: 'export'`): se sirve como archivos
  planos desde Cloudflare Pages / cualquier CDN. Sin backend.
- **PWA offline**: tras la primera visita, todo el catálogo funciona sin
  conexión.
- **Un solo archivo (el export de POSBerry) alimenta facturación y web.** Se
  publica subiéndolo a `data-src/` (o con el botón de la planilla, opcional);
  ver runbook. La ingesta autodetecta el formato POSBerry o el propio.
- **Ofertas**: precio anterior tachado + badge `-X%` / etiqueta (`2x1`…).
- **Carrito local por stand** con checkout por caja de stand (QR). *(El
  carrito quedó en segundo plano; el foco es el catálogo de precios y fotos.)*

> ## ⚠ QR impresos — NO CAMBIAR
> Los códigos QR de los stands **se mandaron a imprimir en físico** y no hay
> tiempo para rehacerlos. Cada QR apunta al **número** de stand
> (`/stand/<n>/`), no al proveedor. En consecuencia:
> - **No cambiar la URL base** del sitio: debe seguir siendo
>   `https://farmafest.pages.dev` (no pasar a dominio propio ni renombrar/borrar
>   el proyecto de Cloudflare Pages mientras los QR estén en uso).
> - **No renumerar ni eliminar stands.** Si un número pasa a otro proveedor, el
>   QR sigue sirviendo: solo hay que actualizar los datos de ese stand. Lo único
>   que no se puede tocar es el número y el dominio.
> - Fuente/entrega de los QR: `src/components/QrSheet.tsx`, página `/qr`, y la
>   carpeta entregada al Drive.

## Cómo se usa (flujo del evento)

1. El cliente escanea el **QR del stand** → `/stand/12/` (mini-tienda del
   proveedor) o un **QR de pasillo** → `/` (buscador global).
2. Arma el carrito en su teléfono (localStorage, agrupado por stand).
3. En la caja del stand toca **"Pasar por la caja"** → la app muestra un QR
   (o una lista legible) para que el cajero cobre. Sin pasarela de pagos.

## Desarrollo

```bash
npm install
npm run sample-data     # genera datos de ejemplo en data-src/sample/
npm run ingest:sample   # sample → JSON en public/data/
npm run dev             # http://localhost:3000
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

### Fuente de datos: una sola por dataset (en `data-src/`)

- **`productos.xlsx`** — el export/import de **POSBerry** (los precios). Es el
  único archivo que se actualiza seguido.
- **`stands.csv`** — `Stand, Proveedor, CUIT` (asigna cada producto a su stand
  por **CUIT**).
- **`familias.csv`** — `Familia, Tipo, Valor, Etiqueta` (mecánica de cada oferta).

La ingesta **autodetecta** el formato: si `productos` trae columna `CUIT`, usa el
modo **POSBerry** (precio regular + descuento por familia + stand por CUIT); si
no, acepta el **formato propio** (`Código de barras, Descripción, Precio, Stand`
+ opcionales `Precio anterior, Oferta, Foto, Stock`) para pruebas/carga manual.
Detalle del formato POSBerry: **[apps-script/README.md](apps-script/README.md)**.

### Publicar precios y ofertas EN CALIENTE (recomendado)

1. Actualizá **`data-src/productos.xlsx`** con el export de POSBerry (subílo por
   la web de GitHub a `data-src/`, o por git).
2. Un **GitHub Action** (`publicar-precios.yml`, trigger `push` a `data-src/**`)
   corre la ingesta, valida y commitea `public/data`; Cloudflare Pages redeploya
   solo. En 2–3 min está online; el reporte queda en la pestaña **Actions**.
   Alternativa local: `npm run publish:data`.
3. Sin señal, los teléfonos muestran el último precio conocido y avisan "sin
   conexión".

> **Opcional — planilla de Google** como capa de edición en vivo: publicar las
> pestañas como CSV y cargar `SHEET_PRODUCTOS_URL` / `SHEET_STANDS_URL` /
> `SHEET_FAMILIAS_URL` como *Variables* del repo; el botón de Apps Script dispara
> el mismo Action. Es solo publicación llenada desde la verdad de POSBerry, **no
> una segunda fuente de precios**. Puesta a punto: apps-script/README.md.

Reglas de la ingesta (iguales para Excel, CSV o planilla):
- Códigos: 6–14 dígitos; duplicados se descartan (gana la primera fila).
- Precio: número o texto AR ("$ 1.234,50"); inválido → fila afuera.
- **POSBerry**: `*Precio de Venta` es el **regular**; la oferta sale de la
  familia (`familias.csv`); el stand se asigna por **CUIT**. Familia desconocida
  → se publica sin oferta (queda avisado).
- **Formato propio**: `Precio anterior` solo si es mayor al precio (genera el
  `-X%`); `Oferta` es etiqueta libre.
- Stand inexistente (o CUIT no mapeado) → fila afuera.
- Foto y Stock **opcionales**: sin foto, placeholder; sin stock, no se muestra.
  **La foto se vincula por código de barras**: archivo `<código>.jpg` en
  `public/img/productos/` (ver apps-script/README.md → Imágenes).

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
data-src/ (productos.xlsx POSBerry + stands.csv + familias.csv)
   │   push a data-src/**   (o planilla Google → botón, opcional)
   ▼
GitHub Action ──(npm run ingest)──▶ public/data/
  (valida + commit)                 ├── manifest.json
   │                                ├── stands.json
   ▼                                ├── stand/<id>.json
Cloudflare Pages redeploya          └── index.json
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
