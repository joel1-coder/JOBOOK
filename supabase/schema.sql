-- ============================================================
-- JOBOOK – Supabase Schema (Fixed)
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

create extension if not exists "uuid-ossp";

-- ─── profiles ─────────────────────────────────────────────────
create table if not exists profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  staff_id    text unique,
  full_name   text,
  email       text,
  department  text default 'General',
  phone       text,
  bio         text,
  role        text default 'user' check (role in ('user','admin')),
  status      text default 'active' check (status in ('active','inactive')),
  created_at  timestamptz default now()
);

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
    new.email
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ─── rooms ────────────────────────────────────────────────────
create table if not exists rooms (
  id          uuid primary key default uuid_generate_v4(),
  name        text not null,
  capacity    int  not null default 1,
  floor       text,
  building    text,
  type        text,
  description text,
  emoji       text default '🏢',
  available   boolean default true,
  created_at  timestamptz default now()
);

-- ─── time_slots ───────────────────────────────────────────────
create table if not exists time_slots (
  id          uuid primary key default uuid_generate_v4(),
  label       text not null,
  start_time  text not null,
  end_time    text not null,
  days        text default 'Mon-Fri',
  rooms       text default 'All',
  active      boolean default true,
  created_at  timestamptz default now()
);

-- ─── booking_seq FIRST, then bookings table ───────────────────
create sequence if not exists booking_seq start 200;

create table if not exists bookings (
  id          uuid primary key default uuid_generate_v4(),
  booking_ref text unique not null default ('BK-' || to_char(nextval('booking_seq'), 'FM0000')),
  user_id     uuid references profiles(id) on delete set null,
  room_id     uuid references rooms(id) on delete cascade,
  slot_id     uuid references time_slots(id) on delete set null,
  date        date not null,
  status      text default 'pending' check (status in ('pending','confirmed','completed','cancelled')),
  notes       text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

drop trigger if exists bookings_updated_at on bookings;
create trigger bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- ─── booking_rules ────────────────────────────────────────────
create table if not exists booking_rules (
  id                    uuid primary key default uuid_generate_v4(),
  max_bookings_per_day  int     default 3,
  max_bookings_per_week int     default 10,
  max_duration_hours    int     default 4,
  min_notice_mins       int     default 30,
  max_advance_days      int     default 30,
  allow_weekends        boolean default false,
  require_approval      boolean default false,
  auto_cancel           boolean default true,
  auto_cancel_mins      int     default 15,
  allow_guest_booking   boolean default false,
  max_capacity_percent  int     default 100,
  updated_at            timestamptz default now()
);

insert into booking_rules (id) values (uuid_generate_v4());

-- ─── RPC Functions ───────────────────────────────────────────
create or replace function admin_create_user(
  new_email text,
  new_password text,
  new_full_name text,
  new_department text,
  new_staff_id text
)
returns json language plpgsql security definer set search_path = public as $$
declare
  new_user_id uuid;
begin
  -- Create auth user
  new_user_id := (
    select id from auth.users 
    where email = new_email
    limit 1
  );
  
  if new_user_id is null then
    new_user_id := extensions.uuid_generate_v4();
  end if;
  
  -- Insert profile
  insert into profiles (id, staff_id, full_name, email, department)
  values (new_user_id, new_staff_id, new_full_name, new_email, new_department)
  on conflict(id) do update set 
    staff_id = new_staff_id,
    full_name = new_full_name,
    department = new_department;
  
  return json_build_object('user_id', new_user_id);
exception when others then
  return json_build_object('error', SQLERRM);
end;
$$;

-- ─── Row Level Security ───────────────────────────────────────
alter table profiles      enable row level security;
alter table rooms         enable row level security;
alter table time_slots    enable row level security;
alter table bookings      enable row level security;
alter table booking_rules enable row level security;

-- profiles policies
create policy "Users read own profile"     on profiles for select using (auth.uid() = id);
create policy "Admins read all profiles"   on profiles for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users update own profile"   on profiles for update using (auth.uid() = id);
create policy "Admins update any profile"  on profiles for update using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- rooms policies
create policy "Auth users view rooms"  on rooms for select using (auth.role() = 'authenticated');
create policy "Admins manage rooms"    on rooms for all   using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- time_slots policies
create policy "Auth users view slots"  on time_slots for select using (auth.role() = 'authenticated');
create policy "Admins manage slots"    on time_slots for all   using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- bookings policies
create policy "Users view own bookings"    on bookings for select using (user_id = auth.uid());
create policy "Admins view all bookings"   on bookings for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Users create bookings"      on bookings for insert with check (user_id = auth.uid());
create policy "Users cancel own bookings"  on bookings for update using (user_id = auth.uid());
create policy "Admins manage all bookings" on bookings for all   using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- booking_rules policies
create policy "Admins manage rules"    on booking_rules for all    using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
create policy "Auth users read rules"  on booking_rules for select using (auth.role() = 'authenticated');

-- ─── Seed Data ────────────────────────────────────────────────
insert into rooms (name, capacity, floor, building, type, description, emoji, available) values
  ('VIDEO EDITING ROOM', 10, 'MCA BLOCK', 'MCA BLOCK', 'Video Editing', 'Professional video editing room. Location: MCA BLOCK, near Staff Room', '🎬', true);

insert into time_slots (label, start_time, end_time, days, rooms, active) values
  ('Morning Slot',   '08:00', '10:00', 'Mon-Fri', 'All',             true),
  ('Late Morning',   '10:00', '12:00', 'Mon-Fri', 'All',             true),
  ('Lunch Slot',     '12:00', '14:00', 'Mon-Sat', 'Boardroom, Hub',  true),
  ('Afternoon',      '14:00', '16:00', 'Mon-Fri', 'All',             true),
  ('Late Afternoon', '16:00', '18:00', 'Mon-Fri', 'All',             false);
