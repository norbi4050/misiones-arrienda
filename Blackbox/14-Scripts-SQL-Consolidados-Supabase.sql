-- =====================================================
-- 14. SCRIPTS SQL CONSOLIDADOS PARA SUPABASE
-- =====================================================
-- Fecha: 9 de Enero 2025
-- Basado en: Documento 13 - Plan Paso a Paso Corrección Supabase
-- Objetivo: Script SQL unificado para configurar Supabase completamente

-- =====================================================
-- INSTRUCCIONES DE USO:
-- 1. Abrir Supabase Dashboard > SQL Editor
-- 2. Ejecutar cada sección paso a paso
-- 3. Verificar resultados después de cada sección
-- =====================================================

-- =====================================================
-- SECCIÓN 1: EXTENSIONES Y CONFIGURACIÓN INICIAL
-- =====================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Verificar extensiones instaladas
SELECT extname, extversion FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- =====================================================
-- SECCIÓN 2: CREACIÓN DE TABLAS PRINCIPALES
-- =====================================================

-- Tabla profiles (vinculada a auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla properties (tabla principal del negocio)
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'ARS',
    old_price DECIMAL(12,2),
    bedrooms INTEGER NOT NULL,
    bathrooms INTEGER NOT NULL,
    garages INTEGER DEFAULT 0,
    area DECIMAL(8,2) NOT NULL,
    lot_area DECIMAL(8,2),
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    province TEXT NOT NULL,
    postal_code TEXT NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    property_type TEXT NOT NULL CHECK (property_type IN ('APARTMENT', 'HOUSE', 'COMMERCIAL', 'LAND', 'OFFICE', 'WAREHOUSE', 'PH', 'STUDIO')),
    status TEXT DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RENTED', 'SOLD', 'MAINTENANCE', 'RESERVED', 'EXPIRED')),
    images JSONB DEFAULT '[]',
    virtual_tour_url TEXT,
    amenities JSONB DEFAULT '[]',
    features JSONB DEFAULT '[]',
    year_built INTEGER,
    floor INTEGER,
    total_floors INTEGER,
    featured BOOLEAN DEFAULT FALSE,
    contact_name TEXT,
    contact_phone TEXT NOT NULL,
    contact_email TEXT,
    expires_at TIMESTAMPTZ,
    highlighted_until TIMESTAMPTZ,
    is_paid BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL
);

-- Tabla favorites
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Tabla search_history
CREATE TABLE IF NOT EXISTS public.search_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    search_term TEXT NOT NULL,
    filters JSONB,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verificar tablas creadas
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;

-- =====================================================
-- SECCIÓN 3: CREACIÓN DE ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para properties
CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_province ON public.properties(province);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_featured ON public.properties(featured);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at);

-- Índices para favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property_id ON public.favorites(property_id);

-- Índices para search_history
CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON public.search_history(user_id, created_at);

-- Verificar índices creados
SELECT indexname, tablename FROM pg_indexes WHERE schemaname = 'public' AND indexname LIKE 'idx_%' ORDER BY tablename, indexname;

-- =====================================================
-- SECCIÓN 4: HABILITAR ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS en todas las tablas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;

-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- =====================================================
-- SECCIÓN 5: POLÍTICAS RLS PARA TABLA PROFILES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Crear políticas para profiles
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- SECCIÓN 6: POLÍTICAS RLS PARA TABLA PROPERTIES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Anyone can view properties" ON public.properties;
DROP POLICY IF EXISTS "Users can insert own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can update own properties" ON public.properties;
DROP POLICY IF EXISTS "Users can delete own properties" ON public.properties;

-- Crear políticas para properties
CREATE POLICY "Anyone can view properties" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON public.properties
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SECCIÓN 7: POLÍTICAS RLS PARA TABLA FAVORITES
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can insert own favorites" ON public.favorites;
DROP POLICY IF EXISTS "Users can delete own favorites" ON public.favorites;

-- Crear políticas para favorites
CREATE POLICY "Users can view own favorites" ON public.favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.favorites
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- SECCIÓN 8: POLÍTICAS RLS PARA TABLA SEARCH_HISTORY
-- =====================================================

-- Eliminar políticas existentes si existen
DROP POLICY IF EXISTS "Users can view own search history" ON public.search_history;
DROP POLICY IF EXISTS "Users can insert own search history" ON public.search_history;

-- Crear políticas para search_history
CREATE POLICY "Users can view own search history" ON public.search_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON public.search_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Verificar políticas creadas
SELECT schemaname, tablename, policyname, permissive, roles, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
ORDER BY tablename, policyname;

-- =====================================================
-- SECCIÓN 9: CONFIGURAR STORAGE - CREAR BUCKETS
-- =====================================================

-- Crear bucket para imágenes de propiedades
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'property-images',
    'property-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Crear bucket para avatares de usuarios
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    1048576, -- 1MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Verificar buckets creados
SELECT id, name, public, file_size_limit, allowed_mime_types FROM storage.buckets ORDER BY name;

-- =====================================================
-- SECCIÓN 10: POLÍTICAS DE STORAGE PARA PROPERTY-IMAGES
-- =====================================================

-- Eliminar políticas existentes para property-images
DROP POLICY IF EXISTS "Anyone can view property images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own property images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own property images" ON storage.objects;

-- Políticas para property-images bucket
CREATE POLICY "Anyone can view property images" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' 
        AND auth.role() = 'authenticated'
    );

CREATE POLICY "Users can update own property images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'property-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own property images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'property-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- SECCIÓN 11: POLÍTICAS DE STORAGE PARA AVATARS
-- =====================================================

-- Eliminar políticas existentes para avatars
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;

-- Políticas para avatars bucket
CREATE POLICY "Anyone can view avatars" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- SECCIÓN 12: FUNCIONES AUXILIARES
-- =====================================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS handle_updated_at ON public.properties;
CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.properties
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- SECCIÓN 13: DATOS DE PRUEBA (OPCIONAL)
-- =====================================================

-- Insertar algunas propiedades de ejemplo (solo si no existen)
-- NOTA: Estas propiedades no tendrán user_id válido hasta que haya usuarios registrados

INSERT INTO public.properties (
    title, description, price, bedrooms, bathrooms, area, address, city, province, postal_code, contact_phone, user_id
) 
SELECT 
    'Casa en Posadas Centro',
    'Hermosa casa de 3 dormitorios en el centro de Posadas',
    150000,
    3,
    2,
    120.5,
    'Av. Mitre 1234',
    'Posadas',
    'Misiones',
    '3300',
    '+54 376 123456',
    '00000000-0000-0000-0000-000000000000'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Casa en Posadas Centro');

INSERT INTO public.properties (
    title, description, price, bedrooms, bathrooms, area, address, city, province, postal_code, contact_phone, user_id
) 
SELECT 
    'Departamento en Puerto Iguazú',
    'Moderno departamento cerca de las Cataratas',
    95000,
    2,
    1,
    65.0,
    'Av. Victoria Aguirre 567',
    'Puerto Iguazú',
    'Misiones',
    '3370',
    '+54 3757 987654',
    '00000000-0000-0000-0000-000000000000'::uuid
WHERE NOT EXISTS (SELECT 1 FROM public.properties WHERE title = 'Departamento en Puerto Iguazú');

-- =====================================================
-- SECCIÓN 14: VERIFICACIÓN FINAL COMPLETA
-- =====================================================

-- Verificar tablas creadas
SELECT 
    'Tables Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 4 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as tables_found,
    STRING_AGG(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
    AND table_name IN ('profiles', 'properties', 'favorites', 'search_history');

-- Verificar RLS habilitado
SELECT 
    'RLS Check' as test_category,
    CASE 
        WHEN COUNT(*) = 4 AND MIN(rowsecurity::int) = 1 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as tables_with_rls,
    STRING_AGG(tablename || ':' || rowsecurity::text, ', ') as rls_status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('profiles', 'properties', 'favorites', 'search_history');

-- Verificar políticas RLS
SELECT 
    'Policies Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as policies_found,
    COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies 
WHERE schemaname = 'public';

-- Verificar buckets de storage
SELECT 
    'Storage Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as buckets_found,
    STRING_AGG(name, ', ') as bucket_names
FROM storage.buckets 
WHERE name IN ('property-images', 'avatars');

-- Verificar índices
SELECT 
    'Indexes Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 8 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as indexes_found
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname LIKE 'idx_%';

-- Verificar extensiones
SELECT 
    'Extensions Check' as test_category,
    CASE 
        WHEN COUNT(*) >= 2 THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as status,
    COUNT(*) as extensions_found,
    STRING_AGG(extname, ', ') as extensions
FROM pg_extension 
WHERE extname IN ('uuid-ossp', 'pgcrypto');

-- =====================================================
-- SECCIÓN 15: CONSULTAS DE DIAGNÓSTICO
-- =====================================================

-- Mostrar resumen de configuración
SELECT 
    'SUPABASE CONFIGURATION SUMMARY' as title,
    '================================' as separator;

-- Contar registros en tablas principales
SELECT 'properties' as table_name, COUNT(*) as record_count FROM public.properties
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM public.profiles
UNION ALL
SELECT 'favorites' as table_name, COUNT(*) as record_count FROM public.favorites
UNION ALL
SELECT 'search_history' as table_name, COUNT(*) as record_count FROM public.search_history
ORDER BY table_name;

-- Mostrar políticas por tabla
SELECT 
    tablename,
    COUNT(*) as policy_count,
    STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- =====================================================
-- SECCIÓN 16: COMANDOS DE LIMPIEZA (SI ES NECESARIO)
-- =====================================================

-- ADVERTENCIA: Los siguientes comandos ELIMINAN datos
-- Solo ejecutar si necesitas limpiar la base de datos

/*
-- Eliminar todas las políticas RLS
DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON ' || r.schemaname || '.' || r.tablename;
    END LOOP;
END $$;

-- Eliminar todas las tablas
DROP TABLE IF EXISTS public.search_history CASCADE;
DROP TABLE IF EXISTS public.favorites CASCADE;
DROP TABLE IF EXISTS public.properties CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Eliminar buckets de storage
DELETE FROM storage.buckets WHERE name IN ('property-images', 'avatars');

-- Eliminar funciones
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
*/

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

SELECT 
    'SCRIPT COMPLETED SUCCESSFULLY' as message,
    NOW() as completed_at,
    'All Supabase configurations have been applied' as status;
