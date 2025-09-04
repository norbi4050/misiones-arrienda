const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales reales
const supabaseUrl = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

// Crear cliente de Supabase con permisos de administrador
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// Función para verificar conexión básica
async function verificarConexionBasica() {
    console.log('🔍 Verificando conexión básica a Supabase...');
    
    try {
        // Intentar una consulta simple a auth.users
        const { data, error } = await supabase.auth.admin.listUsers();
        
        if (error) {
            console.log('❌ Error de conexión auth:', error.message);
            return false;
        }
        
        console.log('✅ Conexión a Supabase Auth exitosa');
        console.log(`📊 Usuarios encontrados: ${data.users ? data.users.length : 0}`);
        return true;
    } catch (err) {
        console.log('❌ Error de conexión:', err.message);
        return false;
    }
}

// Función para verificar tablas existentes
async function verificarTablasExistentes() {
    console.log('\n🔍 Verificando tablas existentes...');
    
    const tablasEsperadas = ['properties', 'users', 'profiles'];
    let tablasEncontradas = 0;
    
    for (const tabla of tablasEsperadas) {
        try {
            const { data, error } = await supabase
                .from(tabla)
                .select('*')
                .limit(1);
            
            if (error) {
                console.log(`❌ Tabla '${tabla}': ${error.message}`);
            } else {
                console.log(`✅ Tabla '${tabla}': Accesible`);
                tablasEncontradas++;
            }
        } catch (err) {
            console.log(`❌ Error verificando tabla '${tabla}':`, err.message);
        }
    }
    
    console.log(`\n📊 Tablas encontradas: ${tablasEncontradas}/${tablasEsperadas.length}`);
    return tablasEncontradas;
}

// Función para verificar storage
async function verificarStorage() {
    console.log('\n🔍 Verificando Supabase Storage...');
    
    try {
        const { data, error } = await supabase.storage.listBuckets();
        
        if (error) {
            console.log('❌ Error accediendo a Storage:', error.message);
            return false;
        }
        
        console.log('✅ Supabase Storage accesible');
        console.log(`📊 Buckets encontrados: ${data ? data.length : 0}`);
        
        if (data && data.length > 0) {
            data.forEach(bucket => {
                console.log(`  - ${bucket.name} (público: ${bucket.public})`);
            });
        }
        
        return true;
    } catch (err) {
        console.log('❌ Error verificando Storage:', err.message);
        return false;
    }
}

// Función para ejecutar scripts SQL básicos
async function ejecutarScriptsBasicos() {
    console.log('\n🔧 Ejecutando scripts SQL básicos...');
    
    const scriptsBasicos = [
        {
            nombre: 'Verificar extensiones',
            sql: "SELECT extname FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto');"
        },
        {
            nombre: 'Verificar esquemas',
            sql: "SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('public', 'auth', 'storage');"
        }
    ];
    
    let scriptosEjecutados = 0;
    
    for (const script of scriptsBasicos) {
        try {
            console.log(`🔄 Ejecutando: ${script.nombre}`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: script.sql 
            });
            
            if (error) {
                console.log(`❌ Error en ${script.nombre}:`, error.message);
            } else {
                console.log(`✅ ${script.nombre}: Ejecutado exitosamente`);
                if (data && Array.isArray(data)) {
                    console.log(`   📊 Resultados: ${data.length} registros`);
                }
                scriptosEjecutados++;
            }
        } catch (err) {
            console.log(`❌ Error ejecutando ${script.nombre}:`, err.message);
        }
    }
    
    return scriptosEjecutados;
}

// Función principal de verificación
async function verificarConexionCompleta() {
    console.log('🚀 VERIFICACIÓN COMPLETA DE CONEXIÓN');
    console.log('====================================\n');
    
    const resultados = {
        conexionBasica: false,
        tablas: 0,
        storage: false,
        scripts: 0
    };
    
    // Verificar conexión básica
    resultados.conexionBasica = await verificarConexionBasica();
    
    // Verificar tablas
    resultados.tablas = await verificarTablasExistentes();
    
    // Verificar storage
    resultados.storage = await verificarStorage();
    
    // Ejecutar scripts básicos
    resultados.scripts = await ejecutarScriptsBasicos();
    
    console.log('\n📊 RESUMEN DE VERIFICACIÓN:');
    console.log('============================');
    console.log(`🔗 Conexión básica: ${resultados.conexionBasica ? '✅ OK' : '❌ Error'}`);
    console.log(`📋 Tablas accesibles: ${resultados.tablas}/3`);
    console.log(`💾 Storage: ${resultados.storage ? '✅ OK' : '❌ Error'}`);
    console.log(`🔧 Scripts ejecutados: ${resultados.scripts}/2`);
    
    const puntuacion = (
        (resultados.conexionBasica ? 25 : 0) +
        (resultados.tablas * 8.33) +
        (resultados.storage ? 25 : 0) +
        (resultados.scripts * 12.5)
    );
    
    console.log(`\n🎯 PUNTUACIÓN TOTAL: ${Math.round(puntuacion)}/100`);
    
    if (puntuacion >= 75) {
        console.log('🎉 Conexión a Supabase: EXCELENTE');
    } else if (puntuacion >= 50) {
        console.log('⚠️  Conexión a Supabase: PARCIAL - Requiere atención');
    } else {
        console.log('❌ Conexión a Supabase: PROBLEMÁTICA - Requiere configuración');
    }
    
    return resultados;
}

module.exports = {
    supabase,
    verificarConexionBasica,
    verificarTablasExistentes,
    verificarStorage,
    ejecutarScriptsBasicos,
    verificarConexionCompleta
};

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarConexionCompleta()
        .then(resultados => {
            const puntuacion = (
                (resultados.conexionBasica ? 25 : 0) +
                (resultados.tablas * 8.33) +
                (resultados.storage ? 25 : 0) +
                (resultados.scripts * 12.5)
            );
            
            if (puntuacion >= 50) {
                console.log('\n✅ Verificación completada exitosamente');
                process.exit(0);
            } else {
                console.log('\n⚠️  Verificación completada con problemas');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error fatal en verificación:', error.message);
            process.exit(1);
        });
}
