-- =====================================================
-- FASE 3.2: AUDITORÍA COMPLETA DE SEGURIDAD RLS
-- Verificación exhaustiva de Row Level Security policies
-- Proyecto: Misiones Arrienda - 2025
-- =====================================================

-- PASO 1: VERIFICAR ESTADO GENERAL DE RLS
-- =====================================================

SELECT 
    '🔍 ESTADO GENERAL DE RLS' as seccion,
    '' as detalle;

-- Verificar qué tablas tienen RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    (SELECT COUNT(*) FROM pg_policies WHERE tablename = t.tablename AND schemaname = t.schemaname) as policies_count
FROM pg_tables t
WHERE schemaname = 'public'
    AND tablename IN ('User', 'properties', 'favorites', 'user_ratings', 'user_searches', 'user_messages', 'user_activity')
ORDER BY tablename;

-- PASO 2: AUDITORÍA DETALLADA DE TABLA USER
-- =====================================================

SELECT 
    '🔐 AUDITORÍA TABLA USER' as seccion,
    '' as detalle;

-- Verificar políticas existentes en tabla User
SELECT 
    policyname,
    cmd as operation,
    permissive,
    roles,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'User'
ORDER BY policyname;

-- Verificar si hay usuarios sin perfil
SELECT 
    'Usuarios sin perfil en tabla User' as check_name,
    COUNT(*) as count
FROM auth.users au
LEFT JOIN public."User" u ON au.id::text = u.id
WHERE u.id IS NULL;

-- PASO 3: AUDITORÍA DE TABLA FAVORITES
-- =====================================================

SELECT 
    '❤️ AUDITORÍA TABLA FAVORITES' as seccion,
    '' as detalle;

-- Verificar políticas de favoritos
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'favorites'
ORDER BY policyname;

-- Verificar estructura de tabla favorites
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'favorites'
ORDER BY ordinal_position;

-- PASO 4: AUDITORÍA DE TABLA USER_RATINGS
-- =====================================================

SELECT 
    '⭐ AUDITORÍA TABLA USER_RATINGS' as seccion,
    '' as detalle;

-- Verificar si la tabla existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_ratings')
        THEN 'Tabla user_ratings existe'
        ELSE 'Tabla user_ratings NO EXISTE'
    END as table_status;

-- Si existe, verificar políticas
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_ratings'
ORDER BY policyname;

-- PASO 5: AUDITORÍA DE TABLA USER_SEARCHES
-- =====================================================

SELECT 
    '🔍 AUDITORÍA TABLA USER_SEARCHES' as seccion,
    '' as detalle;

-- Verificar si la tabla existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_searches')
        THEN 'Tabla user_searches existe'
        ELSE 'Tabla user_searches NO EXISTE'
    END as table_status;

-- Si existe, verificar políticas
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_searches'
ORDER BY policyname;

-- PASO 6: AUDITORÍA DE TABLA USER_MESSAGES
-- =====================================================

SELECT 
    '💬 AUDITORÍA TABLA USER_MESSAGES' as seccion,
    '' as detalle;

-- Verificar si la tabla existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'user_messages')
        THEN 'Tabla user_messages existe'
        ELSE 'Tabla user_messages NO EXISTE'
    END as table_status;

-- Si existe, verificar políticas
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'user_messages'
ORDER BY policyname;

-- PASO 7: AUDITORÍA DE TABLA PROPERTIES
-- =====================================================

SELECT 
    '🏠 AUDITORÍA TABLA PROPERTIES' as seccion,
    '' as detalle;

-- Verificar políticas de propiedades
SELECT 
    policyname,
    cmd as operation,
    qual as using_expression,
    with_check as with_check_expression
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'properties'
ORDER BY policyname;

-- Verificar estructura de propiedades
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'properties'
    AND column_name IN ('id', 'user_id', 'status', 'published', 'created_at')
ORDER BY ordinal_position;

-- PASO 8: AUDITORÍA DE STORAGE POLICIES
-- =====================================================

SELECT 
    '📁 AUDITORÍA STORAGE POLICIES' as seccion,
    '' as detalle;

-- Verificar buckets de storage
SELECT 
    name as bucket_name,
    public,
    created_at
FROM storage.buckets
ORDER BY name;

-- Verificar políticas de storage
SELECT 
    policyname,
    bucket_id,
    roles,
    cmd as operation
FROM storage.policies
ORDER BY bucket_id, policyname;

-- PASO 9: TESTING DE SEGURIDAD BÁSICO
-- =====================================================

SELECT 
    '🧪 TESTING DE SEGURIDAD BÁSICO' as seccion,
    '' as detalle;

-- Verificar que auth.uid() funciona correctamente
SELECT 
    'auth.uid() test' as test_name,
    CASE 
        WHEN auth.uid() IS NULL THEN 'No hay usuario autenticado (esperado en SQL Editor)'
        ELSE 'Usuario autenticado: ' || auth.uid()::text
    END as result;

-- Verificar funciones de autenticación disponibles
SELECT 
    'auth.role() test' as test_name,
    CASE 
        WHEN auth.role() IS NULL THEN 'No hay rol definido'
        ELSE 'Rol actual: ' || auth.role()
    END as result;

-- PASO 10: RECOMENDACIONES DE SEGURIDAD
-- =====================================================

SELECT 
    '💡 RECOMENDACIONES DE SEGURIDAD' as seccion,
    '' as detalle;

-- Verificar tablas sin RLS
SELECT 
    'Tablas sin RLS habilitado' as issue_type,
    tablename,
    'CRÍTICO: Habilitar RLS inmediatamente' as recommendation
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('User', 'properties', 'favorites', 'user_ratings', 'user_searches', 'user_messages', 'user_activity')
    AND rowsecurity = false;

-- Verificar tablas con RLS pero sin políticas
SELECT 
    'Tablas con RLS pero sin políticas' as issue_type,
    t.tablename,
    'CRÍTICO: Crear políticas RLS' as recommendation
FROM pg_tables t
WHERE t.schemaname = 'public' 
    AND t.tablename IN ('User', 'properties', 'favorites', 'user_ratings', 'user_searches', 'user_messages', 'user_activity')
    AND t.rowsecurity = true
    AND NOT EXISTS (
        SELECT 1 FROM pg_policies p 
        WHERE p.schemaname = t.schemaname AND p.tablename = t.tablename
    );

-- PASO 11: POLÍTICAS RLS RECOMENDADAS PARA TABLAS FALTANTES
-- =====================================================

SELECT 
    '🔧 POLÍTICAS RLS RECOMENDADAS' as seccion,
    'Ejecutar estas políticas si las tablas existen' as detalle;

-- Políticas para user_ratings (si existe)
/*
-- Habilitar RLS
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios pueden ver calificaciones que les hicieron
CREATE POLICY "users_can_view_own_ratings" ON public.user_ratings
    FOR SELECT USING (auth.uid()::text = rated_user_id);

-- Política para INSERT: usuarios autenticados pueden crear calificaciones
CREATE POLICY "authenticated_users_can_create_ratings" ON public.user_ratings
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid()::text = rater_user_id);

-- Política para UPDATE: usuarios pueden actualizar calificaciones que crearon
CREATE POLICY "users_can_update_own_ratings" ON public.user_ratings
    FOR UPDATE USING (auth.uid()::text = rater_user_id);
*/

-- Políticas para user_searches (si existe)
/*
-- Habilitar RLS
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios solo ven sus propias búsquedas
CREATE POLICY "users_can_view_own_searches" ON public.user_searches
    FOR SELECT USING (auth.uid()::text = user_id);

-- Política para INSERT: usuarios pueden crear sus propias búsquedas
CREATE POLICY "users_can_create_own_searches" ON public.user_searches
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- Política para DELETE: usuarios pueden eliminar sus propias búsquedas
CREATE POLICY "users_can_delete_own_searches" ON public.user_searches
    FOR DELETE USING (auth.uid()::text = user_id);
*/

-- Políticas para user_messages (si existe)
/*
-- Habilitar RLS
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios ven mensajes donde son sender o receiver
CREATE POLICY "users_can_view_own_messages" ON public.user_messages
    FOR SELECT USING (
        auth.uid()::text = sender_id OR 
        auth.uid()::text = receiver_id
    );

-- Política para INSERT: usuarios pueden enviar mensajes
CREATE POLICY "users_can_send_messages" ON public.user_messages
    FOR INSERT WITH CHECK (auth.uid()::text = sender_id);

-- Política para UPDATE: usuarios pueden marcar como leídos sus mensajes recibidos
CREATE POLICY "users_can_update_received_messages" ON public.user_messages
    FOR UPDATE USING (auth.uid()::text = receiver_id);
*/

-- Políticas para user_activity (si existe)
/*
-- Habilitar RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Política para SELECT: usuarios solo ven su propia actividad
CREATE POLICY "users_can_view_own_activity" ON public.user_activity
    FOR SELECT USING (auth.uid()::text = user_id);

-- Política para INSERT: sistema puede crear actividad para usuarios
CREATE POLICY "system_can_create_user_activity" ON public.user_activity
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);
*/

-- PASO 12: VERIFICACIÓN FINAL
-- =====================================================

SELECT 
    '✅ VERIFICACIÓN FINAL' as seccion,
    '' as detalle;

-- Resumen de seguridad por tabla
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COALESCE(p.policies_count, 0) as policies_count,
    CASE 
        WHEN t.rowsecurity = false THEN '❌ RLS DESHABILITADO'
        WHEN t.rowsecurity = true AND COALESCE(p.policies_count, 0) = 0 THEN '⚠️ RLS SIN POLÍTICAS'
        WHEN t.rowsecurity = true AND COALESCE(p.policies_count, 0) > 0 THEN '✅ RLS CONFIGURADO'
        ELSE '❓ ESTADO DESCONOCIDO'
    END as security_status
FROM pg_tables t
LEFT JOIN (
    SELECT 
        tablename, 
        COUNT(*) as policies_count 
    FROM pg_policies 
    WHERE schemaname = 'public' 
    GROUP BY tablename
) p ON t.tablename = p.tablename
WHERE t.schemaname = 'public' 
    AND t.tablename IN ('User', 'properties', 'favorites', 'user_ratings', 'user_searches', 'user_messages', 'user_activity')
ORDER BY t.tablename;

-- Conteo final de problemas de seguridad
SELECT 
    'RESUMEN DE SEGURIDAD' as categoria,
    COUNT(CASE WHEN rowsecurity = false THEN 1 END) as tablas_sin_rls,
    COUNT(CASE WHEN rowsecurity = true AND NOT EXISTS (
        SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public'
    ) THEN 1 END) as tablas_sin_policies,
    COUNT(CASE WHEN rowsecurity = true AND EXISTS (
        SELECT 1 FROM pg_policies p WHERE p.tablename = t.tablename AND p.schemaname = 'public'
    ) THEN 1 END) as tablas_seguras
FROM pg_tables t
WHERE schemaname = 'public' 
    AND tablename IN ('User', 'properties', 'favorites', 'user_ratings', 'user_searches', 'user_messages', 'user_activity');

-- =====================================================
-- FIN DE AUDITORÍA RLS
-- =====================================================

SELECT 
    '🎯 AUDITORÍA COMPLETADA' as resultado,
    'Revisar resultados y aplicar recomendaciones' as accion_requerida;
