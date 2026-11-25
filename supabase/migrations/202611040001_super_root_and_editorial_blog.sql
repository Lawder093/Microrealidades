-- PEGAR TODO EL CONTENIDO EN SQL EDITOR. No pegar la ruta del archivo.
-- Instalación aditiva e idempotente. No modifica evaluaciones, pacientes ni usuarios existentes.
begin;

create table if not exists public.microhub_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  is_super_root boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create unique index if not exists microhub_one_active_super_root
  on public.microhub_admins (is_super_root) where is_super_root and is_active;

alter table public.microhub_admins enable row level security;
revoke all on public.microhub_admins from anon, authenticated;
grant select on public.microhub_admins to authenticated;
grant all on public.microhub_admins to service_role;
drop policy if exists microhub_admin_read_self on public.microhub_admins;
create policy microhub_admin_read_self on public.microhub_admins for select to authenticated
  using (user_id = (select auth.uid()));

create or replace function public.is_microhub_super_root()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.microhub_admins where user_id = (select auth.uid()) and is_super_root and is_active);
$$;
revoke all on function public.is_microhub_super_root() from public;
grant execute on function public.is_microhub_super_root() to anon, authenticated, service_role;

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (length(slug) between 1 and 180 and slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null check (length(btrim(title)) between 1 and 180),
  excerpt text not null check (length(btrim(excerpt)) between 1 and 320),
  body text not null check (length(btrim(body)) between 1 and 50000),
  category text not null check (length(btrim(category)) between 1 and 80),
  author_name text not null check (length(btrim(author_name)) between 1 and 120),
  tags text[] not null default '{}' check (cardinality(tags) <= 12),
  source_url text check (source_url is null or (length(source_url) <= 600 and source_url ~* '^https?://')),
  cover_image_path text check (cover_image_path is null or cover_image_path ~ '^covers/[a-f0-9-]+\.(jpg|png|webp)$'),
  color text not null default 'pink' check (color in ('pink','blue','yellow')),
  is_published boolean not null default false,
  published_at timestamptz,
  is_archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint microhub_blog_publication_state check (not is_published or (published_at is not null and not is_archived))
);
create index if not exists microhub_blog_publication_date on public.blog_posts (published_at desc, id desc)
  where is_published and not is_archived;

create or replace function public.microhub_touch_blog()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = clock_timestamp(); return new; end;
$$;
drop trigger if exists microhub_blog_updated_at on public.blog_posts;
create trigger microhub_blog_updated_at before update on public.blog_posts for each row execute function public.microhub_touch_blog();

alter table public.blog_posts enable row level security;
revoke all on public.blog_posts from anon, authenticated;
grant select (id,slug,title,excerpt,body,category,author_name,tags,source_url,cover_image_path,color,is_published,published_at,is_archived,created_at,updated_at)
  on public.blog_posts to anon, authenticated;
grant insert, update on public.blog_posts to authenticated;
grant all on public.blog_posts to service_role;
drop policy if exists microhub_blog_read_published on public.blog_posts;
drop policy if exists microhub_blog_root_read on public.blog_posts;
drop policy if exists microhub_blog_root_insert on public.blog_posts;
drop policy if exists microhub_blog_root_update on public.blog_posts;
create policy microhub_blog_read_published on public.blog_posts for select to anon, authenticated
  using (is_published and not is_archived and published_at <= now());
create policy microhub_blog_root_read on public.blog_posts for select to authenticated
  using ((select public.is_microhub_super_root()));
create policy microhub_blog_root_insert on public.blog_posts for insert to authenticated
  with check ((select public.is_microhub_super_root()));
create policy microhub_blog_root_update on public.blog_posts for update to authenticated
  using ((select public.is_microhub_super_root())) with check ((select public.is_microhub_super_root()));

-- Bucket privado: las portadas se sirven por la API solo cuando la entrada está publicada.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('microrealidades-editorial','microrealidades-editorial',false,5242880,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists microhub_editorial_root_read on storage.objects;
drop policy if exists microhub_editorial_root_insert on storage.objects;
drop policy if exists microhub_editorial_root_update on storage.objects;
drop policy if exists microhub_editorial_root_delete on storage.objects;
create policy microhub_editorial_root_read on storage.objects for select to authenticated
  using (bucket_id = 'microrealidades-editorial' and (select public.is_microhub_super_root()));
create policy microhub_editorial_root_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'microrealidades-editorial' and (select public.is_microhub_super_root()));
create policy microhub_editorial_root_update on storage.objects for update to authenticated
  using (bucket_id = 'microrealidades-editorial' and (select public.is_microhub_super_root()))
  with check (bucket_id = 'microrealidades-editorial' and (select public.is_microhub_super_root()));
create policy microhub_editorial_root_delete on storage.objects for delete to authenticated
  using (bucket_id = 'microrealidades-editorial' and (select public.is_microhub_super_root()));

-- Evitar que una policy global de otro módulo abra este bucket por accidente.
drop policy if exists microhub_editorial_bucket_guard on storage.objects;
create policy microhub_editorial_bucket_guard on storage.objects as restrictive for all to anon, authenticated
  using (bucket_id <> 'microrealidades-editorial' or (select public.is_microhub_super_root()))
  with check (bucket_id <> 'microrealidades-editorial' or (select public.is_microhub_super_root()));

notify pgrst, 'reload schema';
commit;
