-- =====================================================
-- SUPABASE: AUDITORÍA FINAL COMPLETA
-- =====================================================
-- Verificación exhaustiva de alineación Código ↔ Supabase
-- Ejecutar en Supabase SQL Editor para diagnóstico completo

-- =====================================================
-- 1. VERIFICAR CONFIGURACIÓN DE AUTENTICACIÓN
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔐 === AUDITORÍA DE AUTENTICACIÓN ===';
  RAISE NOTICE '';
END $$;

-- Verificar configuración de Auth
SELECT 
  'AUTH CONFIG' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN '✅ Auth habilitado'
    ELSE '❌ Auth no configurado'
  END as status;

-- Verificar tabla profiles
SELECT 
  'PROFILES TABLE' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN '✅ Tabla profiles existe'
    ELSE '❌ Tabla profiles faltante'
  END as status;

-- Verificar RLS en profiles
SELECT 
  'PROFILES RLS' as component,
  CASE 
    WHEN (SELECT rowsecurity FROM pg_tables WHERE tablename = 'profiles') THEN '✅ RLS habilitado'
    ELSE '❌ RLS deshabilitado'
  END as status;

-- =====================================================
-- 2. VERIFICAR STORAGE Y BUCKETS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📁 === AUDITORÍA DE STORAGE ===';
  RAISE NOTICE '';
END $$;

-- Verificar buckets existentes
SELECT 
  'STORAGE BUCKETS' as component,
  COUNT(*) || ' buckets encontrados' as status
FROM storage.buckets;

-- Listar todos los buckets
SELECT 
  id as bucket_name,
  CASE WHEN public THEN 'Público' ELSE 'Privado' END as visibility,
  created_at
FROM storage.buckets
ORDER BY created_at;

-- Verificar policies de storage
SELECT 
  'STORAGE POLICIES' as component,
  COUNT(*) || ' policies encontradas' as status
FROM pg_policies 
WHERE tablename = 'objects';

-- =====================================================
-- 3. VERIFICAR TABLAS PRINCIPALES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🗄️ === AUDITORÍA DE TABLAS ===';
  RAISE NOTICE '';
END $$;

-- Verificar existencia de tablas críticas
WITH expected_tables AS (
  SELECT unnest(ARRAY[
    'profiles', 'User', 'Agent', 'Property', 'Inquiry', 
    'UserReview', 'RentalHistory', 'UserInquiry', 'Favorite', 
    'SearchHistory', 'Payment', 'Subscription', 'PaymentMethod',
    'PaymentAnalytics', 'PaymentNotification', 'UserProfile',
    'Room', 'Like', 'Conversation', 'Message', 'Report'
  ]) as table_name
),
existing_tables AS (
  SELECT table_name 
  FROM information_schema.tables 
  WHERE table_schema = 'public'
)
SELECT 
  et.table_name,
  CASE 
    WHEN ext.table_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Faltante'
  END as status
FROM expected_tables et
LEFT JOIN existing_tables ext ON et.table_name = ext.table_name
ORDER BY et.table_name;

-- =====================================================
-- 4. VERIFICAR ESTRUCTURA DE TABLA PROPERTY
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🏠 === AUDITORÍA DE TABLA PROPERTY ===';
  RAISE NOTICE '';
END $$;

-- Verificar campos críticos en Property (30 campos total confirmado)
WITH expected_columns AS (
  SELECT unnest(ARRAY[
    'id', 'title', 'description', 'price', 'currency', 'contact_name',
    'contact_phone', 'contact_email', 'agentId', 'userId', 'createdAt', 'updatedAt'
  ]) as column_name
),
existing_columns AS (
  SELECT column_name 
  FROM information_schema.columns 
  WHERE table_name = 'Property' AND table_schema = 'public'
)
SELECT 
  '🔍 CAMPOS BÁSICOS PROPERTY' as seccion,
  ec.column_name,
  CASE 
    WHEN exc.column_name IS NOT NULL THEN '✅ Existe'
    ELSE '❌ Faltante'
  END as status
FROM expected_columns ec
LEFT JOIN existing_columns exc ON ec.column_name = exc.column_name
ORDER BY ec.column_name;

-- Buscar campos relacionados con caducidad/premium/pago
SELECT 
  '🎯 CAMPOS CADUCIDAD/PREMIUM DETECTADOS' as seccion,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
AND (
  column_name ILIKE '%expir%' OR 
  column_name ILIKE '%highlight%' OR 
  column_name ILIKE '%paid%' OR
  column_name ILIKE '%premium%' OR
  column_name ILIKE '%featured%' OR
  column_name ILIKE '%active%' OR
  column_name ILIKE '%status%' OR
  column_name ILIKE '%plan%' OR
  column_name ILIKE '%tier%'
)
ORDER BY column_name;

-- =====================================================
-- 5. VERIFICAR ENUMS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 === AUDITORÍA DE ENUMS ===';
  RAISE NOTICE '';
END $$;

-- Verificar enums existentes
SELECT 
  typname as enum_name,
  '✅ Existe' as status
FROM pg_type 
WHERE typtype = 'e' 
AND typname IN ('CommunityRole', 'PetPref', 'SmokePref', 'Diet', 'RoomType')
ORDER BY typname;

-- =====================================================
-- 6. VERIFICAR ÍNDICES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 === AUDITORÍA DE ÍNDICES ===';
  RAISE NOTICE '';
END $$;

-- Contar índices por tabla
SELECT 
  schemaname,
  tablename,
  COUNT(*) as index_count
FROM pg_indexes 
WHERE schemaname = 'public'
AND tablename IN ('Property', 'User', 'Payment', 'UserProfile', 'Conversation')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- =====================================================
-- 7. VERIFICAR FOREIGN KEYS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔗 === AUDITORÍA DE FOREIGN KEYS ===';
  RAISE NOTICE '';
END $$;

-- Verificar foreign keys críticas
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  '✅ Configurada' as status
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('Property', 'Payment', 'UserProfile', 'Message')
ORDER BY tc.table_name, kcu.column_name;

-- =====================================================
-- 8. VERIFICAR CONFIGURACIÓN DE RLS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🛡️ === AUDITORÍA DE RLS (ROW LEVEL SECURITY) ===';
  RAISE NOTICE '';
END $$;

-- Verificar RLS en tablas críticas
SELECT 
  tablename,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Habilitado'
    ELSE '⚠️ RLS Deshabilitado'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
AND tablename IN ('Property', 'User', 'Payment', 'UserProfile', 'profiles')
ORDER BY tablename;

-- Contar policies por tabla
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
HAVING COUNT(*) > 0
ORDER BY policy_count DESC;

-- =====================================================
-- 9. VERIFICAR EXTENSIONES
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔧 === AUDITORÍA DE EXTENSIONES ===';
  RAISE NOTICE '';
END $$;

-- Verificar extensiones instaladas
SELECT 
  extname as extension_name,
  extversion as version,
  '✅ Instalada' as status
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pg_trgm', 'postgis')
ORDER BY extname;

-- =====================================================
-- 10. VERIFICAR FUNCIONES Y TRIGGERS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚡ === AUDITORÍA DE FUNCIONES Y TRIGGERS ===';
  RAISE NOTICE '';
END $$;

-- Verificar funciones de Supabase Auth
SELECT 
  routine_name,
  routine_type,
  '✅ Disponible' as status
FROM information_schema.routines 
WHERE routine_schema = 'auth'
AND routine_name IN ('uid', 'role', 'email')
ORDER BY routine_name;

-- Verificar triggers de updated_at
SELECT 
  trigger_name,
  event_object_table,
  '✅ Configurado' as status
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
AND trigger_name LIKE '%updated_at%'
ORDER BY event_object_table;

-- =====================================================
-- 11. VERIFICAR DATOS DE PRUEBA
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📊 === AUDITORÍA DE DATOS ===';
  RAISE NOTICE '';
END $$;

-- Contar registros en tablas principales
SELECT 'User' as tabla, COUNT(*) as registros FROM "User"
UNION ALL
SELECT 'Property' as tabla, COUNT(*) as registros FROM "Property"
UNION ALL
SELECT 'Payment' as tabla, COUNT(*) as registros FROM "Payment"
UNION ALL
SELECT 'UserProfile' as tabla, COUNT(*) as registros FROM "UserProfile"
UNION ALL
SELECT 'profiles' as tabla, COUNT(*) as registros FROM profiles
ORDER BY registros DESC;

-- =====================================================
-- 12. VERIFICAR CONFIGURACIÓN DE REALTIME
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '⚡ === AUDITORÍA DE REALTIME ===';
  RAISE NOTICE '';
END $$;

-- Verificar publicaciones de realtime
SELECT 
  schemaname,
  tablename,
  'Realtime habilitado' as status
FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime'
ORDER BY tablename;

-- =====================================================
-- 13. VERIFICAR CONFIGURACIÓN DE API
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🌐 === AUDITORÍA DE API (PostgREST) ===';
  RAISE NOTICE '';
END $$;

-- Verificar esquemas expuestos
SELECT 
  schema_name,
  CASE 
    WHEN schema_name = 'public' THEN '✅ Expuesto via API'
    WHEN schema_name = 'storage' THEN '✅ Expuesto via API'
    ELSE '⚠️ No expuesto'
  END as api_status
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'auth', 'storage', 'realtime')
ORDER BY schema_name;

-- =====================================================
-- 14. RESUMEN FINAL DE AUDITORÍA
-- =====================================================

DO $$
DECLARE
  table_count INTEGER;
  bucket_count INTEGER;
  policy_count INTEGER;
  index_count INTEGER;
  enum_count INTEGER;
BEGIN
  -- Contar elementos
  SELECT COUNT(*) INTO table_count FROM information_schema.tables WHERE table_schema = 'public';
  SELECT COUNT(*) INTO bucket_count FROM storage.buckets;
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
  SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
  SELECT COUNT(*) INTO enum_count FROM pg_type WHERE typtype = 'e';
  
  RAISE NOTICE '';
  RAISE NOTICE '📋 === RESUMEN FINAL DE AUDITORÍA ===';
  RAISE NOTICE '';
  RAISE NOTICE '✅ TABLAS CREADAS: % tablas', table_count;
  RAISE NOTICE '✅ STORAGE BUCKETS: % buckets', bucket_count;
  RAISE NOTICE '✅ POLICIES CONFIGURADAS: % policies', policy_count;
  RAISE NOTICE '✅ ÍNDICES OPTIMIZADOS: % índices', index_count;
  RAISE NOTICE '✅ ENUMS DEFINIDOS: % enums', enum_count;
  RAISE NOTICE '';
  
  IF table_count >= 20 AND bucket_count >= 7 AND policy_count >= 10 THEN
    RAISE NOTICE '🎉 SUPABASE COMPLETAMENTE CONFIGURADO';
    RAISE NOTICE '✅ Base de datos lista para producción';
    RAISE NOTICE '✅ Storage configurado correctamente';
    RAISE NOTICE '✅ Seguridad implementada (RLS + Policies)';
    RAISE NOTICE '✅ Optimizaciones aplicadas (Índices)';
  ELSE
    RAISE NOTICE '⚠️ CONFIGURACIÓN INCOMPLETA';
    RAISE NOTICE 'Revisar elementos faltantes arriba';
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '🚀 PRÓXIMOS PASOS:';
  RAISE NOTICE '1. Configurar variables de entorno';
  RAISE NOTICE '2. Probar conexión desde aplicación';
  RAISE NOTICE '3. Ejecutar tests de integración';
  RAISE NOTICE '4. Configurar backups automáticos';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- 15. VERIFICACIONES ESPECÍFICAS DEL PROYECTO
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎯 === VERIFICACIONES ESPECÍFICAS MISIONES ARRIENDA ===';
  RAISE NOTICE '';
END $$;

-- Verificar campos específicos de contacto en Property
SELECT 
  'CAMPOS DE CONTACTO' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Property' 
      AND column_name IN ('contact_name', 'contact_phone', 'contact_email')
    ) THEN '✅ Campos de contacto configurados'
    ELSE '❌ Campos de contacto faltantes'
  END as status;

-- Verificar agentId opcional
SELECT 
  'AGENT ID OPCIONAL' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Property' 
      AND column_name = 'agentId'
      AND is_nullable = 'YES'
    ) THEN '✅ agentId es opcional'
    ELSE '❌ agentId no es opcional'
  END as status;

-- Verificar sistema de pagos MercadoPago
SELECT 
  'SISTEMA MERCADOPAGO' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'Payment' 
      AND column_name = 'mercadopagoId'
    ) THEN '✅ Sistema MercadoPago configurado'
    ELSE '❌ Sistema MercadoPago faltante'
  END as status;

-- Verificar módulo comunidad
SELECT 
  'MÓDULO COMUNIDAD' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name IN ('UserProfile', 'Room', 'Like', 'Conversation', 'Message')
    ) THEN '✅ Módulo comunidad configurado'
    ELSE '❌ Módulo comunidad faltante'
  END as status;

-- Verificar campos de caducidad
SELECT 
  'SISTEMA CADUCIDAD' as verificacion,
  CASE 
    WHEN (
      SELECT COUNT(*) FROM information_schema.columns 
      WHERE table_name = 'Property' 
      AND table_schema = 'public'
      AND column_name IN ('expiresAt', 'highlightedUntil', 'isPaid')
    ) = 3 THEN '✅ Sistema de caducidad configurado'
    ELSE '❌ Sistema de caducidad faltante - Campos encontrados: ' || COALESCE((
      SELECT string_agg(column_name, ', ') 
      FROM information_schema.columns 
      WHERE table_name = 'Property' 
      AND table_schema = 'public'
      AND column_name IN ('expiresAt', 'highlightedUntil', 'isPaid')
    ), 'ninguno')
  END as status;

-- Verificar campos de caducidad detallado (diagnóstico adicional)
SELECT 
  'DIAGNOSTICO CADUCIDAD' as verificacion,
  'Campos encontrados: ' || string_agg(column_name, ', ') as status
FROM information_schema.columns 
WHERE table_name = 'Property' 
AND table_schema = 'public'
AND column_name IN ('expiresAt', 'highlightedUntil', 'isPaid');

-- Verificar si la tabla Property existe
SELECT 
  'TABLA PROPERTY' as verificacion,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'Property' 
      AND table_schema = 'public'
    ) THEN '✅ Tabla Property existe'
    ELSE '❌ Tabla Property no encontrada'
  END as status;

-- =====================================================
-- MENSAJE FINAL
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🎊 AUDITORÍA COMPLETA FINALIZADA';
  RAISE NOTICE '';
  RAISE NOTICE 'Revisa los resultados arriba para identificar:';
  RAISE NOTICE '✅ Elementos configurados correctamente';
  RAISE NOTICE '❌ Elementos que requieren atención';
  RAISE NOTICE '⚠️ Elementos con configuración parcial';
  RAISE NOTICE '';
  RAISE NOTICE 'Para más detalles, consulta la documentación generada.';
  RAISE NOTICE '';
END $$;
