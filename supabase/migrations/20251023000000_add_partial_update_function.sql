-- Create a flexible update function that only updates fields that are provided
-- Uses special sentinel value to distinguish between "don't update" and "set to value"
-- Pass '___NO_UPDATE___' for fields that should not be updated
CREATE OR REPLACE FUNCTION public.update_note_partial(
  uuid_arg uuid,
  session_arg uuid,
  title_arg text DEFAULT '___NO_UPDATE___',
  emoji_arg text DEFAULT '___NO_UPDATE___',
  content_arg text DEFAULT '___NO_UPDATE___'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
    UPDATE public.notes
    SET
        title = CASE WHEN title_arg = '___NO_UPDATE___' THEN title ELSE title_arg END,
        emoji = CASE WHEN emoji_arg = '___NO_UPDATE___' THEN emoji ELSE emoji_arg END,
        content = CASE WHEN content_arg = '___NO_UPDATE___' THEN content ELSE content_arg END
    WHERE id = uuid_arg AND session_id = session_arg;
END;
$function$;
