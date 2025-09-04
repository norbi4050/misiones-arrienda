-- ============================================================================
-- 🚨 SOLUCIÓN CRÍTICA: POLÍTICAS RLS PARA COMMUNITY_PROFILES
-- ============================================================================
-- Proyecto: Misiones Arrienda
-- Fecha: 04 de Enero de 2025
-- Propósito: Implementar políticas RLS faltantes para community_profiles
-- Estado: CRÍTICO - Sin estas políticas, el módulo de comunidad no funciona
-- ============================================================================

-- 📋 VERIFICACIÓN PREVIA
-- ============================================================================
-- Verificar que la tabla existe y tiene RLS habilitado
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_habilitado,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'community_profiles') as politicas_actuales
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'community_profiles';

-- 🔧 IMPLEMENTACIÓN DE POLÍTICAS CRÍTICAS
-- ============================================================================

-- POLÍTICA 1: Lectura pública para todos los usuarios
-- Permite que cualquier usuario vea los perfiles de comunidad
CREATE POLICY "Enable read access for all users" ON "public"."community_profiles"
AS PERMISSIVE FOR SELECT
TO public
USING (true);

-- POLÍTICA 2: Inserción para usuarios autenticados
-- Permite que usuarios autenticados creen su perfil de comunidad
CREATE POLICY "Enable insert for authenticated users" ON "public"."community_profiles"
AS PERMISSIVE FOR INSERT
TO public
WITH CHECK (auth.role() = 'authenticated'::text);

-- POLÍTICA 3: Actualización del propio perfil
-- Permite que usuarios actualicen solo su propio perfil de comunidad
CREATE POLICY "Users can update own community profile" ON "public"."community_profiles"
AS PERMISSIVE FOR UPDATE
TO public
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- POLÍTICA 4: Eliminación del propio perfil
-- Permite que usuarios eliminen solo su propio perfil de comunidad
CREATE POLICY "Users can delete own community profile" ON "public"."community_profiles"
AS PERMISSIVE FOR DELETE
TO public
USING (auth.uid() = user_id);

-- 📊 VERIFICACIÓN POST-IMPLEMENTACIÓN
-- ============================================================================
-- Verificar que las políticas se crearon correctamente
SELECT 
    'VERIFICACION_POST_IMPLEMENTACION' as seccion,
    schemaname || '.' || tablename as tabla,
    policyname as nombre_politica,
    cmd as comando,
    COALESCE(roles::text, 'public') as rol,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        ELSE 'Sin restricción USING'
    END as expresion_using,
    CASE 
        WHEN with_check IS NOT NULL THEN 'CHECK: ' || with_check
        ELSE 'Sin restricción CHECK'
    END as expresion_check
FROM pg_policies 
WHERE schemaname = 'public' 
    AND tablename = 'community_profiles'
ORDER BY policyname;

-- 🎯 RESUMEN DE POLÍTICAS IMPLEMENTADAS
-- ============================================================================
SELECT 
    'RESUMEN_FINAL' as seccion,
    COUNT(*) as total_politicas_community_profiles,
    'Políticas implementadas correctamente' as estado
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'community_profiles';

-- ============================================================================
-- 📝 NOTAS IMPORTANTES
-- ============================================================================
/*
POLÍTICAS IMPLEMENTADAS:

1. "Enable read access for all users" (SELECT)
   - Permite lectura pública de todos los perfiles de comunidad
   - Necesario para mostrar perfiles en la interfaz

2. "Enable insert for authenticated users" (INSERT)
   - Solo usuarios autenticados pueden crear perfiles
   - Previene spam y registros no autorizados

3. "Users can update own community profile" (UPDATE)
   - Los usuarios solo pueden actualizar su propio perfil
   - Seguridad: auth.uid() = user_id

4. "Users can delete own community profile" (DELETE)
   - Los usuarios solo pueden eliminar su propio perfil
   - Seguridad: auth.uid() = user_id

RESULTADO ESPERADO:
- Módulo de comunidad funcionará correctamente
- Los usuarios podrán crear, ver, actualizar y eliminar sus perfiles
- Seguridad mantenida con restricciones apropiadas
*/

-- ============================================================================
-- 🚀 TESTING BÁSICO (OPCIONAL)
-- ============================================================================
-- Estas consultas pueden ejecutarse para verificar el funcionamiento
-- (Comentadas para evitar errores si no hay datos)

/*
-- Test 1: Verificar que se puede leer (debería funcionar)
-- SELECT COUNT(*) FROM community_profiles;

-- Test 2: Verificar estructura de la tabla
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'community_profiles' AND table_schema = 'public';
*/

-- ============================================================================
-- ✅ IMPLEMENTACIÓN COMPLETADA
-- ============================================================================
SELECT 
    'IMPLEMENTACION_COMPLETADA' as resultado,
    NOW() as timestamp_implementacion,
    'Políticas RLS para community_profiles implementadas exitosamente' as mensaje;
