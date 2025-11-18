# Revalidate ISR Cache

This skill guides you through revalidating the Incremental Static Regeneration (ISR) cache in this Next.js notes application when public notes are updated.

## When to Use This Skill

- Updated a public note's content, title, or emoji
- Added a new public note via database admin panel
- Deleted a public note from database
- Changes to public notes aren't appearing on the website
- Need to clear ISR cache manually

## Repository Context

This app uses Next.js ISR with **24-hour caching** for public notes:
- **Layout cache**: All public notes in sidebar (24 hours)
- **Page cache**: Individual note pages (24 hours)
- **On-demand revalidation**: API endpoint at `/notes/revalidate`

**Why 24 hours?** For a personal site with infrequent public note updates, long cache duration reduces database load and improves performance.

## Two Types of Revalidation

### Type 1: Page Revalidation (Specific Note)

Use when: Updated content of a single public note

**What it does**: Regenerates the cached HTML for `/notes/{slug}` page

**Example**: Updated "about-me" note content in database

### Type 2: Layout Revalidation (Sidebar)

Use when: Added or removed public notes

**What it does**: Regenerates the sidebar note list across all pages

**Example**: Added a new public note "new-project" to database

## Methods of Revalidation

### Method 1: Automatic (in Client Code)

Used when updating notes through the application UI.

**Location**: `/workspace/repo/components/note.tsx:85-92`

```typescript
// After updating note
await supabase.rpc("update_note_content", { ... });

// Revalidate the note page
await fetch("/notes/revalidate", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-revalidate-token": process.env.NEXT_PUBLIC_REVALIDATE_TOKEN || '',
  },
  body: JSON.stringify({ slug: note.slug }),
});
```

**When to use**: Already implemented for note updates in the UI. No action needed.

### Method 2: Manual via curl (Database Updates)

Use when updating public notes directly in Supabase dashboard.

#### Revalidate Specific Note
```bash
curl -X POST "https://yourdomain.com/notes/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: your-token-here" \
  -d '{"slug": "about-me"}'
```

#### Revalidate Sidebar (Layout)
```bash
curl -X POST "https://yourdomain.com/notes/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: your-token-here" \
  -d '{"layout": true}'
```

**Response**:
```json
{
  "revalidated": true,
  "type": "page",
  "slug": "about-me",
  "now": 1700000000000
}
```

### Method 3: Redeploy on Vercel

**Nuclear option**: Clears all ISR caches across the entire site.

```bash
# Push any commit to main branch
git commit --allow-empty -m "Trigger revalidation"
git push origin main
```

**When to use**:
- Multiple public notes updated
- Want to clear all caches at once
- Revalidation API not working

**Downside**: Takes longer (~2 minutes for full deployment)

### Method 4: Programmatic (in API Routes)

If building an admin panel or CMS, call revalidation programmatically:

```typescript
// In API route or Server Action
import { revalidatePath } from "next/cache";

// Revalidate specific note page
revalidatePath(`/notes/${slug}`);

// Revalidate layout (sidebar)
revalidatePath('/notes', 'layout');
```

**Example use case**: Admin dashboard for managing public notes

## API Route Details

**Location**: `/workspace/repo/app/notes/revalidate/route.ts`

```typescript
export async function POST(request: NextRequest) {
  const { slug, layout } = await request.json();
  const token = request.headers.get('x-revalidate-token');

  // Verify token
  if (!token || token !== process.env.REVALIDATE_TOKEN) {
    return NextResponse.json({ message: "Invalid token" }, { status: 401 });
  }

  // Revalidate layout (sidebar)
  if (layout) {
    revalidatePath('/notes', 'layout');
    return NextResponse.json({
      revalidated: true,
      type: 'layout',
      now: Date.now()
    });
  }

  // Revalidate specific note page
  if (!slug) {
    return NextResponse.json({ message: "Missing slug parameter" }, { status: 400 });
  }

  revalidatePath(`/notes/${slug}`);
  return NextResponse.json({
    revalidated: true,
    type: 'page',
    slug,
    now: Date.now()
  });
}
```

**Security**: Token-based authentication prevents unauthorized cache invalidation.

## Environment Variables

**Required for revalidation**:

```env
# Server-side (secure, not exposed to browser)
REVALIDATE_TOKEN=your-secret-token-here

# Client-side (exposed to browser, used in components)
NEXT_PUBLIC_REVALIDATE_TOKEN=your-secret-token-here
```

**Why two tokens?**
- `REVALIDATE_TOKEN`: Used by API route for validation (server-side)
- `NEXT_PUBLIC_REVALIDATE_TOKEN`: Used by client components when calling API (exposed in browser)

**Security Note**: For production, consider:
- Using different tokens for server vs client
- Adding rate limiting to revalidation endpoint
- Restricting revalidation to authenticated users

## Common Scenarios

### Scenario 1: Updated Public Note Content

**Steps**:
1. Update note in Supabase dashboard:
   ```sql
   UPDATE notes
   SET content = '# New Content\n\nUpdated text...'
   WHERE slug = 'about-me';
   ```

2. Revalidate the note page:
   ```bash
   curl -X POST "https://yourdomain.com/notes/revalidate" \
     -H "Content-Type: application/json" \
     -H "x-revalidate-token: your-token" \
     -d '{"slug": "about-me"}'
   ```

3. Verify: Visit `https://yourdomain.com/notes/about-me` and check for updates

### Scenario 2: Added New Public Note

**Steps**:
1. Insert note in Supabase dashboard:
   ```sql
   INSERT INTO notes (id, slug, title, content, public, emoji, category)
   VALUES (gen_random_uuid(), 'new-post', 'New Post', '# Content', true, '📝', 'today');
   ```

2. Revalidate layout (so sidebar shows new note):
   ```bash
   curl -X POST "https://yourdomain.com/notes/revalidate" \
     -H "Content-Type: application/json" \
     -H "x-revalidate-token: your-token" \
     -d '{"layout": true}'
   ```

3. Navigate to new note:
   ```bash
   # Also revalidate the new note page
   curl -X POST "https://yourdomain.com/notes/revalidate" \
     -H "Content-Type: application/json" \
     -H "x-revalidate-token: your-token" \
     -d '{"slug": "new-post"}'
   ```

4. Verify: Visit homepage and check sidebar for new note

### Scenario 3: Deleted Public Note

**Steps**:
1. Delete note in Supabase dashboard:
   ```sql
   DELETE FROM notes WHERE slug = 'old-post';
   ```

2. Revalidate layout (remove from sidebar):
   ```bash
   curl -X POST "https://yourdomain.com/notes/revalidate" \
     -H "Content-Type: application/json" \
     -H "x-revalidate-token: your-token" \
     -d '{"layout": true}'
   ```

3. Verify: Sidebar no longer shows deleted note

### Scenario 4: Bulk Updates (Multiple Notes)

**Steps**:
1. Update multiple notes in database
2. **Option A**: Call revalidation for each note
   ```bash
   for slug in about-me projects contact; do
     curl -X POST "https://yourdomain.com/notes/revalidate" \
       -H "Content-Type: application/json" \
       -H "x-revalidate-token: your-token" \
       -d "{\"slug\": \"$slug\"}"
   done
   ```

3. **Option B**: Redeploy (easier for bulk updates)
   ```bash
   git commit --allow-empty -m "Revalidate all caches"
   git push origin main
   ```

## Debugging Cache Issues

### Issue: Changes not appearing after revalidation

**Check 1**: Verify token is correct
```bash
# Check server-side token
echo $REVALIDATE_TOKEN

# Check response from API
curl -X POST "https://yourdomain.com/notes/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: wrong-token" \
  -d '{"slug": "about-me"}'
# Should return: {"message": "Invalid token"}
```

**Check 2**: Clear browser cache
- Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
- Incognito mode: Test without browser cache

**Check 3**: Verify database changes
```sql
-- Check note exists and is public
SELECT slug, title, content, public
FROM notes
WHERE slug = 'about-me';
```

**Check 4**: Check Next.js build
```bash
# Rebuild locally to test
npm run build
npm run start
```

### Issue: "Invalid token" error

**Solution**: Ensure `REVALIDATE_TOKEN` environment variable is set:

**Vercel**:
1. Go to: Project Settings → Environment Variables
2. Add: `REVALIDATE_TOKEN` = `your-secret-token`
3. Redeploy

**Local**:
```bash
# .env.local
REVALIDATE_TOKEN=your-secret-token
NEXT_PUBLIC_REVALIDATE_TOKEN=your-secret-token
```

### Issue: Revalidation works but sidebar doesn't update

**Cause**: Need to revalidate layout, not just page

**Solution**:
```bash
# Revalidate layout (sidebar)
curl -X POST "https://yourdomain.com/notes/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: your-token" \
  -d '{"layout": true}'
```

## ISR Configuration Reference

### Layout Cache (Sidebar)
**File**: `/workspace/repo/app/notes/layout.tsx:22`
```typescript
export const revalidate = 86400; // 24 hours
```

### Page Cache (Individual Notes)
**File**: `/workspace/repo/app/notes/[slug]/page.tsx:10`
```typescript
export const revalidate = 86400; // 24 hours
export const dynamicParams = true; // Allow runtime note creation
```

### Static Params (Build-time Pre-rendering)
**File**: `/workspace/repo/app/notes/[slug]/page.tsx:70-79`
```typescript
export async function generateStaticParams() {
  const supabase = createBrowserClient();
  const { data: posts } = await supabase
    .from("notes")
    .select("slug")
    .eq("public", true);

  return posts!.map(({ slug }) => ({ slug }));
}
```

**What it does**: Pre-renders all public notes at build time

## Best Practices

1. **After database updates**: Always revalidate affected pages
2. **Adding/removing notes**: Revalidate layout (sidebar)
3. **Updating content**: Revalidate specific note page
4. **Bulk changes**: Redeploy instead of multiple API calls
5. **Testing**: Use incognito mode to verify cache is cleared
6. **Security**: Keep `REVALIDATE_TOKEN` secret, don't commit to git

## Related Files

- Revalidation API: `/workspace/repo/app/notes/revalidate/route.ts`
- Layout (sidebar cache): `/workspace/repo/app/notes/layout.tsx`
- Note page (page cache): `/workspace/repo/app/notes/[slug]/page.tsx`
- Note editor (auto-revalidation): `/workspace/repo/components/note.tsx`
- Environment variables: `/workspace/repo/.env.local` (local)

## Additional Resources

- [Next.js Revalidation Docs](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#revalidating-data)
- [Next.js ISR Guide](https://nextjs.org/docs/app/building-your-application/data-fetching/fetching-caching-and-revalidating#incremental-static-regeneration-isr)
- Repository architecture: `/workspace/repo/ARCHITECTURE.md` (see "ISR & Revalidation Strategy" section)
