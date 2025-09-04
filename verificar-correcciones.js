const { supabase } = require('./supabase-connection');

async function verificarCorrecciones() {
    console.log('🔍 VERIFICANDO CORRECCIONES APLICADAS');
    console.log('====================================\n');
    
    const verificaciones = [
        {
            nombre: 'Tabla properties',
            query: "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'properties' ORDER BY ordinal_position"
        },
        {
            nombre: 'Tabla auth.users',
            query: "SELECT count(*) as total FROM auth.users"
        },
        {
            nombre: 'Políticas RLS',
            query: "SELECT schemaname, tablename, policyname FROM pg_policies WHERE schemaname = 'public'"
        },
        {
            nombre: 'Funciones personalizadas',
            query: "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'"
        }
    ];
    
    let verificacionesExitosas = 0;
    
    for (const verificacion of verificaciones) {
        try {
            console.log(`🔄 Verificando: ${verificacion.nombre}`);
            
            const { data, error } = await supabase.rpc('exec_sql', { 
                sql_query: verificacion.query 
            });
            
            if (error) {
                console.log(`❌ Error en ${verificacion.nombre}:`, error.message);
            } else {
                console.log(`✅ ${verificacion.nombre}: OK`);
                if (data && Array.isArray(data)) {
                    console.log(`   📊 Resultados: ${data.length} registros`);
                }
                verificacionesExitosas++;
            }
        } catch (err) {
            console.log(`❌ Error verificando ${verificacion.nombre}:`, err.message);
        }
        
        console.log(''); // Línea en blanco
    }
    
    console.log(`📊 RESUMEN DE VERIFICACIÓN:`);
    console.log(`✅ Verificaciones exitosas: ${verificacionesExitosas}/${verificaciones.length}`);
    
    return verificacionesExitosas === verificaciones.length;
}

// Ejecutar si se llama directamente
if (require.main === module) {
    verificarCorrecciones()
        .then(exito => {
            if (exito) {
                console.log('🎉 Todas las verificaciones pasaron');
                process.exit(0);
            } else {
                console.log('⚠️  Algunas verificaciones fallaron');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error en verificación:', error.message);
            process.exit(1);
        });
}

module.exports = { verificarCorrecciones };
