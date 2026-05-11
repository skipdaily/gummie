-- Product Concept Studio Supabase schema
-- Paste this whole file into the Supabase SQL Editor and run it.
--
-- Image handling:
-- - Upload binary images to Supabase Storage.
-- - Store the resulting storage paths and public/signed URLs in Postgres.
-- - Suggested storage paths:
--   - product-concept-assets/{user_id}/{concept_id}/reference.png
--   - product-concept-assets/{user_id}/{concept_id}/logo.png
--   - product-concept-renders/{user_id}/{concept_id}/generated.png
--
-- Auth note:
-- These policies assume you use Supabase Auth. The app requires email/password
-- sign in before saving, so every saved concept gets a real auth user_id.
-- Enable the Email provider in Supabase Auth.

create extension if not exists pgcrypto;

-- Keep updated_at fresh on edited rows.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Storage buckets for uploaded assets and generated product renders.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  (
    'product-concept-assets',
    'product-concept-assets',
    true,
    10485760,
    array['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml']
  ),
  (
    'product-concept-renders',
    'product-concept-renders',
    true,
    15728640,
    array['image/png', 'image/jpeg', 'image/webp']
  )
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Product concepts, including every editable field from the app.
create table if not exists public.product_concepts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,

  -- Optional: store the current client-side GeneratedImage.id if you want to sync
  -- existing local browser records.
  client_id text unique,

  brand_name text not null default '',
  product_name text not null,
  tagline text not null,
  target_audience text not null,
  product_details text not null,
  package_style text not null,
  accent_color text not null,
  environment_details text not null,
  scene_description text not null,
  label_image_description text not null,

  -- Uploaded source images.
  reference_image_path text,
  reference_image_url text,
  logo_image_path text,
  logo_image_url text,

  -- Generated product image.
  generated_image_path text,
  generated_image_url text,

  prompt_used text,
  image_model text default 'gemini-3.1-flash-image-preview',
  draft_model text,
  generation_status text not null default 'draft'
    check (generation_status in ('draft', 'generating', 'success', 'error')),
  error_message text,

  -- Flexible escape hatch for future app fields without a migration.
  raw_config jsonb not null default '{}'::jsonb,
  image_metadata jsonb not null default '{}'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Migration for existing projects created before Brand Name was added.
alter table public.product_concepts
add column if not exists brand_name text not null default '';

drop trigger if exists set_product_concepts_updated_at on public.product_concepts;
create trigger set_product_concepts_updated_at
before update on public.product_concepts
for each row
execute function public.set_updated_at();

create index if not exists product_concepts_user_id_created_at_idx
on public.product_concepts (user_id, created_at desc);

create index if not exists product_concepts_product_name_idx
on public.product_concepts using gin (to_tsvector('english', product_name));

-- Landing page copy generated from one or more selected concepts.
create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  hero_concept_id uuid references public.product_concepts(id) on delete set null,

  eyebrow text not null,
  headline text not null,
  subheadline text not null,
  cta_primary text not null,
  cta_secondary text not null,
  feature_title text not null,
  features jsonb not null default '[]'::jsonb,
  proof_points text[] not null default array[]::text[],
  gallery_title text not null,
  closing_headline text not null,
  closing_body text not null,

  content_model text,
  selected_concept_snapshot jsonb not null default '[]'::jsonb,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_landing_pages_updated_at on public.landing_pages;
create trigger set_landing_pages_updated_at
before update on public.landing_pages
for each row
execute function public.set_updated_at();

create index if not exists landing_pages_user_id_created_at_idx
on public.landing_pages (user_id, created_at desc);

-- Join table for concepts selected into a landing page.
create table if not exists public.landing_page_concepts (
  landing_page_id uuid not null references public.landing_pages(id) on delete cascade,
  concept_id uuid not null references public.product_concepts(id) on delete cascade,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (landing_page_id, concept_id)
);

create index if not exists landing_page_concepts_concept_id_idx
on public.landing_page_concepts (concept_id);

-- Row Level Security
alter table public.product_concepts enable row level security;
alter table public.landing_pages enable row level security;
alter table public.landing_page_concepts enable row level security;

-- Product concepts: users can manage only their own rows.
drop policy if exists "Users can read their product concepts" on public.product_concepts;
create policy "Users can read their product concepts"
on public.product_concepts
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their product concepts" on public.product_concepts;
create policy "Users can insert their product concepts"
on public.product_concepts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their product concepts" on public.product_concepts;
create policy "Users can update their product concepts"
on public.product_concepts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their product concepts" on public.product_concepts;
create policy "Users can delete their product concepts"
on public.product_concepts
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Public prototype can read product concepts" on public.product_concepts;
drop policy if exists "Public prototype can insert product concepts" on public.product_concepts;
drop policy if exists "Public prototype can update product concepts" on public.product_concepts;
drop policy if exists "Public prototype can delete product concepts" on public.product_concepts;

-- Landing pages: users can manage only their own rows.
drop policy if exists "Users can read their landing pages" on public.landing_pages;
create policy "Users can read their landing pages"
on public.landing_pages
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert their landing pages" on public.landing_pages;
create policy "Users can insert their landing pages"
on public.landing_pages
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their landing pages" on public.landing_pages;
create policy "Users can update their landing pages"
on public.landing_pages
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their landing pages" on public.landing_pages;
create policy "Users can delete their landing pages"
on public.landing_pages
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Public prototype can read landing pages" on public.landing_pages;
drop policy if exists "Public prototype can insert landing pages" on public.landing_pages;
drop policy if exists "Public prototype can update landing pages" on public.landing_pages;
drop policy if exists "Public prototype can delete landing pages" on public.landing_pages;

-- Landing page selections inherit ownership from the landing page.
drop policy if exists "Users can read landing page concept selections" on public.landing_page_concepts;
create policy "Users can read landing page concept selections"
on public.landing_page_concepts
for select
to authenticated
using (
  exists (
    select 1
    from public.landing_pages lp
    where lp.id = landing_page_id
      and lp.user_id = auth.uid()
  )
);

drop policy if exists "Users can insert landing page concept selections" on public.landing_page_concepts;
create policy "Users can insert landing page concept selections"
on public.landing_page_concepts
for insert
to authenticated
with check (
  exists (
    select 1
    from public.landing_pages lp
    where lp.id = landing_page_id
      and lp.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.product_concepts pc
    where pc.id = concept_id
      and pc.user_id = auth.uid()
  )
);

drop policy if exists "Users can update landing page concept selections" on public.landing_page_concepts;
create policy "Users can update landing page concept selections"
on public.landing_page_concepts
for update
to authenticated
using (
  exists (
    select 1
    from public.landing_pages lp
    where lp.id = landing_page_id
      and lp.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.landing_pages lp
    where lp.id = landing_page_id
      and lp.user_id = auth.uid()
  )
  and exists (
    select 1
    from public.product_concepts pc
    where pc.id = concept_id
      and pc.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete landing page concept selections" on public.landing_page_concepts;
create policy "Users can delete landing page concept selections"
on public.landing_page_concepts
for delete
to authenticated
using (
  exists (
    select 1
    from public.landing_pages lp
    where lp.id = landing_page_id
      and lp.user_id = auth.uid()
  )
);

drop policy if exists "Public prototype can read landing page concept selections" on public.landing_page_concepts;
drop policy if exists "Public prototype can insert landing page concept selections" on public.landing_page_concepts;
drop policy if exists "Public prototype can update landing page concept selections" on public.landing_page_concepts;
drop policy if exists "Public prototype can delete landing page concept selections" on public.landing_page_concepts;

-- Storage RLS
-- Public read is enabled because the buckets are public. Authenticated users can
-- upload/update/delete files only inside their own first-level folder:
-- product-concept-assets/{auth.uid()}/...
-- product-concept-renders/{auth.uid()}/...
drop policy if exists "Anyone can read product concept storage files" on storage.objects;
create policy "Anyone can read product concept storage files"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('product-concept-assets', 'product-concept-renders'));

drop policy if exists "Users can upload product concept storage files" on storage.objects;
create policy "Users can upload product concept storage files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('product-concept-assets', 'product-concept-renders')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can update product concept storage files" on storage.objects;
create policy "Users can update product concept storage files"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('product-concept-assets', 'product-concept-renders')
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id in ('product-concept-assets', 'product-concept-renders')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Users can delete product concept storage files" on storage.objects;
create policy "Users can delete product concept storage files"
on storage.objects
for delete
to authenticated
using (
  bucket_id in ('product-concept-assets', 'product-concept-renders')
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Public prototype can upload product concept storage files" on storage.objects;
drop policy if exists "Public prototype can update product concept storage files" on storage.objects;
drop policy if exists "Public prototype can delete product concept storage files" on storage.objects;
