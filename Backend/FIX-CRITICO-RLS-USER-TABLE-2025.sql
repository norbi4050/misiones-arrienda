-- =====================================================
-- FIX CRÍTICO: Crear políticas RLS para tabla User
-- =====================================================
-- PROBLEMA: RLS habilitado pero 0 políticas = permission denied
-- SOLUCIÓN: Crear políticas RLS inmediatamente

-- 1. Verificar estado actual
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'User' AND schemaname = 'public') as policies_count
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'User';

-- 2. Crear políticas RLS CRÍTICAS para tabla User
-- IMPORTANTE: Ejecutar estas políticas INMEDIATAMENTE

-- Política 1: Permitir SELECT para usuarios autenticados
CREATE POLICY "authenticated_users_select_own_profile" ON public."User"
    FOR SELECT 
    USING (auth.uid()::text = id OR auth.role() = 'authenticated');

-- Política 2: Permitir INSERT para usuarios autenticados (creación de perfil)
CREATE POLICY "authenticated_users_insert_own_profile" ON public."User"
    FOR INSERT 
    WITH CHECK (auth.uid()::text = id OR auth.role() = 'authenticated');

-- Política 3: Permitir UPDATE para usuarios autenticados
CREATE POLICY "authenticated_users_update_own_profile" ON public."User"
    FOR UPDATE 
    USING (auth.uid()::text = id)
    WITH CHECK (auth.uid()::text = id);

-- Política 4: Permitir acceso completo para service_role
CREATE POLICY "service_role_full_access" ON public."User"
    FOR ALL
    USING (
        current_setting('role') = 'service_role' OR
        current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    );

-- 3. Verificar que las políticas se crearon correctamente
SELECT 
    policyname,
    cmd,
    permissive,
    roles
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'User'
ORDER BY policyname;

-- 4. Crear perfil para el usuario faltante
-- IMPORTANTE: Esto debe ejecutarse DESPUÉS de crear las políticas
INSERT INTO public."User" (
    id,
    name,
    email,
    phone,
    password,
    avatar,
    bio,
    verified,
    "emailVerified",
    "userType",
    "createdAt",
    "updatedAt"
) VALUES (
    '6403f9d2-e846-4c70-87e0-e051127d9500',
    'Carlos González',
    'cgonzalezarchilla@gmail.com',
    '',
    '',
    null,
    null,
    true,
    true,
    'inquilino',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 5. Verificar que el perfil se creó
SELECT 
    id,
    name,
    email,
    "userType",
    "createdAt"
FROM public."User" 
WHERE id = '6403f9d2-e846-4c70-87e0-e051127d9500';

-- 6. Verificar conteos finales
SELECT 
    'auth.users' as source,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'public.User' as source,
    COUNT(*) as count
FROM public."User";

-- 7. Verificar que no hay usuarios sin perfil
SELECT COUNT(*) as missing_profiles_count
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL;

COMMIT;
