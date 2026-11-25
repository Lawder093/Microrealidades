# Microhub

> El prototipo de la rama `microhub-001` añade MicroID, instituciones y acceso a módulos mediante contratos. La instalación y administración actualizada están en la [guía Ecosystem Core](ecosystem-core.md).

- `/microhub`: herramientas y acceso a la cuenta.
- `/microhub/evaluaciones`: dashboard de Microtalento; requiere sesión.
- `/microhub/expediente`: expediente de demostración con datos simulados.
- `/microhub/bitacora`: notas locales separadas por cuenta y navegador; no se sincronizan con Supabase.
- `/ingresar` y `/registro`: acceso compartido y registro autónomo.
- `/auth/confirm`: confirmación del correo. Admite el enlace estándar de Supabase y `token_hash` de una plantilla personalizada.
- `/evaluacion/[codigo]` y `/evaluaciones`: acceso público de candidatos; las ligas existentes se conservan.

Se reutilizan Supabase Auth REST y las API existentes; no hay dependencias ni migraciones nuevas. El perfil de reclutador se crea automáticamente al abrir el dashboard, mediante `ensureRecruiter` existente. Los endpoints siguen validando al usuario y filtrando por propietario.

## Configuración de producción

1. Mantener `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (o `NEXT_PUBLIC_SUPABASE_ANON_KEY`). Las API de evaluaciones siguen requiriendo `SUPABASE_SECRET_KEY` o `SUPABASE_SERVICE_ROLE_KEY` exclusivamente en servidor.
2. En Supabase → Authentication, habilitar el registro y el proveedor Email. Con confirmación de correo activa, el usuario confirma su propio correo; no necesita aprobación del administrador.
3. En URL Configuration, usar el dominio de producción como Site URL y permitir `https://microrealidades-4iw3.vercel.app/auth/confirm`. Agregar la URL equivalente cuando cambie el dominio. Para pruebas locales, permitir `http://localhost:3000/auth/confirm`.
4. Configurar SMTP para poder enviar confirmaciones a usuarios externos. El correo integrado de Supabase tiene restricciones; las pruebas simuladas no verifican la entrega real de mensajes.
5. Desplegar de nuevo después de cambiar variables de Vercel.

La sesión se conserva en el almacenamiento local del navegador, siguiendo el flujo cliente existente, con renovación del token, validación al recargar y cierre entre pestañas. No se guardan contraseñas. La confirmación retira los tokens de la URL.

Referencias: [redirecciones de Supabase](https://supabase.com/docs/guides/auth/redirect-urls), [envío mediante SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
