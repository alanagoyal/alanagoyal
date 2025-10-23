# [notes](https://alanagoyal.com/notes)

i'm obsessed with re-creating apple products. this one is a notes-inspired website that doubles as my personal website.

## how it works

### architecture

the app uses a session-based architecture with two types of notes:

**public notes**: viewable by everyone, managed by the site owner. these appear on the public site and in the sidebar for all visitors.

**private notes**: anyone can create and view their own private notes. each browser session gets a unique session id (stored in localstorage) that links to the notes you create. only you can see and edit your private notes.

the app is built with:
- **next.js 14** with app router for server-side rendering and static generation
- **typescript** for type safety
- **supabase** for database and authentication
- **react-markdown** with github flavored markdown support
- **tailwind css** for styling

### backend

the app uses [supabase](https://supabase.com) for the postgresql database with row-level security policies to control access to public and private notes.

**database schema**:

the `notes` table stores all notes with these fields:
- `id` (uuid): unique identifier
- `title` (text): note title
- `content` (text): markdown content
- `session_id` (uuid): links notes to browser sessions
- `public` (boolean): controls visibility
- `slug` (text): url-friendly identifier
- `category` (text): optional categorization
- `emoji` (text): note icon
- `created_at` (timestamp): when the note was created

### caching

the app uses next.js incremental static regeneration (isr) to cache public notes for optimal performance:

**cache durations**:
- **layout (sidebar)**: 24 hours (`app/notes/layout.tsx`)
- **individual note pages**: 24 hours (`app/notes/[slug]/page.tsx`)
- **private notes**: no caching (always real-time)

**what this means**:
- private notes you create always show up immediately
- public notes in the sidebar refresh every 24 hours
- public note content refreshes every 24 hours
- database queries reduced by 99%+, significantly lowering costs

**manually revalidating public notes**:

if you publish a new public note or update existing public note content and want it to appear immediately (without waiting 24 hours), you can manually trigger revalidation:

**option 1: revalidate via next.js api route**

create an api route at `app/api/revalidate/route.ts`:

```typescript
import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret');

  // protect the endpoint with a secret token
  if (secret !== process.env.REVALIDATION_SECRET) {
    return NextResponse.json({ message: 'Invalid secret' }, { status: 401 });
  }

  try {
    // revalidate the layout (sidebar)
    revalidatePath('/notes', 'layout');

    // optionally revalidate a specific note page
    const slug = request.nextUrl.searchParams.get('slug');
    if (slug) {
      revalidatePath(`/notes/${slug}`);
    }

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (err) {
    return NextResponse.json({ message: 'Error revalidating' }, { status: 500 });
  }
}
```

add `REVALIDATION_SECRET=your-secret-token` to your `.env.local` and vercel environment variables.

**trigger revalidation**:
```bash
# revalidate the sidebar
curl -X POST "https://yourdomain.com/api/revalidate?secret=your-secret-token"

# revalidate a specific note
curl -X POST "https://yourdomain.com/api/revalidate?secret=your-secret-token&slug=your-note-slug"
```

**option 2: redeploy the site**

the simplest option is to trigger a redeploy on vercel, which will rebuild all static pages:

```bash
# using vercel cli
vercel --prod

# or just push to your git repository and vercel will auto-deploy
git commit -m "update public notes"
git push
```

**option 3: wait 24 hours**

for infrequent updates (like portfolio updates), simply wait up to 24 hours for the cache to naturally expire and regenerate.

## clone the repo

`git clone https://github.com/alanagoyal/alanagoyal`

## set up the database

this project uses [supabase](https://supabase.com) as a backend. to set up the database:

1. create a [new project](https://database.new) and enter your project details
2. wait for the database to launch
3. navigate to the sql editor in the dashboard
4. paste the sql from the [migration file](https://github.com/alanagoyal/alanagoyal/blob/main/supabase/migrations) into the sql editor and press run

alternatively, use the supabase cli to run migrations locally:
```bash
supabase db push
```

grab the project url and anon key from the api settings and put them in a new `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL="<your-supabase-url>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
```

## install dependencies

`npm install`

## run the app

run the application in the command line and it will be available at http://localhost:3000.

`npm run dev`

## deploy

deploy using [vercel](https://vercel.com)

## markdown syntax for notes

notes support github flavored markdown (gfm) with interactive features. here's what you can use:

### headings

```markdown
# heading 1
## heading 2
### heading 3
```

### text formatting

```markdown
**bold text**
*italic text*
~~strikethrough~~
`inline code`
```

### lists

**unordered lists**:
```markdown
- item one
- item two
  - nested item
  - another nested item
```

**ordered lists**:
```markdown
1. first item
2. second item
3. third item
```

### task lists (interactive)

task lists are interactive - click checkboxes to toggle completion:

```markdown
- [ ] task to do
- [x] completed task
- [ ] another task
```

the app automatically updates the markdown when you click checkboxes, so your progress is saved.

### tables

create tables using standard markdown table syntax. tables render with a styled dark theme:

```markdown
| book | author | year read |
|------|--------|-----------|
| the great gatsby | f. scott fitzgerald | 2023 |
| 1984 | george orwell | 2024 |
```

this renders as:

| book | author | year read |
|------|--------|-----------|
| the great gatsby | f. scott fitzgerald | 2023 |
| 1984 | george orwell | 2024 |

**table features**:
- white borders on dark background
- properly padded cells
- header row styling
- responsive layout
- supports links in cells

### links

```markdown
[link text](https://example.com)
```

all links automatically open in new tabs for better navigation.

### code blocks

**inline code**: use backticks for `inline code`

**code blocks**: use triple backticks for multi-line code
````markdown
```javascript
function hello() {
  console.log("hello world");
}
```
````

### blockquotes

```markdown
> this is a blockquote
> it can span multiple lines
```

### images

```markdown
![alt text](image-url.jpg)
```

### horizontal rules

```markdown
---
```

## license

licensed under the [mit license](https://github.com/alanagoyal/alanagoyal/blob/main/LICENSE.md).
