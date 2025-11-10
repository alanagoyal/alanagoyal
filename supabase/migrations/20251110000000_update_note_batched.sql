-- Create the new batched update function that uses COALESCE to only update provided fields
CREATE OR REPLACE FUNCTION public.update_note_batched(
  uuid_arg uuid,
  session_arg uuid,
  title_arg text,
  emoji_arg text,
  content_arg text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET
        title = COALESCE(title_arg, title),
        emoji = COALESCE(emoji_arg, emoji),
        content = COALESCE(content_arg, content)
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$;

-- Drop the old individual field update functions
DROP FUNCTION IF EXISTS public.update_note_title(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.update_note_emoji(uuid, uuid, text);
DROP FUNCTION IF EXISTS public.update_note_content(uuid, uuid, text);

-- Drop the old update_note function (replaced by update_note_batched)
DROP FUNCTION IF EXISTS public.update_note(uuid, uuid, text, text, text);
