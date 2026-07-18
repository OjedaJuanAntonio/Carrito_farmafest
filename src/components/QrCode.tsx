"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * Renderiza un QR en canvas, 100% en el cliente (funciona offline).
 * Si el payload no entra en un QR razonable, avisa para usar la lista
 * de respaldo que siempre acompaña al QR.
 */
export function QrCode({ data }: { data: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!canvasRef.current) return;
    setError(false);
    QRCode.toCanvas(canvasRef.current, data, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 300,
      color: { dark: "#1a2421", light: "#ffffff" },
    }).catch(() => setError(true));
  }, [data]);

  if (error) {
    return (
      <p className="text-center text-sm text-danger px-4 py-8">
        El pedido es demasiado grande para un QR. Usá la lista de abajo en la
        caja.
      </p>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="rounded-xl bg-white shadow-md max-w-full"
      aria-label="Código QR del pedido"
    />
  );
}
