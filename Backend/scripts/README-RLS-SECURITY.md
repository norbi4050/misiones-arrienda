# Aplicar Políticas de RLS (Row Level Security)

## 📋 Resumen

Este script corrige los errores de seguridad detectados por Supabase Linter habilitando RLS en 4 tablas:

1. ✅ `notifications`
2. ✅ `notification_preferences`
3. ✅ `email_logs`
4. ✅ `UserProfile_backup_20250118`

## 🔒 ¿Qué es RLS?

Row Level Security (RLS) es una capa de seguridad en PostgreSQL que controla qué filas puede ver/modificar cada usuario. Sin RLS, cualquier usuario autenticado puede acceder a TODOS los datos de una tabla pública.

## 🚨 Riesgo Actual

**SIN RLS:**
- Cualquier usuario puede ver las notificaciones de OTROS usuarios
- Cualquier usuario puede modificar preferencias ajenas
- Acceso sin restricción a logs de emails
- Tabla de backup expuesta públicamente

**CON RLS (después de aplicar el script):**
- Cada usuario solo ve SUS propias notificaciones
- Solo puede modificar SUS propias preferencias
- Los logs son accesibles solo por service role (backend)
- Tabla de backup protegida completamente

## 📝 Instrucciones de Aplicación

### Método 1: Supabase Dashboard (Recomendado)

1. **Abre Supabase Dashboard**
   - Ve a: https://supabase.com/dashboard
   - Selecciona tu proyecto

2. **Abre SQL Editor**
   - Menú lateral → "SQL Editor"
   - Click en "New query"

3. **Copia y Pega el Script**
   - Abre el archivo: `scripts/enable-rls-security.sql`
   - Copia TODO el contenido
   - Pégalo en el SQL Editor

4. **Ejecuta el Script**
   - Click en "Run" o presiona `Ctrl+Enter`
   - Espera a que termine (debería tomar 2-3 segundos)

5. **Verifica Resultados**
   - Al final del script hay queries de verificación
   - Deberías ver que `rls_enabled = true` para todas las tablas

### Método 2: Comando psql (Avanzado)

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -f scripts/enable-rls-security.sql
```

## 🔍 Verificación Post-Aplicación

Ejecuta esta query en SQL Editor para verificar:

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'notifications',
    'notification_preferences',
    'email_logs',
    'UserProfile_backup_20250118'
  )
ORDER BY tablename;
```

**Resultado esperado:** `rls_enabled = true` para todas las tablas

## 📜 Políticas Creadas

### 1. `notifications`
- ✅ Usuarios ven solo sus notificaciones
- ✅ Usuarios pueden marcar como leído/eliminar sus notificaciones
- ✅ Sistema (service role) puede crear notificaciones

### 2. `notification_preferences`
- ✅ Usuarios gestionan solo sus propias preferencias
- ✅ CRUD completo para propias preferencias

### 3. `email_logs`
- 🔒 **Totalmente bloqueado** para usuarios normales
- ✅ Solo service role puede acceder (para debugging backend)

### 4. `UserProfile_backup_20250118`
- 🔒 **Totalmente bloqueado** para todos
- ✅ Solo service role puede acceder
- 💡 Recomendación: Considerar eliminar esta tabla si ya no es necesaria

## ⚠️ Impacto en la Aplicación

### ✅ NO rompe funcionalidad existente

Las políticas están diseñadas para permitir:
- Backend sigue funcionando (usa service role que bypassa RLS)
- Usuarios acceden a SUS propios datos normalmente
- APIs existentes siguen funcionando

### 🔧 Posibles Ajustes Necesarios

Si después de aplicar encuentras errores de acceso:

1. **Notificaciones no se muestran:**
   ```sql
   -- Verifica que user_id esté correctamente poblado
   SELECT id, user_id, title FROM notifications LIMIT 10;
   ```

2. **Preferencias no se guardan:**
   - Asegúrate que el INSERT incluya `user_id = auth.uid()`

3. **Email logs no se crean:**
   - Usa `supabase.createClient()` con **service role key** en el backend

## 🧹 Limpieza Opcional

### Eliminar tabla de backup (si ya no es necesaria)

```sql
-- ⚠️ PRECAUCIÓN: Esto es irreversible
-- Verifica que ya no necesites esta tabla antes de ejecutar
DROP TABLE IF EXISTS public."UserProfile_backup_20250118";
```

## 📊 Monitoreo

Después de aplicar, monitorea en los próximos días:

1. **Dashboard de Supabase → Database → Linter**
   - Los 4 errores de RLS deberían desaparecer

2. **Logs de errores en la app**
   - Busca errores relacionados con permisos
   - Errores tipo "permission denied" o "RLS policy violation"

3. **Funcionalidad de usuario**
   - Notificaciones se muestran correctamente
   - Preferencias se guardan sin problemas
   - Emails se envían normalmente

## 🆘 Rollback (si algo sale mal)

Si necesitas revertir los cambios:

```sql
-- DESHABILITAR RLS (volver al estado anterior)
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."UserProfile_backup_20250118" DISABLE ROW LEVEL SECURITY;

-- ELIMINAR POLÍTICAS
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
-- ... (eliminar todas las políticas creadas)
```

## 📞 Soporte

Si encuentras problemas:

1. Revisa los logs de Supabase
2. Verifica que las políticas se crearon correctamente
3. Asegúrate que el backend usa service role key para operaciones del sistema

---

**Fecha de creación:** 2025-01-21
**Versión:** 1.0
**Mantenedor:** Claude Code
