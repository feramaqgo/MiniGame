-- Roleta Concreteshow — schema novo, aditivo.
-- Não altera public.webhook_leads_summary (tabela compartilhada do CRM,
-- usada também pelo mini-game de pênalti). Rodar manualmente no SQL Editor
-- do Supabase antes do evento (instalação do zero).
--
-- Se você já rodou uma versão anterior deste schema (com nome/celular/CNPJ
-- digitados) em produção, use sql/migration_google_login.sql em vez deste
-- arquivo — ele faz a transição sem derrubar a tabela.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- Estoque de prêmios
-- ---------------------------------------------------------------------
create table public.roleta_prizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  initial_stock integer not null check (initial_stock >= 0),
  remaining_stock integer not null check (remaining_stock >= 0),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index roleta_prizes_active_stock_idx
  on public.roleta_prizes (active, remaining_stock);

-- ---------------------------------------------------------------------
-- Participantes — identidade vem do login com Google (nome, e-mail e o
-- `sub`, o id único e estável da conta Google — mais forte que e-mail
-- pra travar giro repetido, já que e-mail permite truques de alias).
-- Celular ainda é pedido à parte, como contato comercial.
-- ---------------------------------------------------------------------
create table public.roleta_participants (
  id uuid primary key default gen_random_uuid(),
  google_sub text,
  google_email text,
  google_name text,
  google_picture text,
  name text,
  phone text not null,
  phone_normalized text generated always as
    (regexp_replace(phone, '\D', '', 'g')) stored,
  prize_id uuid references public.roleta_prizes(id),
  prize_name text,
  crm_synced boolean not null default false,
  created_at timestamptz not null default now(),
  constraint roleta_participants_google_sub_key unique (google_sub),
  constraint roleta_participants_phone_key unique (phone_normalized)
);

alter table public.roleta_prizes enable row level security;
alter table public.roleta_participants enable row level security;
-- Sem policies: nada legível/gravável por anon/authenticated, só service_role
-- (o front-end nunca fala com o Supabase direto, só via /api/*)

-- ---------------------------------------------------------------------
-- RPC girar_roleta — transação única:
-- reivindica unicidade (google_sub + celular) -> trava candidatos
-- -> sorteio ponderado -> decrementa estoque -> devolve o prêmio sorteado
-- ---------------------------------------------------------------------
create or replace function public.girar_roleta(
  p_google_sub text,
  p_google_email text,
  p_google_name text,
  p_google_picture text,
  p_celular text
)
returns table (participant_id uuid, prize_id uuid, prize_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant_id uuid;
  v_constraint      text;
  v_ids             uuid[];
  v_weights         integer[];
  v_total_weight    integer;
  v_pick            integer;
  v_running         integer := 0;
  v_chosen_id       uuid;
  v_chosen_name     text;
  i                 integer;
begin
  -- 1) Reivindica a unicidade primeiro (conta Google OU celular já usados
  --    = "já participou", um único erro amigável).
  begin
    insert into public.roleta_participants
      (google_sub, google_email, google_name, google_picture, name, phone)
    values
      (p_google_sub, p_google_email, p_google_name, p_google_picture, p_google_name, p_celular)
    returning id into v_participant_id;
  exception
    when unique_violation then
      get stacked diagnostics v_constraint = constraint_name;
      raise exception 'JA_PARTICIPOU' using errcode = 'P0001', detail = v_constraint;
  end;

  -- 2) Trava todo prêmio candidato pro resto desta transação. Qualquer
  --    girar_roleta() concorrente tocando o mesmo conjunto espera aqui
  --    até este commit/rollback — é isso que torna o decremento
  --    à prova de corrida (serializa giros).
  perform 1 from public.roleta_prizes
   where active and remaining_stock > 0
   for update;

  -- 3) Relê as linhas já travadas pra montar o pool ponderado.
  select array_agg(id order by sort_order, id),
         array_agg(remaining_stock order by sort_order, id),
         sum(remaining_stock)
    into v_ids, v_weights, v_total_weight
    from public.roleta_prizes
   where active and remaining_stock > 0;

  if v_total_weight is null or v_total_weight = 0 then
    raise exception 'ESGOTADO' using errcode = 'P0002';
    -- (aborta a transação INTEIRA, incluindo o insert do passo 1 —
    --  não fica participante órfão sem prêmio)
  end if;

  -- 4) Sorteio ponderado: sorteio uniforme em [1, total_weight], percorre
  --    o array de peso acumulado. Mais remaining_stock => bucket maior
  --    => proporcionalmente mais provável, autoequilibrado conforme esgota.
  v_pick := floor(random() * v_total_weight)::int + 1;
  for i in 1 .. array_length(v_ids, 1) loop
    v_running := v_running + v_weights[i];
    if v_pick <= v_running then
      v_chosen_id := v_ids[i];
      exit;
    end if;
  end loop;

  -- 5) Decrementa (linha já travada no passo 2 — sem lost update possível).
  update public.roleta_prizes
     set remaining_stock = remaining_stock - 1
   where id = v_chosen_id
  returning name into v_chosen_name;

  update public.roleta_participants
     set prize_id = v_chosen_id, prize_name = v_chosen_name
   where id = v_participant_id;

  return query select v_participant_id, v_chosen_id, v_chosen_name;
end;
$$;

revoke all on function public.girar_roleta(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.girar_roleta(text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------------
-- Seed de exemplo — AJUSTE os nomes e quantidades reais antes do evento.
-- ---------------------------------------------------------------------
-- insert into public.roleta_prizes (name, initial_stock, remaining_stock, sort_order) values
--   ('Boné', 15, 15, 1),
--   ('Trena', 73, 73, 2),
--   ('Cordão', 143, 143, 3),
--   ('Caneta', 153, 153, 4),
--   ('Abridor', 216, 216, 5);
