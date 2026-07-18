/**
 * ÚNICO punto de configuración de marca.
 *
 * Cuando marketing pase la paleta y los logos definitivos:
 *  1. Reemplazar los colores de `colors` (hex).
 *  2. Poner los archivos de logo en /public/img/ y actualizar las rutas.
 *  3. Cambiar `name` / `tagline` si hace falta.
 * No hay que tocar ningún otro archivo.
 */
export const branding = {
  /** Nombre visible de la app */
  name: "Farmafest",
  /** Bajada corta que aparece en la home */
  tagline: "Tu carrito del evento",
  /** Fechas del evento (solo texto informativo) */
  eventDates: "15 al 17 de septiembre de 2026",

  /** Logo grande (home / splash). SVG o PNG en /public */
  logoLarge: "/img/logo-large.svg",
  /** Logo chico (header). SVG o PNG en /public */
  logoSmall: "/img/logo-small.svg",

  colors: {
    /** Color principal: botones, header, acentos */
    primary: "#0d7a6a",
    /** Variante oscura del principal (hover / estados activos) */
    primaryDark: "#095e52",
    /** Fondo suave derivado del principal (chips, highlights) */
    primarySoft: "#e2f3f0",
    /** Color de acento secundario (badges, precios destacados) */
    accent: "#f59e0b",
    /** Fondo general de la app */
    background: "#f7f8f8",
    /** Fondo de tarjetas y superficies elevadas */
    surface: "#ffffff",
    /** Texto principal */
    ink: "#1a2421",
    /** Texto secundario */
    inkMuted: "#5c6b66",
    /** Bordes y separadores */
    border: "#e3e8e6",
    /** Color de error / alertas */
    danger: "#dc2626",
  },
} as const;

export type Branding = typeof branding;

/** CSS custom properties que consume Tailwind (ver globals.css). */
export function brandingCssVars(): Record<string, string> {
  const c = branding.colors;
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
  };
}
