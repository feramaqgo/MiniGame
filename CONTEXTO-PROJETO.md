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
| `/` | `index.html` | `src/hub/main.tsx` | Login + menu de jogos (Hub) |
| `/chute` | `chute.html` | `src/main.tsx` | Jogo do pênalti |
| `/cobrinha` | `cobrinha.html` | `src/cobrinha/main.tsx` | Mangote de Concreto (snake) |
| `/memoria` | `memoria.html` | `src/memoria/main.tsx` | Jogo da memória |
| `/velha` | `velha.html` | `src/velha/main.tsx` | Jogo da velha |
| `/roleta` | `roleta.html` | `src/roleta/main.tsx` | Roleta de prêmios (prêmio final) |
| `/roleta/admin` | `roleta-admin.html` | `src/roleta/admin/main.tsx` | Painel de estoque (equipe) |

As entradas estão registradas em `vite.config.ts` (`build.rollupOptions.input`) e os
rewrites em `vercel.json`. **Ao adicionar uma página nova, tem que mexer nos dois.**

## Fluxo do usuário

1. **`/` (Hub)** — máquina de 2 estados:
   - **Login**: botão "Entrar com Google" **+ um botão "Entrar em modo demo"**. O
     login real do Google **ainda não está ativo** (falta o Client ID — ver adiante).
     O **modo demo** cria uma sessão falsa (`demo: true`) e já entra no menu — é como
     tudo é testado hoje.
   - **Menu**: grid com os 4 jogos (todos habilitados) + a roleta é o prêmio, não
     aparece como jogo escolhível.
2. Escolhe um jogo → joga → **ao vencer**, `window.location.href = "/roleta"`.
   Perder/empatar nunca bloqueia: só manda tentar de novo (filosofia "sempre ganável").
3. **`/roleta`** — usa a sessão salva pra girar. Sorteia um prêmio ponderado por
   estoque, mostra "Você ganhou: X", e a pessoa mostra a tela pro atendente.

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
- `ADMIN_PASSPHRASE` — já configurada (senha atual: `concreteshow2026`).
- `GOOGLE_CLIENT_ID` — **ainda não configurada** (o `api/girar.js` já usa; falta o
  valor real).

## Estado atual / o que falta

**Pronto e no ar:** os 4 jogos, o menu, o botão demo, a roleta completa (com vídeos e
modo teste), o painel admin, todo o backend e o SQL escritos.

**Falta pra virar produção real com público (2 bloqueantes, ambos dependem do cliente):**

1. **Login com Google não está ativo.** Precisa criar um **OAuth Client ID** no Google
   Cloud Console (origem autorizada: `https://promocao.feramaq.com.br`) e:
   - Trocar o placeholder `GOOGLE_CLIENT_ID = "SUBSTITUA_PELO_CLIENT_ID..."` em
     `src/shared/lib/googleIdentity.ts`.
   - Rodar `vercel env add GOOGLE_CLIENT_ID production` com o mesmo valor.
   Enquanto isso não acontece, só o **botão demo** funciona (o que é suficiente pra
   testar/demonstrar todos os jogos e a roleta simulada).
2. **Rodar `sql/migration_google_login.sql`** no SQL Editor do Supabase — só depois
   disso a RPC nova (com parâmetros do Google) existe de verdade no banco e o giro real
   funciona.

**Próxima tarefa pedida pelo usuário (em aberto):** adicionar **fotos de fundo** em
cada tela (tela inicial + cada jogo). O usuário vai gerar as imagens (prompts já
entregues) e colocar em `public/` com nomes tipo `fundo-inicial.jpg`, `fundo-chute.jpg`,
`fundo-cobrinha.jpg`, `fundo-memoria.jpg`, `fundo-velha.jpg`. Falta **encaixar cada uma
no fundo da tela certa** (provavelmente um componente tipo o `VideoBackdrop` da roleta,
com véu claro por cima pra não atrapalhar a leitura), otimizando as imagens se vierem
grandes. A roleta já tem vídeos de fundo, não precisa.

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
