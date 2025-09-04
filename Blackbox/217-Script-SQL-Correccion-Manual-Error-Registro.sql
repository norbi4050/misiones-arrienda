-- ============================================================
-- SCRIPT SQL PARA CORREGIR ERROR DE REGISTRO DE USUARIOS
-- ============================================================
-- Problema: "Database error saving new user" - permission denied for schema public
-- Solución: Configurar políticas RLS correctas para permitir registro de usuarios
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
-- Esta política permite que cualquier usuario autenticado o no autenticado pueda insertar
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

-- 9. VERIFICAR ESTRUCTURA DE LA TABLA USERS
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 10. PROBAR INSERCIÓN BÁSICA (OPCIONAL - PARA TESTING)
-- NOTA: Descomenta las siguientes líneas solo para testing manual
/*
INSERT INTO public.users (
    id,
    name, 
    email, 
    phone, 
    password,
    user_type,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Usuario Test',
    'test-' || extract(epoch from now()) || '@test.com',
    '+1234567890',
    'password123',
    'inquilino',
    now(),
    now()
);
*/

-- 11. VERIFICAR PERMISOS DE ESQUEMA PUBLIC
SELECT 
    nspname as schema_name,
    nspowner::regrole as owner,
    nspacl as permissions
FROM pg_namespace 
WHERE nspname = 'public';

-- ============================================================
-- INSTRUCCIONES DE USO:
-- ============================================================
-- 1. Copia este script completo
-- 2. Ve al Dashboard de Supabase (supabase.com)
-- 3. Navega a SQL Editor
-- 4. Pega el script y ejecuta
-- 5. Verifica que no hay errores
-- 6. Ejecuta el testing post-solución para confirmar
-- ============================================================

-- MENSAJE DE CONFIRMACIÓN
SELECT 'Script de corrección RLS ejecutado correctamente' as status;
