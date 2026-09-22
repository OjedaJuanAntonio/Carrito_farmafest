/**
 * Flags de funcionalidad de alto nivel: un solo lugar para prender o apagar
 * módulos enteros de la app sin borrar código.
 */
export const FEATURES = {
  /**
   * Carrito y checkout. El foco del evento es el catálogo de precios y fotos,
   * así que por ahora está APAGADO: no se muestran el botón "Agregar", el
   * ícono/badge del carrito, la barra flotante de "Ver carrito" ni los enlaces
   * a /carrito. Las rutas /carrito y /caja siguen existiendo pero no se
   * enlazan desde ningún lado. Poné `true` para reactivar todo el flujo.
   */
  carrito: false,

  /**
   * Mapa del predio en la home (SVG clickeable con la ubicación de cada stand).
   * Poné `false` para ocultarlo.
   */
  mapa: true,
} as const;
