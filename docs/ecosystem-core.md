# Sprint 01 — Ecosystem Core

## Decisiones y diagnóstico

La rama de trabajo es `microhub-001`, siguiendo la última elección del usuario sobre el nombre. El commit base conserva los cambios de MicroHub y del blog revisados en conversaciones anteriores. `main` permanece en `e7a7b56`.

MicroWeb usa Next 16, React 19, TypeScript, Tailwind y Supabase Auth mediante REST. Vercel compila con Next. Los scripts existentes también comprueban Vinext. Una sola sesión centralizada ya conserva el acceso al navegar. La sesión carecía de recuperación de contraseña, perfil persistente y registro de dispositivos. El modelo de Microtalento identifica al reclutador propietario, con enlaces anónimos para candidatos y reportes privados. Las API profesionales usaban la llave de servidor y carecían de un ámbito institucional. El blog tenía un único propietario editorial.

## Arquitectura

Monolito modular sobre el stack existente. MicroID autentica, mantiene perfiles y sesiones. Las membresías delimitan instituciones y espacios. Los roles editoriales se asignan independientemente de los contratos profesionales. El catálogo de módulos y sus habilitaciones resuelven el acceso de MicroHub. Las API usan el JWT del usuario para que RLS aplique también en solicitudes directas. Las operaciones administrativas son funciones transaccionales con verificación de permisos y auditoría. La autorización comercial se calcula con fechas y estados al consultar, por lo que una suspensión o expiración toma efecto sin tareas programadas.

## Backlog por fases

1. MicroID, recuperación, perfil, sesiones y pruebas de identidad.
2. Instituciones, espacios, membresías, roles y aislamiento.
3. Catálogo modular y disponibilidad por institución.
4. MicroAdmin, paquetes, pagos externos, contratos, invitaciones y auditoría.
5. Integración institucional de Microtalento y preservación del histórico.
6. Autores, revisión editorial, buscador, categorías y publicaciones destacadas.
7. Pruebas de acceso, compilación, revisión móvil, reversión y preparación del preview.

## Modelo de datos

La identidad reside en `auth.users`, `micro_profiles` y `micro_sessions`. Los roles y las habilitaciones comerciales tendrán tablas independientes. Los cambios de este sprint son aditivos y las migraciones se ejecutarán primero en una base de pruebas.

## Registro de cambios

- Base revisada guardada en la rama del prototipo.
- Fase 1 añade perfil y sesiones con RLS, cierre de dispositivos y recuperación de contraseña sobre Supabase Auth.

## Administración y despliegue

La preparación de Vercel usará variables de Preview de un proyecto Supabase de pruebas. Las migraciones de producción y la promoción del despliegue requieren la autorización del propietario después de verificar el aislamiento y Microtalento. Las URLs de confirmación y recuperación deben estar permitidas en Supabase Auth. La entrega real de correos depende del SMTP del ambiente.

## Reversión

Crear un respaldo de la base y del bucket de PDF antes de aplicar las migraciones al ambiente autorizado. Conservar el commit base y el despliegue anterior. Las tablas nuevas conservan los datos del prototipo al retirar la interfaz. Una reversión de aplicación debe realizarse en mantenimiento para evitar que código anterior con llave de servidor eluda los nuevos controles. La restauración de un respaldo se prueba en una base independiente antes de usarla en producción.
