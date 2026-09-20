create extension if not exists vector with schema extensions;

alter table public.photos
  add column if not exists caption text not null default '',
  add column if not exists tags text[] not null default '{}',
  add column if not exists ocr_text text not null default '',
  add column if not exists embedding extensions.vector(512),
  add column if not exists analyzed_at timestamp with time zone;

create index if not exists photos_embedding_hnsw_idx
  on public.photos
  using hnsw (embedding vector_cosine_ops)
  where embedding is not null;

drop function if exists public.insert_photo(text, text, timestamp with time zone, text[]);

create function public.insert_photo(
  filename_arg text,
  url_arg text,
  timestamp_arg timestamp with time zone,
  collections_arg text[] default '{}',
  caption_arg text default '',
  tags_arg text[] default '{}',
  ocr_text_arg text default '',
  embedding_arg extensions.vector(512) default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $function$
declare
  new_id uuid;
begin
  insert into public.photos (
    filename,
    url,
    timestamp,
    collections,
    caption,
    tags,
    ocr_text,
    embedding,
    analyzed_at
  )
  values (
    filename_arg,
    url_arg,
    timestamp_arg,
    collections_arg,
    caption_arg,
    tags_arg,
    ocr_text_arg,
    embedding_arg,
    case when caption_arg <> '' or cardinality(tags_arg) > 0 or ocr_text_arg <> ''
      then now()
      else null
    end
  )
  returning id into new_id;

  return new_id;
end;
$function$;

revoke all on function public.insert_photo(
  text,
  text,
  timestamp with time zone,
  text[],
  text,
  text[],
  text,
  extensions.vector
) from public, anon, authenticated;
grant execute on function public.insert_photo(
  text,
  text,
  timestamp with time zone,
  text[],
  text,
  text[],
  text,
  extensions.vector
) to service_role;

create or replace function public.search_photos(
  query_embedding_arg extensions.vector(512),
  match_threshold_arg double precision default 0.08,
  match_count_arg integer default 40,
  collection_filter_arg text default null
)
returns table (
  id uuid,
  filename text,
  caption text,
  tags text[],
  ocr_text text,
  collections text[],
  similarity double precision
)
language sql
stable
security invoker
set search_path = ''
as $function$
  select
    photo.id,
    photo.filename,
    photo.caption,
    photo.tags,
    photo.ocr_text,
    photo.collections,
    1 - (photo.embedding <=> query_embedding_arg) as similarity
  from public.photos as photo
  where photo.embedding is not null
    and 1 - (photo.embedding <=> query_embedding_arg) >= match_threshold_arg
    and (
      collection_filter_arg is null
      or collection_filter_arg = any(photo.collections)
    )
  order by photo.embedding <=> query_embedding_arg
  limit least(greatest(match_count_arg, 1), 100);
$function$;

revoke all on function public.search_photos(
  extensions.vector,
  double precision,
  integer,
  text
) from public, anon, authenticated;
grant execute on function public.search_photos(
  extensions.vector,
  double precision,
  integer,
  text
) to service_role;
