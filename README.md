# [notes](https://alanagoyal.com/notes)

i'm obsessed with re-creating apple products. this one is a notes-inspired website that doubles as my personal website.

## clone the repo

`git clone https://github.com/alanagoyal/alanagoyal`

## set up the database

this project uses [supabase](https://supabase.com) as a backend. to set up the database, create a [new project](https://database.new), enter your project details, and wait for the database to launch. navigate to the sql editor in the dashboard, paste the sql from the [migration file](https://github.com/alanagoyal/alanagoyal/blob/main/supabase/migrations) into the sql editor and press run. you can also use the supabase cli to do this locally.

grab the project url and anon key from the api settings and put them in a new `.env.local` file in the root directory as shown:

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

## license

licensed under the [mit license](https://github.com/alanagoyal/alanagoyal/blob/main/LICENSE.md).
