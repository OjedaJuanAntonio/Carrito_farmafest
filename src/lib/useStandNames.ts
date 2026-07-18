"use client";

import { useEffect, useState } from "react";
import { fetchStands } from "./data";

/** Mapa standId → nombre de proveedor, cargado una vez en runtime. */
export function useStandNames(): Map<number, string> {
  const [names, setNames] = useState<Map<number, string>>(new Map());
  useEffect(() => {
    let cancelled = false;
    fetchStands()
      .then((stands) => {
        if (cancelled) return;
        setNames(new Map(stands.map((s) => [s.id, s.proveedor])));
      })
      .catch(() => {
        // sin conexión y sin cache: los nombres quedan vacíos, no es crítico
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return names;
}
