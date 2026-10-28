create table if not exists public.reclutadores (
  id uuid primary key references auth.users(id) on delete cascade,
  nombre text not null,
  email text not null unique,
  empresa text,
  created_at timestamptz default now()
);

create table if not exists public.baterias (
  id uuid primary key default gen_random_uuid(),
  reclutador_id uuid not null references public.reclutadores(id) on delete cascade,
  nombre text not null,
  clasificacion_puesto text not null,
  pruebas jsonb not null default '[]'::jsonb,
  tiempo_total_min int not null default 30 check (tiempo_total_min between 1 and 240),
  activa boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.sesiones_evaluacion (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  bateria_id uuid not null references public.baterias(id) on delete cascade,
  reclutador_id uuid not null references public.reclutadores(id) on delete cascade,
  candidato_nombre text,
  candidato_edad int check (candidato_edad is null or candidato_edad between 14 and 100),
  candidato_empresa text,
  estado text not null default 'creado' check (estado in ('creado', 'en_progreso', 'completado', 'bloqueado')),
  motivo_bloqueo text,
  ip_inicio inet,
  ip_fin inet,
  user_agent text,
  iniciado_en timestamptz,
  finalizado_en timestamptz,
  respuestas jsonb,
  resultados jsonb,
  pdf_path text,
  pdf_hash text,
  created_at timestamptz default now()
);

create table if not exists public.eventos_seguridad (
  id uuid primary key default gen_random_uuid(),
  sesion_id uuid not null references public.sesiones_evaluacion(id) on delete cascade,
  tipo text not null check (tipo in ('refresh', 'tab_change', 'copy', 'paste', 'blur', 'right_click')),
  detalle jsonb,
  ip inet,
  created_at timestamptz default now()
);

insert into storage.buckets (id, name, public)
values ('evaluation-reports', 'evaluation-reports', false)
on conflict (id) do nothing;

alter table public.reclutadores enable row level security;
alter table public.baterias enable row level security;
alter table public.sesiones_evaluacion enable row level security;
alter table public.eventos_seguridad enable row level security;

create policy "reclu_self" on public.reclutadores for all using (auth.uid() = id) with check (auth.uid() = id);
create policy "baterias_owner" on public.baterias for all using (auth.uid() = reclutador_id) with check (auth.uid() = reclutador_id);
create policy "sesiones_owner_read" on public.sesiones_evaluacion for select using (auth.uid() = reclutador_id);
create policy "sesiones_owner_insert" on public.sesiones_evaluacion for insert with check (auth.uid() = reclutador_id);
create policy "eventos_owner_read" on public.eventos_seguridad for select using (
  exists (select 1 from public.sesiones_evaluacion s where s.id = sesion_id and s.reclutador_id = auth.uid())
);

-- Candidate access intentionally stays behind server-side service-role actions.
