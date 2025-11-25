-- Create storage bucket for note images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'note-images',
  'note-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
);

-- Allow public read access to note images
CREATE POLICY "Public read access for note images"
ON storage.objects FOR SELECT
USING (bucket_id = 'note-images');

-- Allow authenticated users to upload images
CREATE POLICY "Allow users to upload note images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'note-images');

-- Allow users to delete their own uploaded images
CREATE POLICY "Allow users to delete their own note images"
ON storage.objects FOR DELETE
USING (bucket_id = 'note-images');
