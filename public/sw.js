// Service worker do Arcade Feramaq.
//
// Objetivo no estande: o tablet continuar abrindo e jogando mesmo se o wi-fi
// da feira oscilar. Regras, em ordem de importância:
//
// 1. `/api/*` NUNCA passa pelo cache. Cadastro, validação de código e giro da
//    roleta precisam bater no servidor sempre — resposta velha aqui daria
//    código errado ou prêmio duplicado.
// 2. HTML (navegação): rede primeiro, cache como rede de segurança. Assim um
//    deploy novo aparece no próximo carregamento, sem ficar preso em versão
//    velha.
// 3. Assets com hash no nome (/assets/*) e mídia (imagens/áudio/vídeo): cache
//    primeiro — são imutáveis e pesados, não vale rebaixar por rede.

const VERSAO = "v1";
const CACHE_ESTATICO = `feramaq-estatico-${VERSAO}`;
const CACHE_PAGINAS = `feramaq-paginas-${VERSAO}`;

// Casca mínima pra abrir offline.
const PRE_CACHE = ["/", "/tablet", "/icon-192.png", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_PAGINAS)
      .then((cache) => cache.addAll(PRE_CACHE))
      // Falhar o pre-cache não pode impedir a instalação do SW.
      .catch(() => undefined)
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes
            .filter((n) => n.startsWith("feramaq-") && !n.endsWith(VERSAO))
            .map((n) => caches.delete(n))
        )
      )
      .then(() => self.clients.claim())
  );
});

function ehMidia(url) {
  return /\.(png|jpe?g|webp|svg|gif|mp3|mp4|woff2?)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Só cuidamos do nosso próprio domínio (Google Fonts/Identity ficam de fora).
  if (url.origin !== self.location.origin) return;

  // Regra 1: API sempre na rede, sem cache.
  if (url.pathname.startsWith("/api/")) return;

  // Regra 3: assets versionados e mídia — cache primeiro.
  if (url.pathname.startsWith("/assets/") || ehMidia(url)) {
    event.respondWith(
      caches.match(request).then(
        (cacheado) =>
          cacheado ||
          fetch(request).then((resposta) => {
            if (resposta.ok) {
              const copia = resposta.clone();
              caches.open(CACHE_ESTATICO).then((c) => c.put(request, copia));
            }
            return resposta;
          })
      )
    );
    return;
  }

  // Regra 2: páginas — rede primeiro, cache se a rede falhar.
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((resposta) => {
          if (resposta.ok) {
            const copia = resposta.clone();
            caches.open(CACHE_PAGINAS).then((c) => c.put(request, copia));
          }
          return resposta;
        })
        .catch(() =>
          caches.match(request).then((cacheado) => cacheado || caches.match("/tablet"))
        )
    );
  }
});
