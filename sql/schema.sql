-- Roleta Concreteshow — schema novo, aditivo.
-- Não altera public.webhook_leads_summary (tabela compartilhada do CRM,
-- usada também pelo mini-game de pênalti). Rodar manualmente no SQL Editor
-- do Supabase antes do evento.

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
-- Participantes — colunas geradas normalizadas carregam a unicidade
-- (um giro por nome, por celular e por cnpj, cada um isoladamente)
-- ---------------------------------------------------------------------
create table public.roleta_participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  cnpj text not null,
  name_normalized  text generated always as
    (lower(regexp_replace(btrim(name), '\s+', ' ', 'g'))) stored,
  phone_normalized text generated always as
    (regexp_replace(phone, '\D', '', 'g')) stored,
  cnpj_normalized  text generated always as
    (regexp_replace(cnpj, '\D', '', 'g')) stored,
  prize_id uuid references public.roleta_prizes(id),
  prize_name text,
  crm_synced boolean not null default false,
  created_at timestamptz not null default now(),
  constraint roleta_participants_name_key  unique (name_normalized),
  constraint roleta_participants_phone_key unique (phone_normalized),
  constraint roleta_participants_cnpj_key  unique (cnpj_normalized)
);

alter table public.roleta_prizes enable row level security;
alter table public.roleta_participants enable row level security;
-- Sem policies: nada legível/gravável por anon/authenticated, só service_role
-- (o front-end nunca fala com o Supabase direto, só via /api/*)

-- ---------------------------------------------------------------------
-- RPC girar_roleta — transação única:
-- reivindica unicidade -> trava candidatos -> sorteio ponderado
-- -> decrementa estoque -> devolve o prêmio sorteado
-- ---------------------------------------------------------------------
create or replace function public.girar_roleta(
  p_nome text,
  p_celular text,
  p_cnpj text
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
  -- 1) Reivindica a unicidade primeiro. Qualquer uma das 3 constraints
  --    disparando = "já participou", um único erro amigável.
  begin
    insert into public.roleta_participants (name, phone, cnpj)
    values (p_nome, p_celular, p_cnpj)
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

revoke all on function public.girar_roleta(text, text, text) from public, anon, authenticated;
grant execute on function public.girar_roleta(text, text, text) to service_role;

-- ---------------------------------------------------------------------
-- Seed de exemplo — AJUSTE os nomes e quantidades reais antes do evento.
-- ---------------------------------------------------------------------
-- insert into public.roleta_prizes (name, initial_stock, remaining_stock, sort_order) values
--   ('Boné Feramaq', 50, 50, 1),
--   ('Camiseta Feramaq', 40, 40, 2),
--   ('Chaveiro Feramaq', 100, 100, 3),
--   ('Vale-desconto Especial', 10, 10, 4);
