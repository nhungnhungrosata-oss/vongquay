-- Supabase setup for Vong Quay May Man
-- Copy all SQL in this file and run it once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text not null unique,
  address text not null,
  referrer text not null,
  note text default '',
  registration_time timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending', 'won')),
  prize_name text,
  won_time timestamptz
);

create table if not exists winners (
  id uuid primary key default gen_random_uuid(),
  participant_id uuid references participants(id) on delete set null,
  full_name text not null,
  phone text not null,
  address text default '',
  referrer text default '',
  prize_name text not null,
  status text not null default 'not_contacted' check (status in ('not_contacted', 'contacted', 'sent')),
  won_time timestamptz not null default now()
);

create table if not exists prizes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  quantity integer not null default 1,
  notes text default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists app_settings (
  id text primary key default 'default',
  program_name text default 'VÒNG QUAY MAY MẮN',
  short_description text default 'Nhập thông tin bên dưới để tham gia vòng quay may mắn trong chương trình Zoom hôm nay.',
  referrer_label text default 'Ai giới thiệu bạn vào nhóm chuyên sâu?',
  group_link text default '',
  success_message text default 'Anh/chị đã đăng ký thành công. Vui lòng theo dõi phần quay số trong chương trình.',
  remove_winner_from_next_spins boolean default true,
  allow_multiple_wins boolean default false,
  updated_at timestamptz default now()
);

insert into app_settings (id)
values ('default')
on conflict (id) do nothing;

insert into prizes (name, quantity, notes, is_active)
select 'Phần quà may mắn', 10, 'Quà tặng trong chương trình', true
where not exists (select 1 from prizes);

alter table participants enable row level security;
alter table winners enable row level security;
alter table prizes enable row level security;
alter table app_settings enable row level security;

-- Drop old policies if re-running this script.
drop policy if exists "anon select participants" on participants;
drop policy if exists "anon insert participants" on participants;
drop policy if exists "anon update participants" on participants;
drop policy if exists "anon delete participants" on participants;
drop policy if exists "anon all winners" on winners;
drop policy if exists "anon all prizes" on prizes;
drop policy if exists "anon all settings" on app_settings;

-- Quick-use policies for a public Vite app.
-- Note: This allows the frontend publishable key to read/write app data.
-- For a stricter production setup, move admin actions behind a server API or Supabase Auth.
create policy "anon select participants" on participants for select to anon using (true);
create policy "anon insert participants" on participants for insert to anon with check (true);
create policy "anon update participants" on participants for update to anon using (true) with check (true);
create policy "anon delete participants" on participants for delete to anon using (true);

create policy "anon all winners" on winners for all to anon using (true) with check (true);
create policy "anon all prizes" on prizes for all to anon using (true) with check (true);
create policy "anon all settings" on app_settings for all to anon using (true) with check (true);
