-- Verificación RLS (Row Level Security) - Misiones Arrienda v1
-- Ejecutar con usuario normal (no service role) para validar políticas

-- ===========================================
-- PROPERTIES - Verificación RLS
-- ===========================================

-- 1. Usuario normal solo ve propiedades disponibles
SELECT
    COUNT(*) as total_properties,
    COUNT(CASE WHEN status = 'AVAILABLE' THEN 1 END) as available_properties,
    COUNT(CASE WHEN status != 'AVAILABLE' THEN 1 END) as non_available_properties
FROM public.properties;

-- Debe mostrar: non_available_properties = 0

-- 2. Usuario no puede ver propiedades de otros usuarios (borradores)
SELECT COUNT(*) as other_user_drafts
FROM public.properties
WHERE user_id != auth.uid() AND status != 'AVAILABLE';

-- Debe mostrar: 0

-- ===========================================
-- MESSAGES - Verificación RLS
-- ===========================================

-- 3. Usuario solo ve sus propios mensajes
SELECT
    COUNT(*) as total_messages,
    COUNT(CASE WHEN sender_id = auth.uid() OR receiver_id = auth.uid() THEN 1 END) as own_messages,
    COUNT(CASE WHEN sender_id != auth.uid() AND receiver_id != auth.uid() THEN 1 END) as other_messages
FROM public.messages;

-- Debe mostrar: other_messages = 0

-- ===========================================
-- PAYMENTS - Verificación RLS
-- ===========================================

-- 4. Usuario solo ve sus propios pagos
SELECT
    COUNT(*) as total_payments,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as own_payments,
    COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_payments
FROM public.payments;

-- Debe mostrar: other_payments = 0

-- ===========================================
-- USER CONSENT - Verificación RLS
-- ===========================================

-- 5. Usuario solo ve su propio consentimiento
SELECT
    COUNT(*) as total_consents,
    COUNT(CASE WHEN user_id = auth.uid() THEN 1 END) as own_consents,
    COUNT(CASE WHEN user_id != auth.uid() THEN 1 END) as other_consents
FROM public.user_consent;

-- Debe mostrar: other_consents = 0

-- ===========================================
-- ANALYTICS - Verificación RLS
-- ===========================================

-- 6. Usuario normal no puede leer analytics (solo insertar)
SELECT COUNT(*) as readable_analytics FROM public.analytics_events;
-- Debe fallar o mostrar 0 (dependiendo de política admin)

-- ===========================================
-- PRUEBAS DE INSERCIÓN (con auth.uid() simulado)
-- ===========================================

-- 7. Simular auth.uid() para pruebas
-- Nota: En producción auth.uid() viene de JWT, aquí simulamos

-- Prueba: Usuario puede insertar propiedad
-- INSERT INTO public.properties (title, user_id, status, ...)
-- VALUES ('Test Property', auth.uid(), 'DRAFT', ...);
-- Debe funcionar

-- Prueba: Usuario NO puede insertar propiedad para otro usuario
-- INSERT INTO public.properties (title, user_id, status, ...)
-- VALUES ('Test Property', 'other-user-id', 'DRAFT', ...);
-- Debe fallar por RLS

-- ===========================================
-- VERIFICACIÓN DE POLÍTICAS ACTIVAS
-- ===========================================

-- 8. Contar políticas activas por tabla
SELECT
    schemaname,
    tablename,
    COUNT(*) as active_policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Debe mostrar políticas para: properties, messages, payments, user_consent, analytics_events

-- ===========================================
-- PERFORMANCE DE RLS
-- ===========================================

-- 9. Verificar que índices están siendo usados
EXPLAIN ANALYZE
SELECT COUNT(*) FROM public.properties WHERE status = 'AVAILABLE';

-- Debe usar índices apropiados

-- 10. Verificar constraints de FK
SELECT
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name;

-- ===========================================
-- RESULTADOS ESPERADOS
-- ===========================================
/*
Resultados esperados para usuario normal (no admin):

1. Properties: non_available_properties = 0
2. Properties drafts: other_user_drafts = 0
3. Messages: other_messages = 0
4. Payments: other_payments = 0
5. Consent: other_consents = 0
6. Analytics: Error de permisos o 0 resultados
7. Insert: Solo puede insertar con su user_id
8. Policies: 5+ tablas con políticas activas
9. Performance: Uso de índices apropiados
10. FK: Constraints funcionando correctamente

Si todos pasan: ✅ RLS funcionando correctamente
*/
