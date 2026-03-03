# WatchVault 🎬

A personal media tracker for Movies, TV Series, Anime, Animation, Donghua, and Manhwa.

## Features
- 🔐 Secure login / signup via Supabase Auth
- 📊 Dashboard with stats by status and category
- 🎬 Track Movies, Series, Anime, Animation, Donghua, Manhwa
- 🏷️ Filter by status (Watching, Completed, Plan to Watch, Dropped)
- 🌍 Filter by country
- ⭐ Rate entries 1–10
- 📺 Track seasons for series/anime
- 🖼️ Poster images via URL
- 📝 Personal notes

---

## Setup Guide

### 1. Supabase (Database + Auth)

1. Go to [supabase.com](https://supabase.com) and create a free account
2. Click **New Project**, give it a name like `watchvault`
3. Save your **Project URL** and **anon/public API key** (Settings → API)
4. Go to **SQL Editor** and run:

```sql
create extension if not exists "uuid-ossp";

create table media (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  category text not null,
  subcategory text,
  country text,
  status text not null default 'plan_to_watch',
  rating integer check (rating between 1 and 10),
  seasons integer,
  current_season integer,
  image_url text,
  notes text,
  created_at timestamp default now(),
  updated_at timestamp default now()
);

alter table media enable row level security;

create policy "Users can manage own media" on media
  for all using (auth.uid() = user_id);
```

5. In **Authentication → Settings**, optionally disable email confirmation for easier local testing

### 2. GitHub

1. Create account at [github.com](https://github.com)
2. Create a new repository named `watchvault-app`
3. Push this project:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/watchvault-app.git
git push -u origin main
```

### 3. Vercel (Hosting)

1. Go to [vercel.com](https://vercel.com), sign in with GitHub
2. Click **Add New Project** → select your `watchvault-app` repo
3. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` → your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → your Supabase anon key
4. Click **Deploy** — done! 🎉

### 4. Local Development

```bash
# Copy environment file
cp .env.example .env
# Fill in your Supabase values in .env

# Install and run
npm install
npm run dev
```

---

## Tech Stack
- **Frontend**: React + Vite
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Hosting**: Vercel (free)
- **Fonts**: Bebas Neue + Outfit (Google Fonts)
