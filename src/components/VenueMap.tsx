"use client";

import { useRouter } from "next/navigation";
import {
  VENUE_VIEWBOX,
  VENUE_STANDS,
  VENUE_PATIOS,
  VENUE_ZONES,
  VENUE_ACCESS,
  type VenueBox,
} from "@/config/venue";

/**
 * Mapa del predio: SVG redibujado del plano oficial
 * (`data-src/plano-predio.png`). Cada stand es clickeable → /stand/<id>.
 * Los patios de comida y las zonas de servicio se muestran solo como
 * referencia. Va en un contenedor con scroll horizontal: en el teléfono se
 * desliza para recorrer todo el predio sin achicar los números.
 */
export function VenueMap() {
  const router = useRouter();

  return (
    <div className="rounded-2xl border border-border-c bg-surface p-2 shadow-sm">
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${VENUE_VIEWBOX.w} ${VENUE_VIEWBOX.h}`}
          role="group"
          aria-label="Mapa del predio con los stands del evento"
          className="block h-auto"
          style={{ minWidth: 720, width: "100%" }}
        >
          {/* Zonas de servicio (referencia) */}
          {VENUE_ZONES.map((z) => (
            <g key={z.nombre}>
              <rect
                x={z.x}
                y={z.y}
                width={z.w}
                height={z.h}
                rx={6}
                fill="var(--bg)"
                stroke="var(--border-c)"
                strokeWidth={2}
              />
              <text
                x={z.x + z.w / 2}
                y={z.y + z.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={16}
                fontWeight={700}
                fill="var(--ink-muted)"
                transform={
                  z.vertical
                    ? `rotate(-90 ${z.x + z.w / 2} ${z.y + z.h / 2})`
                    : undefined
                }
              >
                {z.nombre}
              </text>
            </g>
          ))}

          {/* Accesos */}
          {VENUE_ACCESS.map((a, i) => (
            <text
              key={`${a.nombre}-${i}`}
              x={a.x}
              y={a.y}
              textAnchor="middle"
              fontSize={15}
              fontWeight={700}
              letterSpacing={1}
              fill="var(--ink-muted)"
            >
              {a.nombre}
            </text>
          ))}

          {/* Patios de comida (no clickeables) */}
          {VENUE_PATIOS.map((p) => (
            <g key={`patio-${p.id}`}>
              <rect
                x={p.x}
                y={p.y}
                width={p.w}
                height={p.h}
                rx={6}
                fill="var(--bg)"
                stroke="var(--border-c)"
                strokeWidth={2}
              />
              <text
                x={p.x + p.w / 2}
                y={p.y + p.h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={600}
                fill="var(--ink-muted)"
              >
                Patio
              </text>
            </g>
          ))}

          {/* Stands (clickeables) */}
          {VENUE_STANDS.map((s) => (
            <StandBox key={s.id} s={s} onOpen={() => router.push(`/stand/${s.id}/`)} />
          ))}
        </svg>
      </div>
    </div>
  );
}

function StandBox({ s, onOpen }: { s: VenueBox; onOpen: () => void }) {
  const cx = s.x + s.w / 2;
  const cy = s.y + s.h / 2;
  const fontSize = Math.max(13, Math.min(s.w * 0.42, s.h * 0.5, 26));
  return (
    <g
      className="venue-stand"
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
      <rect
        x={s.x}
        y={s.y}
        width={s.w}
        height={s.h}
        rx={6}
        fill="var(--brand-soft)"
        stroke="var(--brand)"
        strokeWidth={2}
      />
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={fontSize}
        fontWeight={700}
        fill="var(--brand-dark)"
      >
        {s.id}
      </text>
    </g>
  );
}
