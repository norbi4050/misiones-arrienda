# GUÍA DE IMPLEMENTACIÓN - SOLUCIÓN ERROR 500 PERFIL USUARIO

## 📋 RESUMEN DEL PROBLEMA

**Error reportado:** 500 Internal Server Error en `PUT /api/users/profile`  
**Log Supabase:** PATCH request con status 400 a `/rest/v1/users`  
**Usuario afectado:** `6403f9d2-e846-4c70-87e0-e051127d9500`  
**Causa identificada:** Desalineación entre modelo Prisma y estructura real tabla `users`

## 🔧 SOLUCIÓN IMPLEMENTADA

### Archivos creados:
1. `SUPABASE-SOLUCION-ERROR-PERFIL-USUARIO-500-COMPLETA.sql` - Script principal de corrección

### Lo que hace el script:

#### ✅ PASO 1: DIAGNÓSTICO
- Verifica si la tabla `users` existe
- Lista todas las columnas actuales
- Identifica campos faltantes

#### ✅ PASO 2: ESTRUCTURA DE TABLA
- Crea tabla `users` si no existe
- Agrega todos los campos necesarios del modelo Prisma
- Incluye campos específicos del endpoint `/api/users/profile`

#### ✅ PASO 3: CAMPOS AGREGADOS
- `location` - Ubicación del usuario
- `search_type` - Tipo de búsqueda
- `budget_range` - Rango de presupuesto
- `profile_image` - Imagen de perfil
- `preferred_areas` - Áreas preferidas
- `family_size` - Tamaño de familia
- `pet_friendly` - Acepta mascotas
- `move_in_date` - Fecha de mudanza
- `employment_status` - Estado laboral
- `monthly_income` - Ingresos mensuales
- `user_type` - Tipo de usuario

#### ✅ PASO 4: TRIGGERS
- Trigger automático para `updated_at`
- Función de sincronización `auth.users` → `public.users`

#### ✅ PASO 5: POLÍTICAS RLS
- Política SELECT: usuarios pueden ver su propio perfil
- Política UPDATE: usuarios pueden actualizar su propio perfil
- Política INSERT: usuarios pueden crear su propio perfil

#### ✅ PASO 6: VERIFICACIÓN
- Verifica el usuario específico del error
- Comprueba sincronización entre `auth.users` y `public.users`

## 🚀 INSTRUCCIONES DE IMPLEMENTACIÓN

### 1. Ejecutar el Script SQL

```bash
# Opción 1: Desde Supabase Dashboard
1. Ve a tu proyecto en Supabase Dashboard
2. Navega a SQL Editor
3. Copia y pega el contenido de SUPABASE-SOLUCION-ERROR-PERFIL-USUARIO-500-COMPLETA.sql
4. Ejecuta el script

# Opción 2: Desde línea de comandos (si tienes psql)
psql "postgresql://[usuario]:[password]@[host]:[puerto]/[database]" -f SUPABASE-SOLUCION-ERROR-PERFIL-USUARIO-500-COMPLETA.sql
```

### 2. Verificar la Implementación

Después de ejecutar el script, verifica:

```sql
-- Verificar estructura de tabla
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'users';

-- Verificar usuario específico
SELECT id, email, name, created_at, updated_at 
FROM public.users 
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';
```

### 3. Probar el Endpoint

```bash
# Probar con curl (reemplaza [TOKEN] con un token válido)
curl -X PUT http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer [TOKEN]" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "location": "Buenos Aires",
    "searchType": "rent",
    "budgetRange": "50000-100000"
  }'
```

## 🔍 VERIFICACIÓN DE ÉXITO

### Indicadores de que la solución funcionó:

1. **✅ Script ejecutado sin errores**
   - No hay mensajes de error en la consola SQL
   - Todos los pasos se completaron exitosamente

2. **✅ Tabla users actualizada**
   - Todos los campos necesarios están presentes
   - Tipos de datos correctos

3. **✅ Políticas RLS activas**
   - RLS habilitado en la tabla
   - Políticas para SELECT, UPDATE, INSERT creadas

4. **✅ Endpoint funciona**
   - PUT `/api/users/profile` retorna 200 en lugar de 500
   - Los datos se actualizan correctamente en la base de datos

5. **✅ Usuario específico resuelto**
   - El usuario `6403f9d2-e846-4c70-87e0-e051127d9500` puede actualizar su perfil
   - No más errores 400 en los logs de Supabase

## 🚨 POSIBLES PROBLEMAS Y SOLUCIONES

### Problema 1: "Permission denied for table users"
**Solución:** Ejecutar el script con permisos de administrador o service_role

### Problema 2: "Column already exists"
**Solución:** El script maneja esto automáticamente con verificaciones `IF NOT EXISTS`

### Problema 3: "RLS policy already exists"
**Solución:** El script elimina políticas existentes antes de crear nuevas

### Problema 4: Usuario aún no puede actualizar perfil
**Verificar:**
1. El usuario existe en `public.users`
2. Las políticas RLS están activas
3. El token de autenticación es válido

## 📊 MONITOREO POST-IMPLEMENTACIÓN

### Consultas útiles para monitorear:

```sql
-- Ver actividad reciente en tabla users
SELECT id, email, updated_at 
FROM public.users 
WHERE updated_at > NOW() - INTERVAL '1 hour'
ORDER BY updated_at DESC;

-- Verificar sincronización auth.users vs public.users
SELECT 
  a.id,
  a.email as auth_email,
  p.email as public_email,
  CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'OK' END as status
FROM auth.users a
LEFT JOIN public.users p ON a.id = p.id
WHERE a.created_at > NOW() - INTERVAL '1 day';
```

## ✅ CONFIRMACIÓN FINAL

Una vez implementada la solución:

1. **El endpoint `/api/users/profile` debe funcionar sin errores 500**
2. **Los usuarios pueden actualizar sus perfiles correctamente**
3. **Los logs de Supabase no muestran más errores 400 en `/rest/v1/users`**
4. **La sincronización entre `auth.users` y `public.users` funciona automáticamente**

## 📞 SOPORTE

Si después de implementar esta solución sigues teniendo problemas:

1. Verifica que el script se ejecutó completamente
2. Revisa los logs de Supabase para errores específicos
3. Confirma que las variables de entorno están correctamente configuradas
4. Prueba con un usuario diferente para descartar problemas específicos del usuario

---

**Fecha de creación:** $(date)  
**Versión:** 1.0  
**Estado:** Listo para implementación
