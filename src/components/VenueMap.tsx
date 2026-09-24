"use client";

import { useRouter } from "next/navigation";
import {
  VENUE_VIEWBOX,
  VENUE_STANDS,
  VENUE_PLANO,
  type VenueBox,
} from "@/config/venue";

/**
 * Mapa del predio: el plano oficial real (`public/img/plano-predio.webp`, con
 * sus líneas, zonas, números y colores) de fondo, y encima, por cada stand,
 * el nombre del proveedor (rótulo ajustado al ancho del box) + un hotspot
 * clickeable que se resalta al tocar/enfocar → /stand/<id>.
 * En un contenedor con el plano a lo ancho; en /mapa entra completo y se puede
 * hacer zoom con los dedos para leer los nombres.
 */
export function VenueMap() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-border-c bg-white p-2 shadow-sm">
      <svg
        viewBox={`0 0 ${VENUE_VIEWBOX.w} ${VENUE_VIEWBOX.h}`}
        role="group"
        aria-label="Mapa del predio con los stands del evento"
        className="block h-auto w-full mx-auto"
        style={{ maxHeight: "80svh" }}
      >
        <image
          href={VENUE_PLANO}
          x={0}
          y={0}
          width={VENUE_VIEWBOX.w}
          height={VENUE_VIEWBOX.h}
          preserveAspectRatio="xMidYMid meet"
        />
        {VENUE_STANDS.map((s) => (
          <Stand key={s.id} s={s} onOpen={() => router.push(`/stand/${s.id}/`)} />
        ))}
      </svg>
    </div>
  );
}

function Stand({ s, onOpen }: { s: VenueBox; onOpen: () => void }) {
  // Fuente proporcional al alto del box (los 5x5 son grandes → nombre grande).
  const fontSize = Math.max(6, Math.min(s.h * 0.17, 12));
  return (
    <g
      className="venue-hotspot"
      role="link"
      tabIndex={0}
      aria-label={`Stand ${s.id}, ${s.nombre}`}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <title>{`Stand ${s.id} · ${s.nombre}`}</title>
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={3} />
      <text
        x={s.x + s.w / 2}
        y={s.y + s.h - 4}
        textAnchor="middle"
        fontSize={fontSize}
        fontWeight={700}
        textLength={s.w - 5}
        lengthAdjust="spacingAndGlyphs"
        fill="#0b2136"
        stroke="#ffffff"
        strokeWidth={fontSize * 0.32}
        paintOrder="stroke"
        strokeLinejoin="round"
        style={{ pointerEvents: "none" }}
      >
        {s.nombre}
      </text>
    </g>
  );
}
