create table public.game_matches (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'waiting' check (status in ('waiting', 'active', 'completed', 'expired')),
  white_visitor_id uuid not null,
  white_secret_hash text not null,
  black_visitor_id uuid,
  black_secret_hash text,
  fen text not null default 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn text not null default '',
  move_history jsonb not null default '[]'::jsonb,
  version integer not null default 0,
  result text check (result is null or result in ('white', 'black', 'draw', 'abandoned')),
  waiting_heartbeat_at timestamptz default now(),
  white_heartbeat_at timestamptz not null default now(),
  black_heartbeat_at timestamptz,
  expires_at timestamptz not null default (now() + interval '75 seconds'),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'waiting' and black_visitor_id is null) or status <> 'waiting')
);

create index game_matches_waiting_idx on public.game_matches (status, waiting_heartbeat_at desc);
create index game_matches_white_idx on public.game_matches (white_visitor_id, updated_at desc);
create index game_matches_black_idx on public.game_matches (black_visitor_id, updated_at desc);
alter table public.game_matches enable row level security;
revoke all on public.game_matches from anon, authenticated;
grant all on public.game_matches to service_role;

create or replace function public.game_matchmake(visitor_id_arg uuid, secret_hash_arg text)
returns public.game_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_match public.game_matches;
  waiting_match public.game_matches;
begin
  update public.game_matches
    set status = 'expired', updated_at = now()
    where status in ('waiting', 'active') and expires_at <= now();

  select * into existing_match from public.game_matches
    where (white_visitor_id = visitor_id_arg and white_secret_hash = secret_hash_arg)
       or (black_visitor_id = visitor_id_arg and black_secret_hash = secret_hash_arg)
    order by updated_at desc limit 1;
  if existing_match.status in ('waiting', 'active') and existing_match.expires_at > now() then
    return existing_match;
  end if;

  select * into waiting_match from public.game_matches
    where status = 'waiting'
      and white_visitor_id <> visitor_id_arg
      and waiting_heartbeat_at > now() - interval '45 seconds'
      and expires_at > now()
    order by created_at asc
    for update skip locked limit 1;

  if waiting_match.id is not null then
    update public.game_matches set
      status = 'active', black_visitor_id = visitor_id_arg, black_secret_hash = secret_hash_arg,
      black_heartbeat_at = now(), expires_at = now() + interval '75 seconds', updated_at = now(), version = version + 1
      where id = waiting_match.id returning * into waiting_match;
    return waiting_match;
  end if;

  insert into public.game_matches (white_visitor_id, white_secret_hash)
    values (visitor_id_arg, secret_hash_arg) returning * into waiting_match;
  return waiting_match;
end;
$$;

revoke all on function public.game_matchmake(uuid, text) from public, anon, authenticated;
grant execute on function public.game_matchmake(uuid, text) to service_role;

alter publication supabase_realtime add table public.game_matches;
