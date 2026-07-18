/**
 * ÚNICO punto de configuración de marca.
 *
 * Identidad FarmaFest (derivada del sitio oficial farmafest.com.ar):
 * fondo blanco, tipografía Poppins, wordmark multicolor y paleta festival.
 *
 * Notas de accesibilidad:
 *  - El azul de marca puro (#178dff) da 3,3:1 sobre blanco → solo para
 *    elementos grandes/decorativos (está en `festival.azul`).
 *  - `colors.primary` usa un azul apenas más profundo (#0f6fe0, 4,8:1 con
 *    texto blanco) para botones/links; `primaryDark` (6,5:1) para precios
 *    y texto chico. La marca se percibe igual y el texto se lee al sol.
 *
 * Si marketing entrega assets nuevos: reemplazar los archivos en
 * /public/img/ y/o ajustar acá. No hay que tocar ningún otro archivo.
 */
export const branding = {
  /** Nombre visible de la app */
  name: "FarmaFest",
  /** Bajada corta que aparece en la home */
  tagline: "Tu carrito del evento",
  /** Fechas del evento (solo texto informativo) */
  eventDates: "15 al 17 de septiembre de 2026 · a confirmar",
  /** Lugar del evento (texto informativo de la landing) */
  eventPlace: "Corrientes · sede a confirmar",

  /** Wordmark oficial (SVG 3000×700). Se usa en header y hero. */
  logoLarge: "/img/logo-farmafest.svg",
  /** Igual al wordmark: el header lo muestra chico. */
  logoSmall: "/img/logo-farmafest.svg",
  /** Mark compacto "fa" multicolor (transparente, ~cuadrado). */
  logoMark: "/img/logo-f.svg",
  /** Mark sobre fondo blanco redondeado (ícono PWA / manifest). */
  logoIcon: "/img/icon-f.svg",

  colors: {
    /** Azul funcional: botones, links, estados activos (AA con blanco) */
    primary: "#0f6fe0",
    /** Azul profundo: hover, precios, texto chico sobre blanco */
    primaryDark: "#0b55b0",
    /** Fondo suave azulado (chips, highlights, focus ring) */
    primarySoft: "#e5f1ff",
    /** Magenta de marca: badge del carrito, acentos calientes */
    accent: "#f3006c",
    /** Fondo general: blanco apenas quebrado (las tarjetas separan igual) */
    background: "#fafbfd",
    /** Tarjetas y superficies elevadas */
    surface: "#ffffff",
    /** Texto principal */
    ink: "#1c2430",
    /** Texto secundario */
    inkMuted: "#5d6b7a",
    /** Bordes y separadores */
    border: "#e4e9f0",
    /** Errores / alertas */
    danger: "#dc2626",
  },

  /**
   * Paleta festival (colores exactos del wordmark oficial + círculos del
   * sitio). SOLO para uso decorativo: círculos flotantes, chips, números
   * de pasos. No usar para texto chico sobre blanco.
   */
  festival: {
    azul: "#178dff",
    naranja: "#ff4502",
    magenta: "#f3006c",
    /** Variante del magenta apta para TEXTO chico sobre blanco (AA 5:1) */
    magentaTexto: "#d80060",
    lima: "#a1d436",
    amarillo: "#ffd139",
    rosa: "#ff87e5",
    verde: "#00b96d",
    celeste: "#a1daf7",
  },
} as const;

export type Branding = typeof branding;

/** CSS custom properties que consume Tailwind (ver globals.css). */
export function brandingCssVars(): Record<string, string> {
  const c = branding.colors;
  const f = branding.festival;
  return {
    "--brand": c.primary,
    "--brand-dark": c.primaryDark,
    "--brand-soft": c.primarySoft,
    "--accent": c.accent,
    "--bg": c.background,
    "--surface": c.surface,
    "--ink": c.ink,
    "--ink-muted": c.inkMuted,
    "--border-c": c.border,
    "--danger": c.danger,
    "--fest-azul": f.azul,
    "--fest-naranja": f.naranja,
    "--fest-magenta": f.magenta,
    "--fest-magenta-texto": f.magentaTexto,
    "--fest-lima": f.lima,
    "--fest-amarillo": f.amarillo,
    "--fest-rosa": f.rosa,
    "--fest-verde": f.verde,
    "--fest-celeste": f.celeste,
  };
}
