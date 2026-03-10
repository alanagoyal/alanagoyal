create table if not exists "public"."app_content_entries" (
    "content_key" text not null,
    "description" text,
    "payload" jsonb not null,
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."app_content_entries" enable row level security;

create unique index if not exists app_content_entries_pkey
on "public"."app_content_entries" using btree ("content_key");

alter table "public"."app_content_entries"
  add constraint "app_content_entries_pkey"
  primary key using index "app_content_entries_pkey";

grant select on table "public"."app_content_entries" to "anon";
grant select on table "public"."app_content_entries" to "authenticated";
grant all on table "public"."app_content_entries" to "service_role";

create policy "allow_public_read_app_content_entries"
on "public"."app_content_entries"
as permissive
for select
to public
using (true);

create or replace function public.upsert_app_content_entry(
    content_key_arg text,
    payload_arg jsonb,
    description_arg text default null
)
returns void
language plpgsql
security definer
as $function$
begin
    insert into public.app_content_entries (content_key, description, payload, updated_at)
    values (content_key_arg, description_arg, payload_arg, now())
    on conflict (content_key)
    do update
      set description = excluded.description,
          payload = excluded.payload,
          updated_at = now();
end;
$function$;

insert into public.app_content_entries (content_key, description, payload)
values
  (
    'weather.default_cities',
    'Curated default cities shown in Weather before local custom cities are merged.',
    '[
      {"id":"san-francisco","name":"San Francisco","latitude":37.78,"longitude":-122.42},
      {"id":"seattle","name":"Seattle","latitude":47.61,"longitude":-122.33},
      {"id":"los-angeles","name":"Los Angeles","latitude":34.05,"longitude":-118.24},
      {"id":"new-york","name":"New York","latitude":40.71,"longitude":-74.01},
      {"id":"london","name":"London","latitude":51.51,"longitude":-0.13},
      {"id":"paris","name":"Paris","latitude":48.86,"longitude":2.35}
    ]'::jsonb
  )
on conflict (content_key)
do update
  set description = excluded.description,
      payload = excluded.payload,
      updated_at = now();
