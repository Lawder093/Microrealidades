begin;
do $$ begin
  if exists(select 1 from public.blog_posts where slug in ('gestor','autores')) then
    raise exception 'Hay artículos con rutas reservadas (gestor/autores). Revisar sus rutas y enlaces antes de instalar el gestor editorial';
  end if;
end; $$;
alter table public.blog_posts add column if not exists author_user_id uuid references auth.users(id);
alter table public.blog_posts add column if not exists review_status text not null default 'draft' check(review_status in ('draft','review','published','withdrawn'));
alter table public.blog_posts add column if not exists featured boolean not null default false;
update public.blog_posts set author_user_id=created_by where author_user_id is null and created_by is not null;
update public.blog_posts set review_status='published' where is_published and review_status<>'published';
alter table public.blog_posts alter column author_user_id set default auth.uid();
alter table public.blog_posts alter column created_by set default auth.uid();
do $$ begin
  if not exists(select 1 from pg_constraint where conname='micro_editorial_state') then
    alter table public.blog_posts add constraint micro_editorial_state check(is_published=(review_status='published'));
  end if;
end; $$;

create or replace function public.micro_protect_editorial() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  if auth.uid() is not null then
    if not public.micro_has_editorial('write') then raise exception 'Permiso editorial requerido' using errcode='42501'; end if;
    if tg_op='INSERT' and (new.author_user_id is distinct from auth.uid() or new.created_by is distinct from auth.uid()) then raise exception 'Autoría inválida' using errcode='42501'; end if;
    if tg_op='UPDATE' and (old.author_user_id is distinct from new.author_user_id or old.created_by is distinct from new.created_by) then raise exception 'La propiedad editorial es inmutable' using errcode='42501'; end if;
    if not public.micro_has_editorial('publish') then
      if new.author_user_id is distinct from auth.uid() or new.is_published or new.featured then raise exception 'Requiere revisión de un editor' using errcode='42501'; end if;
      if tg_op='UPDATE' and old.is_published then raise exception 'Solo un editor modifica entradas publicadas' using errcode='42501'; end if;
    end if;
  end if;
  perform public.micro_audit('editorial.'||lower(tg_op),null,new.id::text,jsonb_build_object('status',new.review_status));
  return new;
end; $$;
drop trigger if exists micro_editorial_permissions on public.blog_posts;
create trigger micro_editorial_permissions before insert or update on public.blog_posts for each row execute function public.micro_protect_editorial();
revoke all on function public.micro_protect_editorial() from public;

drop policy if exists microhub_blog_root_read on public.blog_posts;
drop policy if exists microhub_blog_root_insert on public.blog_posts;
drop policy if exists microhub_blog_root_update on public.blog_posts;
drop policy if exists micro_editorial_read on public.blog_posts;
drop policy if exists micro_editorial_insert on public.blog_posts;
drop policy if exists micro_editorial_update on public.blog_posts;
create policy micro_editorial_read on public.blog_posts for select to authenticated using(public.micro_has_editorial('write') and (author_user_id=auth.uid() or public.micro_has_editorial('publish')));
create policy micro_editorial_insert on public.blog_posts for insert to authenticated with check(public.micro_has_editorial('write') and author_user_id=auth.uid() and created_by=auth.uid());
create policy micro_editorial_update on public.blog_posts for update to authenticated using(public.micro_has_editorial('write') and ((author_user_id=auth.uid() and not is_published) or public.micro_has_editorial('publish')))
  with check(public.micro_has_editorial('write') and (author_user_id=auth.uid() or public.micro_has_editorial('publish')));
grant select on public.blog_posts to authenticated;
grant select(author_user_id,review_status,featured) on public.blog_posts to anon;

create or replace view public.micro_author_profiles with(security_barrier=true) as
  select p.user_id,coalesce(nullif(p.display_name,''),'Microrealidades') as display_name,p.bio
  from public.micro_profiles p where exists(select 1 from public.micro_global_roles r where r.user_id=p.user_id and r.is_active)
    or exists(select 1 from public.blog_posts b where b.author_user_id=p.user_id and b.is_published and not b.is_archived and b.published_at<=now());
grant select on public.micro_author_profiles to anon,authenticated;

-- La API comprueba el permiso antes de servir portadas privadas. RLS permite cargar imágenes al autor o editor.
drop policy if exists microhub_editorial_root_read on storage.objects;
drop policy if exists microhub_editorial_root_insert on storage.objects;
drop policy if exists microhub_editorial_root_update on storage.objects;
drop policy if exists microhub_editorial_root_delete on storage.objects;
drop policy if exists microhub_editorial_bucket_guard on storage.objects;
drop policy if exists micro_editorial_images_read on storage.objects;
drop policy if exists micro_editorial_images_insert on storage.objects;
drop policy if exists micro_editorial_images_guard on storage.objects;
create policy micro_editorial_images_read on storage.objects for select to authenticated
  using(bucket_id='microrealidades-editorial' and public.micro_has_editorial('write') and (public.micro_has_editorial('publish') or owner_id=auth.uid()::text));
create policy micro_editorial_images_insert on storage.objects for insert to authenticated
  with check(bucket_id='microrealidades-editorial' and public.micro_has_editorial('write') and owner_id=auth.uid()::text);
create policy micro_editorial_images_guard on storage.objects as restrictive for all to authenticated
  using(bucket_id<>'microrealidades-editorial' or (public.micro_has_editorial('write') and (public.micro_has_editorial('publish') or owner_id=auth.uid()::text)))
  with check(bucket_id<>'microrealidades-editorial' or (public.micro_has_editorial('write') and owner_id=auth.uid()::text));
drop policy if exists micro_editorial_images_anon_guard on storage.objects;
create policy micro_editorial_images_anon_guard on storage.objects as restrictive for all to anon using(bucket_id<>'microrealidades-editorial') with check(bucket_id<>'microrealidades-editorial');
notify pgrst,'reload schema';
commit;
