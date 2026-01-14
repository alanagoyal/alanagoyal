# [alanagoyal.com](https://alanagoyal.com)

i'm obsessed with re-creating apple products. this is a macos-inspired personal website featuring a full desktop environment with multiple apps.

## features

### desktop environment

a macos sierra 10.12 themed desktop with:
- **window management**: draggable, resizable windows with minimize, maximize, and close
- **dock**: app launcher with hover tooltips
- **menu bar**: functional apple menu, file menu, app menu, and status menus (wifi, bluetooth, control center)
- **system states**: lock screen, sleep mode, restart, and shutdown overlays

### apps

**notes** - apple notes clone for my personal website content
- public notes viewable by everyone, private notes per browser session
- github flavored markdown with interactive task lists
- image paste/upload support
- swipe gestures on mobile

**messages** - imessage clone with ai-powered conversations
- chat with ai contacts that have unique personalities (powered by gpt)
- message reactions and sound effects
- typing indicators and read/unread states
- group chats and one-on-one conversations
- pinned conversations and swipe gestures
- @mentions and contact management
- command menu (⌘K) with keyboard shortcuts
- focus mode integration (mutes notifications)

**iterm** - terminal emulator
- real file system navigation
- github integration (browse your repos)
- basic shell commands (ls, cd, cat, pwd, clear, etc.)

**finder** - file browser
- sidebar navigation (recents, applications, desktop, documents, downloads, projects)
- browse local files and github repositories
- launch apps from applications folder

**photos** - apple photos clone
- photo library with grid view and full-screen viewer
- collections: flowers, food, friends
- favorites (per-browser, stored in localstorage)
- time filters (today, this week, this month, this year, all)
- keyboard navigation (arrow keys, escape to close)
- upload via ios shortcut with ai auto-categorization

**settings** - system preferences
- wi-fi and bluetooth panels
- appearance (light/dark/system theme)
- airdrop and focus mode toggles
- about this mac

### mobile

responsive mobile interface with:
- swipe gestures for navigation
- touch-optimized controls
- full app functionality

## how it works

### architecture

the app uses next.js app router with a route group for the desktop environment. on desktop screens, all apps render in windows on a shared desktop. on mobile, apps display fullscreen with navigation.

**notes** use a session-based architecture:
- **public notes**: managed by the site owner, visible to everyone
- **private notes**: each browser session gets a unique id (stored in localstorage) linking to notes you create

**messages** are client-side only:
- conversations stored in localstorage
- ai responses generated via braintrust proxy (openai-compatible)
- no server-side message storage

**photos** use supabase storage:
- images stored in supabase storage bucket
- metadata (filename, timestamp, collections) in database
- favorites are per-browser (stored in localstorage)
- upload via api with ai auto-categorization (openai gpt-4o-mini)

the app is built with:
- **next.js** with app router
- **typescript** for type safety
- **supabase** for notes database
- **braintrust** for ai chat responses (openai-compatible proxy)
- **react-markdown** with github flavored markdown
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

public notes are cached for 24 hours using next.js isr. private notes are always real-time.

**to manually revalidate public notes**:

set `REVALIDATE_TOKEN` in environment variables, then:

```bash
# revalidate sidebar (when adding/removing public notes)
curl -X POST "https://yourdomain.com/notes/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: your-token" \
  -d '{"layout": true}'

# revalidate specific note (when updating content)
curl -X POST "https://yourdomain.com/notes/revalidate" \
  -H "Content-Type: application/json" \
  -H "x-revalidate-token: your-token" \
  -d '{"slug": "note-slug"}'
```

or redeploy on vercel to refresh all pages.

### ios shortcut for photos

upload photos directly from your iphone using the share sheet:

1. open the **shortcuts** app on ios
2. create a new shortcut with these actions:
   - **receive** images from share sheet
   - **get details of image** → date taken
   - **resize image** to max 2048px (fit)
   - **convert image** to jpeg (quality 0.8)
   - **encode** with base64
   - **format date** → iso 8601
   - **get contents of url**:
     - url: `https://yourdomain.com/api/photos/upload`
     - method: POST
     - headers: `x-api-key: <your-PHOTOS_UPLOAD_API_KEY>`
     - body: json `{ "image": [base64], "timestamp": [formatted date] }`
3. name it "add to website"
4. enable "show in share sheet" for images

when you share a photo, the shortcut uploads it to supabase storage and ai automatically categorizes it into collections (flowers, food, friends).

## clone the repo

`git clone https://github.com/alanagoyal/alanagoyal`

## set up the database

this project uses [supabase](https://supabase.com) as a backend. to set up the database:

1. create a [new project](https://database.new) and enter your project details
2. wait for the database to launch
3. navigate to the sql editor in the dashboard
4. paste the sql from the [migration file](https://github.com/alanagoyal/alanagoyal/blob/main/supabase/migrations/20240710180237_initial.sql) into the sql editor and press run

alternatively, use the supabase cli to run migrations locally:
```bash
supabase db push
```

grab the project url and anon key from the api settings and put them in a new `.env.local` file in the root directory:

```
# supabase (required for notes and photos)
NEXT_PUBLIC_SUPABASE_URL="<your-supabase-url>"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"

# braintrust (required for messages ai)
BRAINTRUST_API_KEY="<your-braintrust-api-key>"

# photos upload (required for ios shortcut)
PHOTOS_UPLOAD_API_KEY="<generate-random-key>"
OPENAI_API_KEY="<your-openai-api-key>"

# site config (optional)
NEXT_PUBLIC_SITE_URL="https://yourdomain.com"
REVALIDATE_TOKEN="<your-revalidate-token>"
NEXT_PUBLIC_REVALIDATE_TOKEN="<your-revalidate-token>"
```

**notes:**
- `GITHUB_TOKEN` is optional but helps avoid rate limits when using iterm/finder github integration
- `SUPABASE_SERVICE_ROLE_KEY` is needed for photo uploads (bypasses RLS)
- `OPENAI_API_KEY` is used for ai photo categorization

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

paste images directly into notes by copying any image (screenshot, file, etc.) and pressing `ctrl+v` (or `cmd+v` on mac). images are automatically uploaded to supabase storage and inserted as markdown.

you can also manually add images:
```markdown
![alt text](image-url.jpg)
```

**supported formats**: jpeg, png, gif, webp (including animated gifs)
**file size limit**: 5mb
**images are automatically resized** to fit the note width while maintaining aspect ratio

### horizontal rules

```markdown
---
```

## license

licensed under the [mit license](https://github.com/alanagoyal/alanagoyal/blob/main/LICENSE.md).
