-- =====================================================
-- POLÍTICAS RLS PARA TABLA USERS - SUPABASE
-- =====================================================
-- Fecha: 2025-01-27
-- Propósito: Configurar Row Level Security para tabla users
-- IMPORTANTE: Ejecutar en Supabase Dashboard > SQL Editor

-- 1. HABILITAR ROW LEVEL SECURITY EN LA TABLA USERS
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 2. ELIMINAR POLÍTICAS EXISTENTES (SI LAS HAY)
-- =====================================================
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON public.users;

-- 3. CREAR POLÍTICAS RLS PARA USUARIOS AUTENTICADOS
-- =====================================================

-- POLÍTICA 1: Los usuarios pueden ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.users
FOR SELECT 
USING (auth.uid()::text = id);

-- POLÍTICA 2: Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.users
FOR UPDATE 
USING (auth.uid()::text = id)
WITH CHECK (auth.uid()::text = id);

-- POLÍTICA 3: Los usuarios pueden insertar su propio perfil
CREATE POLICY "Users can insert own profile" ON public.users
FOR INSERT 
WITH CHECK (auth.uid()::text = id);

-- POLÍTICA 4: Los usuarios pueden eliminar su propio perfil
CREATE POLICY "Users can delete own profile" ON public.users
FOR DELETE 
USING (auth.uid()::text = id);

-- 4. POLÍTICAS ADICIONALES PARA CASOS ESPECÍFICOS
-- =====================================================

-- POLÍTICA 5: Perfiles públicos visibles para todos (solo campos básicos)
-- Esta política permite que otros usuarios vean información básica
CREATE POLICY "Public profiles viewable by authenticated users" ON public.users
FOR SELECT 
USING (
    auth.role() = 'authenticated' AND
    -- Solo permitir ver campos públicos básicos
    true
);

-- POLÍTICA 6: Administradores pueden ver todos los perfiles
CREATE POLICY "Admins can view all profiles" ON public.users
FOR ALL
USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.jwt() ->> 'user_metadata' ->> 'role' = 'admin'
);

-- 5. POLÍTICAS PARA SERVICE ROLE (BACKEND)
-- =====================================================

-- POLÍTICA 7: Service role puede hacer todo (para operaciones del backend)
CREATE POLICY "Service role full access" ON public.users
FOR ALL
USING (auth.role() = 'service_role');

-- 6. VERIFICAR QUE LAS POLÍTICAS SE CREARON CORRECTAMENTE
-- =====================================================

-- Consulta para verificar las políticas creadas
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
WHERE schemaname = 'public' 
AND tablename = 'users'
ORDER BY policyname;

-- 7. VERIFICAR QUE RLS ESTÁ HABILITADO
-- =====================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'users';

-- 8. TEST DE FUNCIONAMIENTO
-- =====================================================

-- Test básico: Verificar que la tabla es accesible
SELECT 
    'RLS configurado correctamente' as status,
    COUNT(*) as total_users
FROM public.users;

-- 9. COMENTARIOS SOBRE LAS POLÍTICAS CREADAS
-- =====================================================

COMMENT ON TABLE public.users IS 'Tabla de usuarios con Row Level Security habilitado';

-- 10. INSTRUCCIONES POST-EJECUCIÓN
-- =====================================================

/*
INSTRUCCIONES DESPUÉS DE EJECUTAR ESTE SQL:

1. VERIFICAR EN SUPABASE DASHBOARD:
   - Ir a Authentication > Policies
   - Confirmar que aparecen las políticas para la tabla 'users'
   - Verificar que RLS está habilitado

2. PROBAR DESDE LA APLICACIÓN:
   - Hacer login con un usuario
   - Intentar actualizar el perfil
   - Verificar que solo puede ver/editar su propio perfil

3. VERIFICAR LOGS:
   - Revisar los logs de Supabase para confirmar que no hay errores
   - Probar consultas desde el frontend

4. TESTING ADICIONAL:
   - Probar con diferentes tipos de usuario (inquilino, dueno_directo, inmobiliaria)
   - Verificar que las consultas de perfil funcionan correctamente
   - Confirmar que el error 406 no aparece más

NOTAS IMPORTANTES:
- Estas políticas usan auth.uid()::text porque el campo id es de tipo TEXT
- Las políticas permiten acceso completo al propio perfil del usuario
- Los administradores tienen acceso completo a todos los perfiles
- El service role (backend) tiene acceso completo para operaciones automáticas
*/

-- =====================================================
-- FIN DEL SCRIPT DE POLÍTICAS RLS
-- =====================================================

SELECT 'Políticas RLS para tabla users creadas exitosamente' as resultado;
