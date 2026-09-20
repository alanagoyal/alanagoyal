alter table public.photos
  add column if not exists search_text text;
