import type { Metadata } from "next";
import { loadStandsAtBuild } from "@/lib/build-data";
import { StandView } from "@/components/StandView";

/**
 * Página de stand: /stand/[id]
 * El cliente llega escaneando el QR pegado en el stand.
 * El shell es estático (una ruta por stand, enumeradas en build);
 * productos y precios se cargan en runtime desde /data/stand/<id>.json.
 */

export const dynamicParams = false;

export async function generateStaticParams() {
  const stands = await loadStandsAtBuild();
  return stands.map((s) => ({ id: String(s.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const stands = await loadStandsAtBuild();
  const stand = stands.find((s) => String(s.id) === id);
  return {
    title: stand ? `Stand ${stand.id} · ${stand.proveedor}` : `Stand ${id}`,
  };
}

export default async function StandPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const stands = await loadStandsAtBuild();
  const stand = stands.find((s) => String(s.id) === id);
  return (
    <StandView
      standId={Number(id)}
      proveedorInicial={stand?.proveedor ?? `Stand ${id}`}
    />
  );
}
