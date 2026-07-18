"use client";

import { useEffect } from "react";
import { fetchManifest, fetchStands } from "@/lib/data";

/**
 * "Priming" de datos para offline: ~12 s después de cargar (cuando el SW ya
 * está instalado y la página quieta), baja todos los JSON de datos
 * (índice + 60 stands) para que el service worker los deje cacheados. Así el catálogo COMPLETO queda disponible sin señal
 * aunque el usuario no haya visitado cada stand.
 *
 * Se repite solo cuando cambia la versión de datos (marcador en localStorage).
 */
const MARKER_KEY = "farmafest.prefetch.version";

export function DataPrefetcher() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return; // sin SW no hay cache útil
    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        const manifest = await fetchManifest();
        if (cancelled) return;
        if (window.localStorage.getItem(MARKER_KEY) === manifest.version) {
          return; // ya tenemos esta versión cacheada
        }
        const stands = await fetchStands();
        // índice global + stands de a tandas de 8 para no saturar la red
        await fetch("/data/index.json", { cache: "no-cache" });
        const ids = stands.map((s) => s.id);
        for (let i = 0; i < ids.length && !cancelled; i += 8) {
          await Promise.all(
            ids
              .slice(i, i + 8)
              .map((id) =>
                fetch(`/data/stand/${id}.json`, { cache: "no-cache" }).catch(
                  () => undefined
                )
              )
          );
        }
        if (!cancelled) {
          window.localStorage.setItem(MARKER_KEY, manifest.version);
        }
      } catch {
        // sin conexión: se reintenta en la próxima visita
      }
    }, 12000);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);
  return null;
}
