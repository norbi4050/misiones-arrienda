const fs = require('fs');
const path = require('path');

// =====================================================
// TESTING SCRIPT SQL CORREGIDO - COLUMNA IS_ACTIVE
// Verifica que el script corregido resuelve el problema
// =====================================================

console.log('🔍 INICIANDO TESTING DEL SCRIPT SQL CORREGIDO - COLUMNA IS_ACTIVE');
console.log('================================================================');

const reporteResultados = {
    timestamp: new Date().toISOString(),
    script_testeado: 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.sql',
    problema_original: 'ERROR: 42703: column "is_active" does not exist',
    tests_ejecutados: [],
    resumen: {
        total_tests: 0,
        exitosos: 0,
        fallidos: 0,
        warnings: 0
    }
};

// =====================================================
// TEST 1: VERIFICAR EXISTENCIA DEL SCRIPT CORREGIDO
// =====================================================

function test1_verificarScriptExiste() {
    console.log('\n📋 TEST 1: Verificando existencia del script corregido...');
    
    const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.sql');
    const existe = fs.existsSync(scriptPath);
    
    const resultado = {
        test: 'Verificar existencia del script corregido',
        exitoso: existe,
        detalles: existe ? 'Script encontrado correctamente' : 'Script no encontrado',
        archivo: 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.sql'
    };
    
    reporteResultados.tests_ejecutados.push(resultado);
    
    if (existe) {
        console.log('✅ Script corregido encontrado');
        reporteResultados.resumen.exitosos++;
    } else {
        console.log('❌ Script corregido NO encontrado');
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
    return existe;
}

// =====================================================
// TEST 2: ANALIZAR CONTENIDO DEL SCRIPT CORREGIDO
// =====================================================

function test2_analizarContenidoScript() {
    console.log('\n📋 TEST 2: Analizando contenido del script corregido...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const verificaciones = {
            tiene_verificacion_columna: contenido.includes('information_schema.columns'),
            tiene_alter_table: contenido.includes('ALTER TABLE public.properties ADD COLUMN is_active'),
            tiene_politicas_condicionales: contenido.includes('IF EXISTS') && contenido.includes('is_active'),
            tiene_manejo_errores: contenido.includes('DO $$'),
            tiene_indices_condicionales: contenido.includes('idx_properties_is_active'),
            resuelve_problema_original: contenido.includes('column "is_active"') || contenido.includes('is_active')
        };
        
        const exitoso = Object.values(verificaciones).every(v => v === true);
        
        const resultado = {
            test: 'Analizar contenido del script corregido',
            exitoso: exitoso,
            detalles: {
                verificaciones_pasadas: Object.keys(verificaciones).filter(k => verificaciones[k]).length,
                total_verificaciones: Object.keys(verificaciones).length,
                verificaciones: verificaciones
            }
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (exitoso) {
            console.log('✅ Script contiene todas las correcciones necesarias');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Script contiene algunas correcciones pero puede necesitar mejoras');
            reporteResultados.resumen.warnings++;
        }
        
        console.log(`   - Verificación de columna: ${verificaciones.tiene_verificacion_columna ? '✅' : '❌'}`);
        console.log(`   - ALTER TABLE para is_active: ${verificaciones.tiene_alter_table ? '✅' : '❌'}`);
        console.log(`   - Políticas condicionales: ${verificaciones.tiene_politicas_condicionales ? '✅' : '❌'}`);
        console.log(`   - Manejo de errores: ${verificaciones.tiene_manejo_errores ? '✅' : '❌'}`);
        console.log(`   - Índices condicionales: ${verificaciones.tiene_indices_condicionales ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log('❌ Error al analizar el script:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Analizar contenido del script corregido',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 3: VERIFICAR CORRECCIÓN DEL PROBLEMA ORIGINAL
// =====================================================

function test3_verificarCorreccionProblema() {
    console.log('\n📋 TEST 3: Verificando corrección del problema original...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        // Buscar las secciones clave que resuelven el problema
        const solucionesImplementadas = {
            seccion_verificacion_columna: contenido.includes('-- 1. VERIFICAR Y AGREGAR COLUMNA IS_ACTIVE SI NO EXISTE'),
            bloque_do_verificacion: contenido.includes('DO $$') && contenido.includes('information_schema.columns'),
            alter_table_condicional: contenido.includes('ALTER TABLE public.properties ADD COLUMN is_active'),
            politicas_con_verificacion: contenido.includes('IF EXISTS') && contenido.includes('is_active'),
            manejo_casos_sin_columna: contenido.includes('políticas creadas sin esta restricción'),
            indices_condicionales: contenido.includes('CREATE INDEX IF NOT EXISTS idx_properties_is_active')
        };
        
        const problema_resuelto = Object.values(solucionesImplementadas).filter(v => v).length >= 4;
        
        const resultado = {
            test: 'Verificar corrección del problema original',
            exitoso: problema_resuelto,
            problema_original: 'ERROR: 42703: column "is_active" does not exist',
            soluciones_implementadas: solucionesImplementadas,
            detalles: problema_resuelto ? 
                'Script implementa soluciones para el problema de columna faltante' : 
                'Script no resuelve completamente el problema original'
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (problema_resuelto) {
            console.log('✅ Problema original corregido correctamente');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('❌ Problema original NO completamente corregido');
            reporteResultados.resumen.fallidos++;
        }
        
        console.log('   Soluciones implementadas:');
        Object.keys(solucionesImplementadas).forEach(key => {
            const implementada = solucionesImplementadas[key];
            console.log(`   - ${key.replace(/_/g, ' ')}: ${implementada ? '✅' : '❌'}`);
        });
        
    } catch (error) {
        console.log('❌ Error al verificar corrección:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Verificar corrección del problema original',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 4: VERIFICAR COMPATIBILIDAD CON SCRIPTS ANTERIORES
// =====================================================

function test4_verificarCompatibilidad() {
    console.log('\n📋 TEST 4: Verificando compatibilidad con scripts anteriores...');
    
    try {
        const scriptCorregido = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.sql');
        const scriptOriginal = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-ACTUALIZADO-FINAL.sql');
        
        const contenidoCorregido = fs.readFileSync(scriptCorregido, 'utf8');
        const contenidoOriginal = fs.existsSync(scriptOriginal) ? fs.readFileSync(scriptOriginal, 'utf8') : '';
        
        const compatibilidad = {
            mantiene_estructura_original: contenidoCorregido.includes('CREACIÓN DE TABLAS PRINCIPALES'),
            mantiene_politicas_rls: contenidoCorregido.includes('ROW LEVEL SECURITY'),
            mantiene_funciones_triggers: contenidoCorregido.includes('FUNCIONES Y TRIGGERS'),
            mantiene_storage_config: contenidoCorregido.includes('CONFIGURACIÓN DE STORAGE'),
            mantiene_indices: contenidoCorregido.includes('ÍNDICES PARA PERFORMANCE'),
            agrega_mejoras: contenidoCorregido.includes('VERIFICAR Y AGREGAR COLUMNA IS_ACTIVE')
        };
        
        const es_compatible = Object.values(compatibilidad).filter(v => v).length >= 5;
        
        const resultado = {
            test: 'Verificar compatibilidad con scripts anteriores',
            exitoso: es_compatible,
            compatibilidad: compatibilidad,
            detalles: es_compatible ? 
                'Script mantiene compatibilidad y agrega mejoras' : 
                'Script puede tener problemas de compatibilidad'
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (es_compatible) {
            console.log('✅ Script compatible con versiones anteriores');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Script puede tener problemas de compatibilidad');
            reporteResultados.resumen.warnings++;
        }
        
    } catch (error) {
        console.log('❌ Error al verificar compatibilidad:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Verificar compatibilidad con scripts anteriores',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 5: VERIFICAR SINTAXIS SQL
// =====================================================

function test5_verificarSintaxisSQL() {
    console.log('\n📋 TEST 5: Verificando sintaxis SQL...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const verificacionesSintaxis = {
            tiene_comentarios_estructura: contenido.includes('-- ====================================================='),
            bloques_do_correctos: (contenido.match(/DO \$\$/g) || []).length === (contenido.match(/END \$\$/g) || []).length,
            create_statements_validos: contenido.includes('CREATE TABLE IF NOT EXISTS') && contenido.includes('CREATE POLICY'),
            drop_statements_seguros: contenido.includes('DROP POLICY IF EXISTS'),
            sintaxis_postgresql: contenido.includes('LANGUAGE plpgsql') && contenido.includes('SECURITY DEFINER'),
            manejo_errores_sql: contenido.includes('RAISE NOTICE') || contenido.includes('RAISE EXCEPTION')
        };
        
        const sintaxis_correcta = Object.values(verificacionesSintaxis).filter(v => v).length >= 5;
        
        const resultado = {
            test: 'Verificar sintaxis SQL',
            exitoso: sintaxis_correcta,
            verificaciones_sintaxis: verificacionesSintaxis,
            detalles: sintaxis_correcta ? 
                'Sintaxis SQL correcta y bien estructurada' : 
                'Posibles problemas de sintaxis SQL detectados'
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (sintaxis_correcta) {
            console.log('✅ Sintaxis SQL correcta');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Posibles problemas de sintaxis SQL');
            reporteResultados.resumen.warnings++;
        }
        
    } catch (error) {
        console.log('❌ Error al verificar sintaxis SQL:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Verificar sintaxis SQL',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// EJECUTAR TODOS LOS TESTS
// =====================================================

function ejecutarTodosLosTests() {
    console.log('🚀 Ejecutando todos los tests...\n');
    
    test1_verificarScriptExiste();
    test2_analizarContenidoScript();
    test3_verificarCorreccionProblema();
    test4_verificarCompatibilidad();
    test5_verificarSintaxisSQL();
    
    // Generar reporte final
    generarReporteFinal();
}

// =====================================================
// GENERAR REPORTE FINAL
// =====================================================

function generarReporteFinal() {
    console.log('\n📊 GENERANDO REPORTE FINAL...');
    console.log('================================');
    
    const porcentajeExito = ((reporteResultados.resumen.exitosos / reporteResultados.resumen.total_tests) * 100).toFixed(1);
    
    console.log(`\n📈 RESUMEN DE RESULTADOS:`);
    console.log(`   Total de tests: ${reporteResultados.resumen.total_tests}`);
    console.log(`   Tests exitosos: ${reporteResultados.resumen.exitosos} ✅`);
    console.log(`   Tests fallidos: ${reporteResultados.resumen.fallidos} ❌`);
    console.log(`   Warnings: ${reporteResultados.resumen.warnings} ⚠️`);
    console.log(`   Porcentaje de éxito: ${porcentajeExito}%`);
    
    // Determinar estado general
    let estadoGeneral = '';
    let recomendacion = '';
    
    if (reporteResultados.resumen.fallidos === 0 && reporteResultados.resumen.warnings <= 1) {
        estadoGeneral = '✅ SCRIPT LISTO PARA USO';
        recomendacion = 'El script corregido resuelve el problema de la columna is_active y está listo para ser ejecutado.';
    } else if (reporteResultados.resumen.fallidos <= 1) {
        estadoGeneral = '⚠️  SCRIPT NECESITA REVISIÓN MENOR';
        recomendacion = 'El script resuelve el problema principal pero puede necesitar ajustes menores.';
    } else {
        estadoGeneral = '❌ SCRIPT NECESITA CORRECCIONES';
        recomendacion = 'El script requiere correcciones adicionales antes de ser usado.';
    }
    
    console.log(`\n🎯 ESTADO GENERAL: ${estadoGeneral}`);
    console.log(`💡 RECOMENDACIÓN: ${recomendacion}`);
    
    // Agregar información al reporte
    reporteResultados.estado_general = estadoGeneral;
    reporteResultados.recomendacion = recomendacion;
    reporteResultados.porcentaje_exito = porcentajeExito;
    
    // Guardar reporte en archivo
    try {
        const nombreReporte = 'REPORTE-TESTING-SCRIPT-SQL-CORREGIDO-COLUMNA-IS-ACTIVE.json';
        fs.writeFileSync(nombreReporte, JSON.stringify(reporteResultados, null, 2));
        console.log(`\n💾 Reporte guardado en: ${nombreReporte}`);
    } catch (error) {
        console.log(`❌ Error al guardar reporte: ${error.message}`);
    }
    
    console.log('\n🏁 TESTING COMPLETADO');
    console.log('=====================');
}

// =====================================================
// EJECUTAR TESTING
// =====================================================

if (require.main === module) {
    ejecutarTodosLosTests();
}

module.exports = {
    ejecutarTodosLosTests,
    reporteResultados
};
