-- ============================================
-- PROMPT C — Crear RPC genérica para el conteo
-- ============================================
-- Ejecutar en Supabase SQL Editor
-- Simplifica la estrategia 1 del endpoint unread-count

-- Crear función RPC para contar mensajes no leídos
create or replace function public.get_unread_messages_count(p_uid uuid)
returns integer
language sql
security definer
as $$
  select count(*)::integer
  from public.messages
  where recipient_id = p_uid
    and read_at is null;
$$;

-- Otorgar permisos a usuarios autenticados
grant execute on function public.get_unread_messages_count(uuid) to authenticated;

-- Verificar que la función se creó correctamente
-- SELECT public.get_unread_messages_count('your-user-uuid-here');

-- ============================================
-- INSTRUCCIONES DE EJECUCIÓN
-- ============================================
-- 1. Ir a Supabase Dashboard > SQL Editor
-- 2. Ejecutar este script completo
-- 3. Verificar que no hay errores
-- 4. Probar la función con un UUID válido de usuario
-- 5. El endpoint unread-count ahora usará esta función en la estrategia 1

-- ============================================
-- NOTAS
-- ============================================
-- - security definer: ejecuta con permisos del creador (service role)
-- - authenticated: solo usuarios logueados pueden ejecutar
-- - Retorna integer para compatibilidad con el endpoint
-- - Maneja nulls automáticamente con count(*)
