-- Add function to update note created_at date
CREATE OR REPLACE FUNCTION public.update_note_date(uuid_arg uuid, session_arg uuid, created_at_arg timestamp with time zone)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET created_at = created_at_arg
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$;