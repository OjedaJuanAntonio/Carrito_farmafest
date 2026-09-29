# Publicar precios desde Google Sheets

Este flujo permite que **cualquier persona edite precios y ofertas en una
planilla de Google y publique con un botón**, sin tocar el repositorio ni
esperar a un desarrollador.

> **Un solo archivo para todo.** La planilla usa el **mismo formato que
> POSBerry**: editás precios y descuentos en Google Sheets (el "master"),
> tocás **Publicar** para la web, y cuando necesitás facturar **descargás** la
> pestaña `Productos` como `.xlsx` (Archivo → Descargar → Microsoft Excel) y la
> subís a POSBerry tal cual. La ingesta **detecta el formato POSBerry solo**.

```
Editás la planilla  →  botón "FarmaFest ▸ Publicar precios"
        │
        ▼
Apps Script dispara un GitHub Action  →  ingesta (valida) + commit
        │
        ▼
Cloudflare Pages redeploya  →  precios nuevos online (~2–3 min)
```

## 1. Armar la planilla

Creá un Google Sheet con **dos pestañas**: `Productos` (formato POSBerry) y
`Stands` (mapeo de proveedores).

### Pestaña `Productos` — formato POSBerry

Pegá acá el archivo de POSBerry **tal cual** (sus 28 columnas, en su orden).
La app **solo lee** estas columnas; el resto las usa POSBerry y se ignoran:

| Columna POSBerry     | Para qué la usa la app |
|----------------------|------------------------|
| `Codigo de Barras`   | **EAN**: identifica el producto y linkea la foto |
| `*Descripcion`       | Nombre del producto (se muestra tal cual) |
| `*Precio de Venta`   | **Precio** (de lista) |
| `Familia`            | **Descuento** como fracción: `0.3` = 30% off (vacío = sin oferta) |
| `CUIT Proveedor`     | Asigna el **stand** (ver pestaña Stands) |

- Con descuento en `Familia`: la app muestra el precio de lista **tachado**, el
  precio con descuento (`Precio de Venta × (1 − 0.3)`) y el badge **-X%**.
- Se publican **todos** los productos del archivo. No se usa stock.
- El código que importa es **`Codigo de Barras`** (EAN), no `*Codigo` (interno).

### Pestaña `Stands` — mapeo por CUIT

| Stand | Proveedor            | CUIT          |
|-------|----------------------|---------------|
| 8     | Cuenca               | 20111111125   |
| 6     | Beauty Solutions…    | 30xxxxxxxx x  |

- Cada producto se asigna a su stand haciendo **match del `CUIT Proveedor`**
  (del archivo POSBerry) contra la columna `CUIT` de esta pestaña.
- Si un mismo CUIT quedara asignado a varios stands, gana el de **número menor**.
- Plantilla con los 56 stands: `data-src/stands.csv` (completá la columna CUIT).

> **Formato propio (alternativa).** La ingesta también acepta el formato simple
> (`Código de barras, Descripción, Precio, Stand` + opcionales `Precio anterior,
> Oferta, Foto, Stock`); se usa automáticamente si la planilla **no** tiene
> columna CUIT. Sirve para pruebas o carga manual.

## 2. Publicar cada pestaña como CSV

En Google Sheets: **Archivo → Compartir → Publicar en la web**.

1. Elegí la pestaña **Productos**, formato **CSV**, y copiá la URL.
2. Repetí con la pestaña **Stands**.

Quedan dos URLs tipo
`https://docs.google.com/spreadsheets/d/e/XXXX/pub?gid=0&single=true&output=csv`.

> Los precios van a un sitio público igual, así que publicar el CSV (solo
> lectura) es aceptable. Si preferís mantener la planilla privada, se puede
> usar la API de Google con una cuenta de servicio; avisá y lo cambiamos.

## 3. Cargar las URLs en GitHub

En el repo: **Settings → Secrets and variables → Actions → Variables**, agregá:

| Variable              | Valor                                  |
|-----------------------|----------------------------------------|
| `SHEET_PRODUCTOS_URL` | URL CSV de la pestaña Productos         |
| `SHEET_STANDS_URL`    | URL CSV de la pestaña Stands            |
| `IMAGE_BASE_URL`      | (opcional) base de las fotos, ver abajo |

## 4. Conectar el botón (Apps Script)

1. En la planilla: **Extensiones → Apps Script**.
2. Pegá el contenido de [`Codigo.gs`](./Codigo.gs) y guardá.
3. **Configuración del proyecto → Propiedades del script**, agregá:
   - `GITHUB_REPO` = `OjedaJuanAntonio/Carrito_farmafest`
   - `GITHUB_TOKEN` = un token de GitHub (ver abajo).
4. Recargá la planilla: aparece el menú **FarmaFest**.

**Token de GitHub**: creá un *fine-grained token* (Settings → Developer
settings → Fine-grained tokens) con acceso **solo a este repo** y permiso
**Contents: read and write** (y **Actions: read/write** si querés seguir el
run). Pegalo como `GITHUB_TOKEN`. No se guarda en el código, solo en las
propiedades del script.

## 5. Usar

1. Editá precios/ofertas en la planilla.
2. **FarmaFest → Chequear planilla** (opcional): avisa errores obvios.
3. **FarmaFest → Publicar precios**: confirma y dispara la publicación.
4. En 2–3 min los precios están online. El reporte completo de la ingesta
   (filas descartadas y por qué) queda en la pestaña **Actions** del repo, en
   el resumen del run "Publicar precios".
5. **Para facturar en POSBerry**: en la pestaña `Productos`, **Archivo →
   Descargar → Microsoft Excel (.xlsx)** y subí ese archivo a POSBerry. Es el
   mismo contenido que ves en la web; editás en un solo lugar.

## Imágenes

**Recomendado: nombrá cada foto con el código de barras** y no toques la
planilla. Poné los archivos en `public/img/productos/`:

```
7791000000017.jpg
7790123456789.webp
```

La app vincula sola cada producto con `<su-código>.<ext>`; los que no tienen
archivo muestran un placeholder digno (ningún flujo depende de la imagen). Las
fotos quedan **offline** una vez vistas. Extensiones: webp/avif/jpg/jpeg/png/
gif/svg (mejor **.webp** o `.jpg`). Detalle en
[`public/img/productos/README.md`](../public/img/productos/README.md).

La columna **Foto** de la planilla es opcional y **solo para excepciones**: si
la completás, tiene prioridad. Acepta una URL completa (`https://…/x.jpg`) o un
nombre de archivo + `IMAGE_BASE_URL`.

> **Dónde alojar**: por defecto en el repo (offline, sin servicios). Para
> gestionarlas aparte sin tocar el repo, un bucket **Cloudflare R2** público y
> `IMAGE_BASE_URL` con la columna Foto. **No uses Google Drive**: bloquea el
> hotlink.

## Sin planilla (respaldo)

El flujo con Excel local sigue funcionando: `npm run publish:data` corre la
ingesta sobre `data-src/*.xlsx` y publica. Útil para la carga inicial o si
Google no está disponible.
