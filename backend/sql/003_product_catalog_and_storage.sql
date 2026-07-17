-- Rich product catalog fields and a public image bucket.
alter table public.products add column if not exists image_url text;
alter table public.products add column if not exists stock integer not null default 0 check (stock >= 0);
alter table public.products add column if not exists overview text;
alter table public.products add column if not exists how_it_works text;
alter table public.products add column if not exists best_for jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists limitations jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists specifications jsonb not null default '[]'::jsonb;
alter table public.products add column if not exists delivery_estimate text not null default '2–5 business days';
alter table public.products add column if not exists warranty text not null default '1-year limited warranty';
alter table public.products add column if not exists is_active boolean not null default true;
alter table public.products add column if not exists updated_at timestamptz not null default now();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Public buckets allow direct reads. Writes are performed only by validated FastAPI
-- manager endpoints using the backend secret key, which bypasses Storage RLS.
