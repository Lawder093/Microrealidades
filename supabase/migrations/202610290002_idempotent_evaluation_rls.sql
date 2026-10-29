-- Reaplica las políticas con nombres estables. Es seguro ejecutarla después
-- de las migraciones anteriores y evita errores por políticas duplicadas.
drop policy if exists "reclu_self" on public.reclutadores;
drop policy if exists "baterias_owner" on public.baterias;
drop policy if exists "baterias_select_owner" on public.baterias;
drop policy if exists "baterias_insert_owner" on public.baterias;
drop policy if exists "baterias_update_owner" on public.baterias;
drop policy if exists "baterias_delete_owner" on public.baterias;
drop policy if exists "sesiones_owner_read" on public.sesiones_evaluacion;
drop policy if exists "sesiones_owner_insert" on public.sesiones_evaluacion;
drop policy if exists "eventos_owner_read" on public.eventos_seguridad;

create policy "reclu_self" on public.reclutadores
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "baterias_select_owner" on public.baterias
  for select using (auth.uid() = reclutador_id);
create policy "baterias_insert_owner" on public.baterias
  for insert with check (auth.uid() = reclutador_id);
create policy "baterias_update_owner" on public.baterias
  for update using (auth.uid() = reclutador_id) with check (auth.uid() = reclutador_id);
create policy "baterias_delete_owner" on public.baterias
  for delete using (auth.uid() = reclutador_id);

create policy "sesiones_owner_read" on public.sesiones_evaluacion
  for select using (auth.uid() = reclutador_id);
create policy "sesiones_owner_insert" on public.sesiones_evaluacion
  for insert with check (auth.uid() = reclutador_id);

create policy "eventos_owner_read" on public.eventos_seguridad
  for select using (
    exists (
      select 1
      from public.sesiones_evaluacion s
      where s.id = sesion_id and s.reclutador_id = auth.uid()
    )
  );
