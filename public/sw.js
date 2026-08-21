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

// IMPORTANTE: subir esta versão a cada mudança no que é guardado em cache.
// O `activate` só apaga caches de versões DIFERENTES desta — então, sem
// subir aqui, um aparelho que já tenha um cache quebrado da versão anterior
// continua usando o cache quebrado, mesmo com o service worker novo. Foi
// exatamente o que aconteceu quando o pre-cache atômico falhava em silêncio.
const VERSAO = "v2";
const CACHE_ESTATICO = `feramaq-estatico-${VERSAO}`;
const CACHE_PAGINAS = `feramaq-paginas-${VERSAO}`;

// Casca mínima pra abrir offline.
// Todas as telas do ciclo, não só a inicial: quem está offline precisa
// conseguir abrir o jogo, não apenas a home.
const PRE_CACHE = [
  "/",
  "/tablet",
  "/chute",
  "/cobrinha",
  "/memoria",
  "/velha",
  "/roleta",
  "/icon-192.png",
  "/manifest.webmanifest",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_PAGINAS)
      .then((cache) =>
        // Um por um, de propósito: `cache.addAll` é atômico e uma única URL
        // que falhe (rewrite ausente em dev, rota renomeada) derruba o
        // pre-cache inteiro em silêncio — o aparelho fica achando que está
        // preparado pra ficar offline quando não está.
        Promise.all(
          PRE_CACHE.map((url) =>
            cache.add(new Request(url, { cache: "reload" })).catch((err) => {
              console.warn("[sw] nao cacheou", url, err);
            })
          )
        )
      )
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
      // `ignoreVary` é essencial aqui: os imports de módulo ES chegam com
      // cabeçalhos diferentes dos usados quando o arquivo foi guardado, e o
      // match estrito falharia mesmo com o arquivo em cache — o app abria
      // em branco offline, com o JS "faltando" que na verdade estava lá.
      caches.match(request, { ignoreVary: true }).then(
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
          caches
            .match(request, { ignoreVary: true })
            .then(
              (cacheado) =>
                cacheado ||
                // Rota limpa e .html são a mesma tela: se uma não está
                // guardada, a outra serve.
                caches.match(url.pathname.replace(/\.html$/, ""), { ignoreVary: true })
            )
            .then((r) => r || caches.match("/tablet", { ignoreVary: true }))
        )
    );
  }
});
