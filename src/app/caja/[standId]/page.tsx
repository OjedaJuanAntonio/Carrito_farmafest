import type { Metadata } from "next";
import { loadStandsAtBuild } from "@/lib/build-data";
import { CajaView } from "@/components/CajaView";

/**
 * Página de caja: /caja/[standId]
 * Presenta el pedido del stand según la estrategia de checkout configurada
 * (pantalla legible o QR). Una ruta estática por stand.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  const stands = await loadStandsAtBuild();
  return stands.map((s) => ({ standId: String(s.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ standId: string }>;
}): Promise<Metadata> {
  const { standId } = await params;
  return { title: `Caja · Stand ${standId}` };
}

export default async function CajaPage({
  params,
}: {
  params: Promise<{ standId: string }>;
}) {
  const { standId } = await params;
  const stands = await loadStandsAtBuild();
  const stand = stands.find((s) => String(s.id) === standId);
  return (
    <CajaView
      standId={Number(standId)}
      proveedor={stand?.proveedor ?? `Stand ${standId}`}
    />
  );
}
