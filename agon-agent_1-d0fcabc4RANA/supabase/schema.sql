-- IMPORTANT: Run in Supabase Dashboard > SQL Editor for the connected project.
-- Even when tables/policies already exist, RLS must be enabled explicitly.
-- The provisioning tool did not enable RLS: anonymous writes succeeded before this SQL.
-- Existing schema uses title (not name), text IDs for legacy seed-* identifiers.
create table if not exists public.categories (
  id text primary key default gen_random_uuid()::text,
  name text not null unique,
  created_at timestamptz not null default now()
);
create table if not exists public.products (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  category text not null,
  price numeric not null check (price > 0),
  description text not null default '',
  image_url text not null,
  created_at timestamptz not null default now()
);
create index if not exists products_created_at_idx on public.products (created_at desc);
alter table public.products enable row level security;
alter table public.categories enable row level security;
drop policy if exists public_read_products on public.products;
drop policy if exists public_read_categories on public.categories;
drop policy if exists admin_insert_products on public.products;
drop policy if exists admin_update_products on public.products;
drop policy if exists admin_delete_products on public.products;
drop policy if exists admin_insert_categories on public.categories;
drop policy if exists admin_update_categories on public.categories;
drop policy if exists admin_delete_categories on public.categories;
drop policy if exists "Public can read products" on public.products;
drop policy if exists "Public can read categories" on public.categories;
drop policy if exists "Admin can add products" on public.products;
drop policy if exists "Admin can edit products" on public.products;
drop policy if exists "Admin can remove products" on public.products;
drop policy if exists "Admin can add categories" on public.categories;
drop policy if exists "Admin can edit categories" on public.categories;
drop policy if exists "Admin can remove categories" on public.categories;
create policy "Public can read products" on public.products for select to anon, authenticated using (true);
create policy "Public can read categories" on public.categories for select to anon, authenticated using (true);
create policy "Admin can add products" on public.products for insert to authenticated with check ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
create policy "Admin can edit products" on public.products for update to authenticated using ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com') with check ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
create policy "Admin can remove products" on public.products for delete to authenticated using ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
create policy "Admin can add categories" on public.categories for insert to authenticated with check ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
create policy "Admin can edit categories" on public.categories for update to authenticated using ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com') with check ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
create policy "Admin can remove categories" on public.categories for delete to authenticated using ((auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types) values ('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp','image/gif']) on conflict (id) do nothing;
drop policy if exists "Admin uploads product images" on storage.objects;
drop policy if exists "Admin removes product images" on storage.objects;
create policy "Admin uploads product images" on storage.objects for insert to authenticated with check (bucket_id = 'product-images' and (auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
create policy "Admin removes product images" on storage.objects for delete to authenticated using (bucket_id = 'product-images' and (auth.jwt()->>'email') = 'rafnainvestment@gmail.com');
-- The bucket is public for image reads, not for anonymous writes.
