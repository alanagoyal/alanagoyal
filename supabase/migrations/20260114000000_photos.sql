-- Create photos table
-- Note: favorites are stored per-visitor in localStorage, not in database
create table "public"."photos" (
    "id" uuid not null default gen_random_uuid(),
    "filename" text not null,
    "url" text not null,
    "timestamp" timestamp with time zone not null,
    "collections" text[] not null default '{}',
    "created_at" timestamp with time zone not null default now()
);

alter table "public"."photos" enable row level security;

CREATE UNIQUE INDEX photos_pkey ON public.photos USING btree (id);
CREATE INDEX photos_timestamp_idx ON public.photos USING btree (timestamp);

alter table "public"."photos" add constraint "photos_pkey" PRIMARY KEY using index "photos_pkey";

-- RPC function to get all photos
CREATE OR REPLACE FUNCTION public.select_photos()
 RETURNS SETOF photos
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT *
    FROM photos
    ORDER BY timestamp ASC;
$function$
;

-- RPC function to insert a photo (for API endpoint)
CREATE OR REPLACE FUNCTION public.insert_photo(
    filename_arg text,
    url_arg text,
    timestamp_arg timestamp with time zone,
    collections_arg text[] DEFAULT '{}'
)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    new_id uuid;
BEGIN
    INSERT INTO public.photos (filename, url, timestamp, collections)
    VALUES (filename_arg, url_arg, timestamp_arg, collections_arg)
    RETURNING id INTO new_id;
    RETURN new_id;
END;
$function$
;

-- Grant permissions to anon role (for public read access)
grant select on table "public"."photos" to "anon";
grant insert on table "public"."photos" to "anon";

-- Grant permissions to authenticated role
grant select on table "public"."photos" to "authenticated";
grant insert on table "public"."photos" to "authenticated";

-- Grant full permissions to service_role
grant all on table "public"."photos" to "service_role";

-- RLS policies: allow public read access
create policy "allow_public_read_photos"
on "public"."photos"
as permissive
for select
to public
using (true);

-- RLS policy: allow inserts (controlled via API key at endpoint level)
create policy "allow_insert_photos"
on "public"."photos"
as permissive
for insert
to public
with check (true);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'photos',
  'photos',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
);

-- Allow public read access to photos
CREATE POLICY "Public read access for photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'photos');

-- Allow uploads to photos bucket
CREATE POLICY "Allow uploads to photos bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'photos');
