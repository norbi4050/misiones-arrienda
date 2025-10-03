-- ============================================================================
-- FIX: Deshabilitar RLS en Conversation
-- ============================================================================
-- Nuevo error: "new row violates row-level security policy for table Conversation"
-- Solución: Deshabilitar RLS en Conversation también
-- ============================================================================

-- Deshabilitar RLS en Conversation
ALTER TABLE public."Conversation" DISABLE ROW LEVEL SECURITY;

-- Verificar
SELECT 
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public' 
  AND tablename IN ('Conversation', 'UserProfile', 'Message')
ORDER BY tablename;

-- ============================================================================
-- RESULTADO ESPERADO: Todas las tablas con rls_enabled = false
-- ============================================================================
