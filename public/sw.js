/* Service worker do VagaON.
 *
 * Deliberadamente conservador:
 *  - /api/* nunca passa pelo cache (dados de sessão e do match são sempre frescos);
 *  - páginas (navegações) não são cacheadas — são autenticadas e mudam por usuário;
 *  - só estáticos imutáveis (/_next/static, ícones, imagens) ficam em cache-first;
 *  - offline, uma navegação cai numa página mínima em vez de erro do navegador.
 *
 * Suba a versão de CACHE ao mudar esta lógica para invalidar o cache antigo.
 */
const CACHE = "vagaon-static-v1";
const PRE_CACHE = ["/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];

const OFFLINE_HTML = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>VagaON — offline</title>
<style>body{font-family:system-ui,sans-serif;background:#1a5c38;color:#fff;display:flex;min-height:100vh;
align-items:center;justify-content:center;margin:0;text-align:center;padding:24px}
h1{font-size:22px;margin:0 0 8px}p{opacity:.8;margin:0 0 20px}button{background:#2DB87A;color:#fff;border:0;
border-radius:999px;padding:12px 22px;font-weight:700;font-size:15px}</style></head>
<body><div><h1>Você está sem conexão</h1><p>O VagaON precisa de internet para buscar vagas e candidatos.</p>
<button onclick="location.reload()">Tentar de novo</button></div></body></html>`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRE_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function ehEstatico(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname === "/manifest.webmanifest"
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  if (ehEstatico(url)) {
    event.respondWith(
      caches.match(request).then(
        (emCache) =>
          emCache ||
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copia));
            }
            return resposta;
          })
      )
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(
        () => new Response(OFFLINE_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } })
      )
    );
  }
});
