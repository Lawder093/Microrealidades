drop policy if exists "baterias_owner" on public.baterias;
create policy "baterias_select_owner" on public.baterias
  for select using (auth.uid() = reclutador_id);
create policy "baterias_insert_owner" on public.baterias
  for insert with check (auth.uid() = reclutador_id);
create policy "baterias_update_owner" on public.baterias
  for update using (auth.uid() = reclutador_id) with check (auth.uid() = reclutador_id);
create policy "baterias_delete_owner" on public.baterias
  for delete using (auth.uid() = reclutador_id);

drop policy if exists "sesiones_owner_insert" on public.sesiones_evaluacion;
create policy "sesiones_owner_insert" on public.sesiones_evaluacion
  for insert with check (auth.uid() = reclutador_id);
