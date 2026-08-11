create table public.game_api_rate_limits (
  bucket_key text primary key,
  request_count integer not null,
  window_started_at timestamptz not null,
  expires_at timestamptz not null,
  updated_at timestamptz not null default now(),
  constraint game_api_rate_limits_bucket_key_check
    check (char_length(bucket_key) between 1 and 160),
  constraint game_api_rate_limits_request_count_check
    check (request_count between 1 and 10000),
  constraint game_api_rate_limits_window_check
    check (expires_at > window_started_at)
);

create index game_api_rate_limits_expiry_idx
  on public.game_api_rate_limits (expires_at);

alter table public.game_api_rate_limits enable row level security;
revoke all on public.game_api_rate_limits from public, anon, authenticated;
grant select, insert, update, delete on public.game_api_rate_limits to service_role;

create or replace function public.game_consume_rate_limit(
  bucket_key_arg text,
  request_limit_arg integer,
  window_seconds_arg integer
)
returns table (
  allowed boolean,
  remaining integer,
  reset_at timestamptz
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_time timestamptz := pg_catalog.statement_timestamp();
  current_count integer;
  current_expiry timestamptz;
begin
  if char_length(bucket_key_arg) not between 1 and 160 then
    raise exception 'invalid rate-limit bucket key';
  end if;
  if request_limit_arg not between 1 and 10000 then
    raise exception 'invalid rate-limit request limit';
  end if;
  if window_seconds_arg not between 1 and 3600 then
    raise exception 'invalid rate-limit window';
  end if;

  -- Keep cleanup bounded and outside the per-bucket critical section. SKIP
  -- LOCKED prevents routine cleanup from waiting on active bucket updates.
  if pg_catalog.random() < 0.01 then
    delete from public.game_api_rate_limits
    where bucket_key in (
      select stale.bucket_key
      from public.game_api_rate_limits as stale
      where stale.expires_at < current_time - interval '5 minutes'
      order by stale.expires_at
      limit 100
      for update skip locked
    );
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(bucket_key_arg, 0)
  );

  select request_count, expires_at
    into current_count, current_expiry
    from public.game_api_rate_limits
    where bucket_key = bucket_key_arg
    for update;

  if current_count is null or current_expiry <= current_time then
    current_count := 1;
    current_expiry := current_time + pg_catalog.make_interval(secs => window_seconds_arg);

    insert into public.game_api_rate_limits (
      bucket_key,
      request_count,
      window_started_at,
      expires_at,
      updated_at
    ) values (
      bucket_key_arg,
      current_count,
      current_time,
      current_expiry,
      current_time
    )
    on conflict (bucket_key) do update set
      request_count = excluded.request_count,
      window_started_at = excluded.window_started_at,
      expires_at = excluded.expires_at,
      updated_at = excluded.updated_at;

    return query select true, request_limit_arg - current_count, current_expiry;
    return;
  end if;

  if current_count >= request_limit_arg then
    return query select false, 0, current_expiry;
    return;
  end if;

  update public.game_api_rate_limits
    set request_count = request_count + 1,
        updated_at = current_time
    where bucket_key = bucket_key_arg
    returning request_count, expires_at
      into current_count, current_expiry;

  return query select true, request_limit_arg - current_count, current_expiry;
end;
$$;

revoke all on function public.game_consume_rate_limit(text, integer, integer)
  from public, anon, authenticated;
grant execute on function public.game_consume_rate_limit(text, integer, integer)
  to service_role;
