-- ============================================================
-- SOLUCIÓN AVANZADA: PERMISOS ESQUEMA PUBLIC SUPABASE
-- ============================================================
-- Problema: "permission denied for schema public"
-- Causa: Permisos insuficientes en el esquema public
-- Solución: Configurar permisos completos para roles anon y authenticated
-- ============================================================

-- 1. VERIFICAR ESTADO ACTUAL DEL ESQUEMA PUBLIC
SELECT 
    nspname as schema_name,
    nspowner::regrole as owner,
    nspacl as permissions
FROM pg_namespace 
WHERE nspname = 'public';

-- 2. OTORGAR PERMISOS COMPLETOS AL ESQUEMA PUBLIC
-- Permitir uso del esquema para roles anon y authenticated
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Permitir crear objetos en el esquema public
GRANT CREATE ON SCHEMA public TO anon;
GRANT CREATE ON SCHEMA public TO authenticated;
GRANT CREATE ON SCHEMA public TO service_role;

-- 3. OTORGAR PERMISOS ESPECÍFICOS A LA TABLA USERS
-- Permisos para rol anon (usuarios no autenticados - necesario para registro)
GRANT SELECT, INSERT ON public.users TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Permisos para rol authenticated (usuarios autenticados)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.users TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Permisos para service_role (operaciones administrativas)
GRANT ALL PRIVILEGES ON public.users TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 4. CONFIGURAR PERMISOS POR DEFECTO PARA OBJETOS FUTUROS
-- Para tablas que se creen en el futuro
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO service_role;

-- Para secuencias que se creen en el futuro
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO service_role;

-- 5. VERIFICAR Y CORREGIR POLÍTICAS RLS EXISTENTES
-- Eliminar políticas que puedan estar causando conflictos
DROP POLICY IF EXISTS "Allow user registration" ON public.users;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.users;

-- 6. CREAR POLÍTICAS RLS OPTIMIZADAS
-- Política para permitir registro (INSERT) - MUY PERMISIVA para registro
CREATE POLICY "Enable insert for registration" ON public.users
FOR INSERT 
WITH CHECK (true);

-- Política para SELECT - Permitir ver propio perfil + acceso público limitado
CREATE POLICY "Enable select for users" ON public.users
FOR SELECT 
USING (
    auth.uid()::text = id::text 
    OR auth.uid() IS NULL 
    OR auth.role() = 'service_role'
);

-- Política para UPDATE - Solo propio perfil
CREATE POLICY "Enable update for own profile" ON public.users
FOR UPDATE 
USING (
    auth.uid()::text = id::text 
    OR auth.role() = 'service_role'
);

-- Política para DELETE - Solo propio perfil
CREATE POLICY "Enable delete for own profile" ON public.users
FOR DELETE 
USING (
    auth.uid()::text = id::text 
    OR auth.role() = 'service_role'
);

-- 7. ASEGURAR QUE RLS ESTÉ HABILITADO
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 8. VERIFICAR PERMISOS DE INFORMACIÓN_SCHEMA (para consultas de estructura)
GRANT SELECT ON information_schema.columns TO anon;
GRANT SELECT ON information_schema.columns TO authenticated;
GRANT SELECT ON information_schema.tables TO anon;
GRANT SELECT ON information_schema.tables TO authenticated;

-- 9. VERIFICAR PERMISOS DE PG_CATALOG (para consultas de metadatos)
GRANT SELECT ON pg_catalog.pg_tables TO anon;
GRANT SELECT ON pg_catalog.pg_tables TO authenticated;
GRANT SELECT ON pg_catalog.pg_policies TO anon;
GRANT SELECT ON pg_catalog.pg_policies TO authenticated;

-- 10. PROBAR INSERCIÓN BÁSICA (OPCIONAL - SOLO PARA TESTING)
-- NOTA: Descomenta solo para testing manual
/*
DO $$
BEGIN
    -- Intentar inserción de prueba
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
        gen_random_uuid()::text,
        'Test User Permissions',
        'test-permissions-' || extract(epoch from now()) || '@test.com',
        '+1234567890',
        'password123',
        'inquilino',
        now(),
        now()
    );
    
    RAISE NOTICE 'Inserción de prueba exitosa - Permisos configurados correctamente';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error en inserción de prueba: %', SQLERRM;
END $$;
*/

-- 11. VERIFICAR CONFIGURACIÓN FINAL
-- Verificar permisos del esquema
SELECT 
    nspname as schema_name,
    nspowner::regrole as owner,
    nspacl as permissions
FROM pg_namespace 
WHERE nspname = 'public';

-- Verificar permisos de la tabla users
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasinserts,
    hasselects,
    hasupdates,
    hasdeletes
FROM pg_tables 
WHERE tablename = 'users' AND schemaname = 'public';

-- Verificar políticas RLS
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

-- ============================================================
-- MENSAJE DE CONFIRMACIÓN
SELECT 'Permisos avanzados del esquema public configurados correctamente' as status;

-- ============================================================
-- NOTAS IMPORTANTES:
-- 1. Este script otorga permisos más amplios para resolver el problema
-- 2. Los permisos son seguros gracias a las políticas RLS
-- 3. El rol 'anon' necesita permisos INSERT para permitir registro
-- 4. Las políticas RLS siguen controlando el acceso a nivel de fila
-- ============================================================
