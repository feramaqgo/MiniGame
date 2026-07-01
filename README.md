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

O envio do formulário (`src/lib/enviarLead.ts`) chama a serverless function `api/lead.js`, que repassa o lead para a Edge Function `webhook-lead` do Supabase CRM. O token de autenticação do webhook fica só no servidor (variável de ambiente), nunca no bundle do front-end.

Variáveis de ambiente necessárias (ver `.env.example`):
- `SUPABASE_WEBHOOK_URL`
- `SUPABASE_WEBHOOK_TOKEN`

Para produção (Vercel), configure essas duas variáveis em Project Settings → Environment Variables — o `.env.local` não é commitado e não chega ao deploy.

### Pendência no lado do Supabase

A tabela `webhook_leads_summary` ainda não tem a coluna `campanha`. Rodar no SQL Editor do Supabase:

```sql
alter table public.webhook_leads_summary
add column if not exists campanha text;
```

A Edge Function/trigger que processa o payload também precisa ser ajustada para ler o campo `campanha` (enviado no nível raiz do JSON, junto com `id`/`timestamp`/`event`) e gravá-lo na nova coluna — isso não pôde ser feito a partir deste repositório.
