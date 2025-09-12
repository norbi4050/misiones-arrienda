# 🔧 SOLUCIÓN ERROR: "column viewed_user_id does not exist"

## 📋 PROBLEMA IDENTIFICADO

```
ERROR: 42703: column "viewed_user_id" does not exist
indices para profile_views
```

## 🎯 CAUSA RAÍZ

El error ocurre porque los índices se están intentando crear antes de que la tabla `profile_views` esté completamente configurada, o hay un conflicto con una versión anterior de la tabla.

## ✅ SOLUCIÓN PASO A PASO

### PASO 1: Ejecutar el SQL de corrección

```sql
-- Ejecutar este archivo en Supabase SQL Editor:
Backend/sql-migrations/FIX-INDICES-PROFILE-VIEWS-2025.sql
```

### PASO 2: Verificar la corrección

```sql
-- Verificar que la tabla existe
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profile_views'
ORDER BY ordinal_position;

-- Verificar índices
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profile_views' 
AND schemaname = 'public';
```

### PASO 3: Probar la funcionalidad

```sql
-- Probar función de conteo
SELECT public.get_profile_views_count('tu-user-id'::UUID);

-- Probar función de registro
SELECT public.log_profile_view(
    'viewer-user-id'::UUID,
    'viewed-user-id'::UUID,
    'test-session',
    '127.0.0.1'::INET,
    'test-user-agent'
);
```

## 🔍 QUÉ HACE EL FIX

1. **Elimina y recrea** la tabla `profile_views` limpiamente
2. **Verifica la existencia** de columnas antes de crear índices
3. **Crea índices uno por uno** con verificación individual
4. **Configura RLS** correctamente
5. **Incluye funciones** optimizadas y con manejo de errores

## 📊 ESTRUCTURA FINAL DE LA TABLA

```sql
CREATE TABLE public.profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    viewer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    referrer TEXT,
    session_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🚀 ÍNDICES CREADOS

1. `idx_profile_views_viewed_user` - Para consultas por usuario visto
2. `idx_profile_views_viewer_user` - Para consultas por usuario que ve
3. `idx_profile_views_session` - Para evitar duplicados por sesión
4. `idx_profile_views_recent` - Para consultas de vistas recientes

## 🔒 POLÍTICAS RLS

- **SELECT**: Los usuarios pueden ver las vistas de su propio perfil
- **INSERT**: Los usuarios pueden registrar vistas que ellos realizan

## 🧪 FUNCIONES INCLUIDAS

### `log_profile_view()`
- Registra vistas de perfil
- Evita auto-vistas
- Previene duplicados recientes
- Manejo robusto de errores

### `get_profile_views_count()`
- Cuenta vistas de perfil (últimos 30 días)
- Manejo seguro de errores
- Retorna 0 si hay problemas

## ⚡ PRÓXIMOS PASOS

1. **Ejecutar el SQL de corrección**
2. **Verificar que no hay errores**
3. **Actualizar la API** para usar las nuevas funciones
4. **Probar en el frontend**

## 🔧 SI AÚN HAY PROBLEMAS

### Opción A: Verificación manual
```sql
-- Ver todas las tablas del esquema public
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Ver estructura específica
\d public.profile_views
```

### Opción B: Recreación completa
```sql
-- Si es necesario, eliminar todo y empezar de nuevo
DROP TABLE IF EXISTS public.profile_views CASCADE;
-- Luego ejecutar el SQL de corrección
```

### Opción C: Verificar permisos
```sql
-- Verificar permisos del usuario actual
SELECT current_user, session_user;
SELECT has_table_privilege('public.profile_views', 'SELECT');
```

## 📝 NOTAS IMPORTANTES

- ✅ El SQL incluye verificaciones de existencia
- ✅ Manejo robusto de errores
- ✅ Compatible con Supabase PostgreSQL
- ✅ RLS configurado correctamente
- ✅ Funciones optimizadas para rendimiento

## 🎯 RESULTADO ESPERADO

Después de ejecutar el fix:
- ✅ Tabla `profile_views` creada correctamente
- ✅ Todos los índices funcionando
- ✅ Funciones disponibles para usar
- ✅ RLS configurado
- ✅ Sin errores de columnas faltantes

---

**Fecha:** Enero 2025  
**Estado:** ✅ SOLUCIÓN LISTA PARA APLICAR  
**Prioridad:** 🔥 CRÍTICA - Resolver inmediatamente
