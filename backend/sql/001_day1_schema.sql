-- PulseCart Day 1 schema. Run in Supabase SQL Editor.
create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  role text not null default 'customer' check (role in ('customer', 'manager')),
  interests jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  category text not null check (category in ('laptops', 'chairs', 'headphones', 'accessories')),
  price numeric(10,2) not null check (price > 0),
  image text not null default 'product',
  description text not null,
  rating numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews integer not null default 0 check (reviews >= 0),
  badge text check (badge in ('agent', 'trending', 'match')),
  created_at timestamptz not null default now()
);

create table if not exists public.searches (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  query text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id text primary key,
  user_id uuid not null references auth.users(id) on delete restrict,
  customer_name text not null,
  address text not null,
  phone text not null,
  total numeric(10,2) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id) on delete restrict,
  quantity integer not null check (quantity between 1 and 20),
  unit_price numeric(10,2) not null check (unit_price > 0),
  line_total numeric(10,2) not null check (line_total > 0)
);

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  agent_name text not null,
  action text not null,
  input jsonb not null default '{}'::jsonb,
  output jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  timestamp timestamptz not null default now()
);

create table if not exists public.feedback (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  message text not null,
  theme text not null default 'other' check (theme in ('delivery', 'pricing', 'quality', 'service', 'other')),
  severity text not null default 'low' check (severity in ('low', 'medium', 'high')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.searches enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_log enable row level security;
alter table public.feedback enable row level security;

drop policy if exists "products are publicly readable" on public.products;
create policy "products are publicly readable" on public.products for select using (true);

drop policy if exists "users read own profile" on public.profiles;
create policy "users read own profile" on public.profiles for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users read own orders" on public.orders;
create policy "users read own orders" on public.orders for select to authenticated using (auth.uid() = user_id);

drop policy if exists "users read own order items" on public.order_items;
create policy "users read own order items" on public.order_items for select to authenticated using (
  exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
);

drop policy if exists "users submit own feedback" on public.feedback;
create policy "users submit own feedback" on public.feedback for insert to authenticated with check (auth.uid() = user_id);

-- FastAPI uses the backend-only secret key for validated writes and manager reads.
-- Never place that key in browser code. Manager role checks also happen in FastAPI.
