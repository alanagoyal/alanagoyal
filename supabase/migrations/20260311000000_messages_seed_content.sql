create table if not exists "public"."messages_seed_contacts" (
    "name" text not null,
    "title" text,
    "prompt" text,
    "bio" text,
    "sort_order" integer not null default 0,
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."messages_seed_contacts" enable row level security;

create unique index if not exists messages_seed_contacts_pkey
on "public"."messages_seed_contacts" using btree ("name");

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_seed_contacts_pkey'
  ) then
    alter table "public"."messages_seed_contacts"
      add constraint "messages_seed_contacts_pkey"
      primary key using index "messages_seed_contacts_pkey";
  end if;
end
$$;

grant select on table "public"."messages_seed_contacts" to "anon";
grant select on table "public"."messages_seed_contacts" to "authenticated";
grant all on table "public"."messages_seed_contacts" to "service_role";

drop policy if exists "allow_public_read_messages_seed_contacts"
on "public"."messages_seed_contacts";

create policy "allow_public_read_messages_seed_contacts"
on "public"."messages_seed_contacts"
as permissive
for select
to public
using (true);

create or replace function public.upsert_messages_seed_contact(
    name_arg text,
    title_arg text default null,
    prompt_arg text default null,
    bio_arg text default null,
    sort_order_arg integer default 0
)
returns void
language plpgsql
security definer
as $function$
begin
    insert into public.messages_seed_contacts (
      name,
      title,
      prompt,
      bio,
      sort_order,
      updated_at
    )
    values (
      name_arg,
      title_arg,
      prompt_arg,
      bio_arg,
      sort_order_arg,
      now()
    )
    on conflict (name)
    do update
      set title = excluded.title,
          prompt = excluded.prompt,
          bio = excluded.bio,
          sort_order = excluded.sort_order,
          updated_at = now();
end;
$function$;

create table if not exists "public"."messages_seed_conversations" (
    "conversation_id" text not null,
    "payload" jsonb not null,
    "sort_order" integer not null default 0,
    "updated_at" timestamp with time zone not null default now()
);

alter table "public"."messages_seed_conversations" enable row level security;

create unique index if not exists messages_seed_conversations_pkey
on "public"."messages_seed_conversations" using btree ("conversation_id");

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'messages_seed_conversations_pkey'
  ) then
    alter table "public"."messages_seed_conversations"
      add constraint "messages_seed_conversations_pkey"
      primary key using index "messages_seed_conversations_pkey";
  end if;
end
$$;

grant select on table "public"."messages_seed_conversations" to "anon";
grant select on table "public"."messages_seed_conversations" to "authenticated";
grant all on table "public"."messages_seed_conversations" to "service_role";

drop policy if exists "allow_public_read_messages_seed_conversations"
on "public"."messages_seed_conversations";

create policy "allow_public_read_messages_seed_conversations"
on "public"."messages_seed_conversations"
as permissive
for select
to public
using (true);

create or replace function public.upsert_messages_seed_conversation(
    conversation_id_arg text,
    payload_arg jsonb,
    sort_order_arg integer default 0
)
returns void
language plpgsql
security definer
as $function$
begin
    insert into public.messages_seed_conversations (
      conversation_id,
      payload,
      sort_order,
      updated_at
    )
    values (
      conversation_id_arg,
      payload_arg,
      sort_order_arg,
      now()
    )
    on conflict (conversation_id)
    do update
      set payload = excluded.payload,
          sort_order = excluded.sort_order,
          updated_at = now();
end;
$function$;
