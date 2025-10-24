create table "public"."notes" (
    "id" uuid not null default gen_random_uuid(),
    "title" text,
    "content" text,
    "created_at" timestamp with time zone not null default now(),
    "public" boolean,
    "session_id" uuid,
    "slug" text,
    "category" text,
    "emoji" text
);


alter table "public"."notes" enable row level security;

CREATE UNIQUE INDEX notes_pkey ON public.notes USING btree (id);

CREATE INDEX session_id_index ON public.notes USING btree (session_id);

alter table "public"."notes" add constraint "notes_pkey" PRIMARY KEY using index "notes_pkey";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.delete_note(uuid_arg uuid, session_arg uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    DELETE FROM public.notes
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.select_note(note_slug_arg text)
 RETURNS SETOF notes
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT *
    FROM notes
    WHERE slug = note_slug_arg LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.select_session_notes(session_id_arg uuid)
 RETURNS SETOF notes
 LANGUAGE sql
 STABLE SECURITY DEFINER
AS $function$
    SELECT *
    FROM notes
    WHERE session_id = session_id_arg;
$function$
;

CREATE OR REPLACE FUNCTION public.update_note(uuid_arg uuid, session_arg uuid, title_arg text, emoji_arg text, content_arg text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET title = title_arg, 
        emoji = emoji_arg, 
        content = content_arg
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_note_content(uuid_arg uuid, session_arg uuid, content_arg text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET content = content_arg
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_note_emoji(uuid_arg uuid, session_arg uuid, emoji_arg text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET emoji = emoji_arg
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.update_note_title(uuid_arg uuid, session_arg uuid, title_arg text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET title = title_arg
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$
;

grant delete on table "public"."notes" to "anon";

grant insert on table "public"."notes" to "anon";

grant references on table "public"."notes" to "anon";

grant select on table "public"."notes" to "anon";

grant trigger on table "public"."notes" to "anon";

grant truncate on table "public"."notes" to "anon";

grant update on table "public"."notes" to "anon";

grant delete on table "public"."notes" to "authenticated";

grant insert on table "public"."notes" to "authenticated";

grant references on table "public"."notes" to "authenticated";

grant select on table "public"."notes" to "authenticated";

grant trigger on table "public"."notes" to "authenticated";

grant truncate on table "public"."notes" to "authenticated";

grant update on table "public"."notes" to "authenticated";

grant delete on table "public"."notes" to "service_role";

grant insert on table "public"."notes" to "service_role";

grant references on table "public"."notes" to "service_role";

grant select on table "public"."notes" to "service_role";

grant trigger on table "public"."notes" to "service_role";

grant truncate on table "public"."notes" to "service_role";

grant update on table "public"."notes" to "service_role";

create policy "allow_all_users_insert_private_notes"
on "public"."notes"
as permissive
for insert
to public
with check ((public = false));


create policy "allow_all_users_select_public_notes"
on "public"."notes"
as permissive
for select
to public
using ((public = true));



