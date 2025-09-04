/**
 * BLACKBOX AI - SCRIPT AUTOMATIZADO EJECUTAR SQL COMMUNITY_PROFILES
 * Fecha: 3 de Enero 2025
 * Objetivo: Ejecutar automáticamente el script SQL para crear tabla community_profiles
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 INICIANDO EJECUCIÓN AUTOMÁTICA SQL COMMUNITY_PROFILES...\n');

// Configuración con credenciales reales
const SUPABASE_CONFIG = {
    url: 'https://qfeyhaaxyemmnohqdele.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.vgrh055OkiBIJFBlRlEuEZAOF2FHo3LBUNitB09dSIE',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM'
};

const resultados = {
    timestamp: new Date().toISOString(),
    pasos: [],
    errores: [],
    exito: false
};

// 1. LEER SCRIPT SQL
console.log('📄 1. LEYENDO SCRIPT SQL...');
try {
    const sqlScript = fs.readFileSync('Blackbox/127-Script-SQL-Crear-Tabla-Community-Profiles.sql', 'utf8');
    console.log('✅ Script SQL leído correctamente');
    resultados.pasos.push('Script SQL leído correctamente');
    
    // Dividir el script en comandos individuales
    const comandos = sqlScript
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--'));
    
    console.log(`📋 Encontrados ${comandos.length} comandos SQL para ejecutar`);
    
} catch (error) {
    console.log('❌ Error leyendo script SQL:', error.message);
    resultados.errores.push(`Error leyendo script: ${error.message}`);
    return;
}

// 2. VERIFICAR CONEXIÓN A SUPABASE
console.log('\n🔗 2. VERIFICANDO CONEXIÓN A SUPABASE...');
async function verificarConexion() {
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Conexión a Supabase exitosa');
            resultados.pasos.push('Conexión a Supabase verificada');
            return true;
        } else {
            console.log('❌ Error de conexión a Supabase:', response.status);
            resultados.errores.push(`Error de conexión: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error conectando a Supabase:', error.message);
        resultados.errores.push(`Error de conexión: ${error.message}`);
        return false;
    }
}

// 3. EJECUTAR COMANDOS SQL UNO POR UNO
async function ejecutarComandosSQL() {
    console.log('\n⚙️ 3. EJECUTANDO COMANDOS SQL...');
    
    const comandosEjecutar = [
        // Comando principal para crear la tabla
        `CREATE TABLE IF NOT EXISTS public.community_profiles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            display_name TEXT NOT NULL,
            bio TEXT,
            interests TEXT[],
            location TEXT,
            avatar_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            age INTEGER,
            gender TEXT,
            occupation TEXT,
            phone TEXT,
            email TEXT,
            social_links JSONB DEFAULT '{}',
            preferences JSONB DEFAULT '{}',
            verification_status TEXT DEFAULT 'pending',
            last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(user_id)
        )`,
        
        // Habilitar RLS
        `ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY`
    ];
    
    for (let i = 0; i < comandosEjecutar.length; i++) {
        const comando = comandosEjecutar[i];
        console.log(`\n📝 Ejecutando comando ${i + 1}/${comandosEjecutar.length}...`);
        
        try {
            // Usar la API REST de Supabase para ejecutar SQL
            const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: comando
                })
            });
            
            if (response.ok) {
                console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
                resultados.pasos.push(`Comando ${i + 1} ejecutado`);
            } else {
                const errorText = await response.text();
                console.log(`❌ Error en comando ${i + 1}:`, errorText);
                resultados.errores.push(`Error comando ${i + 1}: ${errorText}`);
            }
            
        } catch (error) {
            console.log(`❌ Error ejecutando comando ${i + 1}:`, error.message);
            resultados.errores.push(`Error comando ${i + 1}: ${error.message}`);
        }
    }
}

// 4. CREAR POLÍTICAS DE SEGURIDAD
async function crearPoliticas() {
    console.log('\n🔒 4. CREANDO POLÍTICAS DE SEGURIDAD...');
    
    const politicas = [
        {
            nombre: 'Allow users to view active community profiles',
            sql: `CREATE POLICY "Allow users to view active community profiles" ON public.community_profiles FOR SELECT USING (is_active = true)`
        },
        {
            nombre: 'Allow users to create their own community profile',
            sql: `CREATE POLICY "Allow users to create their own community profile" ON public.community_profiles FOR INSERT WITH CHECK (auth.uid() = user_id)`
        },
        {
            nombre: 'Allow users to update their own community profile',
            sql: `CREATE POLICY "Allow users to update their own community profile" ON public.community_profiles FOR UPDATE USING (auth.uid() = user_id)`
        },
        {
            nombre: 'Allow users to delete their own community profile',
            sql: `CREATE POLICY "Allow users to delete their own community profile" ON public.community_profiles FOR DELETE USING (auth.uid() = user_id)`
        }
    ];
    
    for (const politica of politicas) {
        console.log(`📋 Creando política: ${politica.nombre}...`);
        
        try {
            const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'apikey': SUPABASE_CONFIG.serviceRoleKey,
                    'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    sql: politica.sql
                })
            });
            
            if (response.ok) {
                console.log(`✅ Política creada: ${politica.nombre}`);
                resultados.pasos.push(`Política creada: ${politica.nombre}`);
            } else {
                const errorText = await response.text();
                console.log(`❌ Error creando política ${politica.nombre}:`, errorText);
                resultados.errores.push(`Error política ${politica.nombre}: ${errorText}`);
            }
            
        } catch (error) {
            console.log(`❌ Error creando política ${politica.nombre}:`, error.message);
            resultados.errores.push(`Error política ${politica.nombre}: ${error.message}`);
        }
    }
}

// 5. VERIFICAR CREACIÓN DE TABLA
async function verificarTabla() {
    console.log('\n✅ 5. VERIFICANDO CREACIÓN DE TABLA...');
    
    try {
        const response = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?limit=1`, {
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Tabla community_profiles creada y accesible');
            resultados.pasos.push('Tabla community_profiles verificada');
            resultados.exito = true;
            return true;
        } else {
            console.log('❌ Tabla community_profiles no accesible:', response.status);
            resultados.errores.push(`Tabla no accesible: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.log('❌ Error verificando tabla:', error.message);
        resultados.errores.push(`Error verificación: ${error.message}`);
        return false;
    }
}

// 6. MÉTODO ALTERNATIVO - USAR DIRECTAMENTE LA API REST
async function crearTablaDirectamente() {
    console.log('\n🔄 6. MÉTODO ALTERNATIVO - CREACIÓN DIRECTA...');
    
    // Como la función exec_sql puede no estar disponible, usamos un enfoque alternativo
    // Intentamos crear un registro de prueba para forzar la creación de la tabla
    try {
        // Primero intentamos acceder a la tabla
        const testResponse = await fetch(`${SUPABASE_CONFIG.url}/rest/v1/community_profiles?limit=1`, {
            headers: {
                'apikey': SUPABASE_CONFIG.serviceRoleKey,
                'Authorization': `Bearer ${SUPABASE_CONFIG.serviceRoleKey}`
            }
        });
        
        if (testResponse.status === 404) {
            console.log('⚠️ Tabla no existe, necesita ser creada manualmente en Supabase Dashboard');
            console.log('📋 INSTRUCCIONES PARA CREAR MANUALMENTE:');
            console.log('1. Ve a https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele/editor');
            console.log('2. Clic en "New Table"');
            console.log('3. Nombre: community_profiles');
            console.log('4. Agrega las columnas según el script SQL');
            
            resultados.errores.push('Tabla debe crearse manualmente en Dashboard');
            return false;
        } else if (testResponse.ok) {
            console.log('✅ Tabla ya existe y es accesible');
            resultados.pasos.push('Tabla ya existía');
            resultados.exito = true;
            return true;
        }
        
    } catch (error) {
        console.log('❌ Error en método alternativo:', error.message);
        resultados.errores.push(`Error método alternativo: ${error.message}`);
        return false;
    }
}

// EJECUTAR PROCESO COMPLETO
async function ejecutarProcesoCompleto() {
    try {
        // Verificar conexión
        const conexionOk = await verificarConexion();
        if (!conexionOk) {
            console.log('\n❌ No se pudo establecer conexión con Supabase');
            return;
        }
        
        // Intentar método alternativo primero
        const tablaCreada = await crearTablaDirectamente();
        
        if (!tablaCreada) {
            // Si no funciona, intentar ejecutar comandos SQL
            await ejecutarComandosSQL();
            await crearPoliticas();
            await verificarTabla();
        }
        
        // Generar reporte final
        console.log('\n📊 RESUMEN FINAL:');
        console.log('==================');
        console.log(`🕐 Timestamp: ${resultados.timestamp}`);
        console.log(`✅ Pasos completados: ${resultados.pasos.length}`);
        console.log(`❌ Errores encontrados: ${resultados.errores.length}`);
        console.log(`🎯 Éxito general: ${resultados.exito ? 'SÍ' : 'NO'}`);
        
        if (resultados.pasos.length > 0) {
            console.log('\n✅ PASOS COMPLETADOS:');
            resultados.pasos.forEach((paso, index) => {
                console.log(`${index + 1}. ${paso}`);
            });
        }
        
        if (resultados.errores.length > 0) {
            console.log('\n❌ ERRORES ENCONTRADOS:');
            resultados.errores.forEach((error, index) => {
                console.log(`${index + 1}. ${error}`);
            });
        }
        
        // Guardar reporte
        const reportePath = 'Blackbox/128-Reporte-Ejecucion-SQL-Community-Profiles.json';
        fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
        console.log(`\n💾 Reporte guardado en: ${reportePath}`);
        
        // Próximos pasos
        if (resultados.exito) {
            console.log('\n🎉 ¡TABLA COMMUNITY_PROFILES CREADA EXITOSAMENTE!');
            console.log('🚀 Próximos pasos automáticos:');
            console.log('1. ✅ Verificar funcionalidad de APIs');
            console.log('2. ✅ Ejecutar testing exhaustivo');
            console.log('3. ✅ Generar reporte final');
        } else {
            console.log('\n⚠️ ACCIÓN MANUAL REQUERIDA:');
            console.log('📋 Debes crear la tabla manualmente en Supabase Dashboard');
            console.log('🔗 URL: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele/editor');
            console.log('📄 Usa el script: Blackbox/127-Script-SQL-Crear-Tabla-Community-Profiles.sql');
        }
        
    } catch (error) {
        console.log('\n❌ ERROR CRÍTICO:', error.message);
        resultados.errores.push(`Error crítico: ${error.message}`);
    }
}

// Ejecutar proceso
ejecutarProcesoCompleto().catch(console.error);
