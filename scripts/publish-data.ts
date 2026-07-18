/**
 * Publicación de datos EN UN SOLO COMANDO:
 *
 *   npm run publish:data
 *
 * Flujo: corrijo el Excel → npm run publish:data → listo.
 *  1. Corre la ingesta (valida y regenera public/data/*).
 *  2. Si hay cambios, commitea SOLO public/data y pushea.
 *  3. Vercel despliega los JSON nuevos (~1 min). La app los levanta en la
 *     próxima carga/revalidación, sin rebuild de código.
 *
 * Si la ingesta descarta filas, pide confirmación explícita con --force.
 */
import { execSync, spawnSync } from "child_process";

function run(cmd: string): string {
  return execSync(cmd, { encoding: "utf8" }).trim();
}

function main() {
  console.log("① Corriendo ingesta…\n");
  const ingest = spawnSync("npx", ["tsx", "scripts/ingest.ts"], {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (ingest.status !== 0) {
    console.error("\n✖ La ingesta falló; no se publica nada.");
    process.exit(ingest.status ?? 1);
  }

  const reporte = run("git status --porcelain -- public/data");
  if (!reporte) {
    console.log("\n✔ Los datos no cambiaron; nada que publicar.");
    return;
  }

  console.log("\n② Publicando JSON de datos…");
  run("git add public/data");
  const fecha = new Date().toLocaleString("es-AR", { hour12: false });
  execSync(
    `git commit -m "datos: actualización de catálogo (${fecha})"`,
    { stdio: "inherit" }
  );
  execSync("git push", { stdio: "inherit" });
  console.log(
    "\n✔ Publicado. Vercel sirve los datos nuevos en ~1 minuto; la app los toma en la próxima carga (sin redeploy de código)."
  );
}

main();
