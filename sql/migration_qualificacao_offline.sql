-- Migração: qualificação no cadastro + giro que sobrevive à queda de rede.
--
-- O fluxo continua o mesmo (QR → cadastro no celular → código → tablet →
-- jogo → roleta). O que muda:
--
--   1. EMPRESA E CARGO no cadastro. O Google não fornece nenhum dos dois, e
--      numa feira de construção pesada são eles que separam curioso de
--      comprador. Vão junto pro CRM.
--
--   2. CADASTRO SEM GOOGLE. Se o login não abrir (script bloqueado, rede
--      ruim), existe agora um formulário manual. `google_verified` registra
--      a diferença de confiabilidade em vez de recusar o lead.
--
--   3. GIRO SORTEADO OFFLINE. Wi-fi de pavilhão cai no pico; o tablet passa a
--      sortear no navegador quando a rede falha e sincronizar depois. Aqui o
--      servidor só registra a baixa, com greatest(stock-1, 0) pra nunca
--      deixar estoque negativo — negar um brinde já entregue na mão da
--      pessoa seria pior do que furar o estoque. `sorteado_offline` marca a
--      linha pra equipe reconciliar.
--
-- As COLUNAS usadas aqui (empresa, cargo, google_verified, sorteado_offline)
-- já foram criadas por sql/migration_jogo_primeiro.sql. Esta migração mexe só
-- nas funções. Idempotente e aditiva — não toca em webhook_leads_summary.

-- ---------------------------------------------------------------------
-- 0) Coluna usada pelo giro offline. Neste fluxo o giro pertence ao
--    participante (não a uma partida anônima), então a marca fica aqui.
-- ---------------------------------------------------------------------
alter table public.roleta_participants
  add column if not exists sorteado_offline boolean not null default false;

-- ---------------------------------------------------------------------
-- 1) Cadastro passa a receber empresa, cargo e a marca de verificação.
--    Continua idempotente por conta Google: reabrir o site devolve o mesmo
--    código, sem criar participante novo.
-- ---------------------------------------------------------------------
create or replace function public.cadastrar_participante(
  p_google_sub text,
  p_google_email text,
  p_google_name text,
  p_google_picture text,
  p_celular text,
  p_empresa text default null,
  p_cargo text default null,
  p_google_verified boolean default false
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
  if p_google_sub is not null then
    select rp.id, rp.codigo, rp.codigo_usado
      into v_id, v_codigo, v_usado
      from public.roleta_participants rp
     where rp.google_sub = p_google_sub;

    if found then
      -- Aproveita pra completar a qualificação, caso o cadastro anterior
      -- tenha vindo antes destes campos existirem.
      update public.roleta_participants
         set empresa = coalesce(empresa, p_empresa),
             cargo   = coalesce(cargo, p_cargo)
       where id = v_id;

      return query select v_id, v_codigo, v_usado, false;
      return;
    end if;
  end if;

  -- Cadastro manual (sem Google): o celular é a chave de unicidade. Se já
  -- existe, devolve o mesmo código em vez de barrar a pessoa.
  if p_google_sub is null then
    select rp.id, rp.codigo, rp.codigo_usado
      into v_id, v_codigo, v_usado
      from public.roleta_participants rp
     where rp.phone_normalized = regexp_replace(p_celular, '\D', '', 'g');

    if found then
      update public.roleta_participants
         set empresa = coalesce(empresa, p_empresa),
             cargo   = coalesce(cargo, p_cargo)
       where id = v_id;

      return query select v_id, v_codigo, v_usado, false;
      return;
    end if;
  end if;

  begin
    insert into public.roleta_participants
      (google_sub, google_email, google_name, google_picture, name, phone,
       empresa, cargo, google_verified)
    values
      (p_google_sub, p_google_email, p_google_name, p_google_picture,
       p_google_name, p_celular, p_empresa, p_cargo, coalesce(p_google_verified, false))
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

revoke all on function public.cadastrar_participante(text, text, text, text, text, text, text, boolean)
  from public, anon, authenticated;
grant execute on function public.cadastrar_participante(text, text, text, text, text, text, text, boolean)
  to service_role;

-- ---------------------------------------------------------------------
-- 2) Giro aceita um prêmio já sorteado offline.
--    `p_prize_id` nulo = comportamento de sempre (servidor sorteia).
--    Preenchido = o tablet sorteou sem rede e isto é a sincronização.
-- ---------------------------------------------------------------------
create or replace function public.girar_roleta_codigo(
  p_codigo integer,
  p_prize_id uuid default null
)
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
  select rp.id, rp.codigo_usado, rp.google_name, rp.prize_id, rp.prize_name
    into v_participant
    from public.roleta_participants rp
   where rp.codigo = p_codigo
     for update;

  if not found then
    raise exception 'CODIGO_INVALIDO' using errcode = 'P0003';
  end if;

  -- 2) Reenvio da fila de um giro que já subiu: devolve o mesmo prêmio em
  --    vez de recusar. Sem isto, a fila insistiria pra sempre num item que
  --    na verdade já deu certo.
  if v_participant.codigo_usado then
    if p_prize_id is not null and v_participant.prize_id is not null then
      return query
        select v_participant.id, v_participant.prize_id,
               v_participant.prize_name, v_participant.google_name;
      return;
    end if;
    raise exception 'JA_PARTICIPOU' using errcode = 'P0001';
  end if;

  if p_prize_id is null then
    -- 3) Sorteio no servidor: trava os candidatos (sem corrida no estoque),
    --    pondera por estoque restante e decrementa.
    perform 1 from public.roleta_prizes
     where active and remaining_stock > 0
     for update;

    select array_agg(id order by sort_order, id),
           array_agg(remaining_stock order by sort_order, id),
           sum(remaining_stock)
      into v_ids, v_weights, v_total_weight
      from public.roleta_prizes
     where active and remaining_stock > 0;

    if v_total_weight is null or v_total_weight = 0 then
      raise exception 'ESGOTADO' using errcode = 'P0002';
    end if;

    v_pick := floor(random() * v_total_weight)::int + 1;
    for i in 1 .. array_length(v_ids, 1) loop
      v_running := v_running + v_weights[i];
      if v_pick <= v_running then
        v_chosen_id := v_ids[i];
        exit;
      end if;
    end loop;

    update public.roleta_prizes
       set remaining_stock = remaining_stock - 1
     where id = v_chosen_id
    returning name into v_chosen_name;
  else
    -- 4) Sorteado offline: valida o prêmio e registra a baixa sem deixar o
    --    estoque negativo.
    select name into v_chosen_name
      from public.roleta_prizes
     where id = p_prize_id
       for update;

    if not found then
      raise exception 'PREMIO_INVALIDO' using errcode = 'P0005';
    end if;

    v_chosen_id := p_prize_id;

    update public.roleta_prizes
       set remaining_stock = greatest(remaining_stock - 1, 0)
     where id = v_chosen_id;
  end if;

  update public.roleta_participants
     set prize_id         = v_chosen_id,
         prize_name       = v_chosen_name,
         codigo_usado     = true,
         sorteado_offline = (p_prize_id is not null)
   where id = v_participant.id;

  return query
    select v_participant.id, v_chosen_id, v_chosen_name, v_participant.google_name;
end;
$$;

revoke all on function public.girar_roleta_codigo(integer, uuid) from public, anon, authenticated;
grant execute on function public.girar_roleta_codigo(integer, uuid) to service_role;
