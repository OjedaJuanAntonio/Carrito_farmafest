# Publicar precios en la web

La web del carrito se alimenta de **un solo archivo: el export/import de
POSBerry** (`POSBERRY_IMPORT.xlsx`), el mismo que usa la facturación. No hay una
planilla de precios aparte para la web.

> **POSBerry manda.** El archivo trae el **precio regular** (`*Precio de Venta`)
> y el **nombre de la familia** (`Familia`, ej. `40%`, `2X1`, `2DO70%`). La
> ingesta calcula el **precio mostrado** según la familia, usando la misma
> cuenta que las etiquetas, así queda **etiqueta = web**.

```
Actualizás el Excel de POSBerry  →  lo subís a data-src/ (web de GitHub o git)
        │
        ▼
GitHub Action corre la ingesta (valida + calcula ofertas) + commitea
        │
        ▼
Cloudflare Pages redeploya  →  precios nuevos online (~2–3 min)
```

## Archivos que usa la web (en `data-src/`)

| Archivo | Qué es | Cada cuánto cambia |
|---------|--------|--------------------|
| `productos.xlsx` | El export de POSBerry (`POSBERRY_IMPORT.xlsx`), renombrado. **Acá viven los precios.** | Cada vez que cambian precios/ofertas |
| `familias.csv` | Diccionario de mecánicas: `Familia, Tipo, Valor, Etiqueta` | Solo si aparece una familia nueva |
| `stands.csv` / `stands.xlsx` | Mapeo `Stand, Proveedor, CUIT` | Solo si aparece un proveedor nuevo |

### `productos.xlsx` — columnas que lee la web
Es el archivo de POSBerry tal cual (sus columnas fijas). La web solo usa:

| Columna POSBerry   | Para qué |
|--------------------|----------|
| `Codigo de Barras` | **EAN**: identifica el producto y linkea la foto |
| `*Descripcion`     | Nombre (se muestra tal cual) |
| `*Precio de Venta` | **Precio regular** (antes de la oferta) |
| `Familia`          | **Nombre** de la familia (la mecánica sale de `familias.csv`) |
| `CUIT Proveedor`   | Asigna el **stand** (ver `stands.csv`) |

Se publican **todos** los productos. Las demás columnas las usa POSBerry y se
ignoran. El código que importa es `Codigo de Barras` (EAN), no `*Codigo`.

### `familias.csv` — mecánica de cada oferta

| Columna    | Qué poner |
|------------|-----------|
| `Familia`  | El nombre **exacto** como figura en el Excel (`40%`, `2X1`, `2DO70%`…) |
| `Tipo`     | `PORCENTAJE`, `2X1`, `SEGUNDO` o `NINGUNA` (si lo dejás vacío, se infiere del nombre) |
| `Valor`    | Fracción del descuento: `0.40` (o `40` / `40%`). Obligatorio en `PORCENTAJE` |
| `Etiqueta` | Texto del badge (opcional; si falta se deriva del tipo) |

Cómo se muestra cada tipo:
- **PORCENTAJE** (`40%`): precio regular **tachado** + precio con descuento + badge `-40%`.
- **2X1**: regular **tachado** + precio a la mitad con **"c/u"** + badge `2x1`.
- **SEGUNDO** (`2DO70%`): **solo** el precio regular + badge `2do al 70%` (no calcula precio por unidad).
- Familia que no esté en la tabla → se publica **sin oferta** (queda avisado en el reporte).

### `stands.csv` — mapeo por CUIT
`Stand, Proveedor, CUIT`. Cada producto va al stand cuyo `CUIT` coincide con su
`CUIT Proveedor`. Si un mismo CUIT cayera en varios stands, gana el **menor**.
Plantilla con los 56 stands en `data-src/stands.csv` (completá la columna CUIT).

## Publicar

### Opción A — subir el Excel por GitHub (recomendada, sin instalar nada)
1. En el repo, entrá a `data-src/` → `productos.xlsx` → **Upload / Replace file**
   y subí tu export de POSBerry (nombralo `productos.xlsx`).
2. Confirmás el commit. El Action **Publicar precios** corre solo (pestaña
   **Actions**): valida, calcula ofertas y publica. En ~2–3 min está online.
3. El reporte (filas descartadas, familias desconocidas) queda en el resumen del
   run.

### Opción B — desde la notebook (respaldo)
Con el repo clonado y Node: dejá el archivo en `data-src/productos.xlsx` y corré
`npm run publish:data` (corre la ingesta y publica). Útil para la carga inicial.

## Imágenes

**Recomendado: nombrá cada foto con el código de barras** y ponelas en
`public/img/productos/` (`7791000000017.webp`). La app vincula sola cada
producto con `<su-código>.<ext>`; los que no tienen archivo muestran un
placeholder. Extensiones: webp/avif/jpg/jpeg/png/gif/svg (mejor **.webp**). Para
alojarlas aparte, un bucket **Cloudflare R2** público + `IMAGE_BASE_URL`. **No
uses Google Drive** (bloquea el hotlink).

## (Opcional) Planilla de Google como capa de edición

Si en algún momento se quiere editar en vivo desde una planilla, se puede
publicar una pestaña `Productos` (mismo formato POSBerry) como CSV y cargar su
URL en la variable `SHEET_PRODUCTOS_URL` del repo (ídem `SHEET_STANDS_URL`,
`SHEET_FAMILIAS_URL`); el botón de Apps Script (`Codigo.gs`) dispara el mismo
Action. **Esto es solo una capa de publicación llenada desde la verdad de
POSBerry, no una segunda fuente de precios.** Por defecto no se usa: el master
es el Excel de POSBerry.
