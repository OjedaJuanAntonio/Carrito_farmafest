/**
 * Genera public/../out/sw.js DESPUÉS del build (npm run build lo corre solo,
 * ver "postbuild"). Escanea out/ y arma la lista de precache con todos los
 * archivos estáticos EXCEPTO /data/** (los datos se cachean en runtime con
 * network-first para poder actualizar precios sin redeploy).
 *
 * Estrategias del SW:
 *  - estáticos (HTML, JS, CSS, imágenes): cache-first desde el precache
 *  - /data/*.json: network-first con timeout de 3,5 s → fallback a cache
 *    (offline o señal mala muestran los últimos datos conocidos)
 */
import { createHash } from "crypto";
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync } from "fs";
import path from "path";

const OUT = path.join(process.cwd(), "out");

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) {
      files.push(...walk(full));
    } else {
      files.push(full);
    }
  }
  return files;
}

function main() {
  if (!existsSync(OUT)) {
    console.error("✖ No existe out/. Corré `npm run build` primero.");
    process.exit(1);
  }

  const all = walk(OUT)
    .map((f) => "/" + path.relative(OUT, f).split(path.sep).join("/"))
    .filter((url) => !url.startsWith("/data/") && url !== "/sw.js")
    // Precacheamos las URLs "bonitas" (la forma final que navega el browser):
    // /stand/12/index.html → /stand/12/ y /index.html → /
    // Si se cachearan los paths con index.html, hostings que redirigen
    // (p. ej. Vercel: /index.html → /) guardarían respuestas `redirected`,
    // que el browser rechaza al usarlas para una navegación.
    .map((url) => {
      if (url === "/index.html") return "/";
      if (url.endsWith("/index.html")) {
        return url.slice(0, -"index.html".length);
      }
      return url;
    })
    // El browser pide los recursos percent-encoded (p. ej. el chunk de
    // /stand/[id] se pide como %5Bid%5D). Las claves del cache tienen que
    // coincidir EXACTAMENTE con la URL pedida, así que encodeamos igual.
    .map((url) =>
      encodeURI(url).replace(/\[/g, "%5B").replace(/\]/g, "%5D")
    );

  const version = createHash("sha1")
    .update(all.join("\n"))
    .digest("hex")
    .slice(0, 10);

  const sw = `/* Generado por scripts/generate-sw.ts — NO editar a mano */
const STATIC_CACHE = "farmafest-static-${version}";
const DATA_CACHE = "farmafest-data-v1";
const PRECACHE_URLS = ${JSON.stringify(all)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k.startsWith("farmafest-static-") && k !== STATIC_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

/** El precache usa URLs "bonitas": /stand/12/ y /. Normalizamos al mismo formato. */
function normalizePath(pathname) {
  if (pathname.endsWith("/index.html")) {
    return pathname.slice(0, -"index.html".length);
  }
  return pathname;
}

/** network-first con timeout: señal mala → cache en ~3,5 s */
async function dataFetch(request) {
  const cache = await caches.open(DATA_CACHE);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3500);
  try {
    const res = await fetch(request, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch (err) {
    clearTimeout(timer);
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    throw err;
  }
}

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== location.origin || event.request.method !== "GET") return;

  if (url.pathname.startsWith("/data/")) {
    event.respondWith(dataFetch(event.request));
    return;
  }

  const key = normalizePath(url.pathname);
  event.respondWith(staticFetch(event, key));
});

async function staticFetch(event, key) {
  const debug = { key, mode: event.request.mode, url: event.request.url };
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(key);
    debug.hit = !!cached;
    if (cached) return cached;
    try {
      return await fetch(event.request);
    } catch (err) {
      debug.fetchErr = String(err);
      // navegación a una ruta no precacheada estando offline
      if (event.request.mode === "navigate") {
        const notFound = await cache.match("/404.html");
        if (notFound) return notFound;
      }
      return Response.error();
    }
  } catch (err) {
    debug.err = String(err);
    return Response.error();
  } finally {
    if (self.__DEBUG_SW) {
      const dc = await caches.open("farmafest-debug");
      dc.put(
        "/debug/" + Date.now() + Math.random(),
        new Response(JSON.stringify(debug))
      );
    }
  }
}
// Diagnóstico: con true, cada fetch deja un registro en el cache
// "farmafest-debug" (leíble desde la consola con caches.open).
self.__DEBUG_SW = false;
`;

  writeFileSync(path.join(OUT, "sw.js"), sw);
  console.log(
    `✔ out/sw.js generado: ${all.length} archivos en precache (versión ${version})`
  );
}

main();
