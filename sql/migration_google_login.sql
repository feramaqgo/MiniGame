-- Migração: login com Google no lugar de nome/CNPJ digitados.
-- Tabela roleta_participants estava vazia no momento desta migração — não há
-- dados reais a preservar. Rodar no SQL Editor do Supabase.

-- 1) Remove CNPJ (não é mais coletado)
alter table public.roleta_participants
  drop constraint if exists roleta_participants_cnpj_key;

alter table public.roleta_participants
  drop column if exists cnpj,
  drop column if exists cnpj_normalized;

-- 2) Remove a coluna "name" digitada e sua constraint — nome agora vem do
--    Google (verificado), não precisa mais de checagem de unicidade nele
--    (a identidade real é garantida pelo google_sub, mais forte que nome).
alter table public.roleta_participants
  drop constraint if exists roleta_participants_name_key;

-- 3) Novas colunas: identidade da conta Google
alter table public.roleta_participants
  add column if not exists google_sub text,
  add column if not exists google_email text,
  add column if not exists google_name text,
  add column if not exists google_picture text;

-- Renomeia a coluna "name" existente pra refletir que agora vem do Google
-- (mantém dado se algum registro de teste existir; segue null-able)
alter table public.roleta_participants
  alter column name drop not null;

-- 4) Um giro por conta Google — a trava mais forte contra replay
alter table public.roleta_participants
  add constraint roleta_participants_google_sub_key unique (google_sub);

-- phone_normalized (celular) continua com unique constraint de antes —
-- bloqueia repetir pelo número de celular também, mesmo com conta Google diferente.

-- ---------------------------------------------------------------------
-- RPC girar_roleta — agora recebe os dados do Google + celular.
-- Mesma lógica de transação única (reivindica unicidade -> trava
-- candidatos -> sorteio ponderado -> decrementa -> devolve), só troca
-- os parâmetros de entrada e o que é gravado no participante.
-- ---------------------------------------------------------------------
drop function if exists public.girar_roleta(text, text, text);

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

  update public.roleta_participants
     set prize_id = v_chosen_id, prize_name = v_chosen_name
   where id = v_participant_id;

  return query select v_participant_id, v_chosen_id, v_chosen_name;
end;
$$;

revoke all on function public.girar_roleta(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.girar_roleta(text, text, text, text, text) to service_role;
