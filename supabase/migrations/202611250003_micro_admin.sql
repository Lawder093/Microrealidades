begin;
create unique index if not exists micro_contract_payment_once on public.micro_contracts(payment_id) where payment_id is not null;

create or replace function public.micro_admin_snapshot(p_org uuid default null) returns jsonb
language plpgsql security definer set search_path='' as $$
declare root_access boolean := public.micro_is_root();
begin
  if not root_access and not public.micro_is_org_admin(p_org) then raise exception 'Administración no autorizada' using errcode='42501'; end if;
  return jsonb_build_object(
    'is_root',root_access,
    'organizations',coalesce((select jsonb_agg(to_jsonb(o)) from public.micro_organizations o where root_access or id=p_org),'[]'),
    'workspaces',coalesce((select jsonb_agg(to_jsonb(w)) from public.micro_workspaces w where root_access or organization_id=p_org),'[]'),
    'memberships',coalesce((select jsonb_agg(to_jsonb(m)) from public.micro_memberships m where root_access or organization_id=p_org),'[]'),
    'users',coalesce((select jsonb_agg(to_jsonb(u)) from (select p.user_id,p.display_name,p.is_active,a.email,
      coalesce((select jsonb_agg(r.role) from public.micro_global_roles r where r.user_id=p.user_id and r.is_active),'[]') as roles
      from public.micro_profiles p join auth.users a on a.id=p.user_id
      where root_access or exists(select 1 from public.micro_memberships m where m.user_id=p.user_id and m.organization_id=p_org)
      order by p.created_at desc limit 500)u),'[]'),
    'modules',coalesce((select jsonb_agg(to_jsonb(m)) from public.micro_modules m),'[]'),
    'packages',case when root_access then coalesce((select jsonb_agg(to_jsonb(p)||jsonb_build_object('modules',(select jsonb_agg(pm.module_id) from public.micro_package_modules pm where pm.package_id=p.id))) from public.micro_packages p),'[]') else '[]'::jsonb end,
    'contracts',case when root_access then coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('modules',(select jsonb_agg(cm.module_id) from public.micro_contract_modules cm where cm.contract_id=c.id))) from public.micro_contracts c),'[]') else '[]'::jsonb end,
    'payments',case when root_access then coalesce((select jsonb_agg(to_jsonb(p)) from public.micro_payments p),'[]') else '[]'::jsonb end,
    'invitations',coalesce((select jsonb_agg(to_jsonb(i)-'token_hash') from public.micro_invitations i where root_access or organization_id=p_org),'[]'),
    'events',coalesce((select jsonb_agg(to_jsonb(e)) from(select * from public.micro_admin_events where root_access or organization_id=p_org order by created_at desc limit 100)e),'[]'));
end; $$;

create or replace function public.micro_admin_command(p_action text,p_data jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare
  root_access boolean := public.micro_is_root();
  org uuid := nullif(p_data->>'organization_id','')::uuid;
  target uuid; entity uuid; workspace uuid;
  selected_role text := p_data->>'role';
  selected_email text := lower(btrim(p_data->>'email'));
  modules jsonb; selected_package uuid; payment uuid; contract uuid;
  current_role text; enabled boolean := coalesce((p_data->>'enabled')::boolean,true);
begin
  if not public.micro_identity_active() then raise exception 'Sesión no disponible' using errcode='42501'; end if;
  if p_action in ('organization.create','organization.update','package.save','contract.create','contract.update','contract.module','module.save','role.set','user.status') and not root_access then
    raise exception 'Requiere superadministración' using errcode='42501';
  end if;

  case p_action
  when 'organization.create' then
    insert into public.micro_organizations(name,slug) values(btrim(p_data->>'name'),'org-'||gen_random_uuid()) returning id into org;
    insert into public.micro_workspaces(organization_id,name) values(org,'Principal') returning id into workspace;
    entity := org;
  when 'organization.update' then
    update public.micro_organizations set status=p_data->>'status' where id=org returning id into entity;
  when 'workspace.create' then
    if not root_access and not public.micro_is_org_admin(org) then raise exception 'Institución no autorizada' using errcode='42501'; end if;
    insert into public.micro_workspaces(organization_id,name) values(org,btrim(p_data->>'name')) returning id into entity;
  when 'workspace.update' then
    select organization_id into org from public.micro_workspaces where id=(p_data->>'id')::uuid;
    if not root_access and not public.micro_is_org_admin(org) then raise exception 'Espacio no autorizado' using errcode='42501'; end if;
    update public.micro_workspaces set is_active=enabled where id=(p_data->>'id')::uuid returning id into entity;
  when 'membership.set' then
    if not root_access and not public.micro_is_org_admin(org) then raise exception 'Institución no autorizada' using errcode='42501'; end if;
    select id into target from auth.users where lower(email)=selected_email;
    if target is null then raise exception 'El usuario debe registrarse o recibir una invitación'; end if;
    if target=auth.uid() then raise exception 'Los permisos propios requieren otro administrador' using errcode='42501'; end if;
    select role into current_role from public.micro_memberships where organization_id=org and user_id=target;
    if selected_role not in ('member','professional','institution_admin') then raise exception 'Rol institucional inválido'; end if;
    if not root_access and (selected_role='institution_admin' or current_role='institution_admin') then raise exception 'Solo el propietario gestiona administradores institucionales' using errcode='42501'; end if;
    workspace := nullif(p_data->>'workspace_id','')::uuid;
    if workspace is not null and not exists(select 1 from public.micro_workspaces where id=workspace and organization_id=org) then raise exception 'Espacio de otra institución' using errcode='42501'; end if;
    if selected_role<>'institution_admin' and workspace is null then raise exception 'Selecciona un espacio de trabajo'; end if;
    insert into public.micro_memberships(organization_id,user_id,role,is_active) values(org,target,selected_role,enabled)
    on conflict(organization_id,user_id) do update set role=excluded.role,is_active=excluded.is_active;
    if workspace is not null then insert into public.micro_workspace_memberships values(workspace,target) on conflict do nothing; end if;
    if not enabled then update public.micro_invitations set revoked_at=now() where organization_id=org and email=selected_email and accepted_at is null; end if;
    entity := target;
  when 'role.set' then
    select id into target from auth.users where lower(email)=selected_email;
    if target is null or selected_role not in ('author','editor') then raise exception 'Usuario o rol editorial inválido'; end if;
    if target=auth.uid() then raise exception 'Los permisos propios requieren otro administrador' using errcode='42501'; end if;
    insert into public.micro_global_roles(user_id,role,is_active) values(target,selected_role,enabled)
    on conflict(user_id,role) do update set is_active=excluded.is_active;
    if not enabled then update public.micro_invitations set revoked_at=now() where organization_id is null and email=selected_email and role=selected_role and accepted_at is null; end if;
    entity := target;
  when 'user.status' then
    target := (p_data->>'user_id')::uuid;
    if target=auth.uid() then raise exception 'No puedes cambiar tu propia habilitación' using errcode='42501'; end if;
    update public.micro_profiles set is_active=enabled where user_id=target returning user_id into entity;
  when 'package.save' then
    modules := p_data->'modules';
    if jsonb_typeof(modules)<>'array' or jsonb_array_length(modules) not between 1 and 20 then raise exception 'Selecciona módulos válidos'; end if;
    if (select count(distinct m.id) from jsonb_array_elements_text(modules) x join public.micro_modules m on m.id=x.value) <> jsonb_array_length(modules) then raise exception 'Catálogo inválido o repetido'; end if;
    entity := coalesce(nullif(p_data->>'id','')::uuid,gen_random_uuid());
    insert into public.micro_packages(id,name,is_active) values(entity,btrim(p_data->>'name'),enabled)
    on conflict(id) do update set name=excluded.name,is_active=excluded.is_active;
    delete from public.micro_package_modules where package_id=entity;
    insert into public.micro_package_modules(package_id,module_id) select entity,value from jsonb_array_elements_text(modules);
  when 'contract.create' then
    if p_data->>'kind' not in ('paid','trial') then raise exception 'Tipo de servicio inválido'; end if;
    selected_package := nullif(p_data->>'package_id','')::uuid;
    if selected_package is not null then
      if not exists(select 1 from public.micro_packages where id=selected_package and is_active) then raise exception 'Paquete no disponible'; end if;
      select jsonb_agg(module_id) into modules from public.micro_package_modules where package_id=selected_package;
    else modules := p_data->'modules'; end if;
    if modules is null or jsonb_typeof(modules)<>'array' or jsonb_array_length(modules) not between 1 and 20 then raise exception 'El servicio necesita módulos'; end if;
    if (select count(distinct m.id) from jsonb_array_elements_text(modules)x join public.micro_modules m on m.id=x.value)<>jsonb_array_length(modules) then raise exception 'Módulos desconocidos o repetidos'; end if;
    if p_data->>'kind'='paid' then
      insert into public.micro_payments(organization_id,amount,currency,reference,recorded_by)
      values(org,(p_data->>'amount')::numeric,coalesce(p_data->>'currency','MXN'),p_data->>'reference',auth.uid())
      on conflict(organization_id,reference) do nothing returning id into payment;
      if payment is null then
        select id into payment from public.micro_payments where organization_id=org and reference=p_data->>'reference'
          and amount=(p_data->>'amount')::numeric and currency=coalesce(p_data->>'currency','MXN');
        if payment is null then raise exception 'La referencia ya corresponde a otro pago'; end if;
        select id into contract from public.micro_contracts where payment_id=payment;
        if contract is not null then return jsonb_build_object('id',contract,'already_recorded',true); end if;
      end if;
    end if;
    insert into public.micro_contracts(organization_id,package_id,payment_id,kind,starts_at,ends_at)
    values(org,selected_package,payment,p_data->>'kind',coalesce(nullif(p_data->>'starts_at','')::timestamptz,now()),nullif(p_data->>'ends_at','')::timestamptz)
    returning id into entity;
    insert into public.micro_contract_modules(contract_id,module_id,configuration)
    select entity,x.value,coalesce(pm.configuration,'{}') from jsonb_array_elements_text(modules)x
      left join public.micro_package_modules pm on pm.package_id=selected_package and pm.module_id=x.value;
  when 'contract.update' then
    update public.micro_contracts set status=p_data->>'status',ends_at=case when p_data ? 'ends_at' then nullif(p_data->>'ends_at','')::timestamptz else ends_at end
      where id=(p_data->>'id')::uuid returning id,organization_id into entity,org;
  when 'contract.module' then
    select organization_id into org from public.micro_contracts where id=(p_data->>'id')::uuid;
    if org is null then raise exception 'Servicio no encontrado'; end if;
    if enabled then
      insert into public.micro_contract_modules(contract_id,module_id,configuration) values((p_data->>'id')::uuid,p_data->>'module_id',coalesce(p_data->'configuration','{}'))
      on conflict(contract_id,module_id) do update set configuration=excluded.configuration;
    else delete from public.micro_contract_modules where contract_id=(p_data->>'id')::uuid and module_id=p_data->>'module_id'; end if;
    entity := (p_data->>'id')::uuid;
  when 'module.save' then
    insert into public.micro_modules(id,name,description,status,route,permission,configuration)
    values(p_data->>'id',p_data->>'name',p_data->>'description',p_data->>'status','/microhub/modulos/'||(p_data->>'id'),(p_data->>'id')||'.use',coalesce(p_data->'configuration','{}'))
    on conflict(id) do update set name=excluded.name,description=excluded.description,status=excluded.status,configuration=excluded.configuration;
  when 'invitation.create' then
    if org is null then
      if not root_access or selected_role not in ('author','editor') then raise exception 'Invitación editorial no autorizada' using errcode='42501'; end if;
    else
      if not root_access and not public.micro_is_org_admin(org) then raise exception 'Institución no autorizada' using errcode='42501'; end if;
      if selected_role not in ('member','professional','institution_admin') or (not root_access and selected_role='institution_admin') then raise exception 'Rol de invitación no autorizado' using errcode='42501'; end if;
    end if;
    if selected_email !~ '^[^ @]+@[^ @]+\.[^ @]+$' or selected_email=(select lower(email) from auth.users where id=auth.uid()) then raise exception 'Correo de invitación inválido'; end if;
    if p_data->>'token_hash' !~ '^[a-f0-9]{64}$' or (p_data->>'expires_at')::timestamptz<=now() or (p_data->>'expires_at')::timestamptz>now()+interval '14 days' then raise exception 'Enlace de invitación inválido'; end if;
    workspace := nullif(p_data->>'workspace_id','')::uuid;
    if org is not null and selected_role<>'institution_admin' and workspace is null then raise exception 'Selecciona un espacio para la invitación'; end if;
    insert into public.micro_invitations(email,organization_id,workspace_id,role,token_hash,expires_at,created_by)
    values(selected_email,org,workspace,selected_role,p_data->>'token_hash',(p_data->>'expires_at')::timestamptz,auth.uid()) returning id into entity;
  when 'invitation.revoke' then
    select organization_id into org from public.micro_invitations where id=(p_data->>'id')::uuid;
    if not root_access and not public.micro_is_org_admin(org) then raise exception 'Invitación no autorizada' using errcode='42501'; end if;
    update public.micro_invitations set revoked_at=now() where id=(p_data->>'id')::uuid and accepted_at is null returning id into entity;
  else raise exception 'Acción administrativa desconocida';
  end case;
  if p_action<>'module.save' and entity is null then raise exception 'Registro no encontrado'; end if;
  perform public.micro_audit(p_action,org,coalesce(entity::text,p_data->>'id'),p_data-'token_hash');
  return jsonb_build_object('id',entity,'organization_id',org,'workspace_id',workspace);
end; $$;

create or replace function public.micro_accept_invitation(p_hash text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare invitation public.micro_invitations; accepted_email text;
begin
  if not public.micro_identity_active() then raise exception 'Inicia sesión' using errcode='42501'; end if;
  select lower(email) into accepted_email from auth.users where id=auth.uid() and email_confirmed_at is not null;
  select * into invitation from public.micro_invitations where token_hash=p_hash for update;
  if invitation.id is null or invitation.email is distinct from accepted_email or invitation.revoked_at is not null or invitation.accepted_at is not null or invitation.expires_at<=now() then
    raise exception 'Invitación no disponible para esta cuenta' using errcode='42501';
  end if;
  if not exists(select 1 from public.micro_profiles where user_id=invitation.created_by and is_active) then raise exception 'La invitación requiere renovación'; end if;
  if invitation.organization_id is not null then
    if not exists(select 1 from public.micro_organizations where id=invitation.organization_id and status='active') then raise exception 'La institución está suspendida'; end if;
    if not exists(select 1 from public.microhub_admins where user_id=invitation.created_by and is_active and is_super_root)
       and not exists(select 1 from public.micro_memberships where organization_id=invitation.organization_id and user_id=invitation.created_by and is_active and role='institution_admin') then raise exception 'La invitación requiere renovación'; end if;
    insert into public.micro_memberships(organization_id,user_id,role) values(invitation.organization_id,auth.uid(),invitation.role)
    on conflict(organization_id,user_id) do update set role=case when micro_memberships.role='institution_admin' then micro_memberships.role else excluded.role end,is_active=true;
    if invitation.workspace_id is not null then insert into public.micro_workspace_memberships values(invitation.workspace_id,auth.uid()) on conflict do nothing; end if;
  else
    if not exists(select 1 from public.microhub_admins where user_id=invitation.created_by and is_active and is_super_root) then raise exception 'La invitación requiere renovación'; end if;
    insert into public.micro_global_roles(user_id,role) values(auth.uid(),invitation.role)
    on conflict(user_id,role) do update set is_active=true;
  end if;
  update public.micro_invitations set accepted_at=now(),accepted_by=auth.uid() where id=invitation.id;
  perform public.micro_audit('invitation.accepted',invitation.organization_id,invitation.id::text);
  return jsonb_build_object('organization_id',invitation.organization_id,'role',invitation.role);
end; $$;

revoke all on function public.micro_admin_snapshot(uuid),public.micro_admin_command(text,jsonb),public.micro_accept_invitation(text) from public;
grant execute on function public.micro_admin_snapshot(uuid),public.micro_admin_command(text,jsonb),public.micro_accept_invitation(text) to authenticated;
grant select on public.micro_workspace_memberships to authenticated;
drop policy if exists micro_workspace_member_read on public.micro_workspace_memberships;
create policy micro_workspace_member_read on public.micro_workspace_memberships for select to authenticated using(user_id=auth.uid() and public.micro_identity_active());
notify pgrst,'reload schema';
commit;
