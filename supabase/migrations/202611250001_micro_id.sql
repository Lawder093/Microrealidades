begin;

create table if not exists public.micro_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check(length(display_name)<=120),
  bio text not null default '' check(length(bio)<=1500),
  is_active boolean not null default true,
  sessions_valid_after timestamptz,
  created_at timestamptz not null default now()
);
alter table public.micro_profiles add column if not exists sessions_valid_after timestamptz;
create table if not exists public.micro_sessions (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  device_label text not null default 'Navegador' check(length(device_label)<=160),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz
);
create or replace function public.micro_create_profile() returns trigger
language plpgsql security definer set search_path='' as $$
begin
  insert into public.micro_profiles(user_id,display_name)
  values(new.id,left(coalesce(new.raw_user_meta_data->>'display_name',''),120)) on conflict do nothing;
  return new;
end; $$;
drop trigger if exists micro_profile_on_signup on auth.users;
create trigger micro_profile_on_signup after insert on auth.users for each row execute function public.micro_create_profile();
insert into public.micro_profiles(user_id,display_name)
select id,left(coalesce(raw_user_meta_data->>'display_name',''),120) from auth.users on conflict do nothing;

create or replace function public.micro_identity_active() returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.micro_profiles where user_id=auth.uid() and is_active
    and (sessions_valid_after is null or to_timestamp(coalesce((auth.jwt()->>'iat')::double precision,0))>sessions_valid_after))
    and not exists(select 1 from public.micro_sessions where id=nullif(auth.jwt()->>'session_id','')::uuid and user_id=auth.uid() and revoked_at is not null);
$$;
create or replace function public.micro_profile_update(p_name text,p_bio text) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.micro_identity_active() then raise exception 'Sesión no disponible' using errcode='42501'; end if;
  if length(btrim(p_name)) not between 1 and 120 or length(p_bio)>1500 then raise exception 'Perfil inválido'; end if;
  update public.micro_profiles set display_name=btrim(p_name),bio=p_bio where user_id=auth.uid();
end; $$;
create or replace function public.micro_session_touch(p_device text default 'Navegador') returns jsonb
language plpgsql security definer set search_path='' as $$
declare sid uuid := nullif(auth.jwt()->>'session_id','')::uuid;
begin
  if not public.micro_identity_active() then raise exception 'Sesión revocada o cuenta suspendida' using errcode='42501'; end if;
  if sid is not null then
    insert into public.micro_sessions(id,user_id,device_label) values(sid,auth.uid(),left(p_device,160))
    on conflict(id) do update set last_seen_at=now(),
      device_label=case when excluded.device_label='Navegador' then micro_sessions.device_label else excluded.device_label end
      where micro_sessions.user_id=auth.uid();
    if not found then raise exception 'La sesión pertenece a otra identidad' using errcode='42501'; end if;
  end if;
  return jsonb_build_object('profile',(select to_jsonb(p) from public.micro_profiles p where user_id=auth.uid()),
    'sessions',coalesce((select jsonb_agg(to_jsonb(s)||jsonb_build_object('is_current',s.id=sid)) from public.micro_sessions s where user_id=auth.uid()),'[]'::jsonb));
end; $$;
create or replace function public.micro_session_revoke(p_session uuid) returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.micro_identity_active() then raise exception 'Sesión no disponible' using errcode='42501'; end if;
  update public.micro_sessions set revoked_at=now() where id=p_session and user_id=auth.uid();
  if not found then raise exception 'Sesión no encontrada'; end if;
end; $$;

create or replace function public.micro_sessions_revoke_all() returns void
language plpgsql security definer set search_path='' as $$
begin
  if not public.micro_identity_active() then raise exception 'Sesión no disponible' using errcode='42501'; end if;
  update public.micro_sessions set revoked_at=now() where user_id=auth.uid();
  update public.micro_profiles set sessions_valid_after=now() where user_id=auth.uid();
end; $$;
revoke all on function public.micro_sessions_revoke_all() from public;
grant execute on function public.micro_sessions_revoke_all() to authenticated;

create or replace function public.micro_session_revoke_current() returns void
language plpgsql security definer set search_path='' as $$
declare sid uuid := nullif(auth.jwt()->>'session_id','')::uuid;
begin
  if not public.micro_identity_active() then raise exception 'Sesión no disponible' using errcode='42501'; end if;
  if sid is null then raise exception 'Identificador de sesión requerido'; end if;
  insert into public.micro_sessions(id,user_id,revoked_at) values(sid,auth.uid(),now())
  on conflict(id) do update set revoked_at=now() where micro_sessions.user_id=auth.uid();
end; $$;
revoke all on function public.micro_session_revoke_current() from public;
grant execute on function public.micro_session_revoke_current() to authenticated;

alter table public.micro_profiles enable row level security;
alter table public.micro_sessions enable row level security;
revoke all on public.micro_profiles,public.micro_sessions from anon,authenticated;
grant select on public.micro_profiles,public.micro_sessions to authenticated;
grant all on public.micro_profiles,public.micro_sessions to service_role;
drop policy if exists micro_profile_self on public.micro_profiles;
create policy micro_profile_self on public.micro_profiles for select to authenticated using(user_id=auth.uid());
drop policy if exists micro_session_self on public.micro_sessions;
create policy micro_session_self on public.micro_sessions for select to authenticated using(user_id=auth.uid());
revoke all on function public.micro_create_profile(),public.micro_identity_active(),public.micro_profile_update(text,text),public.micro_session_touch(text),public.micro_session_revoke(uuid) from public;
grant execute on function public.micro_identity_active(),public.micro_profile_update(text,text),public.micro_session_touch(text),public.micro_session_revoke(uuid) to authenticated;
notify pgrst,'reload schema';
commit;
