# Promoções Feramaq

Site com os jogos/promoções da Feramaq, servidos no mesmo domínio (`promocao.feramaq.com.br`) em rotas separadas:

- `/` — hub: menu listando os jogos disponíveis
- `/chute` — mini-game de pênalti, para a campanha de upgrade gratuito FMCT 2000 → FMCT 3000
- `/roleta` — roleta de brindes do estande da Feramaq na feira Concreteshow
- `/roleta/admin` — painel da equipe do estande pra acompanhar o estoque de brindes ao vivo

Cada rota é uma página HTML separada (build multi-página do Vite) — não é uma SPA com rotas client-side, então não há risco de CSS/JS de um jogo vazar pro outro.

## Rodar localmente

**Pré-requisitos:** Node.js

1. Instalar dependências:
   `npm install`
2. Rodar o projeto:
   `npm run dev`

Obs: `npm run dev` (Vite) não executa as serverless functions em `api/` — os formulários só funcionam de ponta a ponta com `vercel dev` ou após o deploy. Veja a seção Backend.

## Build de produção

`npm run build`

Gera quatro páginas: `dist/index.html` (hub), `dist/chute.html` (pênalti), `dist/roleta.html` (roleta) e `dist/roleta-admin.html` (painel de estoque). O `vercel.json` reescreve `/chute`, `/roleta` e `/roleta/admin` pra essas páginas.

## Estrutura do código

- `src/hub/` — o menu inicial (`/`)
- `src/App.tsx`, `src/components/`, `src/lib/` (raiz) — o jogo de pênalti (`/chute`), inalterado desde antes da fusão
- `src/roleta/` — a roleta e seu painel admin (`/roleta` e `/roleta/admin`), autocontido (tem seu próprio `App.tsx`, `components/`, `lib/`, `types.ts`)
- `api/lead.js` — backend do pênalti
- `api/girar.js`, `api/prizes.js`, `api/admin-stock.js` — backend da roleta

## Assets do pênalti

Coloque os seguintes arquivos em `public/`:
- `maquina-fmct.png` — foto da máquina exibida na tela de vitória
- `bola.png` — imagem da bola usada no jogo
- `rinoceronte-goleiro.png` — imagem do goleiro (rinoceronte) que se move dentro do gol; idealmente com fundo transparente
- `gol-sound.mp3` — som tocado quando o jogador faz gol
- `musica-fundo.mp3` — música de fundo, toca em loop a partir do primeiro clique do usuário (na tela inicial) e pode ser mutada pelo botão fixo no canto inferior direito

## Setup da roleta no Supabase (antes do evento)

1. Rode `sql/schema.sql` no SQL Editor do Supabase — cria as tabelas `roleta_prizes` e `roleta_participants` e a função `girar_roleta`. É aditivo, não altera a tabela `webhook_leads_summary` do CRM.
2. Cadastre os brindes reais (nome + quantidade). Exemplo:
   ```sql
   insert into public.roleta_prizes (name, initial_stock, remaining_stock, sort_order) values
     ('Boné Feramaq', 50, 50, 1),
     ('Camiseta Feramaq', 40, 40, 2),
     ('Chaveiro Feramaq', 100, 100, 3);
   ```
3. As chances de cada prêmio são proporcionais ao estoque restante — não precisa configurar porcentagem, só a quantidade de cada um.

## Backend

### Pênalti (`api/lead.js`)

O envio do formulário (`src/lib/enviarLead.ts`) chama a serverless function `api/lead.js`, que insere o lead diretamente na tabela `public.webhook_leads_summary` do Supabase CRM via REST API, usando a `service_role key`.

### Roleta (`api/girar.js`, `api/prizes.js`, `api/admin-stock.js`)

- `api/girar.js` — chama a função `girar_roleta` no Supabase (via REST/RPC), que numa única transação: cadastra o participante (rejeitando nome/celular/CNPJ repetidos), sorteia um prêmio ponderado pelo estoque restante, decrementa o estoque e devolve o resultado. Depois, insere uma cópia do lead em `public.webhook_leads_summary` com `campanha: "Roleta Concreteshow"` — best-effort, não falha o giro se der erro.
- `api/prizes.js` — lista pública (sem dado pessoal) dos prêmios com estoque disponível, usada pra desenhar as fatias da roleta.
- `api/admin-stock.js` — lista completa de estoque, protegida por senha (`ADMIN_PASSPHRASE`), usada pelo painel `/roleta/admin`.

A chave de serviço fica só no servidor (variável de ambiente), nunca no bundle do front-end.

Variáveis de ambiente necessárias (ver `.env.example`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PASSPHRASE`

Para produção (Vercel), configure essas três em Project Settings → Environment Variables — o `.env.local` não é commitado e não chega ao deploy.

### Observação sobre o CRM do pênalti

O insert do pênalti é direto na tabela, sem passar pela Edge Function `webhook-lead` (que fazia scoring, criação de `contact`/`deal` e atribuição de vendedor por round-robin — mas estava rejeitando a autenticação em produção). Por isso os leads gerados ali ficam com `contact_id`, `deal_id`, `owner_name` e `lead_score` vazios: aparecem na tabela `webhook_leads_summary`, mas não entram automaticamente no pipeline de vendas nem recebem vendedor atribuído. Se isso passar a ser necessário, o próximo passo é corrigir a autenticação da Edge Function (provavelmente desligar "Enforce JWT Verification" nas configs da function no painel do Supabase) e voltar a usá-la.
