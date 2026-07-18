# Decisiones de diseño — Carrito Farmafest

Registro de decisiones tomadas de forma autónoma durante el desarrollo.
Formato: contexto → decisión → por qué.

## Stack y arquitectura

- **Scaffold manual en vez de create-next-app**: control total de versiones y
  cero archivos basura. Next 15 (App Router) + React 19 + TS strict + Tailwind 4.
- **`trailingSlash: true`** en `next.config.ts`: el export genera
  `/stand/12/index.html`, que funciona en cualquier hosting estático (Vercel,
  nginx, S3) sin reglas de rewrite.
- **Rutas de stand estáticas (`generateStaticParams`)**: los 60 stands se
  enumeran en build leyendo `public/data/stands.json`. Alta/baja de un stand ⇒
  rebuild (aceptable: la lista de stands se congela antes del evento; los
  PRECIOS no requieren rebuild, ver "Datos en runtime").
- **Fuente tipográfica del sistema** (system-ui): cero bytes de webfont, cero
  dependencia de red → mejor arranque en 4G mala y offline trivial.
- **Sin librería de búsqueda** (ni Fuse ni MiniSearch): un escaneo lineal sobre
  texto normalizado (sin acentos, minúsculas) resuelve 9.000 productos en <5 ms
  en un teléfono medio. Menos bundle y comportamiento 100% predecible.
  Búsqueda por código de barras: prefijo numérico de 4+ dígitos.

## Datos

- **Los JSON generados se commitean al repo** (`public/data/`): publicar
  precios = `npm run ingest` + commit + push. Vercel sirve los archivos nuevos
  en ~1 min sin rebuild lógico de la app (el build de Vercel solo re-exporta;
  la app igual los lee en runtime por fetch, nunca del bundle).
- **Fetch con `cache: "no-cache"`**: el navegador revalida contra el CDN
  (ETag → 304 si no cambió). El service worker (M4) agrega fallback offline.
  No se usan query-strings de versión: simplifica el cacheo del SW.
- **Índice global compacto** (`index.json`): array de tuplas
  `[codigo, descripcion, precio, stand]` sin claves repetidas (~9.000 filas ≈
  menos de la mitad del peso que con objetos). Sin foto en el índice: el
  resultado de búsqueda linkea al stand, donde sí se ve la foto.
- **Ingesta tolerante en encabezados**: matchea columnas por nombre
  normalizado con alias ("Código de barras", "codigo", "EAN"…). El Excel real
  de la red de farmacias probablemente no tenga exactamente nuestros headers.
- **Filas con error se descartan y se reportan** (fila + motivo, consola y
  `reports/ingesta-report.txt`); la ingesta no se cae por filas rotas.
  Advertencias (checksum EAN dudoso, stock ilegible) no descartan la fila.
- **Precios**: acepta número Excel o texto en formato AR ("$ 1.234,50").
  Heurística documentada en `scripts/lib/ingesta.ts::parsearPrecio`.
- **Datos de ejemplo determinísticos** (PRNG con semilla): 60 proveedores
  ficticios pero plausibles, ~9.200 productos, EAN-13 válidos con prefijo 779.
  Nombres inventados a propósito (no marcas reales) para poder mostrar la
  demo sin problemas. ~12% de productos con foto (SVGs locales de ejemplo),
  ~50% con stock (6% en cero) para ejercitar todos los estados del UI.

## UI

- **Mobile-first estricto**: layout de una columna `max-w-lg` centrado;
  en desktop queda como columna angosta (uso esperado: 99% teléfonos).
- **Placeholder de producto propio (SVG)** cuando no hay foto o la foto
  falla al cargar (`onerror`), sin romper el layout.
- **Header de marca sticky** + buscador sticky debajo: en listas largas el
  usuario siempre tiene la búsqueda a mano.
- **Stock**: solo se muestra si viene el dato ("Stock: N" o "Sin stock");
  si no viene, no aparece nada. Sin stock NO bloquea agregar al carrito
  (el dato puede estar desactualizado; la caja del stand decide).

## Carrito y checkout (M3)

- **Carrito en localStorage** (`farmafest.cart.v1`), estado compartido entre
  vistas con `useSyncExternalStore` y entre pestañas con el evento `storage`.
  Lógica pura en `src/lib/cart.ts` (testeable sin browser).
- **Checkout POR STAND**: el carrito se agrupa por stand y cada grupo tiene su
  botón de caja (`/caja/[standId]`), porque cada stand cobra en su propia caja.
- **Sin stock NO bloquea el agregado**: el dato de stock puede venir viejo del
  Excel; la caja del stand es la fuente de verdad al cobrar.
- **Precios del carrito se refrescan** al abrir /carrito con el catálogo
  actual (pueden cambiar durante el evento). Si un producto ya no está en el
  catálogo, se conserva tal cual (el POS decide).
- **Estrategia de checkout configurable en UN punto**:
  `src/lib/checkout/config.ts` (`CHECKOUT_VARIANT`). Tres variantes detrás de
  la interfaz `CheckoutStrategy`:
  - `pantalla`: lista legible (qty, descripción, código en mono grande, total);
  - `qr-codigos`: QR de texto plano, un renglón `código;cantidad` por producto;
  - `qr-compacto`: QR `FF1|stand|totalCents|codigo:qty,...` — encoder y parser
    de referencia aislados en `compact-encoder.ts` para cuando se defina
    POSBerry.
  Las variantes con QR muestran SIEMPRE la lista legible como respaldo.
  Para demos/pruebas: `?variante=` en la URL de caja overridea la config.
- **QR client-side** con la lib `qrcode` (canvas): funciona offline; corrección
  de errores M; si el payload no entra en el QR se degrada a la lista.
- **"Ya pasé por la caja"** vacía solo los ítems de ese stand, con
  confirmación inline (sin `window.confirm`, que se ve pobre en mobile).

## Branding

- **Un solo archivo**: `src/config/branding.ts` (nombre, tagline, logos,
  paleta completa). Los colores se inyectan como CSS custom properties en
  `<html>` y Tailwind los consume vía `@theme inline` en `globals.css`.
  Cambiar la paleta de marketing = editar ese único archivo.
- Tema inicial neutro: verde farmacia desaturado + acento ámbar.

## Docker

- `docker compose up dev` → desarrollo con hot reload (node 24 alpine).
- `docker compose up --build web` → build de producción servido por nginx
  en :8080, con los mismos Cache-Control que conviene tener en el CDN
  (assets inmutables, `/data/` y `sw.js` no-cache).
