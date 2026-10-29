-- Permite reanudar una sesión desde el mismo navegador sin exponer respuestas
-- ni convertir un refresh accidental en un bloqueo permanente.
alter table public.sesiones_evaluacion
  add column if not exists reanudacion_token text;

create unique index if not exists sesiones_evaluacion_reanudacion_token_idx
  on public.sesiones_evaluacion (reanudacion_token)
  where reanudacion_token is not null;

create index if not exists sesiones_evaluacion_reclutador_estado_idx
  on public.sesiones_evaluacion (reclutador_id, estado, created_at desc);

create index if not exists eventos_seguridad_sesion_created_idx
  on public.eventos_seguridad (sesion_id, created_at desc);
