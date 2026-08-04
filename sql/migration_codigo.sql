-- Migração: código único de participação (fluxo tablet Concreteshow).
--
-- O fluxo novo separa CADASTRO (no celular: login Google + WhatsApp → recebe
-- um código sequencial) de GIRO (no tablet do estande: digita o código, joga,
-- e a roleta gira usando o código). Esta migração é idempotente — pode rodar
-- mais de uma vez sem quebrar.
--
-- Pré-requisito: as tabelas roleta_prizes e roleta_participants do
-- sql/schema.sql já existem. NÃO toca em webhook_leads_summary (CRM).

-- ---------------------------------------------------------------------
-- 1) Coluna codigo — sequencial (1, 2, 3…), única, gerada no insert.
--    Conta os participantes do estande por si só.
-- ---------------------------------------------------------------------
create sequence if not exists public.roleta_codigo_seq start 1;

alter table public.roleta_participants
  add column if not exists codigo integer unique
    default nextval('public.roleta_codigo_seq');

-- Se a tabela já tinha linhas sem código, numera na ordem de chegada.
update public.roleta_participants
   set codigo = nextval('public.roleta_codigo_seq')
 where codigo is null;

alter table public.roleta_participants
  alter column codigo set not null;

-- Código "usado" = já girou a roleta (uso único).
alter table public.roleta_participants
  add column if not exists codigo_usado boolean not null default false;

-- Participantes antigos que já têm prêmio contam como usados.
update public.roleta_participants
   set codigo_usado = true
 where prize_id is not null and codigo_usado = false;

-- ---------------------------------------------------------------------
-- 2) RPC cadastrar_participante — chamada no cadastro (celular).
--    Idempotente por conta Google: se a pessoa reescanear o QR e logar de
--    novo, devolve o MESMO código (não cria duplicata). Celular de outra
--    pessoa → JA_PARTICIPOU (mesma família de erro do fluxo antigo).
-- ---------------------------------------------------------------------
create or replace function public.cadastrar_participante(
  p_google_sub text,
  p_google_email text,
  p_google_name text,
  p_google_picture text,
  p_celular text
)
returns table (participant_id uuid, codigo integer, ja_girou boolean, novo boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id     uuid;
  v_codigo integer;
  v_usado  boolean;
begin
  -- Mesma conta Google voltando: devolve o código existente.
  select rp.id, rp.codigo, rp.codigo_usado
    into v_id, v_codigo, v_usado
    from public.roleta_participants rp
   where rp.google_sub = p_google_sub;

  if found then
    return query select v_id, v_codigo, v_usado, false;
    return;
  end if;

  begin
    insert into public.roleta_participants
      (google_sub, google_email, google_name, google_picture, name, phone)
    values
      (p_google_sub, p_google_email, p_google_name, p_google_picture, p_google_name, p_celular)
    returning roleta_participants.id, roleta_participants.codigo
      into v_id, v_codigo;
  exception
    when unique_violation then
      -- Celular já usado por outra conta Google.
      raise exception 'JA_PARTICIPOU' using errcode = 'P0001';
  end;

  return query select v_id, v_codigo, false, true;
end;
$$;

revoke all on function public.cadastrar_participante(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.cadastrar_participante(text, text, text, text, text) to service_role;

-- ---------------------------------------------------------------------
-- 3) RPC girar_roleta_codigo — chamada no giro (tablet).
--    Valida o código, trava os prêmios, sorteia ponderado por estoque,
--    decrementa, grava o prêmio no participante e marca o código como usado.
--    Tudo numa transação única (mesma garantia anti-corrida do schema).
-- ---------------------------------------------------------------------
create or replace function public.girar_roleta_codigo(p_codigo integer)
returns table (participant_id uuid, prize_id uuid, prize_name text, google_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_participant   record;
  v_ids           uuid[];
  v_weights       integer[];
  v_total_weight  integer;
  v_pick          integer;
  v_running       integer := 0;
  v_chosen_id     uuid;
  v_chosen_name   text;
  i               integer;
begin
  -- 1) Busca e trava o participante pelo código.
  select rp.id, rp.codigo_usado, rp.google_name
    into v_participant
    from public.roleta_participants rp
   where rp.codigo = p_codigo
     for update;

  if not found then
    raise exception 'CODIGO_INVALIDO' using errcode = 'P0003';
  end if;

  if v_participant.codigo_usado then
    raise exception 'JA_PARTICIPOU' using errcode = 'P0001';
  end if;

  -- 2) Trava os prêmios candidatos (serializa giros concorrentes).
  perform 1 from public.roleta_prizes
   where active and remaining_stock > 0
   for update;

  -- 3) Pool ponderado por estoque restante.
  select array_agg(id order by sort_order, id),
         array_agg(remaining_stock order by sort_order, id),
         sum(remaining_stock)
    into v_ids, v_weights, v_total_weight
    from public.roleta_prizes
   where active and remaining_stock > 0;

  if v_total_weight is null or v_total_weight = 0 then
    raise exception 'ESGOTADO' using errcode = 'P0002';
  end if;

  -- 4) Sorteio ponderado (mais estoque = mais provável).
  v_pick := floor(random() * v_total_weight)::int + 1;
  for i in 1 .. array_length(v_ids, 1) loop
    v_running := v_running + v_weights[i];
    if v_pick <= v_running then
      v_chosen_id := v_ids[i];
      exit;
    end if;
  end loop;

  -- 5) Decrementa o estoque e grava o resultado no participante.
  update public.roleta_prizes
     set remaining_stock = remaining_stock - 1
   where id = v_chosen_id
  returning name into v_chosen_name;

  update public.roleta_participants
     set prize_id = v_chosen_id,
         prize_name = v_chosen_name,
         codigo_usado = true
   where id = v_participant.id;

  return query
    select v_participant.id, v_chosen_id, v_chosen_name, v_participant.google_name;
end;
$$;

revoke all on function public.girar_roleta_codigo(integer) from public, anon, authenticated;
grant execute on function public.girar_roleta_codigo(integer) to service_role;
