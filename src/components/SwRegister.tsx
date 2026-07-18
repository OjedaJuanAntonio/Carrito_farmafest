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
    const register = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // dev o navegador sin soporte: la app funciona igual, solo sin offline
      });
    };
    if (document.readyState === "complete") {
      register();
    } else {
      window.addEventListener("load", register, { once: true });
    }
  }, []);
  return null;
}
