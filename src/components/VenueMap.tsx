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
 * sus líneas, zonas y nombres) de fondo, y encima un hotspot clickeable por
 * cada stand → /stand/<id>. Los hotspots son transparentes y se resaltan al
 * tocar/enfocar, así el plano se ve tal cual pero cada stand es tappeable.
 * Va en un contenedor con scroll horizontal: en el teléfono se desliza para
 * recorrer todo el predio sin achicar el plano.
 */
export function VenueMap() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-border-c bg-white p-2 shadow-sm">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VENUE_VIEWBOX.w} ${VENUE_VIEWBOX.h}`}
          role="group"
          aria-label="Mapa del predio con los stands del evento"
          className="block h-auto w-full"
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
            <Hotspot
              key={s.id}
              s={s}
              onOpen={() => router.push(`/stand/${s.id}/`)}
            />
          ))}
        </svg>
      </div>
    </div>
  );
}

function Hotspot({ s, onOpen }: { s: VenueBox; onOpen: () => void }) {
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
      <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={6} />
    </g>
  );
}
