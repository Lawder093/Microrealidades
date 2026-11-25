begin;
create table if not exists public.micro_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check(length(btrim(name)) between 1 and 160),
  slug text not null unique,
  status text not null default 'active' check(status in ('active','suspended')),
  legacy_owner_id uuid unique references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.micro_workspaces (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.micro_organizations(id),
  name text not null check(length(btrim(name)) between 1 and 160),
  is_active boolean not null default true,
  unique(id,organization_id)
);
create table if not exists public.micro_memberships (
  organization_id uuid not null references public.micro_organizations(id),
  user_id uuid not null references auth.users(id),
  role text not null check(role in ('member','professional','institution_admin')),
  is_active boolean not null default true,
  primary key(organization_id,user_id)
);
create table if not exists public.micro_workspace_memberships (
  workspace_id uuid not null references public.micro_workspaces(id),
  user_id uuid not null references auth.users(id),
  primary key(workspace_id,user_id)
);
create table if not exists public.micro_global_roles (
  user_id uuid not null references auth.users(id),
  role text not null check(role in ('author','editor')),
  is_active boolean not null default true,
  primary key(user_id,role)
);
create table if not exists public.micro_modules (
  id text primary key check(id ~ '^[a-z][a-z0-9_-]+$'),
  name text not null,
  description text not null,
  status text not null check(status in ('active','coming_soon','disabled')),
  route text not null unique check(route like '/microhub/%'),
  permission text not null unique,
  configuration jsonb not null default '{}'
);
insert into public.micro_modules(id,name,description,status,route,permission) values
  ('microtalento','Microtalento','Evaluaciones, baterías, aplicaciones y reportes.','active','/microhub/evaluaciones','microtalento.use'),
  ('psychometrics','Psicometría avanzada','Herramientas de evaluación para profesionales de la psicología.','coming_soon','/microhub/modulos/psychometrics','psychometrics.use'),
  ('swap','SWAP','Gestión y seguimiento de registros terapéuticos.','coming_soon','/microhub/modulos/swap','swap.use')
on conflict(id) do nothing;
create table if not exists public.micro_packages (
  id uuid primary key default gen_random_uuid(), name text not null, is_active boolean not null default true
);
create table if not exists public.micro_package_modules (
  package_id uuid not null references public.micro_packages(id),
  module_id text not null references public.micro_modules(id),
  configuration jsonb not null default '{}', primary key(package_id,module_id)
);
create table if not exists public.micro_payments (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.micro_organizations(id),
  amount numeric(14,2) not null check(amount>0), currency text not null default 'MXN' check(length(currency)=3),
  reference text not null check(length(btrim(reference)) between 1 and 200),
  recorded_by uuid not null references auth.users(id), paid_at timestamptz not null default now(),
  unique(organization_id,reference), unique(id,organization_id)
);
create table if not exists public.micro_contracts (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.micro_organizations(id),
  package_id uuid references public.micro_packages(id), payment_id uuid,
  kind text not null default 'paid' check(kind in ('paid','trial','legacy')),
  status text not null default 'active' check(status in ('active','suspended')),
  starts_at timestamptz not null default now(), ends_at timestamptz,
  created_at timestamptz not null default now(),
  foreign key(payment_id,organization_id) references public.micro_payments(id,organization_id),
  check(ends_at is null or ends_at>starts_at), check(kind<>'paid' or payment_id is not null)
);
create table if not exists public.micro_contract_modules (
  contract_id uuid not null references public.micro_contracts(id), module_id text not null references public.micro_modules(id),
  configuration jsonb not null default '{}', primary key(contract_id,module_id)
);
create table if not exists public.micro_invitations (
  id uuid primary key default gen_random_uuid(), email text not null,
  organization_id uuid references public.micro_organizations(id), workspace_id uuid,
  role text not null check(role in ('member','professional','institution_admin','author','editor')),
  token_hash text not null unique check(length(token_hash)=64),
  expires_at timestamptz not null, created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(), accepted_at timestamptz, accepted_by uuid references auth.users(id), revoked_at timestamptz,
  foreign key(workspace_id,organization_id) references public.micro_workspaces(id,organization_id),
  check((organization_id is null and role in ('author','editor') and workspace_id is null) or (organization_id is not null and role in ('member','professional','institution_admin')))
);
create table if not exists public.micro_admin_events (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id),
  organization_id uuid references public.micro_organizations(id), action text not null,
  entity_id text, details jsonb not null default '{}', created_at timestamptz not null default now()
);
create index if not exists micro_membership_user on public.micro_memberships(user_id);
create index if not exists micro_contract_access on public.micro_contracts(organization_id,status,starts_at,ends_at);
create index if not exists micro_audit_organization on public.micro_admin_events(organization_id,created_at desc);

create or replace function public.micro_is_root() returns boolean
language sql stable security definer set search_path='' as $$
  select public.micro_identity_active() and public.is_microhub_super_root();
$$;
create or replace function public.micro_is_org_admin(p_org uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select public.micro_identity_active() and exists(select 1 from public.micro_memberships m join public.micro_organizations o on o.id=m.organization_id
    where m.organization_id=p_org and m.user_id=auth.uid() and m.is_active and m.role='institution_admin' and o.status='active');
$$;
create or replace function public.micro_has_editorial(p_permission text) returns boolean
language sql stable security definer set search_path='' as $$
  select p_permission in ('write','publish') and public.micro_identity_active() and (public.micro_is_root() or exists(select 1 from public.micro_global_roles
    where user_id=auth.uid() and is_active and (role='editor' or (p_permission='write' and role='author'))));
$$;
create or replace function public.micro_has_module(p_org uuid,p_module text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.micro_identity_active()
    and exists(select 1 from public.micro_organizations where id=p_org and status='active')
    and exists(select 1 from public.micro_memberships where organization_id=p_org and user_id=auth.uid() and is_active and role in ('professional','institution_admin'))
    and exists(select 1 from public.micro_modules where id=p_module and status='active')
    and exists(select 1 from public.micro_contracts c join public.micro_contract_modules cm on cm.contract_id=c.id
      where c.organization_id=p_org and cm.module_id=p_module and c.status='active' and c.starts_at<=now() and (c.ends_at is null or c.ends_at>now()));
$$;
create or replace function public.micro_can_workspace(p_workspace uuid,p_module text) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.micro_workspaces w where w.id=p_workspace and w.is_active and public.micro_has_module(w.organization_id,p_module)
    and (public.micro_is_org_admin(w.organization_id) or exists(select 1 from public.micro_workspace_memberships where workspace_id=w.id and user_id=auth.uid())));
$$;
create or replace function public.micro_audit(p_action text,p_org uuid,p_entity text,p_details jsonb default '{}') returns void
language sql security definer set search_path='' as $$
  insert into public.micro_admin_events(actor_id,organization_id,action,entity_id,details) values(auth.uid(),p_org,p_action,p_entity,p_details);
$$;
create or replace function public.micro_context() returns jsonb
language plpgsql security definer set search_path='' as $$
declare identity_data jsonb;
begin
  identity_data := public.micro_session_touch();
  return identity_data || jsonb_build_object(
    'permissions',jsonb_build_object('superadmin',public.micro_is_root(),'author',public.micro_has_editorial('write'),'editor',public.micro_has_editorial('publish')),
    'organizations',coalesce((select jsonb_agg(jsonb_build_object('id',o.id,'name',o.name,'status',o.status,'role',m.role))
      from public.micro_organizations o join public.micro_memberships m on m.organization_id=o.id where m.user_id=auth.uid() and m.is_active),'[]'),
    'workspaces',coalesce((select jsonb_agg(jsonb_build_object('id',w.id,'name',w.name,'organization_id',w.organization_id,'is_active',w.is_active))
      from public.micro_workspaces w join public.micro_memberships m on m.organization_id=w.organization_id
      where m.user_id=auth.uid() and m.is_active and (m.role='institution_admin' or exists(select 1 from public.micro_workspace_memberships where workspace_id=w.id and user_id=auth.uid()))),'[]'),
    'modules',coalesce((select jsonb_agg(to_jsonb(md)) from public.micro_modules md),'[]'),
    'access',coalesce((select jsonb_agg(jsonb_build_object('workspace_id',w.id,'module_id',md.id,'allowed',public.micro_can_workspace(w.id,md.id)))
      from public.micro_workspaces w join public.micro_memberships m on m.organization_id=w.organization_id cross join public.micro_modules md
      where m.user_id=auth.uid() and m.is_active),'[]'));
end; $$;

-- Tablas de control: las escrituras solo se realizan mediante comandos autorizados.
do $$ declare name text; begin
  foreach name in array array['micro_organizations','micro_workspaces','micro_memberships','micro_workspace_memberships','micro_global_roles','micro_modules','micro_packages','micro_package_modules','micro_payments','micro_contracts','micro_contract_modules','micro_invitations','micro_admin_events'] loop
    execute format('alter table public.%I enable row level security',name);
    execute format('revoke all on public.%I from anon,authenticated',name);
    execute format('grant all on public.%I to service_role',name);
  end loop;
end; $$;
grant select on public.micro_organizations,public.micro_workspaces,public.micro_memberships,public.micro_modules to authenticated;
drop policy if exists micro_org_read on public.micro_organizations;
create policy micro_org_read on public.micro_organizations for select to authenticated using(public.micro_identity_active() and (public.micro_is_root() or exists(select 1 from public.micro_memberships where organization_id=id and user_id=auth.uid() and is_active)));

drop policy if exists micro_membership_read on public.micro_memberships;
create policy micro_membership_read on public.micro_memberships for select to authenticated using(public.micro_identity_active() and (user_id=auth.uid() or public.micro_is_root() or public.micro_is_org_admin(organization_id)));
drop policy if exists micro_workspace_read on public.micro_workspaces;
create policy micro_workspace_read on public.micro_workspaces for select to authenticated using(public.micro_identity_active() and (public.micro_is_root() or public.micro_is_org_admin(organization_id) or (exists(select 1 from public.micro_memberships where organization_id=micro_workspaces.organization_id and user_id=auth.uid() and is_active) and exists(select 1 from public.micro_workspace_memberships where workspace_id=id and user_id=auth.uid()))));
drop policy if exists micro_module_read on public.micro_modules;
create policy micro_module_read on public.micro_modules for select to authenticated using(public.micro_identity_active());

revoke all on function public.micro_is_root(),public.micro_is_org_admin(uuid),public.micro_has_editorial(text),public.micro_has_module(uuid,text),public.micro_can_workspace(uuid,text),public.micro_audit(text,uuid,text,jsonb),public.micro_context() from public;
grant execute on function public.micro_is_root(),public.micro_is_org_admin(uuid),public.micro_has_editorial(text),public.micro_has_module(uuid,text),public.micro_can_workspace(uuid,text),public.micro_context() to authenticated;
notify pgrst,'reload schema';
commit;
