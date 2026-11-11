-- Run this in the Supabase SQL Editor after creating a project.
-- Auth users are managed by Supabase Auth; this schema stores learning progress.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  native_language text not null default 'Hindi',
  learning_language text not null default 'English',
  skill_level text not null default 'Beginner' check (skill_level in ('Beginner','Intermediate','Advanced')),
  total_xp integer not null default 0 check (total_xp >= 0),
  current_streak integer not null default 0 check (current_streak >= 0),
  last_activity_date date,
  created_at timestamptz not null default now()
);

create table if not exists public.lesson_progress (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id integer not null,
  completed_at timestamptz not null default now(),
  score integer not null default 0 check (score between 0 and 100),
  xp_earned integer not null default 0 check (xp_earned >= 0),
  unique(user_id, lesson_id)
);

create table if not exists public.vocabulary (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  word text not null,
  meaning text not null,
  example text,
  difficulty text not null default 'Learning' check (difficulty in ('Learning','Easy','Difficult')),
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  unique(user_id, word)
);

create table if not exists public.achievements (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null,
  unlocked_at timestamptz not null default now(),
  unique(user_id, achievement_key)
);

alter table public.profiles enable row level security;
alter table public.lesson_progress enable row level security;
alter table public.vocabulary enable row level security;
alter table public.achievements enable row level security;

create policy "Users can read own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "Users can read own progress" on public.lesson_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on public.lesson_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on public.lesson_progress for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users can manage own vocabulary" on public.vocabulary for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can read own achievements" on public.achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on public.achievements for insert with check (auth.uid() = user_id);

-- Automatically create a profile whenever a new auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();