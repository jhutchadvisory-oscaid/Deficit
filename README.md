# Deficit.

Fuel in. Training out. Know your balance.

A calorie-deficit tracker for endurance athletes: AI food-photo estimates, Garmin-friendly training logging, weight-based baseline calibration, goal projection, fuelling strategy, and multi-user accounts.

## Stack

- **Frontend:** React + Vite (single-page app)
- **Auth + database:** Supabase (email/password, Postgres, Row Level Security)
- **AI estimates:** Anthropic API via a Vercel serverless function (`api/estimate.js`) so the API key stays server-side
- **Hosting:** Vercel (or any host that supports Vite + serverless functions)

## Setup — about 15 minutes

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) (free tier is fine).
2. **SQL Editor → New query** → paste the contents of `supabase-schema.sql` → **Run**.
3. **Authentication → Providers** → make sure **Email** is enabled.
   - Optional: under **Authentication → Settings**, turn off "Confirm email" if you want friction-free signup for your group. Leave it on for better security.
4. **Authentication → URL Configuration** → set **Site URL** to your deployed URL (e.g. `https://deficit.vercel.app`). This is where password-reset emails send people back to.
5. **Project Settings → API** → copy the **Project URL** and the **anon public** key.

### 2. Anthropic

Get an API key from [console.anthropic.com](https://console.anthropic.com). Photo/text estimates cost well under a penny each.

### 3. Deploy to Vercel

```bash
npm install
npx vercel
```

Then in the Vercel dashboard → your project → **Settings → Environment Variables**, add all five:

| Variable | Value |
|---|---|
| `VITE_SUPABASE_URL` | your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | your anon key |
| `SUPABASE_URL` | same project URL (used by the API function) |
| `SUPABASE_ANON_KEY` | same anon key (used by the API function) |
| `ANTHROPIC_API_KEY` | your Anthropic key — **never** prefix this with VITE_ |

Redeploy after adding the variables (`npx vercel --prod`).

### 4. Local development

```bash
cp .env.example .env   # fill in your values
npm install
npx vercel dev          # runs Vite + the api/ function together
```

(`npm run dev` works too, but the AI estimate endpoint won't be available without `vercel dev`.)

## How accounts and privacy work

- Everyone signs up with their own email and password.
- **Row Level Security** in Postgres means each user can only read and write their own rows — you, as project owner, cannot see anyone's logged data through the app, and neither can anyone else.
- **Password resets are self-service:** users tap "Forgot password?" on the sign-in screen and get an email link. As admin you can also trigger a reset email for someone from the Supabase dashboard (**Authentication → Users → ⋯ → Send password recovery**) — without ever seeing or setting their password yourself.

## Notes

- The anon key is safe to ship in the frontend; RLS is what protects the data.
- The `api/estimate.js` function refuses requests from anyone not signed in, so strangers can't spend your Anthropic credits.
- Calorie figures (photo estimates, burn numbers, fuelling guidance) are estimates based on standard sports-nutrition guidelines — useful for trends, not gospel for any single meal or session.
