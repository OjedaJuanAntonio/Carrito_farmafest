"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

type StandLite = { id: number; proveedor: string };

/**
 * Hoja de QRs para imprimir: un QR por stand (→ /stand/<id>/) más un QR de
 * pasillo (→ /). Los QR se arman en el cliente con la URL real del sitio
 * (window.location.origin), así funcionan en cualquier dominio donde se sirva.
 */
export function QrSheet({ stands }: { stands: StandLite[] }) {
  const [origin, setOrigin] = useState("");
  const [cols, setCols] = useState(3);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  return (
    <div className="pt-4">
      {/* Controles: no se imprimen */}
      <div className="no-print">
        <h1 className="text-xl font-bold px-1">QRs para imprimir</h1>
        <p className="text-sm text-ink-muted mt-1 px-1">
          Un QR por stand (lleva a su mini-tienda) y uno de pasillo (lleva al
          buscador general). Imprimí y pegá cada uno en su lugar del predio.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-3 px-1">
          <button
            onClick={() => window.print()}
            className="h-11 px-5 rounded-xl bg-brand text-white font-semibold active:bg-brand-dark"
          >
            Imprimir
          </button>
          <label className="text-sm text-ink-muted flex items-center gap-2">
            Columnas:
            <select
              value={cols}
              onChange={(e) => setCols(Number(e.target.value))}
              className="h-9 rounded-lg border border-border-c bg-surface px-2"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </select>
          </label>
          {origin && (
            <span className="text-[11px] text-ink-muted">
              URL base: {origin}
            </span>
          )}
        </div>
        <p className="text-[11px] text-ink-muted mt-2 px-1">
          Consejo: imprimí desde una computadora para mejor calidad. Verificá
          que la URL base sea la definitiva del evento antes de imprimir.
        </p>
      </div>

      {!origin ? (
        <p className="text-center text-ink-muted py-10">Generando QRs…</p>
      ) : (
        <div
          className="qr-grid mt-4 grid gap-3"
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          <QrCard
            titulo="Pasillo"
            subtitulo="Buscador general del evento"
            url={`${origin}/`}
          />
          {stands.map((s) => (
            <QrCard
              key={s.id}
              titulo={`Stand ${s.id}`}
              subtitulo={s.proveedor}
              url={`${origin}/stand/${s.id}/`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function QrCard({
  titulo,
  subtitulo,
  url,
}: {
  titulo: string;
  subtitulo: string;
  url: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 512,
      color: { dark: "#111111", light: "#ffffff" },
    })
      .then((d) => {
        if (!cancelled) setDataUrl(d);
      })
      .catch(() => {
        if (!cancelled) setDataUrl(null);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="qr-card flex flex-col items-center text-center rounded-xl border border-border-c bg-white p-3">
      <p className="text-sm font-bold text-brand-dark leading-tight">{titulo}</p>
      <p className="text-[11px] text-ink-muted leading-tight mt-0.5 line-clamp-2 min-h-[2.2em]">
        {subtitulo}
      </p>
      {dataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={dataUrl}
          alt={`QR de ${titulo}`}
          className="w-full max-w-[200px] aspect-square mt-2"
        />
      ) : (
        <div className="w-full max-w-[200px] aspect-square mt-2 bg-bg animate-pulse rounded" />
      )}
      <p className="text-[9px] text-ink-muted break-all mt-1 leading-tight">
        {url.replace(/^https?:\/\//, "")}
      </p>
    </div>
  );
}
