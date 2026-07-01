# Feramaq — Chutar para Ganhar

Landing page de geração de leads com um mini-game de pênalti interativo, para a campanha de upgrade gratuito FMCT 2000 → FMCT 3000.

## Rodar localmente

**Pré-requisitos:** Node.js

1. Instalar dependências:
   `npm install`
2. Rodar o projeto:
   `npm run dev`

Obs: `npm run dev` (Vite) não executa a serverless function em `api/lead.js` — o envio do formulário só funciona de ponta a ponta com `vercel dev` ou após o deploy. Veja a seção Backend.

## Build de produção

`npm run build`

## Assets

Coloque o seguinte arquivo em `public/` para substituir o placeholder:
- `maquina-fmct.png` — foto da máquina exibida na tela de vitória

## Backend

O envio do formulário (`src/lib/enviarLead.ts`) chama a serverless function `api/lead.js`, que insere o lead diretamente na tabela `public.webhook_leads_summary` do Supabase CRM via REST API, usando a `service_role key`. A chave fica só no servidor (variável de ambiente), nunca no bundle do front-end.

Variáveis de ambiente necessárias (ver `.env.example`):
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Para produção (Vercel), configure essas duas variáveis em Project Settings → Environment Variables — o `.env.local` não é commitado e não chega ao deploy.

### Observação sobre o CRM

Esse insert é direto na tabela, sem passar pela Edge Function `webhook-lead` (que fazia scoring, criação de `contact`/`deal` e atribuição de vendedor por round-robin — mas estava rejeitando a autenticação em produção). Por isso os leads gerados aqui ficam com `contact_id`, `deal_id`, `owner_name` e `lead_score` vazios: aparecem na tabela `webhook_leads_summary`, mas não entram automaticamente no pipeline de vendas nem recebem vendedor atribuído. Se isso passar a ser necessário, o próximo passo é corrigir a autenticação da Edge Function (provavelmente desligar "Enforce JWT Verification" nas configs da function no painel do Supabase) e voltar a usá-la.
