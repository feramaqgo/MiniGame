# Contexto do Projeto — Arcade de Promoções Feramaq (Concreteshow)

> Documento de handoff. Resume tudo que já foi construído, a arquitetura, o estado
> atual e o que falta. Escrito pra um agente de código (Claude Code) entender o
> projeto do zero sem precisar reconstruir o raciocínio.

## Visão geral

Site de **jogos promocionais** da Feramaq (fabricante de equipamentos de concreto),
usado no estande da feira **Concreteshow**. O visitante acessa pelo **celular via QR
code**, entra (login), escolhe um mini-game num menu, e **ao vencer qualquer jogo** é
mandado pra uma **roleta** que sorteia um **brinde físico** entregue na hora pelo
atendente.

- **Produção**: https://promocao.feramaq.com.br
- **Repositório**: https://github.com/feramaqgo/MiniGame (branch `main`)
- **Deploy**: Vercel (projeto `mini-game`, time/scope `feramaq`). Deploy via
  `vercel deploy --prod --yes` na raiz. O domínio `promocao.feramaq.com.br` é o alias
  de produção.
- **Pasta local**: `C:\Users\DELL\Desktop\feramaq---chutar-para-ganhar`

## Stack

- **Vite 6 + React 19 + TypeScript 5.8** (multi-página, NÃO é SPA/router)
- **Tailwind 4** via `@tailwindcss/vite` (CSS-first, sem `tailwind.config.js`; o tema
  fica em `@theme` dentro de cada `index.css`)
- **motion** (framer-motion) e **lucide-react** (ícones)
- **Funções serverless** em `/api/*.js` (ESM puro, sem `supabase-js` — usam `fetch`
  cru pro REST do Supabase com a `service_role key`)
- **Supabase** (Postgres) como backend de dados — projeto `iqttjifqjawigwlvcjgm`,
  compartilhado com o CRM da empresa
- Scripts: `npm run dev` (Vite puro — NÃO roda `/api`), `npm run build`,
  `npm run lint` (= `tsc --noEmit`). Pra testar `/api` local é `vercel dev`.

## Arquitetura multi-página (importante)

Cada rota é uma **página HTML própria** com seu próprio bundle (não há client-side
router). Isso é de propósito: isola CSS/JS de cada jogo, sem risco de um vazar no
outro. O roteamento de URL limpo é feito por **rewrites no `vercel.json`**.

| URL | HTML | Entry | O que é |
|---|---|---|---|
| `/` | `index.html` | `src/hub/main.tsx` | Celular: login Google + WhatsApp → código único |
| `/tablet` | `tablet.html` | `src/tablet/main.tsx` | Tablet do estande: QR → código → jogos (kiosk) |
| `/chute` | `chute.html` | `src/main.tsx` | Jogo do pênalti |
| `/cobrinha` | `cobrinha.html` | `src/cobrinha/main.tsx` | Mangote de Concreto (snake) |
| `/memoria` | `memoria.html` | `src/memoria/main.tsx` | Jogo da memória |
| `/velha` | `velha.html` | `src/velha/main.tsx` | Jogo da velha |
| `/roleta` | `roleta.html` | `src/roleta/main.tsx` | Roleta de prêmios (prêmio final) |
| `/roleta/admin` | `roleta-admin.html` | `src/roleta/admin/main.tsx` | Painel de estoque (equipe) |

As entradas estão registradas em `vite.config.ts` (`build.rollupOptions.input`) e os
rewrites em `vercel.json`. **Ao adicionar uma página nova, tem que mexer nos dois.**

## Fluxo do usuário (dinâmica do estande, versão tablet + código)

O tablet do estande fica num loop de quiosque; o celular do visitante só faz o
cadastro e recebe um **código sequencial único** (1, 2, 3…) que conta os
participantes.

1. **Tablet (`/tablet`)** — mostra QR code gigante + botão "Já escaneei".
   (Primeiro uso do aparelho pede a senha da equipe — a `ADMIN_PASSPHRASE` — e
   guarda no localStorage. `?teste=1` simula tudo: sem senha, qualquer código.)
2. **Celular (`/`)** — o visitante escaneia o QR: login Google → digita o
   WhatsApp → `/api/cadastrar` valida o token, chama a RPC
   `cadastrar_participante` (idempotente por conta Google: re-login devolve o
   MESMO código) e espelha o lead no CRM. A tela mostra o **código gigante**.
3. **Tablet** — visitante toca "Já escaneei" → teclado numérico → o código é
   validado em `/api/validar-codigo` (devolve o nome) → **recepção do Rino**
   ("Olá, {nome}! Eu sou o Rino!") → menu dos 4 jogos.
4. Joga no tablet → **ao vencer**, `/roleta`. Perder nunca bloqueia: tenta de
   novo à vontade (filosofia "sempre ganável").
5. **`/roleta`** (no tablet) — gira via `/api/girar` com o código; a RPC
   `girar_roleta_codigo` sorteia ponderado por estoque, decrementa, grava o
   prêmio na linha do participante e marca `codigo_usado`. Tela de resultado
   mostra o prêmio (atendente entrega o brinde), e depois de 15s (ou no botão
   "Próximo visitante") volta sozinha pro QR limpando a sessão.

Na tabela `roleta_participants` fica tudo junto: código, nome, e-mail,
WhatsApp e o prêmio ganho — exatamente o que a equipe consulta durante a feira.

### Sessão compartilhada entre páginas

Como cada página é um bundle isolado, "logar uma vez e valer pra todos os jogos" é
feito via **`localStorage`** (chave `arcade_session`):

- `src/shared/lib/session.ts` — `saveSession()`, `getSession()`, `clearSession()`,
  `requireSession()` (redireciona pra `/` se não houver sessão).
- `src/shared/types.ts` — `ArcadeSession = { idToken, celular, name, email, picture, demo? }`.
- Cada jogo faz `requireSession()` no mount. A sessão **demo** passa nessa checagem.
- Na roleta, sessão `demo` (ou `?teste=1`) faz o giro ser **simulado no navegador**
  (nada é salvo, não bate no backend).

## Os jogos (todos prontos e no ar)

- **Chute** (`src/App.tsx`, `src/components/*`): pênalti com mira que varre o gol,
  goleiro (rinoceronte, `public/rinoceronte-goleiro.png`), bola (`public/bola.png`),
  som de gol e música de fundo. Canvas/DOM. Vencer → roleta.
- **Mangote de Concreto** (`src/cobrinha/*`): snake em **canvas** com o corpo
  desenhado como mangueira de bomba de concreto (traço cinza segmentado + bico
  laranja). Come 8 "porções de concreto" pra vencer. Controles: swipe, d-pad na tela,
  teclado. Comida nasce longe das bordas.
- **Memória** (`src/memoria/*`): 6 pares, cartas com flip 3D. As frentes usam **fotos
  reais dos equipamentos** (`public/memoria-1.jpg`..`memoria-6.jpg`, já otimizadas —
  originais eram ~2MB cada, comprimidas pra ~40-60KB). Achar os 6 pares → roleta.
- **Jogo da Velha** (`src/velha/*`): contra uma IA **propositalmente vencível** (sempre
  fecha se puder, mas só bloqueia o jogador ~50% das vezes). Jogador é X e começa.
  Vencer → roleta.

Todos seguem o mesmo padrão: `App.tsx` (tela de intro + jogo, com `requireSession()`) e
um componente do jogo que recebe `onWin` (= redireciona pra `/roleta`). Cada um tem seu
`index.css` (tema claro creme, copiado do da roleta).

## A roleta (prêmio final) — `src/roleta/*`

- `App.tsx`: checa sessão; tela inicial é a **`ResgatarScreen`** (mostra a roleta
  parada + "Resgatar meu prêmio"). Ao resgatar, chama `girarRoleta` (ou simula, se
  demo/teste).
- `RoletaWheel.tsx`: roleta desenhada em **SVG** — fatias **iguais** (o visual não
  reflete as odds; as odds reais são ponderadas por estoque no servidor), aro metálico
  escuro com "luzes", profundidade com gradientes, **texto curvado** nos nomes,
  cubo central dourado, ponteiro. Gira via transição CSS até o prêmio que o servidor
  escolheu.
- `VideoBackdrop.tsx`: vídeos de fundo em loop (`public/roleta-fundo.mp4` na landing,
  `public/roleta-resultado-fundo.mp4` no resultado), com véu creme por cima pra manter
  legibilidade.
- Telas: `ResgatarScreen`, `GirandoScreen`, `ResultadoScreen` (com Confetti),
  `JaParticipouScreen`, `EsgotadoScreen`, `ErroScreen`.
- **Modo teste**: `?teste=1` na URL simula tudo no navegador (badge "Modo teste",
  botões extras). A sessão `demo` reusa esse mesmo caminho de simulação.
- **Admin** (`src/roleta/admin/Admin.tsx`, rota `/roleta/admin`): painel protegido por
  senha (`ADMIN_PASSPHRASE`) que mostra o estoque de brindes ao vivo. Não expõe dados
  de participantes.

## Backend — `api/*.js` (Vercel serverless)

- `api/girar.js` (POST): recebe `{ idToken, celular, tracking }`. **Valida o ID token
  do Google** direto com o Google (`oauth2.googleapis.com/tokeninfo`), confere que o
  `aud` bate com `GOOGLE_CLIENT_ID` e que o e-mail é verificado. Depois chama a RPC
  `girar_roleta` no Supabase (sorteio + decremento atômico + dedup) e faz um **insert
  espelho best-effort** na tabela `webhook_leads_summary` do CRM (campanha
  "Roleta Concreteshow"). Trata erros `JA_PARTICIPOU` / `ESGOTADO`.
- `api/prizes.js` (GET, público): lista os prêmios com estoque > 0 (só nome/estoque,
  sem PII) — usado pra desenhar as fatias.
- `api/admin-stock.js` (GET, protegido por `ADMIN_PASSPHRASE`): estoque completo pro
  painel admin.

### Banco (Supabase) — `sql/`

- `sql/schema.sql`: schema completo do zero. Tabelas `roleta_prizes` (estoque) e
  `roleta_participants` (identidade Google + celular). RPC `girar_roleta` faz **em uma
  transação única**: reivindica unicidade (`google_sub` E `celular`, cada um bloqueia
  repetição), trava as linhas de prêmio (`FOR UPDATE` — sem condição de corrida no
  estoque), sorteia ponderado por estoque restante, decrementa, e devolve o prêmio.
- `sql/migration_google_login.sql`: migração da versão anterior (que coletava
  nome/CNPJ digitados) pra a versão com login Google (sem CNPJ). **Ainda não foi
  rodada no Supabase** — ver "O que falta".
- A tabela `webhook_leads_summary` é **compartilhada com o CRM da empresa** — os
  inserts nela são aditivos, nunca alterar o schema dela.

### Variáveis de ambiente (Vercel, produção)

- `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — já configuradas.
- `ADMIN_PASSPHRASE` — já configurada (senha atual: `concreteshow2026`). É a
  mesma senha que desbloqueia o tablet (`/tablet`) e autoriza os endpoints
  `validar-codigo` e `girar`.
- `GOOGLE_CLIENT_ID` — **configurada** (2026-08-04, projeto Google Cloud
  "Roleta ConcreteShow"). O mesmo valor está hardcoded (é público) em
  `src/shared/lib/googleIdentity.ts`.

## Estado atual (2026-08-04)

**Tudo pronto e configurado de ponta a ponta:**

- Fluxo tablet + código implementado (páginas, APIs, RPCs) e testado.
- **Banco migrado de verdade** no Supabase (via Management API, com personal
  access token do usuário): tabela `roleta_participants` recriada no schema
  novo (Google + `codigo` sequencial único + `codigo_usado`), RPCs
  `cadastrar_participante` e `girar_roleta_codigo` criadas e testadas
  (cadastro repetido devolve o mesmo código; giro repetido dá
  `JA_PARTICIPOU`). Sequência zerada — o primeiro visitante real é o código 1.
  O SQL aplicado está em `sql/migration_codigo.sql` (versão consolidada que
  dropa a tabela antiga vazia).
- **8 brindes reais cadastrados** (600 giros): Camiseta Personalizada x5,
  Cheirinho de Carro x15, Bloquinho de Anotações x50, Boné x15, Trena
  Chaveiro x73, Protetor Auricular x148, Caneta Personalizada x153, Abridor
  Chaveiro x141.
- **Google OAuth ativo**: Client ID real no código e na env da Vercel.
- A roleta desenha as fatias com a **primeira palavra** do prêmio (fonte
  adaptativa — nomes compostos não cabem no arco com 8 fatias); o nome
  completo aparece na tela de resultado.
- O giro tem **timer de segurança**: se o `transitionend` não vier (aba
  escondida/engasgo), `onSpinComplete` dispara mesmo assim — kiosk não trava.

**Teste real de ponta a ponta validado** (04/08/2026): login Google real →
código 1 → validação no tablet → jogo → roleta → prêmio gravado na linha do
participante. Depois disso o banco foi **zerado** (0 participantes, 600 giros,
sequência reiniciada) — o primeiro visitante da feira será o código 1.

**Camada visual (passada do "show", 04/08/2026):**
- Global: brilhos flutuantes de fundo, cartões com relevo mais rico, foco
  visível, `.texto-fera` (título metálico animado laranja→dourado).
- Mangote: d-pad 3x maior e espaçado, resposta no `pointerdown`, **swipe
  contínuo na tela inteira** (pilota sem soltar o dedo), progresso em pips.
- Memória: 4 colunas no tablet (cabe sem rolagem), pips de pares, pop de
  acerto com selo verde.
- Velha: badge "sua vez"/"Rino pensando", prévia fantasma no hover, marcas
  com animação de entrada.
- Chute: mira maior com anel pulsante, campo mais alto.
- Roleta: halo de energia no giro, **prêmio gigante** no resultado com barra
  de tempo esvaziando (o atendente lê de longe).

**PWA instalável (04/08/2026):** `public/manifest.webmanifest` (fullscreen,
`start_url: /tablet`, atalhos pra tablet/cadastro/estoque), ícones gerados da
cabeça do Rino sobre o laranja (`icon-192`, `icon-512`, `icon-maskable-512`
com safe zone, `apple-touch-icon`) e `public/sw.js`.

O service worker foi escrito pro wi-fi instável da feira, com uma regra
inegociável: **`/api/*` nunca entra no cache** (resposta velha de cadastro,
validação ou giro daria código errado/prêmio duplicado). HTML é network-first
(deploy novo aparece no próximo carregamento) e `/assets/*` + mídia são
cache-first (têm hash no nome, são imutáveis). `src/shared/lib/pwa.ts` guarda
o evento `beforeinstallprompt`; `BotaoInstalar` só renderiza quando o
navegador oferece instalação — em destaque na tela de senha do tablet e
discreto na tela do QR.

**Modo demonstração REMOVIDO (04/08/2026):** não existe mais botão demo,
`?teste=1`, prêmio fictício nem giro simulado. A roleta só gira pelo servidor
com código validado. A chave da sessão virou `arcade_session_v2` pra invalidar
sessões demo antigas, e `requireSession()` exige sessão de tablet com código —
jogo só acontece no tablet do estande.

**Placar do estande (04/08/2026):** tabela `arcade_scores` + RPC
`ranking_arcade` (ver `sql/migration_scores.sql`, já aplicado).

- **A pontuação é calculada no servidor** (`api/score.js`), nunca no cliente:
  o jogo manda só tempo e jogadas. Escala única de 1000 a 2000 pros quatro
  jogos — cada um declara o "custo" de uma partida perfeita e o de uma lenta,
  e a nota é a posição do visitante entre esses extremos. Assim o ranking
  geral compara jogos diferentes de forma justa (aferido: velha perfeita
  1960, memória mediana 1432, cobrinha lenta 1105).
- Nomes são gravados **já abreviados** ("Vinicius F.") porque a tela do placar
  é pública.
- `api/ranking.js` (público, sem PII) alimenta o `Placar` na recepção, com
  filtro geral/por jogo. `api/campeao.js` (senha da equipe) alimenta a
  `CampeaoScreen`, aberta por um botão discreto na tela do QR.

**Controles do Mangote:** o d-pad foi removido — tocar em qualquer ponto do
tabuleiro vira o mangote naquela direção (comparando com a cabeça), e deslizar
continua funcionando. No tablet o alvo passa a ser a tela inteira.

**Ideia em aberto (de antes):** fotos de fundo nas telas dos jogos (o usuário
geraria as imagens). A roleta já tem vídeos de fundo.

## Convenções e aprendizados úteis

- **Sempre** rodar `npm run lint` + `npm run build` antes de commitar. Verificar
  visualmente (screenshots com Playwright headless) antes de deploy quando é mudança
  visual.
- Deploy é sempre `vercel deploy --prod --yes` (o projeto está linkado a `feramaq/mini-game`).
- Testar assets/`/api` local exige `vercel dev` (Vite puro não roda as funções). Em
  Windows, processos de dev às vezes travam portas — matar com PowerShell `Stop-Process`.
- Tema visual: fundo creme claro (`#F8EFDD`/`#FFFAF0`), laranja Feramaq `#FF6801`,
  dourado `#F5C518`, grafite. Fontes: "Russo One" (display) e "Roboto" (texto).
- Imagens grandes enviadas pelo usuário devem ser comprimidas (usei `sharp` pontual via
  `npm install --no-save`) antes de entrar no bundle — ex: fotos da memória foram de
  ~12MB pra ~270KB no total.
- O CNPJ foi **removido de vez** do projeto (era coletado numa versão antiga). Hoje a
  identidade é conta Google + celular.
- A campanha antiga "FMCT 2000 → 3000" foi **encerrada** — não deve haver nenhuma
  referência a ela em copy nova.
