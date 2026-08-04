-- Placar do arcade (Concreteshow).
--
-- Cada visitante joga um jogo e recebe uma pontuação de 1000 a 2000, calculada
-- no servidor a partir do tempo e do número de jogadas. A escala é a mesma nos
-- quatro jogos, então o ranking geral compara maçãs com maçãs.
--
-- Idempotente: pode rodar mais de uma vez.

create table if not exists public.arcade_scores (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references public.roleta_participants(id) on delete cascade,
  codigo integer not null,
  -- Nome já abreviado ("Vinicius F.") — a tela do placar é pública, então o
  -- nome completo nunca sai do banco.
  nome_exibicao text not null,
  jogo text not null check (jogo in ('chute', 'memoria', 'cobrinha', 'velha')),
  pontos integer not null check (pontos >= 0),
  tempo_ms integer,
  jogadas integer,
  created_at timestamptz not null default now()
);

create index if not exists arcade_scores_ranking_idx
  on public.arcade_scores (pontos desc, created_at);
create index if not exists arcade_scores_jogo_idx
  on public.arcade_scores (jogo, pontos desc, created_at);

alter table public.arcade_scores enable row level security;
-- Sem policies: só service_role (o front fala com /api/*, nunca com o banco).

-- ---------------------------------------------------------------------
-- Ranking: melhor pontuação de cada participante.
-- `p_jogo` nulo = ranking geral; senão, ranking daquele jogo.
-- Empate é desempatado por quem marcou primeiro.
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
     where p_jogo is null or s.jogo = p_jogo
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
