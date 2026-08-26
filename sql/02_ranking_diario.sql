-- Atualiza a função do ranking para filtrar apenas os jogos realizados "HOJE"
-- no fuso horário do Brasil (America/Sao_Paulo), evitando que o ranking 
-- seja resetado às 21h devido ao UTC do Supabase.

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
     where (p_jogo is null or s.jogo = p_jogo)
       and (s.created_at at time zone 'America/Sao_Paulo')::date = (now() at time zone 'America/Sao_Paulo')::date
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
