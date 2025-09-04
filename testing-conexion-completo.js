const { verificarConexionCompleta } = require('./supabase-connection-alternativo');
const { aplicarCorreccionesEsquema } = require('./aplicar-correcciones-esquema');

async function ejecutarTestingCompleto() {
    console.log('🧪 TESTING COMPLETO DE CONEXIÓN SUPABASE');
    console.log('=========================================\n');
    
    let fase = 1;
    
    // Fase 1: Verificación inicial
    console.log(`📋 FASE ${fase++}: Verificación inicial de conexión`);
    console.log('─'.repeat(50));
    
    const resultadosIniciales = await verificarConexionCompleta();
    
    const puntuacionInicial = (
        (resultadosIniciales.conexionBasica ? 25 : 0) +
        (resultadosIniciales.tablas * 8.33) +
        (resultadosIniciales.storage ? 25 : 0) +
        (resultadosIniciales.scripts * 12.5)
    );
    
    console.log(`\n🎯 Puntuación inicial: ${Math.round(puntuacionInicial)}/100\n`);
    
    // Fase 2: Aplicar correcciones si es necesario
    if (puntuacionInicial < 75) {
        console.log(`📋 FASE ${fase++}: Aplicando correcciones de esquema`);
        console.log('─'.repeat(50));
        
        const correccionesAplicadas = await aplicarCorreccionesEsquema();
        console.log(`\n✅ Correcciones aplicadas: ${correccionesAplicadas}\n`);
        
        // Pausa para que las correcciones se apliquen
        console.log('⏳ Esperando que las correcciones se apliquen...');
        await new Promise(resolve => setTimeout(resolve, 3000));
    }
    
    // Fase 3: Verificación final
    console.log(`📋 FASE ${fase++}: Verificación final de conexión`);
    console.log('─'.repeat(50));
    
    const resultadosFinales = await verificarConexionCompleta();
    
    const puntuacionFinal = (
        (resultadosFinales.conexionBasica ? 25 : 0) +
        (resultadosFinales.tablas * 8.33) +
        (resultadosFinales.storage ? 25 : 0) +
        (resultadosFinales.scripts * 12.5)
    );
    
    console.log(`\n🎯 Puntuación final: ${Math.round(puntuacionFinal)}/100\n`);
    
    // Fase 4: Reporte final
    console.log(`📋 FASE ${fase++}: Reporte final`);
    console.log('─'.repeat(50));
    
    const mejora = puntuacionFinal - puntuacionInicial;
    
    console.log('📊 COMPARACIÓN DE RESULTADOS:');
    console.log(`   Puntuación inicial: ${Math.round(puntuacionInicial)}/100`);
    console.log(`   Puntuación final:   ${Math.round(puntuacionFinal)}/100`);
    console.log(`   Mejora:            ${mejora > 0 ? '+' : ''}${Math.round(mejora)} puntos`);
    
    console.log('\n🎯 ESTADO FINAL:');
    if (puntuacionFinal >= 90) {
        console.log('🎉 EXCELENTE - Supabase completamente funcional');
    } else if (puntuacionFinal >= 75) {
        console.log('✅ BUENO - Supabase funcional con configuración básica');
    } else if (puntuacionFinal >= 50) {
        console.log('⚠️  PARCIAL - Supabase parcialmente funcional');
    } else {
        console.log('❌ PROBLEMÁTICO - Supabase requiere configuración manual');
    }
    
    console.log('\n📋 PRÓXIMOS PASOS RECOMENDADOS:');
    if (puntuacionFinal >= 75) {
        console.log('1. ✅ Continuar con el desarrollo del proyecto');
        console.log('2. ✅ Ejecutar testing de funcionalidades específicas');
        console.log('3. ✅ Configurar datos de prueba si es necesario');
    } else {
        console.log('1. 🔧 Revisar configuración manual en Supabase Dashboard');
        console.log('2. 🔧 Verificar permisos de la service role key');
        console.log('3. 🔧 Contactar soporte si persisten los problemas');
    }
    
    return {
        inicial: resultadosIniciales,
        final: resultadosFinales,
        puntuacionInicial: Math.round(puntuacionInicial),
        puntuacionFinal: Math.round(puntuacionFinal),
        mejora: Math.round(mejora),
        estado: puntuacionFinal >= 75 ? 'FUNCIONAL' : 'REQUIERE_ATENCION'
    };
}

// Ejecutar si se llama directamente
if (require.main === module) {
    ejecutarTestingCompleto()
        .then(resultados => {
            console.log('\n🎉 Testing completo finalizado');
            
            if (resultados.estado === 'FUNCIONAL') {
                console.log('✅ Supabase está listo para usar');
                process.exit(0);
            } else {
                console.log('⚠️  Supabase requiere atención adicional');
                process.exit(1);
            }
        })
        .catch(error => {
            console.log('❌ Error en testing completo:', error.message);
            process.exit(1);
        });
}

module.exports = { ejecutarTestingCompleto };
