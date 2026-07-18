import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
