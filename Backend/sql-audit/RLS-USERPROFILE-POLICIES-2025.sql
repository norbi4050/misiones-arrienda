-- sql-audit/RLS-USERPROFILE-POLICIES-2025.sql
-- PROMPT 3: RLS mínimo para UserProfile (asegura que cada usuario lea/cree su perfil)
-- Fecha: 2025-01-11
-- Propósito: Habilitar Row Level Security en la tabla UserProfile y crear políticas básicas

-- ============================================================================
-- PASO 1: Activar RLS en la tabla UserProfile
-- ============================================================================

ALTER TABLE public."UserProfile" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PASO 2: Política SELECT - Ver solo tu propia fila
-- ============================================================================

DROP POLICY IF EXISTS userprofile_select ON public."UserProfile";

CREATE POLICY userprofile_select
ON public."UserProfile"
FOR SELECT
USING ("userId" = auth.uid()::text);

-- ============================================================================
-- PASO 3: Política INSERT - Crear solo tu propia fila
-- ============================================================================

DROP POLICY IF EXISTS userprofile_insert ON public."UserProfile";

CREATE POLICY userprofile_insert
ON public."UserProfile"
FOR INSERT
WITH CHECK ("userId" = auth.uid()::text);

-- ============================================================================
-- PASO 4: Política UPDATE - Actualizar solo tu propia fila
-- ============================================================================

DROP POLICY IF EXISTS userprofile_update ON public."UserProfile";

CREATE POLICY userprofile_update
ON public."UserProfile"
FOR UPDATE
USING ("userId" = auth.uid()::text);

-- ============================================================================
-- VERIFICACIÓN: Consultar políticas creadas
-- ============================================================================

-- Para verificar que las políticas se crearon correctamente, ejecutar:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'UserProfile';

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================

-- 1. Estas políticas aseguran que:
--    - Cada usuario solo puede ver su propio perfil (SELECT)
--    - Cada usuario solo puede crear su propio perfil (INSERT)
--    - Cada usuario solo puede actualizar su propio perfil (UPDATE)
--
-- 2. No se incluye política DELETE porque los perfiles no deberían eliminarse
--    directamente. Si se necesita, agregar:
--    
--    DROP POLICY IF EXISTS userprofile_delete ON public."UserProfile";
--    CREATE POLICY userprofile_delete
--    ON public."UserProfile"
--    FOR DELETE
--    USING ("userId" = auth.uid()::text);
--
-- 3. Si necesitas que otros usuarios puedan ver perfiles públicos (ej. para
--    la funcionalidad de comunidad), modifica la política SELECT:
--
--    DROP POLICY IF EXISTS userprofile_select ON public."UserProfile";
--    CREATE POLICY userprofile_select
--    ON public."UserProfile"
--    FOR SELECT
--    USING (
--      "userId" = auth.uid()::text OR  -- Tu propio perfil
--      "acceptsMessages" = true         -- O perfiles públicos
--    );
--
-- 4. Para permitir que administradores accedan a todos los perfiles, agregar:
--
--    CREATE POLICY userprofile_admin_all
--    ON public."UserProfile"
--    FOR ALL
--    USING (
--      EXISTS (
--        SELECT 1 FROM public."User"
--        WHERE id = auth.uid()::text AND "userType" = 'admin'
--      )
--    );

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
