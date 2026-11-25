begin;
alter table public.baterias add column if not exists organization_id uuid references public.micro_organizations(id);
alter table public.baterias add column if not exists workspace_id uuid references public.micro_workspaces(id);
alter table public.sesiones_evaluacion add column if not exists organization_id uuid references public.micro_organizations(id);
alter table public.sesiones_evaluacion add column if not exists workspace_id uuid references public.micro_workspaces(id);
-- Conservar enlaces antiguos. Solo las aplicaciones nuevas reciben un secreto adicional.
alter table public.sesiones_evaluacion add column if not exists access_token uuid;
alter table public.sesiones_evaluacion alter column access_token set default gen_random_uuid();

create table if not exists public.micro_migration_markers(id text primary key,completed_at timestamptz not null default now());
revoke all on public.micro_migration_markers from anon,authenticated;
grant all on public.micro_migration_markers to service_role;
create sequence if not exists public.micro_evaluation_code_sequence;
revoke all on sequence public.micro_evaluation_code_sequence from public,anon,authenticated;

do $$
declare recruiter record; org uuid; space uuid; contract uuid; highest bigint;
begin
  if exists(select 1 from public.sesiones_evaluacion s join public.baterias b on b.id=s.bateria_id where s.reclutador_id<>b.reclutador_id) then
    raise exception 'Revisar aplicaciones históricas cuyo propietario difiere del de su batería antes de migrar';
  end if;
  if not exists(select 1 from public.micro_migration_markers where id='microtalento-personal-continuity') then
    for recruiter in select r.* from public.reclutadores r where exists(select 1 from public.baterias b where b.reclutador_id=r.id) loop
      insert into public.micro_organizations(name,slug,legacy_owner_id) values('Espacio personal · '||left(recruiter.nombre,110),'legacy-'||recruiter.id,recruiter.id) returning id into org;
      insert into public.micro_workspaces(organization_id,name) values(org,'Microtalento histórico') returning id into space;
      insert into public.micro_memberships(organization_id,user_id,role) values(org,recruiter.id,'professional');
      insert into public.micro_workspace_memberships values(space,recruiter.id);
      insert into public.micro_contracts(organization_id,kind) values(org,'legacy') returning id into contract;
      insert into public.micro_contract_modules(contract_id,module_id) values(contract,'microtalento');
      update public.baterias set organization_id=org,workspace_id=space where reclutador_id=recruiter.id;
      insert into public.micro_admin_events(organization_id,action,entity_id,details) values(org,'migration.legacy_continuity',recruiter.id::text,'{"source":"existing_microtalento_data"}');
    end loop;
    update public.sesiones_evaluacion s set organization_id=b.organization_id,workspace_id=b.workspace_id from public.baterias b where b.id=s.bateria_id;
    select greatest(coalesce(max(substring(codigo from '^IB-([0-9]+)$')::bigint),0),0) into highest from public.sesiones_evaluacion;
    select greatest(highest,coalesce(max(substring(coalesce(x->>'asignacion_id',x->>'assignmentId') from '^IB-([0-9]+)$')::bigint),0)) into highest
      from public.baterias b cross join lateral jsonb_array_elements(case when jsonb_typeof(b.pruebas)='array' then b.pruebas else '[]'::jsonb end)x;
    perform setval('public.micro_evaluation_code_sequence',highest+1,false);
    insert into public.micro_migration_markers(id) values('microtalento-personal-continuity');
  end if;
end; $$;
alter table public.baterias alter column organization_id set not null;
alter table public.baterias alter column workspace_id set not null;
alter table public.sesiones_evaluacion alter column organization_id set not null;
alter table public.sesiones_evaluacion alter column workspace_id set not null;
do $$ begin
  if not exists(select 1 from pg_constraint where conname='micro_battery_scope') then
    alter table public.baterias add constraint micro_battery_scope unique(id,organization_id,workspace_id,reclutador_id);
    alter table public.baterias add constraint micro_battery_workspace foreign key(workspace_id,organization_id) references public.micro_workspaces(id,organization_id);
    alter table public.sesiones_evaluacion add constraint micro_session_scope foreign key(bateria_id,organization_id,workspace_id,reclutador_id) references public.baterias(id,organization_id,workspace_id,reclutador_id);
  end if;
end; $$;
create or replace function public.micro_lock_talent_scope() returns trigger
language plpgsql set search_path='' as $$
begin
  if old.organization_id is not null and (old.organization_id is distinct from new.organization_id or old.workspace_id is distinct from new.workspace_id or old.reclutador_id is distinct from new.reclutador_id) then
    raise exception 'El ámbito y propietario de un registro histórico son inmutables' using errcode='42501';
  end if;
  return new;
end; $$;
drop trigger if exists micro_battery_scope_lock on public.baterias;
create trigger micro_battery_scope_lock before update on public.baterias for each row execute function public.micro_lock_talent_scope();
drop trigger if exists micro_session_scope_lock on public.sesiones_evaluacion;
create trigger micro_session_scope_lock before update on public.sesiones_evaluacion for each row execute function public.micro_lock_talent_scope();
revoke all on function public.micro_lock_talent_scope() from public;
create index if not exists micro_battery_workspace_idx on public.baterias(workspace_id,reclutador_id);
create index if not exists micro_session_workspace_idx on public.sesiones_evaluacion(workspace_id,reclutador_id);

create or replace function public.micro_service_active(p_org uuid,p_module text,p_workspace uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select exists(select 1 from public.micro_workspaces where id=p_workspace and organization_id=p_org and is_active)
    and exists(select 1 from public.micro_organizations where id=p_org and status='active')
    and exists(select 1 from public.micro_modules where id=p_module and status='active')
    and exists(select 1 from public.micro_contracts c join public.micro_contract_modules cm on cm.contract_id=c.id
      where c.organization_id=p_org and cm.module_id=p_module and c.status='active' and c.starts_at<=now() and (c.ends_at is null or c.ends_at>now()));
$$;
create or replace function public.micro_next_evaluation_code(p_workspace uuid) returns text
language plpgsql security definer set search_path='' as $$
declare code_number bigint;
begin
  if not public.micro_can_workspace(p_workspace,'microtalento') then raise exception 'Módulo no habilitado' using errcode='42501'; end if;
  code_number := nextval('public.micro_evaluation_code_sequence');
  return 'IB-'||case when code_number<10000 then lpad(code_number::text,4,'0') else code_number::text end;
end; $$;
revoke all on function public.micro_next_evaluation_code(uuid),public.micro_service_active(uuid,text,uuid) from public;
grant execute on function public.micro_next_evaluation_code(uuid) to authenticated;
grant execute on function public.micro_service_active(uuid,text,uuid) to service_role;

-- Las políticas históricas de propiedad siguen vigentes y se acotan al espacio habilitado.
drop policy if exists micro_battery_scope_guard on public.baterias;
create policy micro_battery_scope_guard on public.baterias as restrictive for all to authenticated
  using(public.micro_can_workspace(workspace_id,'microtalento')) with check(public.micro_can_workspace(workspace_id,'microtalento'));
drop policy if exists micro_session_scope_guard on public.sesiones_evaluacion;
create policy micro_session_scope_guard on public.sesiones_evaluacion as restrictive for all to authenticated
  using(public.micro_can_workspace(workspace_id,'microtalento')) with check(public.micro_can_workspace(workspace_id,'microtalento'));
drop policy if exists micro_event_scope_guard on public.eventos_seguridad;
create policy micro_event_scope_guard on public.eventos_seguridad as restrictive for all to authenticated
  using(exists(select 1 from public.sesiones_evaluacion s where s.id=sesion_id and public.micro_can_workspace(s.workspace_id,'microtalento')))
  with check(false);
drop policy if exists micro_recruiter_self_guard on public.reclutadores;
create policy micro_recruiter_self_guard on public.reclutadores as restrictive for all to authenticated
  using(id=auth.uid() and public.micro_identity_active()) with check(id=auth.uid() and public.micro_identity_active());
drop policy if exists sesiones_owner_insert on public.sesiones_evaluacion;
create policy sesiones_owner_insert on public.sesiones_evaluacion for insert to authenticated
  with check(reclutador_id=auth.uid() and estado='creado' and respuestas is null and resultados is null and pdf_path is null);
grant select,insert,update,delete on public.baterias to authenticated;
grant select,insert on public.sesiones_evaluacion to authenticated;
grant select on public.eventos_seguridad to authenticated;
grant select,insert,update on public.reclutadores to authenticated;
grant all on public.reclutadores,public.baterias,public.sesiones_evaluacion,public.eventos_seguridad to service_role;

create or replace function public.micro_can_read_pdf(p_name text) returns boolean
language sql stable security definer set search_path='' as $$
  select public.micro_identity_active() and exists(select 1 from public.sesiones_evaluacion s
    where s.pdf_path='evaluaciones-pdf/'||p_name and s.reclutador_id=auth.uid() and public.micro_can_workspace(s.workspace_id,'microtalento'));
$$;
revoke all on function public.micro_can_read_pdf(text) from public;
grant execute on function public.micro_can_read_pdf(text) to anon,authenticated;
drop policy if exists micro_pdf_read on storage.objects;
create policy micro_pdf_read on storage.objects for select to authenticated using(bucket_id='evaluaciones-pdf' and public.micro_can_read_pdf(name));
drop policy if exists micro_pdf_read_guard on storage.objects;
create policy micro_pdf_read_guard on storage.objects as restrictive for select to anon,authenticated using(bucket_id<>'evaluaciones-pdf' or public.micro_can_read_pdf(name));
drop policy if exists micro_pdf_insert_guard on storage.objects;
create policy micro_pdf_insert_guard on storage.objects as restrictive for insert to anon,authenticated with check(bucket_id<>'evaluaciones-pdf');
drop policy if exists micro_pdf_update_guard on storage.objects;
create policy micro_pdf_update_guard on storage.objects as restrictive for update to anon,authenticated using(bucket_id<>'evaluaciones-pdf') with check(bucket_id<>'evaluaciones-pdf');
drop policy if exists micro_pdf_delete_guard on storage.objects;
create policy micro_pdf_delete_guard on storage.objects as restrictive for delete to anon,authenticated using(bucket_id<>'evaluaciones-pdf');
notify pgrst,'reload schema';
commit;
