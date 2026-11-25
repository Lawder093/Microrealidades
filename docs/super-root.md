# Tu dashboard super root

> En el prototipo Ecosystem Core, `/microhub/admin` es MicroAdmin. El gestor editorial está en `/publicaciones/gestor` y admite autores y editores independientes de MicroHub. Ver [guía del sprint](ecosystem-core.md).

Acceso: `/microhub/admin`, usando la misma cuenta e inicio de sesión de Microhub. El enlace también aparece en Microhub cuando esa cuenta tiene permiso.

El sistema adapta el flujo editorial de ScoutWeb/Escultista: crear, editar, previsualizar, guardar borradores, subir portada, publicar, despublicar y consultar el archivo. Las entradas se pueden archivar y restaurar. Las publicaciones públicas viven en `/publicaciones/[slug]`; `/blog` redirige a Publicaciones. El editor comunitario con citas APA se conserva.

## Lo que debes pegar en Supabase

1. Abre tu proyecto de **Microrealidades** en Supabase → **SQL Editor → New query**.
2. Abre `supabase/migrations/202611040001_super_root_and_editorial_blog.sql` y copia **todo su contenido**, desde `begin;` hasta `commit;`. Pégalo y pulsa **Run**. No pegues el nombre ni la ruta del archivo. Puede ejecutarse de nuevo: las políticas y los triggers se reaplican sin duplicarse.
3. Registra y confirma tu cuenta en Microhub si aún no existe.
4. Abre `supabase/setup/02_asignar_super_root.sql`. Cambia únicamente `TU_CORREO_AQUI` por el correo de esa cuenta. Copia el contenido completo a otra consulta SQL y pulsa **Run**.
5. El resultado debe mostrar tu correo con `is_super_root = true` e `is_active = true`. El bloque falla con un mensaje si el correo no existe o si ya hay otro super root activo.
6. Entra a Microhub y abre `/microhub/admin`. Si la sesión ya estaba abierta, recarga la página. Guarda una entrada como borrador, revísala y publícala cuando esté lista.

No necesitas nuevas llaves. Se mantienen las ya configuradas: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` o `NEXT_PUBLIC_SUPABASE_ANON_KEY`, y `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY` **solo en servidor**.

## Qué instala el SQL

- `microhub_admins`: identifica tu cuenta mediante su ID de Supabase Auth. Las cuentas normales no pueden asignarse este permiso; solo se permite un super root activo.
- `blog_posts`: contenido editorial y estado de publicación, con RLS. Visitantes y usuarios normales solo leen entradas publicadas, no archivadas y cuya fecha ya llegó.
- `is_microhub_super_root()`: comprobación protegida del permiso para las políticas.
- Bucket privado `microrealidades-editorial`: JPG, PNG y WebP de hasta 5 MB. La API entrega portadas públicas únicamente para entradas visibles. El PDF de evaluaciones conserva su bucket y funcionamiento.

Las API comprueban la sesión y el permiso root en cada solicitud. El correo y los metadatos del registro no otorgan privilegios. El contenido editorial es texto; las etiquetas HTML se muestran como texto para evitar ejecución de scripts. Las ediciones simultáneas muestran un conflicto en lugar de sobrescribir cambios.

## Verificación realizada

Lint, TypeScript, tests del proyecto y builds Vinext/Next. El SQL se comprueba en PostgreSQL temporal, incluyendo idempotencia, RLS, permisos normales, revocación del root y almacenamiento privado. Las API y los navegadores se prueban contra ese backend local aislado; tu Supabase y tus usuarios reales no se modifican.

Archivos principales: `components/admin/`, `lib/root-access.ts`, `lib/blog.ts`, `lib/blog-repository.ts`, `app/api/admin/`, `app/api/publicaciones/portada/`, `app/microhub/admin/` y `app/publicaciones/`. La ampliación de `lib/supabase-rest.ts` mantiene los valores por defecto de las evaluaciones.

Referencias: [RLS de Supabase](https://supabase.com/docs/guides/database/postgres/row-level-security), [políticas de Storage](https://supabase.com/docs/guides/storage/security/access-control).
