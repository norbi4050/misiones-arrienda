-- =====================================================
-- 🛠️ SOLUCIONES SUPABASE ESPECÍFICAS
-- =====================================================
-- Ejecuta SOLO las secciones que correspondan según los resultados de la investigación

-- =====================================================
-- ESCENARIO 1: RLS HABILITADO PERO SIN POLÍTICAS
-- =====================================================
-- Usar si la investigación muestra:
-- - rowsecurity = true en pg_tables
-- - 0 políticas en pg_policies para tabla User

-- SOLUCIÓN 1A: Crear políticas RLS completas
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public."User";

-- Política para VER perfil propio
CREATE POLICY "Users can view own profile" ON public."User"
    FOR SELECT USING (auth.uid() = id::uuid);

-- Política para CREAR perfil propio
CREATE POLICY "Users can insert own profile" ON public."User"
    FOR INSERT WITH CHECK (auth.uid() = id::uuid);

-- Política para ACTUALIZAR perfil propio
CREATE POLICY "Users can update own profile" ON public."User"
    FOR UPDATE USING (auth.uid() = id::uuid);

-- Política para SERVICE ROLE (bypass completo)
CREATE POLICY "Service role can manage all profiles" ON public."User"
    FOR ALL USING (
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
        OR auth.jwt()->>'role' = 'service_role'
    );

-- Otorgar permisos necesarios
GRANT SELECT, INSERT, UPDATE ON public."User" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."User" TO anon;
GRANT ALL ON public."User" TO service_role;

-- =====================================================
-- ESCENARIO 2: RLS DESHABILITADO
-- =====================================================
-- Usar si la investigación muestra:
-- - rowsecurity = false en pg_tables

-- SOLUCIÓN 2A: Habilitar RLS y crear políticas
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Luego ejecutar las políticas del ESCENARIO 1

-- =====================================================
-- ESCENARIO 3: TABLA USER NO EXISTE
-- =====================================================
-- Usar si la investigación muestra:
-- - No hay tabla "User" en information_schema.tables

-- SOLUCIÓN 3A: Crear tabla User completa
CREATE TABLE public."User" (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    name TEXT,
    phone TEXT,
    bio TEXT,
    profile_image TEXT,
    occupation TEXT,
    age INTEGER,
    verified BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    verification_token TEXT,
    rating DECIMAL(3,2) DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    user_type TEXT,
    company_name TEXT,
    license_number TEXT,
    property_count INTEGER DEFAULT 0,
    password TEXT DEFAULT '',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crear índices
CREATE INDEX idx_user_email ON public."User"(email);
CREATE INDEX idx_user_created_at ON public."User"(created_at);

-- Habilitar RLS
ALTER TABLE public."User" ENABLE ROW LEVEL SECURITY;

-- Crear políticas (usar las del ESCENARIO 1)

-- =====================================================
-- ESCENARIO 4: PERMISOS FALTANTES
-- =====================================================
-- Usar si la investigación muestra:
-- - Faltan permisos para authenticated, anon, o service_role

-- SOLUCIÓN 4A: Otorgar todos los permisos necesarios
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO service_role;

GRANT SELECT, INSERT, UPDATE ON public."User" TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public."User" TO anon;
GRANT ALL ON public."User" TO service_role;

-- =====================================================
-- ESCENARIO 5: POLÍTICAS INCORRECTAS
-- =====================================================
-- Usar si la investigación muestra:
-- - Existen políticas pero están mal configuradas

-- SOLUCIÓN 5A: Recrear políticas desde cero
DROP POLICY IF EXISTS "Users can view own profile" ON public."User";
DROP POLICY IF EXISTS "Users can insert own profile" ON public."User";
DROP POLICY IF EXISTS "Users can update own profile" ON public."User";
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public."User";
DROP POLICY IF EXISTS "Enable access for authenticated users only" ON public."User";
DROP POLICY IF EXISTS "Users can only see own profile" ON public."User";
DROP POLICY IF EXISTS "Users can only update own profile" ON public."User";

-- Crear políticas correctas (usar las del ESCENARIO 1)

-- =====================================================
-- ESCENARIO 6: DESINCRONIZACIÓN auth.users vs User
-- =====================================================
-- Usar si la investigación muestra:
-- - Usuarios en auth.users que no están en public.User

-- SOLUCIÓN 6A: Sincronizar usuarios faltantes
INSERT INTO public."User" (
    id,
    email,
    name,
    created_at,
    updated_at
)
SELECT 
    au.id::text,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    au.created_at,
    au.updated_at
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL;

-- =====================================================
-- ESCENARIO 7: SOLUCIÓN TEMPORAL (SOLO PARA TESTING)
-- =====================================================
-- ⚠️ USAR SOLO PARA TESTING - NO EN PRODUCCIÓN

-- SOLUCIÓN 7A: Deshabilitar RLS temporalmente
-- ALTER TABLE public."User" DISABLE ROW LEVEL SECURITY;

-- SOLUCIÓN 7B: Política permisiva temporal
-- CREATE POLICY "Temporary allow all" ON public."User" FOR ALL USING (true);

-- =====================================================
-- ESCENARIO 8: VERIFICACIÓN POST-APLICACIÓN
-- =====================================================
-- Ejecutar DESPUÉS de aplicar cualquier solución para verificar

-- Verificar que RLS está habilitado
SELECT 
    tablename,
    rowsecurity,
    'RLS ' || CASE WHEN rowsecurity THEN 'HABILITADO ✅' ELSE 'DESHABILITADO ❌' END as estado
FROM pg_tables 
WHERE tablename = 'User' AND schemaname = 'public';

-- Verificar políticas creadas
SELECT 
    policyname as "Política",
    cmd as "Comando",
    'CREADA ✅' as "Estado"
FROM pg_policies 
WHERE tablename = 'User' AND schemaname = 'public'
ORDER BY policyname;

-- Verificar permisos
SELECT 
    grantee as "Rol",
    privilege_type as "Permiso",
    'OTORGADO ✅' as "Estado"
FROM information_schema.role_table_grants 
WHERE table_name = 'User' AND table_schema = 'public'
AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY grantee, privilege_type;

-- Probar inserción (debería funcionar con service_role)
-- INSERT INTO public."User" (id, email, name) VALUES ('test-123', 'test@example.com', 'Test User');
-- DELETE FROM public."User" WHERE id = 'test-123';

-- =====================================================
-- GUÍA DE USO SEGÚN RESULTADOS DE INVESTIGACIÓN
-- =====================================================

/*
CÓMO USAR ESTE ARCHIVO:

1. Ejecuta primero INVESTIGACION-SUPABASE-DIAGNOSTICO.sql
2. Según los resultados, identifica tu escenario:

   📋 TABLA NO EXISTE → Usar ESCENARIO 3
   📋 RLS DESHABILITADO → Usar ESCENARIO 2
   📋 RLS HABILITADO SIN POLÍTICAS → Usar ESCENARIO 1
   📋 POLÍTICAS INCORRECTAS → Usar ESCENARIO 5
   📋 PERMISOS FALTANTES → Usar ESCENARIO 4
   📋 USUARIOS DESINCRONIZADOS → Usar ESCENARIO 6

3. Ejecuta SOLO la sección correspondiente a tu escenario
4. Ejecuta ESCENARIO 8 para verificar que todo funcionó
5. Prueba la aplicación en http://localhost:3000/profile/inquilino

ESCENARIOS MÁS COMUNES:
- 90% de casos: ESCENARIO 1 (RLS habilitado sin políticas)
- 5% de casos: ESCENARIO 2 (RLS deshabilitado)
- 3% de casos: ESCENARIO 5 (políticas incorrectas)
- 2% de casos: ESCENARIO 4 (permisos faltantes)
*/
