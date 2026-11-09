-- Inventário de carpas
-- No painel do Supabase: SQL Editor, New query, cole este arquivo e rode.
-- Depois crie .env na raiz do projeto com VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.

create extension if not exists pgcrypto;

create table public.colors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  hex text not null,
  body boolean not null default true,
  head boolean not null default true,
  dorsal boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.species (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  sort integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.fish (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nickname text not null default '',
  species_id uuid references public.species (id) on delete restrict,
  body_color_id uuid not null references public.colors (id) on delete restrict,
  head_color_id uuid references public.colors (id) on delete restrict,
  dorsal_color_id uuid references public.colors (id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.colors enable row level security;
alter table public.species enable row level security;
alter table public.fish enable row level security;

create policy colors_select_own on public.colors
  for select using (auth.uid() = user_id);
create policy colors_insert_own on public.colors
  for insert with check (auth.uid() = user_id);
create policy colors_update_own on public.colors
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy colors_delete_own on public.colors
  for delete using (auth.uid() = user_id);

create policy species_select_own on public.species
  for select using (auth.uid() = user_id);
create policy species_insert_own on public.species
  for insert with check (auth.uid() = user_id);
create policy species_update_own on public.species
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy species_delete_own on public.species
  for delete using (auth.uid() = user_id);

create policy fish_select_own on public.fish
  for select using (auth.uid() = user_id);
create policy fish_insert_own on public.fish
  for insert with check (auth.uid() = user_id);
create policy fish_update_own on public.fish
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy fish_delete_own on public.fish
  for delete using (auth.uid() = user_id);

create index colors_user_sort_idx on public.colors (user_id, sort);
create index species_user_sort_idx on public.species (user_id, sort);
create index fish_user_created_idx on public.fish (user_id, created_at);

revoke all on public.colors from anon;
revoke all on public.species from anon;
revoke all on public.fish from anon;

grant select, insert, update, delete on public.colors to authenticated;
grant select, insert, update, delete on public.species to authenticated;
grant select, insert, update, delete on public.fish to authenticated;
