-- Migração: JOGA PRIMEIRO, CADASTRA DEPOIS.
--
-- Inverte a ordem do fluxo do estande. Antes: escaneia o QR, faz login,
-- recebe um código, digita no tablet e só então joga. Agora: chega e joga
-- direto no tablet; o cadastro só aparece depois da vitória, no celular da
-- própria pessoa, e é ele que libera o giro da roleta.
--
-- Três consequências no banco:
--
--   1. A PARTIDA NASCE ANÔNIMA. Quando o visitante vence, ainda não sabemos
--      quem é. A pontuação é gravada sem participante e ganha dono quando o
--      cadastro acontece — por isso `nome_exibicao` passa a aceitar nulo e o
--      ranking só lista quem já se identificou.
--
--   2. `partida_id` É A CHAVE DE IDEMPOTÊNCIA. É um UUID gerado no navegador
--      do tablet no início da partida. A fila offline reenvia até obter
--      resposta, então o mesmo giro pode chegar duas vezes aqui — e não pode
--      virar dois sorteios nem dois leads no CRM. Índice único garante isso.
--
--   3. EMPRESA E CARGO viram parte do lead. O Google não fornece nenhum dos
--      dois, e numa feira de construção pesada são eles que separam curioso
--      de comprador.
--
-- Idempotente: pode rodar mais de uma vez. Aditivo — não toca em
-- webhook_leads_summary (tabela compartilhada do CRM).

-- ---------------------------------------------------------------------
-- 1) Lead ganha qualificação
-- ---------------------------------------------------------------------
alter table public.roleta_participants
  add column if not exists empresa text,
  add column if not exists cargo text,
  -- false = cadastro manual, ou Google cujo token não pôde ser verificado
  -- (giro offline sincronizado depois: ID tokens valem ~1h). Registrar com
  -- confiabilidade menor é melhor do que perder o lead.
  add column if not exists google_verified boolean not null default false;

-- Marca como verificados os participantes que já vieram do login Google
-- (antes desta migração, só existia esse caminho).
update public.roleta_participants
   set google_verified = true
 where google_sub is not null and google_verified = false;

-- ---------------------------------------------------------------------
-- 2) Pontuação passa a nascer sem dono
-- ---------------------------------------------------------------------
alter table public.arcade_scores
  add column if not exists partida_id uuid,
  add column if not exists prize_id uuid references public.roleta_prizes(id),
  add column if not exists prize_name text,
  add column if not exists sorteado_offline boolean not null default false,
  add column if not exists resgatado_em timestamptz;

-- `codigo` e `nome_exibicao` eram obrigatórios porque a pontuação só existia
-- depois do cadastro. Agora a partida vem antes: ambos ficam nulos até o
-- visitante se identificar.
alter table public.arcade_scores alter column codigo drop not null;
alter table public.arcade_scores alter column nome_exibicao drop not null;

-- A chave de idempotência do reenvio.
create unique index if not exists arcade_scores_partida_id_key
  on public.arcade_scores (partida_id) where partida_id is not null;

-- ---------------------------------------------------------------------
-- 3) RPC registrar_partida — chamada pelo TABLET, ao vencer.
--    Grava a pontuação sem dono e devolve a linha. Reenvio da fila cai no
--    on conflict e devolve o que já existe, sem duplicar.
-- ---------------------------------------------------------------------
create or replace function public.registrar_partida(
  p_partida_id uuid,
  p_jogo text,
  p_pontos integer,
  p_tempo_ms integer default null,
  p_jogadas integer default null,
  p_tentativas integer default 1
)
returns table (score_id uuid, ja_existia boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id       uuid;
  v_existia  boolean := false;
begin
  select s.id into v_id
    from public.arcade_scores s
   where s.partida_id = p_partida_id;

  if found then
    return query select v_id, true;
    return;
  end if;

  insert into public.arcade_scores
    (partida_id, jogo, pontos, tempo_ms, jogadas, tentativas)
  values
    (p_partida_id, p_jogo, p_pontos, p_tempo_ms, p_jogadas, coalesce(p_tentativas, 1))
  on conflict (partida_id) where partida_id is not null do nothing
  returning id into v_id;

  -- Corrida com outro reenvio simultâneo: a linha apareceu no meio do caminho.
  if v_id is null then
    select s.id into v_id from public.arcade_scores s where s.partida_id = p_partida_id;
    v_existia := true;
  end if;

  return query select v_id, v_existia;
end;
$$;

revoke all on function public.registrar_partida(uuid, text, integer, integer, integer, integer)
  from public, anon, authenticated;
grant execute on function public.registrar_partida(uuid, text, integer, integer, integer, integer)
  to service_role;

-- ---------------------------------------------------------------------
-- 4) Abreviação do nome — a tela do placar é pública, então o nome completo
--    nunca sai do banco. "Vinicius Ferreira" -> "Vinicius F."
-- ---------------------------------------------------------------------
create or replace function public.abreviar_nome(p_nome text)
returns text
language sql
immutable
as $$
  select case
    when p_nome is null or btrim(p_nome) = '' then 'Visitante'
    when array_length(regexp_split_to_array(btrim(p_nome), '\s+'), 1) = 1 then btrim(p_nome)
    else (regexp_split_to_array(btrim(p_nome), '\s+'))[1] || ' ' ||
         upper(left((regexp_split_to_array(btrim(p_nome), '\s+'))[
           array_length(regexp_split_to_array(btrim(p_nome), '\s+'), 1)
         ], 1)) || '.'
  end;
$$;

-- ---------------------------------------------------------------------
-- 5) RPC resgatar_partida — chamada pelo CELULAR, no cadastro pós-jogo.
--    Cria o lead, amarra na partida e sorteia o brinde, tudo numa transação.
--
--    `p_prize_id` preenchido = o navegador já sorteou offline e aqui só
--    registramos a baixa. Nesse caso o estoque usa greatest(stock-1, 0):
--    negar um brinde já entregue na mão da pessoa seria pior do que deixar
--    o estoque furado, e `sorteado_offline` marca a linha pra equipe
--    reconciliar depois.
-- ---------------------------------------------------------------------
create or replace function public.resgatar_partida(
  p_partida_id uuid,
  p_nome text,
  p_empresa text,
  p_cargo text,
  p_celular text,
  p_email text default null,
  p_google_sub text default null,
  p_google_picture text default null,
  p_google_verified boolean default false,
  p_prize_id uuid default null
)
returns table (
  participant_id uuid,
  codigo integer,
  prize_id uuid,
  prize_name text,
  ja_resgatado boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_score        record;
  v_participant  uuid;
  v_codigo       integer;
  v_ids          uuid[];
  v_weights      integer[];
  v_total        integer;
  v_pick         integer;
  v_running      integer := 0;
  v_chosen_id    uuid;
  v_chosen_name  text;
  i              integer;
begin
  -- 1) A partida precisa existir (o tablet a registrou ao vencer) e é
  --    travada aqui: dois resgates simultâneos do mesmo QR viram um só.
  select s.id, s.partida_id, s.participant_id, s.prize_id, s.prize_name
    into v_score
    from public.arcade_scores s
   where s.partida_id = p_partida_id
     for update;

  if not found then
    raise exception 'PARTIDA_NAO_ENCONTRADA' using errcode = 'P0004';
  end if;

  -- 2) Reenvio da fila de algo que já subiu: devolve o mesmo prêmio.
  if v_score.participant_id is not null then
    select rp.codigo into v_codigo
      from public.roleta_participants rp
     where rp.id = v_score.participant_id;

    return query
      select v_score.participant_id, v_codigo, v_score.prize_id, v_score.prize_name, true;
    return;
  end if;

  -- 3) Cria o lead. Unicidade por conta Google ou por celular continua
  --    valendo — cada pessoa leva um brinde só.
  begin
    insert into public.roleta_participants
      (google_sub, google_email, google_name, google_picture,
       name, phone, empresa, cargo, google_verified)
    values
      (p_google_sub, p_email, p_nome, p_google_picture,
       p_nome, p_celular, p_empresa, p_cargo, coalesce(p_google_verified, false))
    returning id, roleta_participants.codigo into v_participant, v_codigo;
  exception
    when unique_violation then
      raise exception 'JA_PARTICIPOU' using errcode = 'P0001';
  end;

  -- 4) Sorteio. Trava as linhas candidatas: sem condição de corrida no
  --    estoque, mesma garantia da versão anterior.
  if p_prize_id is null then
    perform 1 from public.roleta_prizes
     where active and remaining_stock > 0
       for update;

    select array_agg(id order by sort_order, id),
           array_agg(remaining_stock order by sort_order, id),
           sum(remaining_stock)
      into v_ids, v_weights, v_total
      from public.roleta_prizes
     where active and remaining_stock > 0;

    if v_total is null or v_total = 0 then
      raise exception 'ESGOTADO' using errcode = 'P0002';
    end if;

    -- Ponderado por estoque restante: mais unidades = mais provável,
    -- e o equilíbrio se corrige sozinho conforme os brindes acabam.
    v_pick := floor(random() * v_total)::int + 1;
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
    -- Sorteado offline: valida que o prêmio existe e registra a baixa sem
    -- deixar o estoque negativo.
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

  -- 5) Amarra tudo: pontuação ganha dono, nome e prêmio.
  update public.arcade_scores
     set participant_id   = v_participant,
         codigo           = v_codigo,
         nome_exibicao    = public.abreviar_nome(p_nome),
         prize_id         = v_chosen_id,
         prize_name       = v_chosen_name,
         sorteado_offline = (p_prize_id is not null),
         resgatado_em     = now()
   where id = v_score.id;

  update public.roleta_participants
     set prize_id = v_chosen_id, prize_name = v_chosen_name
   where id = v_participant;

  return query select v_participant, v_codigo, v_chosen_id, v_chosen_name, false;
end;
$$;

revoke all on function public.resgatar_partida(uuid, text, text, text, text, text, text, text, boolean, uuid)
  from public, anon, authenticated;
grant execute on function public.resgatar_partida(uuid, text, text, text, text, text, text, text, boolean, uuid)
  to service_role;

-- ---------------------------------------------------------------------
-- 6) Ranking — só lista quem já se identificou.
--    Quem jogou e ainda não cadastrou tem a pontuação guardada, mas fica
--    fora da tela: é o incentivo pra escanear o QR e completar o cadastro.
-- ---------------------------------------------------------------------
create or replace function public.ranking_arcade(p_jogo text default null, p_limite integer default 10)
returns table (posicao bigint, nome_exibicao text, jogo text, pontos integer, tempo_ms integer)
language sql
security definer
set search_path = public
as $$
  with melhores as (
    select distinct on (s.participant_id)
           s.participant_id, s.nome_exibicao, s.jogo, s.pontos, s.tempo_ms, s.created_at
      from public.arcade_scores s
     where s.participant_id is not null
       and s.nome_exibicao is not null
       and (p_jogo is null or s.jogo = p_jogo)
     order by s.participant_id, s.pontos desc, s.created_at
  )
  select row_number() over (order by m.pontos desc, m.created_at) as posicao,
         m.nome_exibicao, m.jogo, m.pontos, m.tempo_ms
    from melhores m
   order by m.pontos desc, m.created_at
   limit greatest(p_limite, 1);
$$;

revoke all on function public.ranking_arcade(text, integer) from public, anon, authenticated;
grant execute on function public.ranking_arcade(text, integer) to service_role;
