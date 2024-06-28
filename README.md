## Getting Started

### Clone the repository

`git clone https://github.com/alanagoyal/alanagoyal`

### Set up the database
This project uses [Supabase](https://supabase.com) as a backend. To set up the database, create a [new project](https://database.new), enter your project details, and wait for the database to launch. Navigate to the SQL editor in the dashboard, paste the SQL from the [migration file](https://github.com/alanagoyal/alanagoyal/blob/main/supabase/migrations) into the SQL editor and press run. You can also use the Supabase CLI to do this locally.

You'll also need to set up the storage bucket locally. See the [storage cli documentation](https://supabase.com/docs/reference/cli/supabase-storage-cp) for more information.

Grab the project URL and anon key from the API settings and put them in a new `.env.local` file in the root directory as shown:
```
NEXT_PUBLIC_SUPABASE_URL="<your-supabase-url>" 
NEXT_PUBLIC_SUPABASE_ANON_KEY="<your-anon-key>"
```

### Install dependencies

`npm install`

### Run the application

Run the application in the command line and it will be available at http://localhost:3000.

`npm run dev`

### Deploy

Deploy using [Vercel](https://vercel.com)

## License

Licensed under the [MIT license](https://github.com/alanagoyal/alanagoyal/blob/main/LICENSE.md).