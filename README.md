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

### how supabase powers the backend

supabase provides the postgresql database and handles security through row-level security (rls) policies:

**database schema**:

the `notes` table structure:
- `id` (uuid): unique identifier for each note
- `title` (text): note title
- `content` (text): markdown content
- `session_id` (uuid): links notes to browser sessions
- `public` (boolean): controls visibility (true = public, false = private)
- `slug` (text): url-friendly identifier
- `category` (text): optional categorization
- `emoji` (text): emoji icon for the note
- `created_at` (timestamp): creation timestamp

**security model**:
- **public notes**: anyone can view notes where `public = true`
- **private notes**: anyone can create private notes (`public = false`), but only the session owner can view, edit, or delete them
- **server-side functions**: all updates/deletes verify session ownership before executing
- **rls policies**: enforce access control at the database level
  - `allow_all_users_select_public_notes`: allows everyone to read public notes
  - `allow_all_users_insert_private_notes`: allows anyone to create private notes

**supabase rpc functions**:

the app uses postgresql functions (called via `supabase.rpc()`) to ensure secure database operations:

1. **`select_note(note_slug_arg)`** - retrieves a single note by slug
   - used for: loading individual note pages
   - security: stable, security definer
   - usage: `app/notes/[slug]/page.tsx:34`, `app/notes/[slug]/page.tsx:61`

2. **`select_session_notes(session_id_arg)`** - retrieves all notes for a session
   - used for: loading a user's private notes in the sidebar
   - security: stable, security definer
   - usage: `app/notes/session-notes.tsx:71`

3. **`update_note_title(uuid_arg, session_arg, title_arg)`** - updates note title
   - used for: real-time title editing
   - security: verifies session ownership before updating
   - usage: `components/note.tsx:33`

4. **`update_note_emoji(uuid_arg, session_arg, emoji_arg)`** - updates note emoji
   - used for: changing note icon
   - security: verifies session ownership before updating
   - usage: `components/note.tsx:40`

5. **`update_note_content(uuid_arg, session_arg, content_arg)`** - updates note content
   - used for: real-time markdown editing with 500ms debounce
   - security: verifies session ownership before updating
   - usage: `components/note.tsx:47`

6. **`update_note(uuid_arg, session_arg, title_arg, emoji_arg, content_arg)`** - updates all fields at once
   - defined in: `supabase/migrations/20240710180237_initial.sql:58`
   - currently unused but available for bulk updates

7. **`delete_note(uuid_arg, session_arg)`** - deletes a note
   - used for: removing private notes
   - security: verifies session ownership before deleting
   - usage: `components/sidebar.tsx:259`

**supabase clients**:
- **server client** (`utils/supabase/server.ts`) for server-side operations
- **browser client** (`utils/supabase/client.ts`) for client-side operations and real-time updates

all rpc functions use `SECURITY DEFINER` to run with elevated privileges while enforcing session-based access control through explicit session_id verification.

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
