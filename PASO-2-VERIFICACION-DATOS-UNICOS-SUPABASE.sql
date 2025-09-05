-- =====================================================
-- PASO 2: VERIFICACIÓN DE DATOS ÚNICOS - SUPABASE
-- =====================================================
-- Fecha: 2025-09-05T15:33:18.805Z
-- Propósito: Verificar datos únicos antes de limpieza
-- CRÍTICO: Ejecutar DESPUÉS del PASO 1 (backup)
-- =====================================================

-- Mensaje de inicio
SELECT 'INICIANDO VERIFICACIÓN DE DATOS ÚNICOS - 2025-09-05T15:33:18.805Z' as inicio;

-- =====================================================
-- VERIFICAR EXISTENCIA DE TABLAS DUPLICADAS
-- =====================================================

-- Verificar qué tablas duplicadas existen
SELECT 
    'TABLAS DUPLICADAS ENCONTRADAS' as seccion,
    table_name,
    CASE 
        WHEN table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages') 
        THEN 'DUPLICADA - CANDIDATA PARA ELIMINACIÓN'
        ELSE 'TABLA PRINCIPAL - MANTENER'
    END as estado
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        'User', 'users',
        'Property', 'properties', 
        'Agent', 'agents',
        'Favorite', 'favorites',
        'Conversation', 'conversations',
        'Message', 'messages',
        'CommunityProfile'
    )
ORDER BY table_name;

-- =====================================================
-- CONTAR REGISTROS EN TABLAS PRINCIPALES
-- =====================================================

-- Contar registros en tablas principales (PascalCase)
SELECT 'CONTEO TABLAS PRINCIPALES' as seccion;

-- User
SELECT 'User' as tabla, COUNT(*) as registros 
FROM public."User"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public');

-- Property  
SELECT 'Property' as tabla, COUNT(*) as registros 
FROM public."Property"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Property' AND table_schema = 'public');

-- Agent
SELECT 'Agent' as tabla, COUNT(*) as registros 
FROM public."Agent"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Agent' AND table_schema = 'public');

-- Favorite
SELECT 'Favorite' as tabla, COUNT(*) as registros 
FROM public."Favorite"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Favorite' AND table_schema = 'public');

-- Conversation
SELECT 'Conversation' as tabla, COUNT(*) as registros 
FROM public."Conversation"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Conversation' AND table_schema = 'public');

-- Message
SELECT 'Message' as tabla, COUNT(*) as registros 
FROM public."Message"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Message' AND table_schema = 'public');

-- CommunityProfile
SELECT 'CommunityProfile' as tabla, COUNT(*) as registros 
FROM public."CommunityProfile"
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'CommunityProfile' AND table_schema = 'public');

-- =====================================================
-- CONTAR REGISTROS EN TABLAS DUPLICADAS
-- =====================================================

-- Contar registros en tablas duplicadas (snake_case) - SI EXISTEN
SELECT 'CONTEO TABLAS DUPLICADAS' as seccion;

-- users (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla users encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.users);
    ELSE
        RAISE NOTICE 'Tabla users NO existe - OK';
    END IF;
END $$;

-- properties (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla properties encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.properties);
    ELSE
        RAISE NOTICE 'Tabla properties NO existe - OK';
    END IF;
END $$;

-- agents (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agents' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla agents encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.agents);
    ELSE
        RAISE NOTICE 'Tabla agents NO existe - OK';
    END IF;
END $$;

-- favorites (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'favorites' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla favorites encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.favorites);
    ELSE
        RAISE NOTICE 'Tabla favorites NO existe - OK';
    END IF;
END $$;

-- conversations (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'conversations' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla conversations encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.conversations);
    ELSE
        RAISE NOTICE 'Tabla conversations NO existe - OK';
    END IF;
END $$;

-- messages (si existe)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'messages' AND table_schema = 'public') THEN
        RAISE NOTICE 'Tabla messages encontrada - Contando registros...';
        PERFORM (SELECT COUNT(*) FROM public.messages);
    ELSE
        RAISE NOTICE 'Tabla messages NO existe - OK';
    END IF;
END $$;

-- =====================================================
-- VERIFICAR DATOS ÚNICOS EN TABLAS DUPLICADAS
-- =====================================================

-- CRÍTICO: Verificar si hay datos únicos en tablas duplicadas
SELECT 'VERIFICACIÓN DATOS ÚNICOS' as seccion;

-- Verificar users vs User (si users existe)
DO $$
DECLARE
    users_count INTEGER := 0;
    user_count INTEGER := 0;
    unique_in_users INTEGER := 0;
BEGIN
    -- Solo si ambas tablas existen
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users' AND table_schema = 'public') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'User' AND table_schema = 'public') THEN
        
        SELECT COUNT(*) INTO users_count FROM public.users;
        SELECT COUNT(*) INTO user_count FROM public."User";
        
        -- Verificar datos únicos en users que no estén en User
        SELECT COUNT(*) INTO unique_in_users 
        FROM public.users u 
        WHERE NOT EXISTS (
            SELECT 1 FROM public."User" pu 
            WHERE pu.email = u.email OR pu.id = u.id
        );
        
        RAISE NOTICE 'TABLA users: % registros, User: % registros, Únicos en users: %', 
                     users_count, user_count, unique_in_users;
        
        IF unique_in_users > 0 THEN
            RAISE WARNING 'ATENCIÓN: % registros únicos encontrados en tabla users', unique_in_users;
        END IF;
    END IF;
END $$;

-- Verificar properties vs Property (si properties existe)
DO $$
DECLARE
    properties_count INTEGER := 0;
    property_count INTEGER := 0;
    unique_in_properties INTEGER := 0;
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'properties' AND table_schema = 'public') 
       AND EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'Property' AND table_schema = 'public') THEN
        
        SELECT COUNT(*) INTO properties_count FROM public.properties;
        SELECT COUNT(*) INTO property_count FROM public."Property";
        
        -- Verificar datos únicos en properties
        SELECT COUNT(*) INTO unique_in_properties 
        FROM public.properties p 
        WHERE NOT EXISTS (
            SELECT 1 FROM public."Property" pp 
            WHERE pp.title = p.title OR pp.id = p.id
        );
        
        RAISE NOTICE 'TABLA properties: % registros, Property: % registros, Únicos en properties: %', 
                     properties_count, property_count, unique_in_properties;
        
        IF unique_in_properties > 0 THEN
            RAISE WARNING 'ATENCIÓN: % registros únicos encontrados en tabla properties', unique_in_properties;
        END IF;
    END IF;
END $$;

-- =====================================================
-- VERIFICAR INTEGRIDAD REFERENCIAL
-- =====================================================

-- Verificar foreign keys que podrían verse afectados
SELECT 'VERIFICACIÓN FOREIGN KEYS' as seccion;

SELECT 
    tc.table_name,
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
    AND (tc.table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages')
         OR ccu.table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages'));

-- =====================================================
-- VERIFICAR POLÍTICAS RLS
-- =====================================================

-- Verificar políticas RLS en tablas duplicadas
SELECT 'VERIFICACIÓN POLÍTICAS RLS' as seccion;

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
    AND tablename IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages')
ORDER BY tablename, policyname;

-- =====================================================
-- RESUMEN DE VERIFICACIÓN
-- =====================================================

SELECT 'RESUMEN DE VERIFICACIÓN COMPLETADO' as seccion;

-- Contar total de tablas duplicadas encontradas
SELECT 
    'RESUMEN FINAL' as tipo,
    COUNT(*) as tablas_duplicadas_encontradas
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('users', 'properties', 'agents', 'favorites', 'conversations', 'messages');

-- Mensaje de finalización
SELECT 'VERIFICACIÓN COMPLETADA - 2025-09-05T15:33:18.805Z' as finalizacion;

-- =====================================================
-- INSTRUCCIONES SIGUIENTES
-- =====================================================

SELECT 'PRÓXIMOS PASOS:' as instrucciones;
SELECT '1. Revisar este reporte cuidadosamente' as paso_1;
SELECT '2. Si hay datos únicos, migrarlos antes de limpieza' as paso_2;
SELECT '3. Si no hay datos únicos, proceder con PASO 3' as paso_3;
SELECT '4. NUNCA proceder sin verificar este reporte' as paso_4;
