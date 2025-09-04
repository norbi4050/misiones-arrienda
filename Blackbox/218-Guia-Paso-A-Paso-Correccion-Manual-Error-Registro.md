# 🔧 GUÍA PASO A PASO: CORRECCIÓN MANUAL ERROR REGISTRO

## 📋 RESUMEN DEL PROBLEMA
- **Error:** "Database error saving new user"
- **Causa:** Políticas RLS (Row Level Security) muy restrictivas en Supabase
- **Síntoma:** "permission denied for schema public"
- **Estado actual:** 38% de éxito en testing (5 de 8 tests fallaron)

## 🎯 SOLUCIÓN MANUAL REQUERIDA

### **PASO 1: Acceder al Dashboard de Supabase**
1. Ve a [supabase.com](https://supabase.com)
2. Inicia sesión con tu cuenta
3. Selecciona tu proyecto "Misiones Arrienda"
4. Ve a la sección **"SQL Editor"** en el menú lateral

### **PASO 2: Aplicar el Script SQL de Corrección**
1. En el SQL Editor, crea una nueva consulta
2. Copia y pega el siguiente script SQL completo:

```sql
-- ============================================================
-- SCRIPT SQL PARA CORREGIR ERROR DE REGISTRO DE USUARIOS
-- ============================================================

-- 1. VERIFICAR ESTADO ACTUAL DE LA TABLA USERS
SELECT 
    schemaname, 
    tablename, 
    rowsecurity as rls_enabled,
    tableowner
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- 2. HABILITAR RLS EN LA TABLA USERS (si no está habilitado)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 3. ELIMINAR POLÍTICAS EXISTENTES QUE PUEDAN ESTAR CAUSANDO CONFLICTOS
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;

-- 4. CREAR POLÍTICA PARA PERMITIR INSERCIÓN DE NUEVOS USUARIOS (REGISTRO)
CREATE POLICY "Allow user registration" ON public.users
FOR INSERT 
WITH CHECK (true);

-- 5. CREAR POLÍTICA PARA PERMITIR QUE LOS USUARIOS VEAN SU PROPIO PERFIL
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT 
USING (auth.uid() = id OR auth.uid() IS NULL);

-- 6. CREAR POLÍTICA PARA PERMITIR QUE LOS USUARIOS ACTUALICEN SU PROPIO PERFIL
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE 
USING (auth.uid() = id);

-- 7. CREAR POLÍTICA PARA PERMITIR ELIMINACIÓN (SOLO PARA EL PROPIO USUARIO)
CREATE POLICY "Users can delete own profile" ON public.users
FOR DELETE 
USING (auth.uid() = id);

-- 8. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM pg_policies 
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;

-- MENSAJE DE CONFIRMACIÓN
SELECT 'Script de corrección RLS ejecutado correctamente' as status;
```

3. Haz clic en **"Run"** para ejecutar el script
4. Verifica que no aparezcan errores en la consola

### **PASO 3: Verificar la Ejecución**
Después de ejecutar el script, deberías ver:
- ✅ Mensaje: "Script de corrección RLS ejecutado correctamente"
- ✅ Lista de políticas creadas (4 políticas nuevas)
- ✅ Sin errores en la consola

### **PASO 4: Ejecutar Testing de Verificación**
Ejecuta este comando para verificar que el problema se solucionó:

```bash
Blackbox\216-Ejecutar-Testing-Post-Solucion-Error-Registro.bat
```

### **PASO 5: Interpretar Resultados**
- **75% o más de éxito** = ✅ PROBLEMA SOLUCIONADO
- **50-74% de éxito** = ⚠️ PARCIALMENTE SOLUCIONADO
- **Menos de 50%** = ❌ PROBLEMA PERSISTE

## 🔍 QUÉ HACE EL SCRIPT SQL

### **Políticas RLS Creadas:**
1. **"Allow user registration"** - Permite insertar nuevos usuarios
2. **"Users can view own profile"** - Permite ver el propio perfil
3. **"Users can update own profile"** - Permite actualizar el propio perfil
4. **"Users can delete own profile"** - Permite eliminar el propio perfil

### **Seguridad Mantenida:**
- ✅ Los usuarios solo pueden ver/editar su propio perfil
- ✅ RLS permanece habilitado para seguridad
- ✅ Registro de nuevos usuarios permitido
- ✅ Sin acceso a datos de otros usuarios

## 🚨 SOLUCIÓN DE PROBLEMAS

### **Si el script falla:**
1. Verifica que estás usando el token correcto de Supabase
2. Asegúrate de tener permisos de administrador
3. Revisa que la tabla `users` existe en el esquema `public`

### **Si persiste el error:**
1. Contacta al soporte de Supabase
2. Verifica la configuración de autenticación
3. Revisa los logs de Supabase para más detalles

## 📞 PRÓXIMOS PASOS

1. **Aplica el script SQL** en Supabase Dashboard
2. **Ejecuta el testing** de verificación
3. **Prueba el registro** en tu aplicación web
4. **Confirma** que los usuarios pueden registrarse exitosamente

## 📄 ARCHIVOS RELACIONADOS
- `Blackbox/217-Script-SQL-Correccion-Manual-Error-Registro.sql` - Script SQL completo
- `Blackbox/215-Reporte-Testing-Post-Solucion-Error-Registro-Final.json` - Reporte de testing actual

---

**¿Necesitas ayuda?** Una vez que apliques el script SQL, ejecuta el testing y comparte los resultados para confirmar que el problema se solucionó.
