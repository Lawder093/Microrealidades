-- Solo lectura. Ejecutar sobre la copia de pruebas ANTES de las migraciones del sprint.
-- El esquema histórico de Microtalento y blog debe estar instalado.
select 'baterias' as tabla,count(*) from public.baterias
union all select 'sesiones_evaluacion',count(*) from public.sesiones_evaluacion
union all select 'sesiones_con_pdf',count(*) from public.sesiones_evaluacion where pdf_path is not null
union all select 'blog_posts',count(*) from public.blog_posts;

-- Debe devolver cero. La migración se detiene si hay propietarios inconsistentes.
select count(*) as aplicaciones_con_propietario_inconsistente
from public.sesiones_evaluacion s join public.baterias b on b.id=s.bateria_id
where s.reclutador_id<>b.reclutador_id;

-- Comprobar que la columna de reanudación y los buckets privados existen.
select column_name,data_type from information_schema.columns
where table_schema='public' and table_name='sesiones_evaluacion' and column_name='reanudacion_token';
select id,public from storage.buckets where id in ('evaluaciones-pdf','microrealidades-editorial');
select column_name,data_type from information_schema.columns
where table_schema='auth' and table_name='sessions' and column_name in ('id','user_id','created_at');
-- Debe devolver cero antes de habilitar las nuevas vistas editoriales.
select count(*) as publicaciones_con_ruta_reservada from public.blog_posts where slug in ('gestor','autores');
