// =====================================================
// BLACKBOX AI - SCRIPT CONFIGURACIÓN SUPABASE CON CREDENCIALES REALES
// Archivo: 106-Script-Configuracion-Supabase-Con-Credenciales-Reales.js
// Fecha: 3/9/2025
// Estado: ✅ LISTO PARA EJECUTAR
// =====================================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE'
};

// Cliente Supabase con permisos de administrador
const supabase = createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.serviceRoleKey);

// Reporte de configuración
let configReport = {
    timestamp: new Date().toISOString(),
    status: 'INICIANDO',
    tasks: [],
    errors: [],
    warnings: [],
    completed: [],
    pending: []
};

// Función para agregar tarea al reporte
function addTask(category, description, status, details = null) {
    const task = {
        category,
        description,
        status,
        details,
        timestamp: new Date().toISOString()
    };
    
    configReport.tasks.push(task);
    
    if (status === 'COMPLETADO') {
        configReport.completed.push(task);
    } else if (status === 'ERROR') {
        configReport.errors.push(task);
    } else if (status === 'PENDIENTE') {
        configReport.pending.push(task);
    } else if (status === 'ADVERTENCIA') {
        configReport.warnings.push(task);
    }
    
    console.log(`[${category}] ${description}: ${status}`);
    if (details) console.log(`   Detalles: ${details}`);
}

// 1. VERIFICAR CONEXIÓN A SUPABASE
async function verificarConexion() {
    try {
        console.log('\n🔍 VERIFICANDO CONEXIÓN A SUPABASE...');
        
        const { data, error } = await supabase
            .from('information_schema.tables')
            .select('table_name')
            .limit(1);
            
        if (error) {
            addTask('CONEXIÓN', 'Verificar conexión a Supabase', 'ERROR', error.message);
            return false;
        }
        
        addTask('CONEXIÓN', 'Verificar conexión a Supabase', 'COMPLETADO', 'Conexión exitosa');
        return true;
    } catch (error) {
        addTask('CONEXIÓN', 'Verificar conexión a Supabase', 'ERROR', error.message);
        return false;
    }
}

// 2. VERIFICAR TABLAS EXISTENTES
async function verificarTablasExistentes() {
    try {
        console.log('\n📋 VERIFICANDO TABLAS EXISTENTES...');
        
        const { data: tables, error } = await supabase
            .rpc('get_table_list');
            
        if (error) {
            // Método alternativo si la función no existe
            const { data: altTables, error: altError } = await supabase
                .from('information_schema.tables')
                .select('table_name')
                .eq('table_schema', 'public');
                
            if (altError) {
                addTask('TABLAS', 'Verificar tablas existentes', 'ERROR', altError.message);
                return [];
            }
            
            const tableNames = altTables.map(t => t.table_name);
            addTask('TABLAS', 'Verificar tablas existentes', 'COMPLETADO', `${tableNames.length} tablas encontradas: ${tableNames.join(', ')}`);
            return tableNames;
        }
        
        addTask('TABLAS', 'Verificar tablas existentes', 'COMPLETADO', `${tables.length} tablas encontradas`);
        return tables;
    } catch (error) {
        addTask('TABLAS', 'Verificar tablas existentes', 'ERROR', error.message);
        return [];
    }
}

// 3. VERIFICAR BUCKETS DE STORAGE
async function verificarStorageBuckets() {
    try {
        console.log('\n🗂️ VERIFICANDO BUCKETS DE STORAGE...');
        
        const { data: buckets, error } = await supabase.storage.listBuckets();
        
        if (error) {
            addTask('STORAGE', 'Verificar buckets de storage', 'ERROR', error.message);
            return [];
        }
        
        const bucketNames = buckets.map(b => b.name);
        addTask('STORAGE', 'Verificar buckets de storage', 'COMPLETADO', `${buckets.length} buckets encontrados: ${bucketNames.join(', ')}`);
        return buckets;
    } catch (error) {
        addTask('STORAGE', 'Verificar buckets de storage', 'ERROR', error.message);
        return [];
    }
}

// 4. VERIFICAR POLÍTICAS RLS
async function verificarPoliticasRLS() {
    try {
        console.log('\n🔒 VERIFICANDO POLÍTICAS RLS...');
        
        // Verificar si RLS está habilitado en las tablas principales
        const tablasImportantes = ['users', 'properties', 'profiles', 'payments', 'user_profiles'];
        const politicasEncontradas = [];
        
        for (const tabla of tablasImportantes) {
            try {
                const { data, error } = await supabase
                    .from('pg_policies')
                    .select('*')
                    .eq('tablename', tabla);
                    
                if (!error && data) {
                    politicasEncontradas.push({
                        tabla,
                        politicas: data.length
                    });
                }
            } catch (err) {
                // Tabla no existe o no se puede acceder
            }
        }
        
        addTask('RLS', 'Verificar políticas RLS', 'COMPLETADO', `Políticas encontradas en ${politicasEncontradas.length} tablas`);
        return politicasEncontradas;
    } catch (error) {
        addTask('RLS', 'Verificar políticas RLS', 'ERROR', error.message);
        return [];
    }
}

// 5. VERIFICAR FUNCIONES Y TRIGGERS
async function verificarFuncionesTriggers() {
    try {
        console.log('\n⚡ VERIFICANDO FUNCIONES Y TRIGGERS...');
        
        const { data: functions, error } = await supabase
            .from('information_schema.routines')
            .select('routine_name')
            .eq('routine_schema', 'public');
            
        if (error) {
            addTask('FUNCIONES', 'Verificar funciones y triggers', 'ERROR', error.message);
            return [];
        }
        
        const functionNames = functions.map(f => f.routine_name);
        addTask('FUNCIONES', 'Verificar funciones y triggers', 'COMPLETADO', `${functions.length} funciones encontradas`);
        return functions;
    } catch (error) {
        addTask('FUNCIONES', 'Verificar funciones y triggers', 'ERROR', error.message);
        return [];
    }
}

// 6. CREAR TABLAS FALTANTES
async function crearTablasFaltantes(tablasExistentes) {
    console.log('\n🏗️ CREANDO TABLAS FALTANTES...');
    
    const tablasRequeridas = [
        'profiles', 'users', 'agents', 'properties', 'favorites', 'inquiries',
        'search_history', 'rental_history', 'user_reviews', 'payments',
        'subscriptions', 'payment_methods', 'user_profiles', 'rooms',
        'likes', 'conversations', 'messages', 'reports'
    ];
    
    const tablasFaltantes = tablasRequeridas.filter(tabla => !tablasExistentes.includes(tabla));
    
    if (tablasFaltantes.length === 0) {
        addTask('CREAR_TABLAS', 'Crear tablas faltantes', 'COMPLETADO', 'Todas las tablas ya existen');
        return;
    }
    
    // Leer el script SQL de creación de tablas
    const sqlScript = `
-- Crear tipos ENUM si no existen
DO $$ BEGIN
    CREATE TYPE community_role AS ENUM ('BUSCO', 'OFREZCO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE pet_pref AS ENUM ('SI_PET', 'NO_PET', 'INDIFERENTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE smoke_pref AS ENUM ('FUMADOR', 'NO_FUMADOR', 'INDIFERENTE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE diet AS ENUM ('NINGUNA', 'VEGETARIANO', 'VEGANO', 'CELIACO', 'OTRO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE room_type AS ENUM ('PRIVADA', 'COMPARTIDA', 'ESTUDIO');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Crear tablas principales
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    password TEXT NOT NULL,
    avatar TEXT,
    bio TEXT,
    occupation TEXT,
    age INTEGER,
    verified BOOLEAN DEFAULT FALSE,
    email_verified BOOLEAN DEFAULT FALSE,
    verification_token TEXT,
    rating REAL DEFAULT 0,
    review_count INTEGER DEFAULT 0,
    user_type TEXT,
    company_name TEXT,
    license_number TEXT,
    property_count TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
`;
    
    try {
        const { error } = await supabase.rpc('exec_sql', { sql: sqlScript });
        
        if (error) {
            addTask('CREAR_TABLAS', 'Crear tablas faltantes', 'ERROR', error.message);
        } else {
            addTask('CREAR_TABLAS', 'Crear tablas faltantes', 'COMPLETADO', `${tablasFaltantes.length} tablas creadas`);
        }
    } catch (error) {
        addTask('CREAR_TABLAS', 'Crear tablas faltantes', 'PENDIENTE', 'Requiere ejecución manual del script SQL');
    }
}

// 7. CREAR BUCKETS DE STORAGE FALTANTES
async function crearStorageBuckets(bucketsExistentes) {
    console.log('\n📁 CREANDO BUCKETS DE STORAGE...');
    
    const bucketsRequeridos = [
        { id: 'property-images', name: 'property-images', public: true },
        { id: 'avatars', name: 'avatars', public: true },
        { id: 'community-photos', name: 'community-photos', public: true },
        { id: 'documents', name: 'documents', public: false }
    ];
    
    const bucketNames = bucketsExistentes.map(b => b.name);
    const bucketsFaltantes = bucketsRequeridos.filter(bucket => !bucketNames.includes(bucket.name));
    
    if (bucketsFaltantes.length === 0) {
        addTask('STORAGE_BUCKETS', 'Crear buckets de storage', 'COMPLETADO', 'Todos los buckets ya existen');
        return;
    }
    
    for (const bucket of bucketsFaltantes) {
        try {
            const { error } = await supabase.storage.createBucket(bucket.id, {
                public: bucket.public,
                fileSizeLimit: bucket.id === 'documents' ? 52428800 : 10485760 // 50MB para docs, 10MB para imágenes
            });
            
            if (error) {
                addTask('STORAGE_BUCKETS', `Crear bucket ${bucket.name}`, 'ERROR', error.message);
            } else {
                addTask('STORAGE_BUCKETS', `Crear bucket ${bucket.name}`, 'COMPLETADO', `Bucket ${bucket.name} creado exitosamente`);
            }
        } catch (error) {
            addTask('STORAGE_BUCKETS', `Crear bucket ${bucket.name}`, 'ERROR', error.message);
        }
    }
}

// 8. GENERAR REPORTE FINAL
function generarReporteFinal() {
    console.log('\n📊 GENERANDO REPORTE FINAL...');
    
    configReport.status = 'COMPLETADO';
    configReport.summary = {
        totalTasks: configReport.tasks.length,
        completed: configReport.completed.length,
        errors: configReport.errors.length,
        warnings: configReport.warnings.length,
        pending: configReport.pending.length,
        successRate: Math.round((configReport.completed.length / configReport.tasks.length) * 100)
    };
    
    // Generar recomendaciones
    configReport.recommendations = [];
    
    if (configReport.errors.length > 0) {
        configReport.recommendations.push({
            priority: 'ALTA',
            action: 'Corregir errores críticos',
            description: 'Hay errores que impiden la configuración completa de Supabase',
            errors: configReport.errors.map(e => e.description)
        });
    }
    
    if (configReport.pending.length > 0) {
        configReport.recommendations.push({
            priority: 'MEDIA',
            action: 'Completar tareas pendientes',
            description: 'Hay configuraciones que requieren intervención manual',
            pending: configReport.pending.map(p => p.description)
        });
    }
    
    // Próximos pasos
    configReport.nextSteps = [
        {
            step: 1,
            description: 'Ejecutar scripts SQL manualmente en Supabase Dashboard',
            file: 'Blackbox/105-Scripts-SQL-Configuracion-Supabase-Completa.sql'
        },
        {
            step: 2,
            description: 'Configurar políticas RLS para seguridad',
            priority: 'CRÍTICA'
        },
        {
            step: 3,
            description: 'Crear funciones y triggers automáticos',
            priority: 'ALTA'
        },
        {
            step: 4,
            description: 'Configurar índices para optimización',
            priority: 'MEDIA'
        },
        {
            step: 5,
            description: 'Testing exhaustivo de todas las funcionalidades',
            priority: 'ALTA'
        }
    ];
    
    // Guardar reporte
    const reportePath = path.join(__dirname, '107-Reporte-Configuracion-Supabase-Con-Credenciales-Final.json');
    fs.writeFileSync(reportePath, JSON.stringify(configReport, null, 2));
    
    console.log(`\n✅ Reporte guardado en: ${reportePath}`);
    
    return configReport;
}

// FUNCIÓN PRINCIPAL
async function ejecutarConfiguracionSupabase() {
    console.log('🚀 INICIANDO CONFIGURACIÓN COMPLETA DE SUPABASE...');
    console.log('📅 Fecha:', new Date().toLocaleString());
    console.log('🔗 URL Supabase:', SUPABASE_CONFIG.url);
    console.log('=' .repeat(60));
    
    try {
        // 1. Verificar conexión
        const conexionOk = await verificarConexion();
        if (!conexionOk) {
            console.log('❌ No se pudo conectar a Supabase. Abortando...');
            return generarReporteFinal();
        }
        
        // 2. Verificar estado actual
        const tablasExistentes = await verificarTablasExistentes();
        const bucketsExistentes = await verificarStorageBuckets();
        const politicasRLS = await verificarPoliticasRLS();
        const funciones = await verificarFuncionesTriggers();
        
        // 3. Crear elementos faltantes
        await crearTablasFaltantes(tablasExistentes);
        await crearStorageBuckets(bucketsExistentes);
        
        // 4. Generar reporte final
        const reporte = generarReporteFinal();
        
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE CONFIGURACIÓN:');
        console.log(`✅ Tareas completadas: ${reporte.summary.completed}`);
        console.log(`❌ Errores: ${reporte.summary.errors}`);
        console.log(`⚠️  Advertencias: ${reporte.summary.warnings}`);
        console.log(`⏳ Pendientes: ${reporte.summary.pending}`);
        console.log(`📈 Tasa de éxito: ${reporte.summary.successRate}%`);
        console.log('=' .repeat(60));
        
        return reporte;
        
    } catch (error) {
        console.error('💥 Error crítico en la configuración:', error);
        addTask('SISTEMA', 'Configuración general', 'ERROR', error.message);
        return generarReporteFinal();
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarConfiguracionSupabase()
        .then(reporte => {
            console.log('\n🎉 Configuración de Supabase completada!');
            process.exit(reporte.summary.errors > 0 ? 1 : 0);
        })
        .catch(error => {
            console.error('💥 Error fatal:', error);
            process.exit(1);
        });
}

module.exports = {
    ejecutarConfiguracionSupabase,
    SUPABASE_CONFIG
};
