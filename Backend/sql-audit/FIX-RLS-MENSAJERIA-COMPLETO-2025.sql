-- ============================================================================
-- FIX COMPLETO: Deshabilitar RLS en todas las tablas de mensajería
-- ============================================================================
-- Problema: RLS habilitado sin políticas bloquea todo acceso
-- Solución: Deshabilitar RLS en UserProfile, Conversation y Message
-- ============================================================================

-- Deshabilitar RLS en las 3 tablas principales
ALTER TABLE public."UserProfile" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Conversation" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public."Message" DISABLE ROW LEVEL SECURITY;

-- Verificar que se deshabilitó en todas
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('UserProfile', 'Conversation', 'Message', 'User')
ORDER BY tablename;

-- ============================================================================
-- RESULTADO ESPERADO: Todas con rls_enabled = false
-- ============================================================================
-- | tablename    | rls_enabled |
-- |--------------|-------------|
-- | Conversation | false       |
-- | Message      | false       |
-- | User         | false       |
-- | UserProfile  | false       |
-- ============================================================================

-- ============================================================================
-- AHORA EL API DEBERÍA FUNCIONAR CORRECTAMENTE
-- ============================================================================
-- Prueba enviando un mensaje desde la UI
-- El error "new row violates row-level security policy" debería desaparecer
-- ============================================================================
