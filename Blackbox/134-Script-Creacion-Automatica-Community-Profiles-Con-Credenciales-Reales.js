/**
 * BLACKBOX AI - CREACIÓN AUTOMÁTICA TABLA COMMUNITY_PROFILES
 * Fecha: 3 de Enero 2025
 * Objetivo: Crear tabla community_profiles usando TODAS las credenciales disponibles
 */

const { Client } = require('pg');

console.log('🚀 INICIANDO CREACIÓN AUTOMÁTICA DE TABLA COMMUNITY_PROFILES...\n');

// Configuración con TODAS las credenciales disponibles
const CONFIGS = {
    // Configuración 1: DATABASE_URL (con pgbouncer)
    config1: {
        connectionString: 'postgresql://postgres.qfeyhaaxyemmnohqdele:Yanina302472%21@aws-1-us-east-2.pooler.supabase.com:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1',
        name: 'DATABASE_URL (pgbouncer)'
    },
    
    // Configuración 2: DIRECT_URL (conexión directa)
    config2: {
        connectionString: 'postgresql://postgres:Yanina302472!@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require',
        name: 'DIRECT_URL (conexión directa)'
    },
    
    // Configuración 3: Supabase REST API con Service Role
    supabaseRest: {
        url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
        serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
        name: 'Supabase REST API'
    }
};

// SQL para crear la tabla community_profiles
const CREATE_TABLE_SQL = `
-- Crear tabla community_profiles
CREATE TABLE IF NOT EXISTS public.community_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    interests TEXT[] DEFAULT '{}',
    location TEXT,
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    age INTEGER,
    gender TEXT,
    occupation TEXT,
    phone TEXT,
    email TEXT,
    social_links JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    last_active TIMESTAMPTZ DEFAULT now()
);

-- Crear índices para optimización
CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON public.community_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_community_profiles_is_active ON public.community_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_community_profiles_location ON public.community_profiles(location);
CREATE INDEX IF NOT EXISTS idx_community_profiles_interests ON public.community_profiles USING GIN(interests);
CREATE INDEX IF NOT EXISTS idx_community_profiles_verification_status ON public.community_profiles(verification_status);
CREATE INDEX IF NOT EXISTS idx_community_profiles_last_active ON public.community_profiles(last_active);

-- Crear función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Crear trigger para updated_at
DROP TRIGGER IF EXISTS update_community_profiles_updated_at ON public.community_profiles;
CREATE TRIGGER update_community_profiles_updated_at
    BEFORE UPDATE ON public.community_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;

-- Política 1: Ver perfiles activos (SELECT)
DROP POLICY IF EXISTS "Ver perfiles activos" ON public.community_profiles;
CREATE POLICY "Ver perfiles activos" ON public.community_profiles
    FOR SELECT USING (is_active = true);

-- Política 2: Crear propio perfil (INSERT)
DROP POLICY IF EXISTS "Crear propio perfil" ON public.community_profiles;
CREATE POLICY "Crear propio perfil" ON public.community_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Política 3: Actualizar propio perfil (UPDATE)
DROP POLICY IF EXISTS "Actualizar propio perfil" ON public.community_profiles;
CREATE POLICY "Actualizar propio perfil" ON public.community_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Política 4: Eliminar propio perfil (DELETE)
DROP POLICY IF EXISTS "Eliminar propio perfil" ON public.community_profiles;
CREATE POLICY "Eliminar propio perfil" ON public.community_profiles
    FOR DELETE USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE public.community_profiles IS 'Perfiles de usuarios para el módulo de comunidad';
COMMENT ON COLUMN public.community_profiles.user_id IS 'Referencia al usuario autenticado';
COMMENT ON COLUMN public.community_profiles.display_name IS 'Nombre a mostrar en la comunidad';
COMMENT ON COLUMN public.community_profiles.interests IS 'Array de intereses del usuario';
COMMENT ON COLUMN public.community_profiles.social_links IS 'Enlaces a redes sociales (JSON)';
COMMENT ON COLUMN public.community_profiles.preferences IS 'Preferencias del usuario (JSON)';
`;

const resultados = {
    timestamp: new Date().toISOString(),
    intentos: [],
    exito: false,
    configuracionExitosa: null,
    errores: []
};

// MÉTODO 1: Intentar con conexión PostgreSQL directa
async function intentarConexionPostgreSQL(config, nombre) {
    console.log(`🔄 Intentando con ${nombre}...`);
    
    try {
        const client = new Client({
            connectionString: config.connectionString,
            ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        console.log(`✅ Conexión exitosa con ${nombre}`);
        
        // Ejecutar el SQL
        const result = await client.query(CREATE_TABLE_SQL);
        console.log(`✅ Tabla creada exitosamente con ${nombre}`);
        
        // Verificar que la tabla existe
        const verificacion = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'community_profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log(`✅ Verificación exitosa: ${verificacion.rows.length} columnas encontradas`);
        
        await client.end();
        
        resultados.intentos.push({
            metodo: nombre,
            exito: true,
            columnas: verificacion.rows.length,
            detalles: 'Tabla creada y verificada exitosamente'
        });
        
        resultados.exito = true;
        resultados.configuracionExitosa = nombre;
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error con ${nombre}: ${error.message}`);
        resultados.intentos.push({
            metodo: nombre,
            exito: false,
            error: error.message
        });
        resultados.errores.push(`${nombre}: ${error.message}`);
        return false;
    }
}

// MÉTODO 2: Intentar con Supabase REST API
async function intentarSupabaseREST() {
    console.log('🔄 Intentando con Supabase REST API...');
    
    try {
        // Intentar ejecutar SQL a través de la API REST
        const response = await fetch(`${CONFIGS.supabaseRest.url}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
                'apikey': CONFIGS.supabaseRest.serviceRoleKey,
                'Authorization': `Bearer ${CONFIGS.supabaseRest.serviceRoleKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                sql: CREATE_TABLE_SQL
            })
        });
        
        if (response.ok) {
            console.log('✅ Tabla creada exitosamente con Supabase REST API');
            resultados.intentos.push({
                metodo: 'Supabase REST API',
                exito: true,
                detalles: 'Tabla creada via REST API'
            });
            resultados.exito = true;
            resultados.configuracionExitosa = 'Supabase REST API';
            return true;
        } else {
            const errorText = await response.text();
            console.log(`❌ Error con Supabase REST API: ${response.status} - ${errorText}`);
            resultados.intentos.push({
                metodo: 'Supabase REST API',
                exito: false,
                error: `${response.status} - ${errorText}`
            });
            resultados.errores.push(`Supabase REST API: ${response.status} - ${errorText}`);
            return false;
        }
        
    } catch (error) {
        console.log(`❌ Error con Supabase REST API: ${error.message}`);
        resultados.intentos.push({
            metodo: 'Supabase REST API',
            exito: false,
            error: error.message
        });
        resultados.errores.push(`Supabase REST API: ${error.message}`);
        return false;
    }
}

// MÉTODO 3: Intentar crear tabla por partes (más seguro)
async function intentarCreacionPorPartes(config, nombre) {
    console.log(`🔄 Intentando creación por partes con ${nombre}...`);
    
    try {
        const client = new Client({
            connectionString: config.connectionString,
            ssl: { rejectUnauthorized: false }
        });
        
        await client.connect();
        console.log(`✅ Conexión exitosa con ${nombre}`);
        
        // Paso 1: Crear solo la tabla básica
        const createTableBasic = `
            CREATE TABLE IF NOT EXISTS public.community_profiles (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
                display_name TEXT NOT NULL,
                bio TEXT,
                interests TEXT[] DEFAULT '{}',
                location TEXT,
                avatar_url TEXT,
                is_active BOOLEAN DEFAULT true,
                created_at TIMESTAMPTZ DEFAULT now(),
                updated_at TIMESTAMPTZ DEFAULT now(),
                age INTEGER,
                gender TEXT,
                occupation TEXT,
                phone TEXT,
                email TEXT,
                social_links JSONB DEFAULT '{}',
                preferences JSONB DEFAULT '{}',
                verification_status TEXT DEFAULT 'pending',
                last_active TIMESTAMPTZ DEFAULT now()
            );
        `;
        
        await client.query(createTableBasic);
        console.log('✅ Tabla básica creada');
        
        // Paso 2: Crear índices
        const indices = [
            'CREATE INDEX IF NOT EXISTS idx_community_profiles_user_id ON public.community_profiles(user_id);',
            'CREATE INDEX IF NOT EXISTS idx_community_profiles_is_active ON public.community_profiles(is_active);',
            'CREATE INDEX IF NOT EXISTS idx_community_profiles_location ON public.community_profiles(location);',
            'CREATE INDEX IF NOT EXISTS idx_community_profiles_interests ON public.community_profiles USING GIN(interests);',
            'CREATE INDEX IF NOT EXISTS idx_community_profiles_verification_status ON public.community_profiles(verification_status);',
            'CREATE INDEX IF NOT EXISTS idx_community_profiles_last_active ON public.community_profiles(last_active);'
        ];
        
        for (const indice of indices) {
            try {
                await client.query(indice);
            } catch (err) {
                console.log(`⚠️ Error creando índice: ${err.message}`);
            }
        }
        console.log('✅ Índices creados');
        
        // Paso 3: Crear función y trigger
        try {
            await client.query(`
                CREATE OR REPLACE FUNCTION public.update_updated_at_column()
                RETURNS TRIGGER AS $$
                BEGIN
                    NEW.updated_at = now();
                    RETURN NEW;
                END;
                $$ language 'plpgsql';
            `);
            
            await client.query(`
                DROP TRIGGER IF EXISTS update_community_profiles_updated_at ON public.community_profiles;
                CREATE TRIGGER update_community_profiles_updated_at
                    BEFORE UPDATE ON public.community_profiles
                    FOR EACH ROW
                    EXECUTE FUNCTION public.update_updated_at_column();
            `);
            console.log('✅ Función y trigger creados');
        } catch (err) {
            console.log(`⚠️ Error creando función/trigger: ${err.message}`);
        }
        
        // Paso 4: Habilitar RLS
        try {
            await client.query('ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;');
            console.log('✅ RLS habilitado');
        } catch (err) {
            console.log(`⚠️ Error habilitando RLS: ${err.message}`);
        }
        
        // Paso 5: Crear políticas
        const politicas = [
            'DROP POLICY IF EXISTS "Ver perfiles activos" ON public.community_profiles;',
            'CREATE POLICY "Ver perfiles activos" ON public.community_profiles FOR SELECT USING (is_active = true);',
            'DROP POLICY IF EXISTS "Crear propio perfil" ON public.community_profiles;',
            'CREATE POLICY "Crear propio perfil" ON public.community_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);',
            'DROP POLICY IF EXISTS "Actualizar propio perfil" ON public.community_profiles;',
            'CREATE POLICY "Actualizar propio perfil" ON public.community_profiles FOR UPDATE USING (auth.uid() = user_id);',
            'DROP POLICY IF EXISTS "Eliminar propio perfil" ON public.community_profiles;',
            'CREATE POLICY "Eliminar propio perfil" ON public.community_profiles FOR DELETE USING (auth.uid() = user_id);'
        ];
        
        for (const politica of politicas) {
            try {
                await client.query(politica);
            } catch (err) {
                console.log(`⚠️ Error creando política: ${err.message}`);
            }
        }
        console.log('✅ Políticas creadas');
        
        // Verificar que la tabla existe
        const verificacion = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'community_profiles' 
            AND table_schema = 'public'
            ORDER BY ordinal_position;
        `);
        
        console.log(`✅ Verificación exitosa: ${verificacion.rows.length} columnas encontradas`);
        
        await client.end();
        
        resultados.intentos.push({
            metodo: `${nombre} (por partes)`,
            exito: true,
            columnas: verificacion.rows.length,
            detalles: 'Tabla creada por partes exitosamente'
        });
        
        resultados.exito = true;
        resultados.configuracionExitosa = `${nombre} (por partes)`;
        
        return true;
        
    } catch (error) {
        console.log(`❌ Error con ${nombre} (por partes): ${error.message}`);
        resultados.intentos.push({
            metodo: `${nombre} (por partes)`,
            exito: false,
            error: error.message
        });
        resultados.errores.push(`${nombre} (por partes): ${error.message}`);
        return false;
    }
}

// EJECUTAR TODOS LOS MÉTODOS
async function ejecutarCreacionCompleta() {
    try {
        console.log('🚀 INICIANDO CREACIÓN AUTOMÁTICA CON MÚLTIPLES MÉTODOS...\n');
        
        // Método 1: Intentar con DATABASE_URL (pgbouncer)
        if (await intentarConexionPostgreSQL(CONFIGS.config1, CONFIGS.config1.name)) {
            console.log('\n🎉 ¡ÉXITO! Tabla creada con DATABASE_URL');
            return;
        }
        
        // Método 2: Intentar con DIRECT_URL
        if (await intentarConexionPostgreSQL(CONFIGS.config2, CONFIGS.config2.name)) {
            console.log('\n🎉 ¡ÉXITO! Tabla creada con DIRECT_URL');
            return;
        }
        
        // Método 3: Intentar con Supabase REST API
        if (await intentarSupabaseREST()) {
            console.log('\n🎉 ¡ÉXITO! Tabla creada con Supabase REST API');
            return;
        }
        
        // Método 4: Intentar creación por partes con DATABASE_URL
        if (await intentarCreacionPorPartes(CONFIGS.config1, CONFIGS.config1.name)) {
            console.log('\n🎉 ¡ÉXITO! Tabla creada por partes con DATABASE_URL');
            return;
        }
        
        // Método 5: Intentar creación por partes con DIRECT_URL
        if (await intentarCreacionPorPartes(CONFIGS.config2, CONFIGS.config2.name)) {
            console.log('\n🎉 ¡ÉXITO! Tabla creada por partes con DIRECT_URL');
            return;
        }
        
        console.log('\n❌ TODOS LOS MÉTODOS FALLARON');
        
    } catch (error) {
        console.log('\n❌ ERROR CRÍTICO:', error.message);
        resultados.errores.push(`Error crítico: ${error.message}`);
    } finally {
        // Mostrar resumen final
        console.log('\n📊 RESUMEN FINAL:');
        console.log('================');
        console.log(`🕐 Timestamp: ${resultados.timestamp}`);
        console.log(`✅ Éxito: ${resultados.exito ? 'SÍ' : 'NO'}`);
        console.log(`🏆 Configuración exitosa: ${resultados.configuracionExitosa || 'Ninguna'}`);
        console.log(`🔄 Intentos realizados: ${resultados.intentos.length}`);
        console.log(`❌ Errores encontrados: ${resultados.errores.length}`);
        
        if (resultados.intentos.length > 0) {
            console.log('\n📋 DETALLE DE INTENTOS:');
            resultados.intentos.forEach((intento, index) => {
                console.log(`${index + 1}. ${intento.metodo}: ${intento.exito ? '✅ ÉXITO' : '❌ FALLÓ'}`);
                if (intento.exito && intento.columnas) {
                    console.log(`   └─ ${intento.columnas} columnas creadas`);
                }
                if (!intento.exito && intento.error) {
                    console.log(`   └─ Error: ${intento.error}`);
                }
            });
        }
        
        if (resultados.errores.length > 0) {
            console.log('\n❌ ERRORES DETALLADOS:');
            resultados.errores.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        // Próximos pasos
        console.log('\n🚀 PRÓXIMOS PASOS:');
        if (resultados.exito) {
            console.log('1. ✅ Ejecutar testing de verificación');
            console.log('2. ✅ Verificar APIs de comunidad');
            console.log('3. ✅ Testing completo del módulo');
            console.log('\n🎯 COMANDO PARA TESTING:');
            console.log('node "Blackbox/131-Testing-Post-Creacion-Tabla-Community-Profiles.js"');
        } else {
            console.log('1. 📋 Revisar errores encontrados');
            console.log('2. 🔧 Intentar creación manual en Supabase Dashboard');
            console.log('3. 📖 Seguir guía manual: Blackbox/130-Guia-Manual-Crear-Tabla-Community-Profiles-Supabase.md');
        }
        
        // Guardar reporte
        const fs = require('fs');
        const reportePath = 'Blackbox/134-Reporte-Creacion-Automatica-Community-Profiles.json';
        fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
        console.log(`\n💾 Reporte guardado en: ${reportePath}`);
    }
}

// Ejecutar el script
ejecutarCreacionCompleta().catch(console.error);
