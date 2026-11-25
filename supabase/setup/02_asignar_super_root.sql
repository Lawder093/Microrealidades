-- DESPUÉS de la instalación: cambia SOLO el correo de la línea siguiente.
-- La cuenta ya debe existir en Authentication > Users, creada desde /registro.
do $$
declare
  correo_root text := 'TU_CORREO_AQUI';
  usuario_root uuid;
begin
  if correo_root = 'TU_CORREO_AQUI' then
    raise exception 'Primero reemplaza TU_CORREO_AQUI por el correo de tu cuenta Microhub.';
  end if;
  select id into usuario_root from auth.users where lower(email) = lower(btrim(correo_root));
  if usuario_root is null then
    raise exception 'Ese correo no existe. Registra y confirma tu cuenta en Microhub antes de ejecutar este bloque.';
  end if;
  if exists (select 1 from public.microhub_admins where is_super_root and is_active and user_id <> usuario_root) then
    raise exception 'Ya existe otro super root activo. Revisa la cuenta asignada antes de cambiarla.';
  end if;
  insert into public.microhub_admins (user_id,is_super_root,is_active)
  values (usuario_root,true,true)
  on conflict (user_id) do update set is_super_root = true, is_active = true;
end;
$$;

select u.email, a.is_super_root, a.is_active
from public.microhub_admins a join auth.users u on u.id = a.user_id
where a.is_super_root and a.is_active;
