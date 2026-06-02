create table if not exists public.game_scores (
  id uuid primary key default gen_random_uuid(),
  game_key text not null check (game_key in ('one-line', 'dance-teacher', 'lunch-run')),
  player_name text not null check (char_length(player_name) between 1 and 12),
  score_value integer not null check (score_value >= 0),
  created_at timestamptz not null default now()
);

create index if not exists game_scores_game_score_desc_idx
  on public.game_scores (game_key, score_value desc, created_at asc);

create index if not exists game_scores_game_score_asc_idx
  on public.game_scores (game_key, score_value asc, created_at asc);

alter table public.game_scores enable row level security;

drop policy if exists "Anyone can read scores" on public.game_scores;
create policy "Anyone can read scores"
  on public.game_scores
  for select
  using (true);

drop policy if exists "Anyone can submit scores" on public.game_scores;
create policy "Anyone can submit scores"
  on public.game_scores
  for insert
  with check (
    game_key in ('one-line', 'dance-teacher', 'lunch-run')
    and char_length(player_name) between 1 and 12
    and score_value >= 0
  );

do $$
begin
  alter publication supabase_realtime add table public.game_scores;
exception
  when duplicate_object then null;
end $$;
