# Fotos de productos

Poné acá las fotos **nombradas con el código de barras** del producto:

```
7791000000017.jpg
7790123456789.webp
7791000000024.png
```

La app las vincula sola: no hace falta llenar la columna **Foto** de la
planilla. El producto cuyo código coincide con el nombre del archivo toma esa
imagen; los que no tienen archivo muestran un placeholder digno.

- Extensiones válidas: `.webp`, `.avif`, `.jpg`, `.jpeg`, `.png`, `.gif`,
  `.svg`. Recomendado **.webp** (más liviano) o `.jpg`.
- Tamaño sugerido: cuadradas, ~400×400 px. Se muestran chicas en el teléfono.
- Cambiar/agregar fotos requiere un commit + rebuild (no es "en caliente" como
  los precios, pero las fotos casi no cambian). Quedan **offline** una vez
  vistas (el service worker las cachea a demanda).
- La columna **Foto** de la planilla, si se completa, tiene prioridad sobre
  esta carpeta (sirve para excepciones o una URL externa puntual).

> Alternativa remota (Cloudflare R2): en vez de esta carpeta, subir las fotos
> a un bucket y configurar `IMAGE_BASE_URL`. En ese caso conviene pedir que se
> agregue el cacheo offline para ese dominio.
