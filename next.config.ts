import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita el warning por lockfiles en directorios superiores (OneDrive).
  outputFileTracingRoot: path.join(__dirname),
  experimental: {
    // Inlinea el CSS crítico por página (critters): sin stylesheet
    // render-blocking en la primera pintura, clave en 4G de predio.
    optimizeCss: true,
  },
  // Sitio 100% estático: sin SSR ni API routes. Deploy como archivos planos.
  output: "export",
  // Genera /stand/12/index.html → funciona en cualquier hosting estático.
  trailingSlash: true,
  images: {
    // Sin servidor de optimización de imágenes en export estático.
    unoptimized: true,
  },
};

export default nextConfig;
