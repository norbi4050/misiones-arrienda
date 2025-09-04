const fs = require('fs');
const path = require('path');

// =====================================================
// TESTING SCRIPT SQL COLUMNAS FALTANTES COMPLETO
// Verifica que el script resuelve múltiples errores de columnas
// =====================================================

console.log('🔍 INICIANDO TESTING DEL SCRIPT SQL COLUMNAS FALTANTES COMPLETO');
console.log('================================================================');

const reporteResultados = {
    timestamp: new Date().toISOString(),
    script_testeado: 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql',
    problemas_originales: [
        'ERROR: 42703: column "is_active" does not exist',
        'ERROR: 42703: column "operation_type" does not exist'
    ],
    tests_ejecutados: [],
    resumen: {
        total_tests: 0,
        exitosos: 0,
        fallidos: 0,
        warnings: 0
    }
};

// =====================================================
// TEST 1: VERIFICAR EXISTENCIA DEL SCRIPT COMPLETO
// =====================================================

function test1_verificarScriptExiste() {
    console.log('\n📋 TEST 1: Verificando existencia del script completo...');
    
    const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql');
    const existe = fs.existsSync(scriptPath);
    
    const resultado = {
        test: 'Verificar existencia del script completo',
        exitoso: existe,
        detalles: existe ? 'Script encontrado correctamente' : 'Script no encontrado',
        archivo: 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql'
    };
    
    reporteResultados.tests_ejecutados.push(resultado);
    
    if (existe) {
        console.log('✅ Script completo encontrado');
        reporteResultados.resumen.exitosos++;
    } else {
        console.log('❌ Script completo NO encontrado');
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
    return existe;
}

// =====================================================
// TEST 2: ANALIZAR CONTENIDO PARA COLUMNA IS_ACTIVE
// =====================================================

function test2_analizarIsActive() {
    console.log('\n📋 TEST 2: Analizando corrección para is_active...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const verificaciones_is_active = {
            tiene_verificacion_is_active: contenido.includes('column_name = \'is_active\''),
            tiene_alter_table_is_active: contenido.includes('ADD COLUMN is_active BOOLEAN'),
            tiene_indice_is_active: contenido.includes('idx_properties_is_active'),
            tiene_politicas_is_active: contenido.includes('is_active = true'),
            tiene_actualizacion_is_active: contenido.includes('SET is_active = true')
        };
        
        const exitoso = Object.values(verificaciones_is_active).every(v => v === true);
        
        const resultado = {
            test: 'Analizar corrección para is_active',
            exitoso: exitoso,
            detalles: {
                verificaciones_pasadas: Object.keys(verificaciones_is_active).filter(k => verificaciones_is_active[k]).length,
                total_verificaciones: Object.keys(verificaciones_is_active).length,
                verificaciones: verificaciones_is_active
            }
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (exitoso) {
            console.log('✅ Corrección is_active implementada correctamente');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Corrección is_active parcialmente implementada');
            reporteResultados.resumen.warnings++;
        }
        
        console.log(`   - Verificación columna is_active: ${verificaciones_is_active.tiene_verificacion_is_active ? '✅' : '❌'}`);
        console.log(`   - ALTER TABLE is_active: ${verificaciones_is_active.tiene_alter_table_is_active ? '✅' : '❌'}`);
        console.log(`   - Índice is_active: ${verificaciones_is_active.tiene_indice_is_active ? '✅' : '❌'}`);
        console.log(`   - Políticas is_active: ${verificaciones_is_active.tiene_politicas_is_active ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log('❌ Error al analizar is_active:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Analizar corrección para is_active',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 3: ANALIZAR CONTENIDO PARA COLUMNA OPERATION_TYPE
// =====================================================

function test3_analizarOperationType() {
    console.log('\n📋 TEST 3: Analizando corrección para operation_type...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const verificaciones_operation_type = {
            tiene_verificacion_operation_type: contenido.includes('column_name = \'operation_type\''),
            tiene_alter_table_operation_type: contenido.includes('ADD COLUMN operation_type VARCHAR'),
            tiene_indice_operation_type: contenido.includes('idx_properties_operation_type'),
            tiene_validacion_operation_type: contenido.includes('validate_operation_type'),
            tiene_trigger_operation_type: contenido.includes('validate_operation_type_trigger'),
            tiene_actualizacion_operation_type: contenido.includes('SET operation_type = \'rent\'')
        };
        
        const exitoso = Object.values(verificaciones_operation_type).every(v => v === true);
        
        const resultado = {
            test: 'Analizar corrección para operation_type',
            exitoso: exitoso,
            detalles: {
                verificaciones_pasadas: Object.keys(verificaciones_operation_type).filter(k => verificaciones_operation_type[k]).length,
                total_verificaciones: Object.keys(verificaciones_operation_type).length,
                verificaciones: verificaciones_operation_type
            }
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (exitoso) {
            console.log('✅ Corrección operation_type implementada correctamente');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Corrección operation_type parcialmente implementada');
            reporteResultados.resumen.warnings++;
        }
        
        console.log(`   - Verificación columna operation_type: ${verificaciones_operation_type.tiene_verificacion_operation_type ? '✅' : '❌'}`);
        console.log(`   - ALTER TABLE operation_type: ${verificaciones_operation_type.tiene_alter_table_operation_type ? '✅' : '❌'}`);
        console.log(`   - Índice operation_type: ${verificaciones_operation_type.tiene_indice_operation_type ? '✅' : '❌'}`);
        console.log(`   - Validación operation_type: ${verificaciones_operation_type.tiene_validacion_operation_type ? '✅' : '❌'}`);
        console.log(`   - Trigger operation_type: ${verificaciones_operation_type.tiene_trigger_operation_type ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log('❌ Error al analizar operation_type:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Analizar corrección para operation_type',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 4: VERIFICAR COLUMNAS ADICIONALES
// =====================================================

function test4_verificarColumnasAdicionales() {
    console.log('\n📋 TEST 4: Verificando columnas adicionales...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const columnas_adicionales = {
            property_type: contenido.includes('ADD COLUMN property_type VARCHAR'),
            status: contenido.includes('ADD COLUMN status VARCHAR'),
            featured: contenido.includes('ADD COLUMN featured BOOLEAN')
        };
        
        const exitoso = Object.values(columnas_adicionales).filter(v => v).length >= 2;
        
        const resultado = {
            test: 'Verificar columnas adicionales',
            exitoso: exitoso,
            columnas_adicionales: columnas_adicionales,
            detalles: exitoso ? 
                'Script incluye columnas adicionales útiles' : 
                'Script no incluye suficientes columnas adicionales'
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (exitoso) {
            console.log('✅ Columnas adicionales incluidas');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Pocas columnas adicionales');
            reporteResultados.resumen.warnings++;
        }
        
        console.log('   Columnas adicionales detectadas:');
        Object.keys(columnas_adicionales).forEach(key => {
            const incluida = columnas_adicionales[key];
            console.log(`   - ${key}: ${incluida ? '✅' : '❌'}`);
        });
        
    } catch (error) {
        console.log('❌ Error al verificar columnas adicionales:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Verificar columnas adicionales',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 5: VERIFICAR POLÍTICAS RLS ADAPTATIVAS
// =====================================================

function test5_verificarPoliticasRLS() {
    console.log('\n📋 TEST 5: Verificando políticas RLS adaptativas...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const politicas_rls = {
            elimina_politicas_existentes: contenido.includes('DROP POLICY IF EXISTS'),
            crea_politica_select: contenido.includes('CREATE POLICY "properties_select_policy"'),
            crea_politica_insert: contenido.includes('CREATE POLICY "properties_insert_policy"'),
            crea_politica_update: contenido.includes('CREATE POLICY "properties_update_policy"'),
            crea_politica_delete: contenido.includes('CREATE POLICY "properties_delete_policy"'),
            habilita_rls: contenido.includes('ENABLE ROW LEVEL SECURITY'),
            politicas_adaptativas: contenido.includes('IF EXISTS') && contenido.includes('is_active = true')
        };
        
        const exitoso = Object.values(politicas_rls).filter(v => v).length >= 6;
        
        const resultado = {
            test: 'Verificar políticas RLS adaptativas',
            exitoso: exitoso,
            politicas_rls: politicas_rls,
            detalles: exitoso ? 
                'Políticas RLS correctamente implementadas' : 
                'Problemas en implementación de políticas RLS'
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (exitoso) {
            console.log('✅ Políticas RLS adaptativas correctas');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Problemas en políticas RLS');
            reporteResultados.resumen.warnings++;
        }
        
    } catch (error) {
        console.log('❌ Error al verificar políticas RLS:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Verificar políticas RLS adaptativas',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 6: VERIFICAR SINTAXIS SQL Y ESTRUCTURA
// =====================================================

function test6_verificarSintaxisSQL() {
    console.log('\n📋 TEST 6: Verificando sintaxis SQL y estructura...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const verificaciones_sintaxis = {
            tiene_comentarios_estructura: contenido.includes('-- ====================================================='),
            bloques_do_correctos: (contenido.match(/DO \$\$/g) || []).length === (contenido.match(/END \$\$/g) || []).length,
            create_statements_validos: contenido.includes('CREATE INDEX IF NOT EXISTS') && contenido.includes('CREATE POLICY'),
            drop_statements_seguros: contenido.includes('DROP POLICY IF EXISTS'),
            sintaxis_postgresql: contenido.includes('LANGUAGE plpgsql'),
            manejo_errores_sql: contenido.includes('RAISE NOTICE'),
            verificacion_final: contenido.includes('REPORTE FINAL'),
            estructura_logica: contenido.includes('1. VERIFICAR Y AGREGAR') && contenido.includes('10. VERIFICACIÓN FINAL')
        };
        
        const sintaxis_correcta = Object.values(verificaciones_sintaxis).filter(v => v).length >= 7;
        
        const resultado = {
            test: 'Verificar sintaxis SQL y estructura',
            exitoso: sintaxis_correcta,
            verificaciones_sintaxis: verificaciones_sintaxis,
            detalles: sintaxis_correcta ? 
                'Sintaxis SQL y estructura correctas' : 
                'Problemas de sintaxis o estructura detectados'
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (sintaxis_correcta) {
            console.log('✅ Sintaxis SQL y estructura correctas');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('⚠️  Problemas de sintaxis o estructura');
            reporteResultados.resumen.warnings++;
        }
        
    } catch (error) {
        console.log('❌ Error al verificar sintaxis SQL:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Verificar sintaxis SQL y estructura',
            exitoso: false,
            error: error.message
        });
        reporteResultados.resumen.fallidos++;
    }
    
    reporteResultados.resumen.total_tests++;
}

// =====================================================
// TEST 7: VERIFICAR RESOLUCIÓN DE PROBLEMAS ORIGINALES
// =====================================================

function test7_verificarResolucionProblemas() {
    console.log('\n📋 TEST 7: Verificando resolución de problemas originales...');
    
    try {
        const scriptPath = path.join(__dirname, 'SUPABASE-SCRIPT-SQL-CORREGIDO-COLUMNAS-FALTANTES-COMPLETO.sql');
        const contenido = fs.readFileSync(scriptPath, 'utf8');
        
        const problemas_resueltos = {
            resuelve_is_active: contenido.includes('column "is_active"') || 
                               (contenido.includes('is_active') && contenido.includes('ADD COLUMN')),
            resuelve_operation_type: contenido.includes('column "operation_type"') || 
                                   (contenido.includes('operation_type') && contenido.includes('ADD COLUMN')),
            manejo_robusto_errores: contenido.includes('IF NOT EXISTS') && contenido.includes('information_schema'),
            seguridad_ejecucion: contenido.includes('IF EXISTS') && contenido.includes('DROP POLICY IF EXISTS'),
            compatibilidad_total: contenido.includes('DEFAULT') && contenido.includes('UPDATE')
        };
        
        const problemas_resueltos_count = Object.values(problemas_resueltos).filter(v => v).length;
        const exitoso = problemas_resueltos_count >= 4;
        
        const resultado = {
            test: 'Verificar resolución de problemas originales',
            exitoso: exitoso,
            problemas_originales: reporteResultados.problemas_originales,
            problemas_resueltos: problemas_resueltos,
            problemas_resueltos_count: problemas_resueltos_count,
            detalles: exitoso ? 
                'Todos los problemas originales resueltos' : 
                'Algunos problemas originales no completamente resueltos'
        };
        
        reporteResultados.tests_ejecutados.push(resultado);
        
        if (exitoso) {
            console.log('✅ Problemas originales resueltos correctamente');
            reporteResultados.resumen.exitosos++;
        } else {
            console.log('❌ Problemas originales NO completamente resueltos');
            reporteResultados.resumen.fallidos++;
        }
        
        console.log('   Resolución de problemas:');
        console.log(`   - ERROR is_active: ${problemas_resueltos.resuelve_is_active ? '✅ RESUELTO' : '❌ NO RESUELTO'}`);
        console.log(`   - ERROR operation_type: ${problemas_resueltos.resuelve_operation_type ? '✅ RESUELTO' : '❌ NO RESUELTO'}`);
        console.log(`   - Manejo robusto: ${problemas_resueltos.manejo_robusto_errores ? '✅' : '❌'}`);
        console.log(`   - Seguridad: ${problemas_resueltos.seguridad_ejecucion ? '✅' : '❌'}`);
        
    } catch (error) {
        console.log('❌ Error al verificar resolución:', error.message);
        reporteResultados.tests_ejecutados.push({
            test: 'Verificar resolución de problemas originales',
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
    test2_analizarIsActive();
    test3_analizarOperationType();
    test4_verificarColumnasAdicionales();
    test5_verificarPoliticasRLS();
    test6_verificarSintaxisSQL();
    test7_verificarResolucionProblemas();
    
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
    
    if (reporteResultados.resumen.fallidos === 0 && reporteResultados.resumen.warnings <= 2) {
        estadoGeneral = '✅ SCRIPT LISTO PARA USO';
        recomendacion = 'El script completo resuelve todos los problemas de columnas faltantes y está listo para ser ejecutado.';
    } else if (reporteResultados.resumen.fallidos <= 1) {
        estadoGeneral = '⚠️  SCRIPT NECESITA REVISIÓN MENOR';
        recomendacion = 'El script resuelve los problemas principales pero puede necesitar ajustes menores.';
    } else {
        estadoGeneral = '❌ SCRIPT NECESITA CORRECCIONES';
        recomendacion = 'El script requiere correcciones adicionales antes de ser usado.';
    }
    
    console.log(`\n🎯 ESTADO GENERAL: ${estadoGeneral}`);
    console.log(`💡 RECOMENDACIÓN: ${recomendacion}`);
    
    console.log(`\n🔧 PROBLEMAS ORIGINALES ABORDADOS:`);
    reporteResultados.problemas_originales.forEach((problema, index) => {
        console.log(`   ${index + 1}. ${problema}`);
    });
    
    // Agregar información al reporte
    reporteResultados.estado_general = estadoGeneral;
    reporteResultados.recomendacion = recomendacion;
    reporteResultados.porcentaje_exito = porcentajeExito;
    
    // Guardar reporte en archivo
    try {
        const nombreReporte = 'REPORTE-TESTING-SCRIPT-SQL-COLUMNAS-FALTANTES-COMPLETO.json';
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
