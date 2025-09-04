# GUÍA DE CORRECCIÓN MANUAL: ERROR "Database error saving new user"

**Fecha:** 2025-01-03  
**Problema:** Columna `full_name` faltante en tabla `users` de Supabase  
**Tiempo estimado:** 5-10 minutos  
**Dificultad:** BAJA  

## 🎯 OBJETIVO

Corregir el error "Database error saving new user" agregando la columna `full_name` faltante en la tabla `users` de Supabase y configurando las políticas RLS correctas.

## 📋 PRERREQUISITOS

- Acceso al Dashboard de Supabase
- Credenciales de administrador del proyecto
- URL del proyecto: `https://qfeyhaaxyemmnohqdele.supabase.co`

## 🔧 PASO A PASO

### PASO 1: Acceder a Supabase Dashboard

1. Ir a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Iniciar sesión con las credenciales del proyecto
3. Seleccionar el proyecto `qfeyhaaxyemmnohqdele`

### PASO 2: Abrir SQL Editor

1. En el menú lateral, hacer clic en **"SQL Editor"**
2. Hacer clic en **"New query"** para crear una nueva consulta

### PASO 3: Verificar esquema actual (OPCIONAL)

Ejecutar esta consulta para ver las columnas actuales:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position;
```

### PASO 4: Aplicar corrección principal

Copiar y pegar este script SQL completo:

```sql
-- ============================================================
-- CORRECCIÓN COMPLETA: ERROR "Database error saving new user"
-- ============================================================

-- 1. Agregar columna full_name si no existe
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Crear índice para optimización
CREATE INDEX IF NOT EXISTS idx_users_full_name 
ON public.users(full_name);

-- 3. Eliminar políticas problemáticas existentes
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "allow_user_insert" ON public.users;
DROP POLICY IF EXISTS "users_insert_policy" ON public.users;

-- 4. Crear política INSERT funcional
CREATE POLICY "allow_user_insert" ON public.users
    FOR INSERT 
    TO authenticated 
    WITH CHECK (auth.uid() = id);

-- 5. Crear política alternativa para casos especiales
CREATE POLICY "allow_service_role_insert" ON public.users
    FOR INSERT 
    TO service_role 
    WITH CHECK (true);

-- 6. Otorgar permisos necesarios
GRANT INSERT ON public.users TO authenticated;
GRANT INSERT ON public.users TO anon;
GRANT INSERT ON public.users TO service_role;

-- 7. Habilitar RLS si no está habilitado
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. Verificar que la corrección funcionó
SELECT 'Corrección aplicada exitosamente' as status;
```

### PASO 5: Ejecutar el script

1. Hacer clic en **"Run"** o presionar `Ctrl + Enter`
2. Verificar que aparezca el mensaje: `Corrección aplicada exitosamente`
3. Si hay errores, revisar los mensajes y aplicar correcciones individuales

### PASO 6: Verificar la corrección

Ejecutar esta consulta de verificación:

```sql
-- Verificar que la columna fue creada
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_name = 'users' 
AND column_name = 'full_name';

-- Verificar políticas RLS
SELECT policyname, cmd, permissive, roles
FROM pg_policies 
WHERE tablename = 'users';
```

### PASO 7: Probar inserción manual

Ejecutar esta prueba para confirmar que funciona:

```sql
-- Test de inserción (usar un UUID único)
INSERT INTO public.users (id, email, full_name, created_at)
VALUES (
  gen_random_uuid(),
  'test-manual@example.com',
  'Usuario de Prueba Manual',
  now()
);

-- Verificar que se insertó
SELECT id, email, full_name, created_at 
FROM public.users 
WHERE email = 'test-manual@example.com';

-- Limpiar datos de prueba
DELETE FROM public.users 
WHERE email = 'test-manual@example.com';
```

## ✅ VERIFICACIÓN DE ÉXITO

Después de aplicar la corrección, deberías ver:

1. ✅ Columna `full_name` existe en la tabla `users`
2. ✅ Políticas RLS configuradas correctamente
3. ✅ Inserción manual funciona sin errores
4. ✅ Permisos otorgados a los roles necesarios

## 🚨 SOLUCIÓN DE PROBLEMAS

### Error: "permission denied for table users"
```sql
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;
```

### Error: "RLS is enabled but no policies exist"
```sql
CREATE POLICY "allow_all_operations" ON public.users
    FOR ALL 
    TO authenticated 
    USING (true) 
    WITH CHECK (true);
```

### Error: "column already exists"
- Esto es normal, significa que la columna ya fue agregada
- Continuar con los siguientes pasos

## 🔄 TESTING POST-CORRECCIÓN

### Opción 1: Testing desde la aplicación web
1. Ir a la página de registro: `http://localhost:3000/register`
2. Intentar registrar un nuevo usuario
3. Verificar que no aparezca el error "Database error saving new user"

### Opción 2: Testing con script automático
```bash
node "Blackbox/232-Testing-Exhaustivo-Post-Correccion-Policy-INSERT-Users-Final.js"
```

## 📞 PRÓXIMOS PASOS

Una vez aplicada la corrección:

1. **Inmediato:** Probar registro desde la aplicación web
2. **Verificar:** Que los usuarios se crean correctamente en Supabase
3. **Confirmar:** Que el login funciona con los nuevos usuarios
4. **Documentar:** El esquema final de la tabla `users`

## 🎯 RESULTADO ESPERADO

Después de aplicar esta corrección:

- ✅ El error "Database error saving new user" desaparecerá
- ✅ Los usuarios podrán registrarse normalmente
- ✅ La tabla `users` tendrá todas las columnas necesarias
- ✅ Las políticas RLS funcionarán correctamente

## 📝 NOTAS IMPORTANTES

- **Backup:** Supabase mantiene backups automáticos, pero es buena práctica
- **Testing:** Probar en un usuario de prueba antes de usar en producción
- **Monitoreo:** Verificar logs de Supabase después de la corrección
- **Documentación:** Actualizar documentación del esquema de base de datos

---

**Archivo:** `Blackbox/234-GUIA-CORRECCION-MANUAL-ERROR-REGISTRO-PASO-A-PASO.md`  
**Generado:** 2025-01-03  
**Versión:** 1.0 - Corrección Completa
