# Image Upload Feature - Setup Guide

This guide explains how to enable and test the new image paste functionality in notes.

## What's Been Implemented

✅ **Full copy-paste image support** - Users can paste images directly into notes
✅ **Supabase Storage integration** - Images uploaded to cloud storage
✅ **Automatic markdown insertion** - Image URLs inserted as `![alt](url)` syntax
✅ **Upload feedback** - Visual indicator while uploading
✅ **File validation** - Type and size checks (5MB limit)
✅ **Supported formats**: JPEG, PNG, GIF, WebP

## Files Created/Modified

### New Files:
1. **`supabase/migrations/20250125000000_create_note_images_bucket.sql`** - Storage bucket configuration
2. **`lib/image-upload.ts`** - Image upload utilities
3. **`IMAGE_UPLOAD_SETUP.md`** - This setup guide

### Modified Files:
1. **`components/note-content.tsx`** - Added paste event handler and upload UI

## Setup Instructions

### 1. Apply Database Migration

You need to apply the migration to create the storage bucket. Choose one option:

#### Option A: Using Supabase CLI (Local Development)

```bash
# If Supabase CLI is not installed, install it first:
# npm install -g supabase

# Start local Supabase (if not already running)
supabase start

# Apply the migration
supabase db reset

# Or apply just the new migration
supabase migration up
```

#### Option B: Using Supabase Dashboard (Production/Hosted)

1. Go to your Supabase project dashboard
2. Navigate to **Database** → **Migrations**
3. Click **New Migration**
4. Copy and paste the contents of `supabase/migrations/20250125000000_create_note_images_bucket.sql`
5. Run the migration

#### Option C: Manual SQL Execution

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/20250125000000_create_note_images_bucket.sql`
4. Click **Run**

### 2. Verify Storage Bucket

After applying the migration, verify the bucket was created:

1. Go to **Storage** in your Supabase dashboard
2. You should see a bucket named `note-images`
3. The bucket should be configured as:
   - **Public**: Yes
   - **File size limit**: 5MB
   - **Allowed MIME types**: image/jpeg, image/png, image/gif, image/webp

### 3. Test the Feature

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Create or open a note**

3. **Test image paste**:
   - Copy an image to your clipboard (screenshot, image file, etc.)
   - Click into the note textarea
   - Press `Ctrl+V` (or `Cmd+V` on Mac)
   - You should see:
     - "Uploading image..." notification in top-right corner
     - Markdown syntax inserted: `![image](https://...)`
     - Image rendered in preview mode

4. **Test different scenarios**:
   - Paste a large image (should reject files > 5MB)
   - Paste an unsupported format (should show error)
   - Paste multiple images in one note
   - Switch between edit and preview modes

## How It Works

```
User pastes image
       ↓
Clipboard event detected
       ↓
Extract image file from clipboard
       ↓
Validate file type & size
       ↓
Upload to Supabase Storage
  (bucket: note-images)
       ↓
Get public URL
       ↓
Insert markdown: ![image](url)
       ↓
Save note content (auto-debounced)
       ↓
Render image in preview
```

## File Organization

Images are organized by note ID in the storage bucket:
```
note-images/
├── {note-id-1}/
│   ├── 1234567890-abc123.png
│   └── 1234567891-def456.jpg
├── {note-id-2}/
│   └── 1234567892-ghi789.png
```

This makes it easy to:
- Find all images for a specific note
- Clean up images when deleting a note (future feature)

## Security & Permissions

The migration sets up these policies:

- **Public Read**: Anyone can view images (needed for public notes)
- **Authenticated Upload**: Users can upload images
- **User Delete**: Users can delete their own uploaded images

## Troubleshooting

### Migration fails with "bucket already exists"
The bucket was already created. You can skip this error or drop the bucket first:
```sql
DELETE FROM storage.buckets WHERE id = 'note-images';
```

### Images not uploading
1. Check browser console for errors
2. Verify Supabase environment variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check Storage bucket exists in Supabase dashboard
4. Verify bucket policies are set correctly

### Images upload but don't display
1. Check that the bucket is set to **public**
2. Verify the markdown syntax is correct: `![alt](url)`
3. Check browser network tab to see if image URL is accessible

### Upload is slow
- 5MB is the maximum. Consider resizing large images before pasting
- Check your internet connection
- Supabase Storage includes CDN, so subsequent loads will be faster

## Future Enhancements (Not Yet Implemented)

Potential improvements you could add:

1. **Drag & drop support** - Drop image files directly into textarea
2. **Image compression** - Auto-resize large images before upload
3. **Progress bar** - Show upload percentage
4. **Image cleanup** - Delete orphaned images when notes are deleted
5. **Image gallery** - Browse uploaded images in a modal
6. **Copy from URL** - Paste image URL directly
7. **Private images** - Support for private notes with authenticated image access

## Architecture Decisions

### Why Supabase Storage?
- ✅ Already using Supabase for database
- ✅ Built-in CDN for fast image delivery
- ✅ Row-level security policies
- ✅ Automatic scaling
- ✅ No additional infrastructure needed

### Why not base64?
- ❌ Would bloat database significantly
- ❌ Slow note loading with multiple images
- ❌ Poor performance with large images
- ❌ Not suitable for PostgreSQL TEXT fields

### Why markdown syntax?
- ✅ Already using `react-markdown` for rendering
- ✅ Familiar syntax for users
- ✅ Portable (can export notes with images)
- ✅ Works seamlessly with existing markdown features

## Support

If you encounter issues:
1. Check the browser console for errors
2. Verify the migration was applied successfully
3. Check Supabase Storage dashboard for uploaded files
4. Review the code in `lib/image-upload.ts` for detailed error messages
