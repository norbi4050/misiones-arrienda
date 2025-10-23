# 🔐 Seguridad del Panel de Administración

## Protección Implementada

El panel de administración tiene **múltiples capas de seguridad** para asegurar que SOLO el administrador autorizado pueda acceder:

### Capa 1: Middleware (Edge Protection)
- **Archivo**: `src/middleware.ts`
- **Protección**: Bloquea TODAS las rutas `/admin/*` y `/api/admin/*` a nivel de Edge
- **Comportamiento**:
  - Si el usuario NO está autenticado → Redirige a `/login`
  - Si el usuario NO es admin → Redirige a `/` (home) sin revelar que la ruta existe
  - Si el usuario ES admin → Permite el acceso

### Capa 2: Layout de Admin (Server-Side Protection)
- **Archivo**: `src/app/admin/layout.tsx`
- **Protección**: Verifica permisos en el servidor usando `isCurrentUserAdmin()`
- **Comportamiento**: Si no es admin, redirige a `/` (home)

### Capa 3: Componentes de Página (Client-Side Protection)
- **Archivos**: Todos los `page.tsx` dentro de `/admin/*`
- **Protección**: Algunos componentes verifican permisos en el cliente
- **Comportamiento**: Muestran mensaje de "Acceso Restringido"

### Capa 4: API Endpoints (Server-Side Protection)
- **Archivos**: Todos los endpoints en `/api/admin/*`
- **Protección**: Verifican permisos usando `isCurrentUserAdmin()`
- **Comportamiento**: Retornan 401/403 si no es admin

## Configuración de Variables de Entorno

Para que el sistema funcione correctamente, **DEBES configurar** estas variables de entorno en Vercel:

### Variables Requeridas en Vercel:

```bash
# Email del super administrador (siempre tiene acceso)
SUPER_ADMIN_EMAIL=misionesarrienda@gmail.com

# Lista de emails de administradores adicionales (separados por comas)
ADMIN_EMAILS=misionesarrienda@gmail.com

# Clave de servicio de Supabase (para bypass de RLS)
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Cómo configurar en Vercel:

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Agrega cada variable:
   - `SUPER_ADMIN_EMAIL` = `misionesarrienda@gmail.com`
   - `ADMIN_EMAILS` = `misionesarrienda@gmail.com`
   - `SUPABASE_SERVICE_ROLE_KEY` = (obtener de Supabase Dashboard → Project Settings → API → service_role key)

4. **IMPORTANTE**: Marca estas variables para todos los ambientes:
   - ✅ Production
   - ✅ Preview
   - ✅ Development

5. Después de agregar las variables, **redeploy** el proyecto

## Emails de Admin Adicionales

Si necesitas agregar más administradores en el futuro:

```bash
# Un solo admin
ADMIN_EMAILS=misionesarrienda@gmail.com

# Múltiples admins (separados por comas)
ADMIN_EMAILS=misionesarrienda@gmail.com,admin2@example.com,admin3@example.com
```

## Verificación de Seguridad

Para verificar que la seguridad está funcionando:

1. **Como usuario normal** (NO admin):
   - Intenta acceder a `https://misionesarrienda.com.ar/admin`
   - Deberías ser redirigido a `/` (home)
   - NO deberías ver ningún mensaje de error que revele que existe un panel de admin

2. **Como admin** (misionesarrienda@gmail.com):
   - Accede a `https://misionesarrienda.com.ar/admin`
   - Deberías ver el panel de administración completo

3. **Sin autenticación**:
   - Intenta acceder a `https://misionesarrienda.com.ar/admin`
   - Deberías ser redirigido a `/login?redirect=/admin`
   - Después de iniciar sesión, si eres admin, deberías ser redirigido al panel

## Logs de Seguridad

El sistema registra todos los intentos de acceso:

```
[MIDDLEWARE] Admin access granted: misionesarrienda@gmail.com -> /admin/dashboard
[SECURITY] Non-admin user attempted to access admin route: user@example.com -> /admin
```

Estos logs aparecen en:
- **Desarrollo**: Terminal local
- **Producción**: Vercel Logs (Project → Deployments → Select deployment → Runtime Logs)

## Rutas Protegidas

Las siguientes rutas están protegidas y SOLO accesibles para admin:

### Frontend:
- `/admin` - Redirige a dashboard
- `/admin/dashboard` - Panel principal
- `/admin/users` - Gestión de usuarios
- `/admin/properties` - Gestión de propiedades
- `/admin/reports` - Gestión de reportes
- `/admin/analytics` - Analytics y KPIs
- `/admin/support` - Soporte y contactos
- `/admin/kpis` - KPIs adicionales

### API:
- `/api/admin/properties` - CRUD de propiedades
- `/api/admin/users` - CRUD de usuarios
- `/api/admin/delete-user` - Eliminación de usuarios
- Cualquier otro endpoint bajo `/api/admin/*`

## Seguridad Adicional

### Service Role Key
- El `SUPABASE_SERVICE_ROLE_KEY` permite bypass de RLS (Row Level Security)
- **NUNCA** expongas esta key en el cliente
- **SOLO** úsala en API routes del servidor
- Esta key da acceso TOTAL a la base de datos

### Mejores Prácticas
1. ✅ Variables de entorno configuradas en Vercel
2. ✅ Middleware bloqueando rutas admin
3. ✅ Layout verificando permisos server-side
4. ✅ API endpoints verificando permisos
5. ✅ Logs de auditoría de accesos
6. ✅ Redirecciones que no revelan existencia de rutas

## Soporte

Si tienes problemas de acceso al panel de admin:
1. Verifica que estés usando el email correcto: `misionesarrienda@gmail.com`
2. Verifica que las variables de entorno estén en Vercel
3. Revisa los logs en Vercel para ver mensajes de error
4. Asegúrate de haber redeployado después de agregar las variables
