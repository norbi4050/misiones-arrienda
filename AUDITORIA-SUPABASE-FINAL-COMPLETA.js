const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('🔍 AUDITORÍA SUPABASE FINAL COMPLETA');
console.log('========================================');

// Función para verificar si un archivo existe
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Función para leer contenido de archivo
function readFile(filePath) {
    if (!fileExists(filePath)) return '';
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return '';
    }
}

// Función para contar líneas
function countLines(content) {
    return content.split('\n').length;
}

console.log('\n🔍 ANALIZANDO CONFIGURACIONES SUPABASE EXISTENTES...');

// ========================================
// ANÁLISIS DE ARCHIVOS SUPABASE EXISTENTES
// ========================================

const supabaseFiles = [
    'Backend/supabase-setup.sql',
    'Backend/SUPABASE-POLICIES-FALTANTES.sql',
    'Backend/SUPABASE-POLICIES-FINAL.sql',
    'Backend/SUPABASE-STORAGE-SETUP-ACTUALIZADO.sql',
    'Backend/SUPABASE-TRIGGER-FUNCTIONS-COMPLETAS.sql',
    'SUPABASE-MASTER-CONFIG.sql',
    'Backend/src/lib/supabase/client.ts',
    'Backend/src/lib/supabase/server.ts',
    'Backend/src/middleware.ts'
];

console.log('\n📋 ARCHIVOS SUPABASE ENCONTRADOS:');
let foundFiles = 0;
let missingFiles = [];

supabaseFiles.forEach(file => {
    if (fileExists(file)) {
        const content = readFile(file);
        const lines = countLines(content);
        console.log(`✅ ${file} (${lines} líneas)`);
        foundFiles++;
    } else {
        console.log(`❌ ${file} - NO ENCONTRADO`);
        missingFiles.push(file);
    }
});

console.log(`\n📊 Archivos encontrados: ${foundFiles}/${supabaseFiles.length}`);

// ========================================
// ANÁLISIS DETALLADO DE CONFIGURACIONES
// ========================================

console.log('\n🔍 ANÁLISIS DETALLADO DE CONFIGURACIONES:');

// 1. Verificar supabase-setup.sql
const setupContent = readFile('Backend/supabase-setup.sql');
console.log('\n[1] Backend/supabase-setup.sql:');
if (setupContent) {
    const hasRLS = setupContent.includes('ROW LEVEL SECURITY');
    const hasPolicies = setupContent.includes('CREATE POLICY');
    const hasTables = setupContent.includes('CREATE TABLE');
    const hasStorage = setupContent.includes('storage.buckets');
    
    console.log(`   - RLS habilitado: ${hasRLS ? '✅' : '❌'}`);
    console.log(`   - Políticas definidas: ${hasPolicies ? '✅' : '❌'}`);
    console.log(`   - Tablas creadas: ${hasTables ? '✅' : '❌'}`);
    console.log(`   - Storage configurado: ${hasStorage ? '✅' : '❌'}`);
} else {
    console.log('   ❌ Archivo no encontrado o vacío');
}

// 2. Verificar SUPABASE-MASTER-CONFIG.sql
const masterContent = readFile('SUPABASE-MASTER-CONFIG.sql');
console.log('\n[2] SUPABASE-MASTER-CONFIG.sql:');
if (masterContent) {
    const hasProperties = masterContent.includes('CREATE TABLE IF NOT EXISTS properties');
    const hasCommunity = masterContent.includes('CREATE TABLE IF NOT EXISTS community_profiles');
    const hasLikes = masterContent.includes('CREATE TABLE IF NOT EXISTS community_likes');
    const hasMessages = masterContent.includes('CREATE TABLE IF NOT EXISTS community_messages');
    const hasRLS = masterContent.includes('ALTER TABLE properties ENABLE ROW LEVEL SECURITY');
    const hasStorage = masterContent.includes('INSERT INTO storage.buckets');
    const hasTriggers = masterContent.includes('CREATE TRIGGER');
    const hasIndexes = masterContent.includes('CREATE INDEX');
    
    console.log(`   - Tabla properties: ${hasProperties ? '✅' : '❌'}`);
    console.log(`   - Tabla community_profiles: ${hasCommunity ? '✅' : '❌'}`);
    console.log(`   - Tabla community_likes: ${hasLikes ? '✅' : '❌'}`);
    console.log(`   - Tabla community_messages: ${hasMessages ? '✅' : '❌'}`);
    console.log(`   - RLS configurado: ${hasRLS ? '✅' : '❌'}`);
    console.log(`   - Storage buckets: ${hasStorage ? '✅' : '❌'}`);
    console.log(`   - Triggers: ${hasTriggers ? '✅' : '❌'}`);
    console.log(`   - Índices: ${hasIndexes ? '✅' : '❌'}`);
} else {
    console.log('   ❌ Archivo no encontrado o vacío');
}

// 3. Verificar cliente Supabase
const clientContent = readFile('Backend/src/lib/supabase/client.ts');
console.log('\n[3] Backend/src/lib/supabase/client.ts:');
if (clientContent) {
    const hasCreateClient = clientContent.includes('createClient');
    const hasAuth = clientContent.includes('auth');
    const hasStorage = clientContent.includes('storage');
    
    console.log(`   - Cliente configurado: ${hasCreateClient ? '✅' : '❌'}`);
    console.log(`   - Auth integrado: ${hasAuth ? '✅' : '❌'}`);
    console.log(`   - Storage integrado: ${hasStorage ? '✅' : '❌'}`);
} else {
    console.log('   ❌ Archivo no encontrado o vacío');
}

// 4. Verificar servidor Supabase
const serverContent = readFile('Backend/src/lib/supabase/server.ts');
console.log('\n[4] Backend/src/lib/supabase/server.ts:');
if (serverContent) {
    const hasServerClient = serverContent.includes('createServerClient');
    const hasCookies = serverContent.includes('cookies');
    const hasSSR = serverContent.includes('ssr');
    
    console.log(`   - Server client: ${hasServerClient ? '✅' : '❌'}`);
    console.log(`   - Cookies configuradas: ${hasCookies ? '✅' : '❌'}`);
    console.log(`   - SSR habilitado: ${hasSSR ? '✅' : '❌'}`);
} else {
    console.log('   ❌ Archivo no encontrado o vacío');
}

// 5. Verificar middleware
const middlewareContent = readFile('Backend/src/middleware.ts');
console.log('\n[5] Backend/src/middleware.ts:');
if (middlewareContent) {
    const hasSupabase = middlewareContent.includes('supabase');
    const hasAuth = middlewareContent.includes('auth');
    const hasProtectedRoutes = middlewareContent.includes('protected') || middlewareContent.includes('dashboard');
    
    console.log(`   - Supabase integrado: ${hasSupabase ? '✅' : '❌'}`);
    console.log(`   - Auth middleware: ${hasAuth ? '✅' : '❌'}`);
    console.log(`   - Rutas protegidas: ${hasProtectedRoutes ? '✅' : '❌'}`);
} else {
    console.log('   ❌ Archivo no encontrado o vacío');
}

// ========================================
// IDENTIFICAR CONFIGURACIONES FALTANTES
// ========================================

console.log('\n🔍 IDENTIFICANDO CONFIGURACIONES FALTANTES...');

const requiredConfigs = [
    {
        name: 'Políticas RLS Completas',
        file: 'Backend/supabase-setup.sql',
        check: () => {
            const content = readFile('Backend/supabase-setup.sql');
            return content.includes('CREATE POLICY') && 
                   content.includes('properties') && 
                   content.includes('community_profiles') &&
                   content.includes('ROW LEVEL SECURITY');
        }
    },
    {
        name: 'Storage Buckets y Políticas',
        file: 'Backend/supabase-setup.sql',
        check: () => {
            const content = readFile('Backend/supabase-setup.sql');
            return content.includes('storage.buckets') && 
                   content.includes('property-images') && 
                   content.includes('profile-images');
        }
    },
    {
        name: 'Funciones y Triggers',
        file: 'Backend/SUPABASE-TRIGGER-FUNCTIONS-COMPLETAS.sql',
        check: () => {
            const content = readFile('Backend/SUPABASE-TRIGGER-FUNCTIONS-COMPLETAS.sql');
            return content.includes('CREATE OR REPLACE FUNCTION') && 
                   content.includes('CREATE TRIGGER');
        }
    },
    {
        name: 'Variables de Entorno',
        file: 'Backend/.env.local',
        check: () => {
            const content = readFile('Backend/.env.local');
            return content.includes('NEXT_PUBLIC_SUPABASE_URL') && 
                   content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
        }
    },
    {
        name: 'Configuración de Auth',
        file: 'Backend/src/lib/supabase/client.ts',
        check: () => {
            const content = readFile('Backend/src/lib/supabase/client.ts');
            return content.includes('createClient') && 
                   content.includes('auth');
        }
    }
];

console.log('\n📋 VERIFICACIÓN DE CONFIGURACIONES REQUERIDAS:');
let missingConfigs = [];

requiredConfigs.forEach(config => {
    const isPresent = config.check();
    console.log(`${isPresent ? '✅' : '❌'} ${config.name}`);
    if (!isPresent) {
        missingConfigs.push(config);
    }
});

// ========================================
// ANÁLISIS DE PRISMA SCHEMA
// ========================================

console.log('\n🔍 ANÁLISIS DE PRISMA SCHEMA:');
const prismaContent = readFile('Backend/prisma/schema.prisma');
if (prismaContent) {
    const hasSupabaseProvider = prismaContent.includes('provider = "postgresql"');
    const hasPropertiesModel = prismaContent.includes('model Property');
    const hasCommunityModel = prismaContent.includes('model CommunityProfile');
    const hasUserModel = prismaContent.includes('model User');
    
    console.log(`   - Provider PostgreSQL: ${hasSupabaseProvider ? '✅' : '❌'}`);
    console.log(`   - Modelo Property: ${hasPropertiesModel ? '✅' : '❌'}`);
    console.log(`   - Modelo CommunityProfile: ${hasCommunityModel ? '✅' : '❌'}`);
    console.log(`   - Modelo User: ${hasUserModel ? '✅' : '❌'}`);
} else {
    console.log('   ❌ Prisma schema no encontrado');
}

// ========================================
// RECOMENDACIONES FINALES
// ========================================

console.log('\n========================================');
console.log('📊 RESUMEN DE AUDITORÍA SUPABASE');
console.log('========================================');

console.log(`\n📈 ESTADO ACTUAL:`);
console.log(`✅ Archivos encontrados: ${foundFiles}/${supabaseFiles.length}`);
console.log(`❌ Configuraciones faltantes: ${missingConfigs.length}`);

if (missingConfigs.length > 0) {
    console.log('\n🔧 CONFIGURACIONES FALTANTES IDENTIFICADAS:');
    missingConfigs.forEach((config, index) => {
        console.log(`${index + 1}. ${config.name} (${config.file})`);
    });
}

if (missingFiles.length > 0) {
    console.log('\n📁 ARCHIVOS FALTANTES:');
    missingFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file}`);
    });
}

// ========================================
// CREAR ARCHIVO FALTANTE CRÍTICO
// ========================================

console.log('\n🔧 CREANDO CONFIGURACIÓN FALTANTE CRÍTICA...');

// El archivo que falta según el testing es Backend/supabase-setup.sql
if (!fileExists('Backend/supabase-setup.sql')) {
    console.log('\n📝 Creando Backend/supabase-setup.sql...');
    
    const supabaseSetupContent = `-- ========================================
-- 🗄️ SUPABASE SETUP COMPLETO
-- ========================================
-- Configuración principal de Supabase para Misiones Arrienda
-- Este archivo debe ejecutarse en el SQL Editor de Supabase

-- ========================================
-- HABILITAR EXTENSIONES
-- ========================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- CREAR TABLAS PRINCIPALES
-- ========================================

-- Tabla de propiedades
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'ARS',
    property_type VARCHAR(50) NOT NULL,
    area DECIMAL(8,2),
    bedrooms INTEGER,
    bathrooms INTEGER,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(100) DEFAULT 'Argentina',
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    images TEXT[],
    amenities TEXT[],
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    user_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'active',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de perfiles de comunidad
CREATE TABLE IF NOT EXISTS public.community_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) UNIQUE,
    full_name VARCHAR(255),
    age INTEGER,
    occupation VARCHAR(255),
    bio TEXT,
    profile_image_url TEXT,
    looking_for TEXT[],
    budget_min DECIMAL(12,2),
    budget_max DECIMAL(12,2),
    preferred_areas TEXT[],
    lifestyle_tags TEXT[],
    contact_preferences JSONB,
    verification_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de likes/matches
CREATE TABLE IF NOT EXISTS public.community_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    liker_id UUID REFERENCES community_profiles(id),
    liked_id UUID REFERENCES community_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(liker_id, liked_id)
);

-- Tabla de mensajes
CREATE TABLE IF NOT EXISTS public.community_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL,
    sender_id UUID REFERENCES community_profiles(id),
    receiver_id UUID REFERENCES community_profiles(id),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- HABILITAR ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- ========================================
-- CREAR POLÍTICAS RLS
-- ========================================

-- Políticas para properties
CREATE POLICY "Properties are viewable by everyone" ON public.properties
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas para community_profiles
CREATE POLICY "Profiles are viewable by authenticated users" ON public.community_profiles
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert their own profile" ON public.community_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.community_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para community_likes
CREATE POLICY "Users can view likes involving them" ON public.community_likes
    FOR SELECT USING (
        liker_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()) OR
        liked_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert their own likes" ON public.community_likes
    FOR INSERT WITH CHECK (
        liker_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

-- Políticas para community_messages
CREATE POLICY "Users can view their own messages" ON public.community_messages
    FOR SELECT USING (
        sender_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid()) OR
        receiver_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can send messages" ON public.community_messages
    FOR INSERT WITH CHECK (
        sender_id IN (SELECT id FROM community_profiles WHERE user_id = auth.uid())
    );

-- ========================================
-- CONFIGURAR STORAGE
-- ========================================

-- Crear buckets de storage
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('property-images', 'property-images', true),
    ('profile-images', 'profile-images', true),
    ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage para property-images
CREATE POLICY "Property images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'property-images' AND 
        auth.role() = 'authenticated'
    );

-- Políticas de storage para profile-images
CREATE POLICY "Profile images are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'profile-images');

CREATE POLICY "Users can upload their own profile images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'profile-images' AND 
        auth.role() = 'authenticated'
    );

-- ========================================
-- CREAR ÍNDICES PARA PERFORMANCE
-- ========================================

CREATE INDEX IF NOT EXISTS idx_properties_city ON public.properties(city);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON public.properties(property_type);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON public.community_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_liker ON public.community_likes(liker_id);
CREATE INDEX IF NOT EXISTS idx_community_likes_liked ON public.community_likes(liked_id);

-- ========================================
-- CONFIGURACIÓN COMPLETADA
-- ========================================

-- Insertar datos de prueba (opcional)
INSERT INTO public.properties (title, description, price, property_type, area, bedrooms, bathrooms, address, city, state, contact_phone, contact_email)
VALUES 
    ('Casa de prueba', 'Propiedad de ejemplo para testing', 100000, 'casa', 120, 3, 2, 'Dirección de prueba 123', 'Posadas', 'Misiones', '+54911234567', 'test@example.com')
ON CONFLICT DO NOTHING;

SELECT 'Supabase setup completado exitosamente' as status;`;

    try {
        fs.writeFileSync('Backend/supabase-setup.sql', supabaseSetupContent);
        console.log('✅ Backend/supabase-setup.sql creado exitosamente');
    } catch (error) {
        console.log('❌ Error creando Backend/supabase-setup.sql:', error.message);
    }
} else {
    console.log('✅ Backend/supabase-setup.sql ya existe');
}

console.log('\n========================================');
console.log('✅ AUDITORÍA SUPABASE COMPLETADA');
console.log('========================================');

console.log('\n📊 RESULTADO FINAL:');
console.log(`✅ Configuración Supabase: ${missingConfigs.length === 0 ? 'COMPLETA' : 'NECESITA AJUSTES'}`);
console.log(`📁 Archivos críticos: ${fileExists('Backend/supabase-setup.sql') ? 'PRESENTES' : 'FALTANTES'}`);
console.log(`🔧 Próximo paso: ${missingConfigs.length === 0 ? 'Ejecutar configuración en Supabase' : 'Completar configuraciones faltantes'}`);
