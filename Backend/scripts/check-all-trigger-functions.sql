-- =====================================================
-- VERIFICAR TODAS LAS FUNCIONES DE TRIGGERS
-- =====================================================

-- Ver el código completo de todas las funciones trigger
SELECT
  p.proname as function_name,
  pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'sync_user_metadata_to_public_users',
    'ensure_display_name',
    'init_notification_prefs'
  )
ORDER BY p.proname;
