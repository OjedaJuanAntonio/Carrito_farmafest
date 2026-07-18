"use client";

import { useEffect, useState } from "react";

/**
 * Aviso discreto cuando no hay conexión: la app sigue funcionando con los
 * últimos datos cacheados, y conviene que el usuario lo sepa.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    setOffline(!navigator.onLine);
    const goOffline = () => setOffline(true);
    const goOnline = () => setOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online", goOnline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      role="status"
      className="bg-accent/15 text-ink text-xs text-center px-4 py-1.5 border-b border-border-c"
    >
      Sin conexión: estás viendo los últimos precios guardados.
    </div>
  );
}
