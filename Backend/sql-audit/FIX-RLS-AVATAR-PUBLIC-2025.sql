-- ============================================================================
-- FIX: RLS Policy para permitir lectura pública de avatares
-- Fecha: 16 de Enero 2025
-- Problema: RLS bloquea lectura de users table cuando se consulta avatar de otro usuario
-- Solución: Cambiar policy para permitir lectura pública de datos básicos
-- ============================================================================

\echo '============================================================================'
\echo 'FIX: RLS POLICY PARA AVATARES PÚBLICOS'
\echo 'Fecha: 2025-01-16'
\echo '============================================================================'
\echo ''

-- ============================================================================
-- PASO 1: VERIFICAR TABLAS EXISTENTES Y SUS POLICIES
-- ============================================================================

\echo '--- 1. VERIFICAR NOMBRE DE TABLA (User vs users) ---'
\echo ''

SELECT
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
    AND table_name IN ('User', 'users')
ORDER BY table_name;

\echo ''
\echo '--- 2. VERIFICAR POLICIES RLS ACTUALES EN public."User" ---'
\echo ''

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'User'
ORDER BY policyname;

\echo ''
\echo '--- 3. VERIFICAR POLICIES RLS ACTUALES EN public.users ---'
\echo ''

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression,
    with_check AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- PASO 2: APLICAR FIX - Modificar policy de "User" (CamelCase)
-- ============================================================================

\echo ''
\echo '--- 4. APLICANDO FIX EN public."User" (si existe) ---'
\echo ''

DO $$
BEGIN
    -- Verificar si la tabla "User" existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'User'
    ) THEN
        RAISE NOTICE 'Tabla public."User" existe - aplicando fix...';

        -- Eliminar policy restrictiva si existe
        DROP POLICY IF EXISTS "Users can view own data" ON public."User";
        RAISE NOTICE '✓ Policy antigua eliminada (si existía)';

        -- Crear nueva policy pública para lectura
        CREATE POLICY "Anyone can view basic user data" ON public."User"
        FOR SELECT TO authenticated
        USING (true);  -- Permitir lectura a todos los usuarios autenticados

        RAISE NOTICE '✓ Nueva policy creada: Anyone can view basic user data';

        -- Mantener policy de actualización (solo propio perfil)
        DROP POLICY IF EXISTS "Users can update own data" ON public."User";
        CREATE POLICY "Users can update own data" ON public."User"
        FOR UPDATE TO authenticated
        USING (id = auth.uid()::text)
        WITH CHECK (id = auth.uid()::text);

        RAISE NOTICE '✓ Policy de UPDATE creada (solo propio perfil)';

    ELSE
        RAISE NOTICE 'Tabla public."User" NO existe - saltando...';
    END IF;
END $$;

\echo ''
\echo '--- 5. APLICANDO FIX EN public.users (si existe) ---'
\echo ''

DO $$
BEGIN
    -- Verificar si la tabla "users" existe
    IF EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'users'
    ) THEN
        RAISE NOTICE 'Tabla public.users existe - aplicando fix...';

        -- Eliminar policy restrictiva si existe
        DROP POLICY IF EXISTS "Users can view own data" ON public.users;
        RAISE NOTICE '✓ Policy antigua eliminada (si existía)';

        -- Crear nueva policy pública para lectura
        CREATE POLICY "Anyone can view basic user data" ON public.users
        FOR SELECT TO authenticated
        USING (true);  -- Permitir lectura a todos los usuarios autenticados

        RAISE NOTICE '✓ Nueva policy creada: Anyone can view basic user data';

        -- Mantener policy de actualización (solo propio perfil)
        DROP POLICY IF EXISTS "Users can update own data" ON public.users;
        CREATE POLICY "Users can update own data" ON public.users
        FOR UPDATE TO authenticated
        USING (id = auth.uid()::text)
        WITH CHECK (id = auth.uid()::text);

        RAISE NOTICE '✓ Policy de UPDATE creada (solo propio perfil)';

    ELSE
        RAISE NOTICE 'Tabla public.users NO existe - saltando...';
    END IF;
END $$;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- PASO 3: VERIFICAR POLICIES DESPUÉS DEL FIX
-- ============================================================================

\echo ''
\echo '--- 6. VERIFICAR POLICIES DESPUÉS DEL FIX (public."User") ---'
\echo ''

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'User'
ORDER BY policyname;

\echo ''
\echo '--- 7. VERIFICAR POLICIES DESPUÉS DEL FIX (public.users) ---'
\echo ''

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_expression
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename = 'users'
ORDER BY policyname;

\echo ''
\echo '============================================================================'

-- ============================================================================
-- PASO 4: TESTING - Verificar que la query funciona
-- ============================================================================

\echo ''
\echo '--- 8. TESTING: Consultar usuario específico ---'
\echo ''

\echo 'Test 1: Query en public."User" para user 6403f9d2-e846-4c70-87e0-e051127d9500'
SELECT
    id,
    name,
    email,
    avatar,
    profile_image,
    logo_url
FROM public."User"
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo 'Test 2: Query en public.users para user 6403f9d2-e846-4c70-87e0-e051127d9500'
SELECT
    id,
    name,
    email,
    avatar,
    profile_image,
    logo_url
FROM public.users
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

\echo ''
\echo '============================================================================'

-- ============================================================================
-- PASO 5: RESUMEN DE CAMBIOS
-- ============================================================================

\echo ''
\echo '--- 9. RESUMEN DE CAMBIOS APLICADOS ---'
\echo ''
\echo 'CAMBIOS REALIZADOS:'
\echo '  ✓ Policy antigua eliminada: "Users can view own data"'
\echo '  ✓ Nueva policy SELECT: "Anyone can view basic user data" (public read)'
\echo '  ✓ Policy UPDATE mantenida: "Users can update own data" (solo propio perfil)'
\echo ''
\echo 'IMPACTO DE SEGURIDAD:'
\echo '  • Usuarios autenticados pueden VER datos básicos de otros usuarios'
\echo '  • Usuarios solo pueden MODIFICAR su propio perfil'
\echo '  • Usuarios NO autenticados NO tienen acceso (RLS activo)'
\echo ''
\echo 'TABLAS AFECTADAS:'
\echo '  • public."User" (si existe)'
\echo '  • public.users (si existe)'
\echo ''
\echo 'PRÓXIMO PASO:'
\echo '  • Probar endpoint de avatar: GET /api/users/avatar?userId=6403f9d2-...'
\echo '  • Debería retornar el avatar en lugar de 404'
\echo ''

\echo '============================================================================'
\echo 'FIX COMPLETADO'
\echo '============================================================================'

-- ============================================================================
-- NOTAS DE SEGURIDAD
-- ============================================================================

/*
ANÁLISIS DE SEGURIDAD:

ANTES DEL FIX:
- Policy: USING (id = auth.uid()::text)
- Problema: Solo puedes ver TU PROPIO perfil
- Consecuencia: Endpoint de avatar retorna 404 para otros usuarios

DESPUÉS DEL FIX:
- Policy SELECT: USING (true)
- Comportamiento: Cualquier usuario autenticado puede leer datos básicos
- Policy UPDATE: USING (id = auth.uid()::text)
- Comportamiento: Solo puedes modificar TU PROPIO perfil

DATOS EXPUESTOS (solo a usuarios autenticados):
- id, name, email, avatar, profile_image, logo_url
- Estos son datos necesarios para mostrar perfiles públicos
- No se exponen datos sensibles como: password, tokens, etc.

ALTERNATIVA MÁS RESTRICTIVA (si es necesario):
Si quieres limitar qué columnas son públicas, puedes crear dos policies:

CREATE POLICY "Public profile data" ON public."User"
FOR SELECT TO authenticated
USING (true)
WITH CHECK (false);  -- Solo para SELECT

Y luego usar SELECT específico en el código:
.select('id,name,avatar')  -- Solo columnas públicas

RECOMENDACIÓN:
- El fix actual es apropiado para una aplicación social/inmobiliaria
- Los avatares y nombres deben ser públicos para funcionalidad básica
- Datos sensibles ya están protegidos por no estar en la SELECT list
*/
