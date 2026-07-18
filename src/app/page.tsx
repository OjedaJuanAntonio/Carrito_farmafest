import { loadStandsAtBuild } from "@/lib/build-data";
import { loadWordmarkSvg } from "@/lib/wordmark";
import { HomeView } from "@/components/HomeView";

/**
 * Home: los QR de los pasillos apuntan acá.
 * El directorio de stands y el wordmark van renderizados en el HTML estático
 * (LCP inmediato); en runtime se refresca desde /data/stands.json y el
 * buscador global carga su índice en segundo plano.
 */
export default async function HomePage() {
  const stands = await loadStandsAtBuild();
  return <HomeView initialStands={stands} wordmarkSvg={loadWordmarkSvg()} />;
}
