/**
 * BLACKBOX AI - AUDITORÍA COMPLETA ESTADO ACTUAL PROYECTO
 * Fecha: 3 de Enero 2025
 * Objetivo: Verificar estado actual antes de implementar correcciones automáticas
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO AUDITORÍA COMPLETA ESTADO ACTUAL...\n');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

const auditResults = {
    timestamp: new Date().toISOString(),
    configuracionManual: {
        completada: false,
        detalles: []
    },
    archivosEsenciales: {
        existentes: [],
        faltantes: []
    },
    baseDatos: {
        conexion: false,
        tablas: [],
        problemas: []
    },
    autenticacion: {
        configurada: false,
        problemas: []
    },
    storage: {
        configurado: false,
        buckets: [],
        policies: []
    },
    apis: {
        funcionando: [],
        fallando: []
    },
    frontend: {
        compilando: false,
        errores: []
    }
};

// 1. VERIFICAR ARCHIVOS ESENCIALES
console.log('📁 1. VERIFICANDO ARCHIVOS ESENCIALES...');

const archivosEsenciales = [
    'Backend/.env',
    'Backend/package.json',
    'Backend/prisma/schema.prisma',
    'Backend/src/lib/supabase/client.ts',
    'Backend/src/lib/supabase/server.ts',
    'Backend/src/middleware.ts',
    'Backend/src/app/api/auth/register/route.ts',
    'Backend/src/app/api/properties/route.ts'
];

archivosEsenciales.forEach(archivo => {
    if (fs.existsSync(archivo)) {
        auditResults.archivosEsenciales.existentes.push(archivo);
        console.log(`✅ ${archivo}`);
    } else {
        auditResults.archivosEsenciales.faltantes.push(archivo);
        console.log(`❌ ${archivo} - FALTANTE`);
    }
});

// 2. VERIFICAR VARIABLES DE ENTORNO
console.log('\n🔧 2. VERIFICANDO VARIABLES DE ENTORNO...');

try {
    const envContent = fs.readFileSync('Backend/.env', 'utf8');
    const requiredVars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'DIRECT_URL'
    ];
    
    requiredVars.forEach(varName => {
        if (envContent.includes(varName)) {
            console.log(`✅ ${varName} - PRESENTE`);
        } else {
            console.log(`❌ ${varName} - FALTANTE`);
            auditResults.configuracionManual.detalles.push(`Variable ${varName} faltante`);
        }
    });
    
    // Verificar que las URLs coincidan
    if (envContent.includes(SUPABASE_CONFIG.url)) {
        console.log('✅ URL de Supabase correcta');
    } else {
        console.log('❌ URL de Supabase incorrecta');
    }
    
} catch (error) {
    console.log('❌ Error leyendo .env:', error.message);
}

// 3. VERIFICAR CONEXIÓN A SUPABASE
console.log('\n🔗 3. VERIFICANDO CONEXIÓN A SUPABASE...');

async function testSupabaseConnection() {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexión a Supabase exitosa');
            auditResults.baseDatos.conexion = true;
        } else {
            console.log('❌ Error de conexión a Supabase:', response.status);
        }
    } catch (error) {
        console.log('❌ Error conectando a Supabase:', error.message);
    }
}

// 4. VERIFICAR TABLAS EN SUPABASE
async function checkSupabaseTables() {
    console.log('\n📊 4. VERIFICANDO TABLAS EN SUPABASE...');
    
    const tablasEsenciales = [
        'properties',
        'users',
        'profiles',
        'community_profiles'
    ];
    
    for (const tabla of tablasEsenciales) {
        try {
            const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/${tabla}?limit=1`, {
                headers: {
                    'apikey': SUPABASE_CONFIG.anonKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
                }
            });
            
            if (response.ok) {
                console.log(`✅ Tabla ${tabla} existe`);
                auditResults.baseDatos.tablas.push(tabla);
            } else {
                console.log(`❌ Tabla ${tabla} no existe o sin acceso`);
                auditResults.baseDatos.problemas.push(`Tabla ${tabla} faltante`);
            }
        } catch (error) {
            console.log(`❌ Error verificando tabla ${tabla}:`, error.message);
        }
    }
}

// 5. VERIFICAR STORAGE BUCKETS
async function checkStorageBuckets() {
    console.log('\n🗄️ 5. VERIFICANDO STORAGE BUCKETS...');
    
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/storage/v1/bucket`, {
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
            }
        });
        
        if (response.ok) {
            const buckets = await response.json();
            console.log('✅ Storage accesible');
            console.log('📦 Buckets encontrados:', buckets.map(b => b.name));
            auditResults.storage.buckets = buckets.map(b => b.name);
            auditResults.storage.configurado = true;
        } else {
            console.log('❌ Error accediendo a Storage:', response.status);
        }
    } catch (error) {
        console.log('❌ Error verificando Storage:', error.message);
    }
}

// 6. VERIFICAR COMPILACIÓN DEL PROYECTO
console.log('\n⚙️ 6. VERIFICANDO ESTADO DE COMPILACIÓN...');

try {
    const packageJson = JSON.parse(fs.readFileSync('Backend/package.json', 'utf8'));
    console.log('✅ package.json válido');
    console.log('📦 Dependencias principales:', Object.keys(packageJson.dependencies || {}).slice(0, 5));
    
    // Verificar si hay errores de TypeScript obvios
    const tsConfigExists = fs.existsSync('Backend/tsconfig.json');
    console.log(tsConfigExists ? '✅ tsconfig.json existe' : '❌ tsconfig.json faltante');
    
} catch (error) {
    console.log('❌ Error verificando package.json:', error.message);
    auditResults.frontend.errores.push('package.json inválido');
}

// 7. IDENTIFICAR PROBLEMAS CRÍTICOS
console.log('\n🚨 7. IDENTIFICANDO PROBLEMAS CRÍTICOS...');

const problemasCriticos = [];

// Verificar tabla community_profiles específicamente
async function checkCommunityProfiles() {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?limit=1`, {
            headers: {
                'apikey': SUPABASE_CONFIG.anonKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.anonKey}`
            }
        });
        
        if (!response.ok) {
            problemasCriticos.push('TABLA COMMUNITY_PROFILES FALTANTE');
            console.log('🚨 CRÍTICO: Tabla community_profiles no existe');
        } else {
            console.log('✅ Tabla community_profiles existe');
        }
    } catch (error) {
        problemasCriticos.push('ERROR CONEXIÓN COMMUNITY_PROFILES');
        console.log('🚨 CRÍTICO: Error verificando community_profiles');
    }
}

// EJECUTAR AUDITORÍA COMPLETA
async function runCompleteAudit() {
    await testSupabaseConnection();
    await checkSupabaseTables();
    await checkStorageBuckets();
    await checkCommunityProfiles();
    
    // Resumen final
    console.log('\n📋 RESUMEN DE AUDITORÍA:');
    console.log('========================');
    console.log(`🕐 Timestamp: ${auditResults.timestamp}`);
    console.log(`📁 Archivos existentes: ${auditResults.archivosEsenciales.existentes.length}/${archivosEsenciales.length}`);
    console.log(`🔗 Conexión BD: ${auditResults.baseDatos.conexion ? 'OK' : 'FALLA'}`);
    console.log(`📊 Tablas encontradas: ${auditResults.baseDatos.tablas.length}`);
    console.log(`🗄️ Storage configurado: ${auditResults.storage.configurado ? 'OK' : 'FALLA'}`);
    console.log(`🚨 Problemas críticos: ${problemasCriticos.length}`);
    
    if (problemasCriticos.length > 0) {
        console.log('\n🚨 PROBLEMAS CRÍTICOS DETECTADOS:');
        problemasCriticos.forEach((problema, index) => {
            console.log(`${index + 1}. ${problema}`);
        });
    }
    
    // Guardar resultados
    auditResults.problemasCriticos = problemasCriticos;
    
    const reportPath = 'Blackbox/125-Reporte-Auditoria-Estado-Actual.json';
    fs.writeFileSync(reportPath, JSON.stringify(auditResults, null, 2));
    console.log(`\n💾 Reporte guardado en: ${reportPath}`);
    
    // Determinar próximos pasos
    console.log('\n🎯 PRÓXIMOS PASOS AUTOMÁTICOS:');
    if (problemasCriticos.includes('TABLA COMMUNITY_PROFILES FALTANTE')) {
        console.log('1. ✅ Crear tabla community_profiles');
    }
    if (!auditResults.baseDatos.conexion) {
        console.log('2. ✅ Corregir configuración de conexión');
    }
    if (!auditResults.storage.configurado) {
        console.log('3. ✅ Configurar storage y policies');
    }
    
    console.log('\n🤖 INICIANDO CORRECCIONES AUTOMÁTICAS...');
    return auditResults;
}

// Ejecutar auditoría
runCompleteAudit().catch(console.error);
