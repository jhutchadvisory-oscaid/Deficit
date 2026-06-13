-- Deficit. — Supabase schema
-- Run this once in your Supabase project: SQL Editor → New query → paste → Run

-- per-user settings
create table public.settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  maintenance int not null default 2500,
  target int not null default 500,
  goal_weight numeric,
  presets jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- one row per user per day; summary columns for fast dashboards, full entries as jsonb
create table public.days (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  intake int not null default 0,
  protein int not null default 0,
  training int not null default 0,
  maintenance int not null default 2500,
  entries jsonb not null default '{"food":[],"exercise":[]}'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, date)
);

-- morning weigh-ins
create table public.weights (
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  kg numeric not null,
  primary key (user_id, date)
);

-- Row Level Security: every user sees ONLY their own rows.
-- This is what guarantees you (admin) cannot read other users' data.
alter table public.settings enable row level security;
alter table public.days enable row level security;
alter table public.weights enable row level security;

create policy "own settings" on public.settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own days" on public.days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "own weights" on public.weights
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
