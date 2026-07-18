"use client";

import { useEffect } from "react";

/**
 * Registra el service worker (solo existe tras el build; en dev no hay sw.js
 * y el registro falla en silencio). Una vez registrado, la app funciona con
 * conectividad mala o nula.
 */
export function SwRegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    let timer: number | undefined;
    const register = () => {
      // Diferido unos segundos: en 4G mala, el precache (~3 MB) no debe
      // competir con el render inicial de la página.
      timer = window.setTimeout(() => {
        navigator.serviceWorker.register("/sw.js").catch(() => {
          // dev o navegador sin soporte: la app funciona igual, sin offline
        });
      }, 4000);
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
