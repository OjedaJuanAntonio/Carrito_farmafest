import type { Metadata } from "next";
import { loadStandsAtBuild } from "@/lib/build-data";
import { QrSheet } from "@/components/QrSheet";

export const metadata: Metadata = {
  title: "QRs para imprimir",
  description:
    "Genera el código QR de cada stand y del buscador de pasillo, listos para imprimir y pegar en el predio.",
  robots: { index: false, follow: false },
};

/**
 * Página operativa (no enlazada desde el público): genera los QR de todos los
 * stands + un QR de pasillo, para imprimir y pegar en el evento. Los stands se
 * enumeran en build; los QR se arman en el cliente con la URL real del sitio.
 */
export default async function QrPage() {
  const stands = await loadStandsAtBuild();
  return <QrSheet stands={stands.map((s) => ({ id: s.id, proveedor: s.proveedor }))} />;
}
