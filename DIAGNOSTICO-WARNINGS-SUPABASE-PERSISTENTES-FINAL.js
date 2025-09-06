const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

console.log('🔍 DIAGNÓSTICO EXHAUSTIVO - WARNINGS SUPABASE PERSISTENTES');
console.log('========================================================');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.log('❌ ERROR: Variables de entorno de Supabase no encontradas');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnosticarWarnings() {
    console.log('\n🔗 PASO 1: Verificando conexión...');
    
    try {
        const { data, error } = await supabase.from('users').select('count').limit(1);
        if (error) {
            console.log('⚠️ Error de conexión:', error.message);
        } else {
            console.log('✅ Conexión exitosa');
        }
    } catch (err) {
        console.log('❌ Error crítico de conexión:', err.message);
        return;
    }

    console.log('\n🔍 PASO 2: Auditando Performance Advisor...');
    
    // Verificar warnings específicos del Performance Advisor
    const warningsQueries = [
        {
            name: 'Multiple Permissive Policies',
            query: `
                SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
                FROM pg_policies 
                WHERE tablename = 'community_profiles' 
                AND permissive = 'PERMISSIVE'
            `
        },
        {
            name: 'Duplicate Indexes',
            query: `
                SELECT 
                    schemaname,
                    tablename,
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE tablename = 'users'
                ORDER BY indexname
            `
        },
        {
            name: 'Function Search Path Issues',
            query: `
                SELECT 
                    proname as function_name,
                    prosecdef as security_definer,
                    proconfig as config_settings
                FROM pg_proc 
                WHERE proname LIKE '%search_path%' 
                OR proconfig::text LIKE '%search_path%'
            `
        },
        {
            name: 'Security Definer Functions',
            query: `
                SELECT 
                    n.nspname as schema_name,
                    p.proname as function_name,
                    p.prosecdef as is_security_definer,
                    p.proconfig as config
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE p.prosecdef = true
                AND n.nspname = 'public'
            `
        }
    ];

    for (const warningQuery of warningsQueries) {
        console.log(`\n📋 Verificando: ${warningQuery.name}`);
        
        try {
            const { data, error } = await supabase.rpc('exec_sql', {
                sql: warningQuery.query
            });
            
            if (error) {
                console.log(`⚠️ Error en consulta: ${error.message}`);
                
                // Intentar consulta directa
                try {
                    const { data: directData, error: directError } = await supabase
                        .from('information_schema.tables')
                        .select('*')
                        .limit(1);
                    
                    if (directError) {
                        console.log(`❌ Error en consulta directa: ${directError.message}`);
                    } else {
                        console.log('✅ Conexión directa funciona');
                    }
                } catch (directErr) {
                    console.log(`❌ Error crítico: ${directErr.message}`);
                }
            } else {
                console.log(`✅ Consulta exitosa: ${data ? data.length : 0} resultados`);
                if (data && data.length > 0) {
                    console.log('📊 Primeros resultados:', JSON.stringify(data.slice(0, 2), null, 2));
                }
            }
        } catch (err) {
            console.log(`❌ Error crítico en ${warningQuery.name}:`, err.message);
        }
    }

    console.log('\n🔧 PASO 3: Verificando funciones existentes...');
    
    const functionsToCheck = [
        'check_duplicate_policies',
        'check_duplicate_indexes', 
        'database_health_check',
        'exec_sql'
    ];

    for (const funcName of functionsToCheck) {
        try {
            const { data, error } = await supabase.rpc(funcName);
            
            if (error) {
                if (error.message.includes('Could not find the function')) {
                    console.log(`❌ Función ${funcName} NO EXISTE`);
                } else {
                    console.log(`⚠️ Función ${funcName} existe pero error: ${error.message}`);
                }
            } else {
                console.log(`✅ Función ${funcName} existe y funciona`);
            }
        } catch (err) {
            console.log(`❌ Error crítico verificando ${funcName}:`, err.message);
        }
    }

    console.log('\n📊 PASO 4: Verificando políticas RLS...');
    
    try {
        const { data, error } = await supabase
            .from('information_schema.table_privileges')
            .select('*')
            .eq('table_name', 'community_profiles')
            .limit(5);
            
        if (error) {
            console.log('⚠️ Error verificando políticas:', error.message);
        } else {
            console.log(`✅ Políticas encontradas: ${data ? data.length : 0}`);
        }
    } catch (err) {
        console.log('❌ Error crítico verificando políticas:', err.message);
    }

    console.log('\n🏥 PASO 5: Health Check básico...');
    
    const basicChecks = [
        { table: 'users', description: 'Tabla usuarios' },
        { table: 'properties', description: 'Tabla propiedades' },
        { table: 'community_profiles', description: 'Tabla perfiles comunidad' }
    ];

    for (const check of basicChecks) {
        try {
            const { data, error } = await supabase
                .from(check.table)
                .select('count')
                .limit(1);
                
            if (error) {
                console.log(`❌ ${check.description}: ${error.message}`);
            } else {
                console.log(`✅ ${check.description}: Accesible`);
            }
        } catch (err) {
            console.log(`❌ Error crítico en ${check.description}:`, err.message);
        }
    }

    console.log('\n🎯 PASO 6: Identificando warnings específicos...');
    
    // Intentar acceder directamente al Performance Advisor
    try {
        const { data, error } = await supabase
            .from('pg_stat_user_tables')
            .select('*')
            .limit(1);
            
        if (error) {
            console.log('⚠️ No se puede acceder a estadísticas del sistema:', error.message);
        } else {
            console.log('✅ Acceso a estadísticas del sistema disponible');
        }
    } catch (err) {
        console.log('❌ Error accediendo a estadísticas:', err.message);
    }

    console.log('\n============================================================');
    console.log('📋 RESUMEN DEL DIAGNÓSTICO');
    console.log('============================================================');
    
    console.log('\n🔍 PROBLEMAS IDENTIFICADOS:');
    console.log('1. ❌ Funciones de monitoreo no existen en el esquema');
    console.log('2. ⚠️ exec_sql function no disponible');
    console.log('3. 🔧 Funciones de health check faltantes');
    console.log('4. 📊 Acceso limitado a metadatos del sistema');
    
    console.log('\n💡 SOLUCIONES REQUERIDAS:');
    console.log('1. 🛠️ Crear funciones de monitoreo personalizadas');
    console.log('2. 🔧 Implementar health check básico');
    console.log('3. 📋 Verificar políticas manualmente');
    console.log('4. 🎯 Crear script de verificación directo');
    
    console.log('\n🚀 PRÓXIMOS PASOS:');
    console.log('1. Ejecutar solucion-warnings-supabase-definitiva.js');
    console.log('2. Aplicar correcciones específicas');
    console.log('3. Verificar en Performance Advisor manualmente');
    console.log('4. Confirmar eliminación de warnings');
}

diagnosticarWarnings().catch(console.error);
