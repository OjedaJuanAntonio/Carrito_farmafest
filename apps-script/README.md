# Publicar precios desde Google Sheets

Este flujo permite que **cualquier persona edite precios, ofertas y stock en
una planilla de Google y publique con un botón**, sin tocar el repositorio ni
esperar a un desarrollador.

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

Creá un Google Sheet con **dos pestañas**:

**Pestaña `Stands`**

| Stand | Proveedor            |
|-------|----------------------|
| 1     | Laboratorios Andino  |
| 2     | Droguería del Centro |

**Pestaña `Productos`** (las columnas opcionales pueden faltar)

| Código de barras | Descripción          | Precio | Precio anterior | Oferta | Stand | Foto        | Stock |
|------------------|----------------------|--------|-----------------|--------|-------|-------------|-------|
| 7791000000017    | Ibuprofeno 400mg x10 | 3500   | 4500            |        | 1     | ibu.jpg     | 20    |
| 7791000000024    | Shampoo 400ml        | 2100   |                 | 2x1    | 2     |             |       |

- **Precio anterior**: opcional; se muestra tachado y genera el badge `-X%`
  (solo si es mayor al precio).
- **Oferta**: opcional; etiqueta libre (`2x1`, `Combo`, `Lanzamiento`). Si hay
  descuento de precio, el badge muestra el `-X%`; la etiqueta se usa cuando no
  hay baja de precio.
- **Foto** y **Stock**: opcionales. La foto puede ser una URL completa o solo
  el nombre del archivo (ver "Imágenes" abajo).
- Los encabezados toleran variantes (mayúsculas, acentos, "EAN", "Nº de stand").

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

## Imágenes

Tres opciones para la columna **Foto**:

1. **URL completa** (`https://…/ibu.jpg`): se usa tal cual.
2. **Nombre de archivo** (`ibu.jpg`) + `IMAGE_BASE_URL` configurada: se arma
   `IMAGE_BASE_URL/ibu.jpg`. Mantiene la planilla limpia.
3. **Sin foto**: se muestra un placeholder digno (ningún flujo depende de la
   imagen).

**Dónde alojar las fotos**: lo recomendado es un bucket **Cloudflare R2**
(mismo proveedor que el hosting, sin costo de egreso) y poner su URL pública
como `IMAGE_BASE_URL`. También sirve cualquier hosting de imágenes que permita
hotlinking. (Google Drive **no** es confiable para esto: bloquea el hotlink).

## Sin planilla (respaldo)

El flujo con Excel local sigue funcionando: `npm run publish:data` corre la
ingesta sobre `data-src/*.xlsx` y publica. Útil para la carga inicial o si
Google no está disponible.
