alter table public.game_matches
  add column white_name text not null default 'Visitor',
  add column black_name text,
  add constraint game_matches_white_name_check check (char_length(white_name) between 1 and 20),
  add constraint game_matches_black_name_check check (black_name is null or char_length(black_name) between 1 and 20);

drop function if exists public.game_matchmake(uuid, text);

create or replace function public.game_matchmake(visitor_id_arg uuid, secret_hash_arg text, visitor_name_arg text)
returns public.game_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  existing_match public.game_matches;
  waiting_match public.game_matches;
begin
  if char_length(visitor_name_arg) not between 1 and 20 then
    raise exception 'invalid player name';
  end if;

  update public.game_matches
    set status = 'expired', updated_at = now()
    where status in ('waiting', 'active') and expires_at <= now();

  select * into existing_match from public.game_matches
    where (white_visitor_id = visitor_id_arg and white_secret_hash = secret_hash_arg)
       or (black_visitor_id = visitor_id_arg and black_secret_hash = secret_hash_arg)
    order by updated_at desc limit 1;

  if existing_match.status = 'waiting' and existing_match.expires_at > now() then
    update public.game_matches set white_name = visitor_name_arg, updated_at = now()
      where id = existing_match.id returning * into existing_match;
    return existing_match;
  end if;

  if existing_match.status = 'active' and existing_match.expires_at > now() then
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
      black_name = visitor_name_arg, black_heartbeat_at = now(), expires_at = now() + interval '75 seconds',
      updated_at = now(), version = version + 1
      where id = waiting_match.id returning * into waiting_match;
    return waiting_match;
  end if;

  insert into public.game_matches (white_visitor_id, white_secret_hash, white_name)
    values (visitor_id_arg, secret_hash_arg, visitor_name_arg) returning * into waiting_match;
  return waiting_match;
end;
$$;

revoke all on function public.game_matchmake(uuid, text, text) from public, anon, authenticated;
grant execute on function public.game_matchmake(uuid, text, text) to service_role;
