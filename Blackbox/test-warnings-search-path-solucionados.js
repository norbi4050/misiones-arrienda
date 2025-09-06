// =====================================================
// TEST: VERIFICACIÓN WARNINGS SEARCH PATH SOLUCIONADOS
// =====================================================
// Fecha: 2025-01-27
// Propósito: Verificar que los warnings de search_path fueron corregidos
// Funciones: update_user_profile, validate_operation_type, handle_updated_at
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales actualizadas
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🧪 TEST: VERIFICACIÓN WARNINGS SEARCH PATH SOLUCIONADOS');
console.log('='.repeat(60));
console.log('');

async function testWarningsSolucionados() {
    try {
        console.log('📋 PASO 1: Verificar conexión a Supabase...');
        
        // Test de conexión
        const { data: connectionTest, error: connectionError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.log('❌ Error de conexión:', connectionError.message);
            return;
        }
        
        console.log('✅ Conexión exitosa a Supabase');
        console.log('');

        console.log('📋 PASO 2: Verificar funciones con search_path fijo...');
        console.log('');

        // Verificar que las funciones tienen search_path configurado
        const funcionesAVerificar = ['update_user_profile', 'validate_operation_type', 'handle_updated_at'];
        const resultadosVerificacion = [];

        for (const nombreFuncion of funcionesAVerificar) {
            try {
                console.log(`🔍 Verificando función: ${nombreFuncion}`);
                
                const { data: funcionInfo, error: funcionError } = await supabase
                    .rpc('sql', {
                        query: `
                            SELECT 
                                proname as function_name,
                                prosecdef as security_definer,
                                proconfig as config_settings,
                                CASE 
                                    WHEN proconfig IS NOT NULL AND 'search_path=public,pg_temp' = ANY(proconfig) 
                                    THEN true 
                                    ELSE false 
                                END as has_fixed_search_path
                            FROM pg_proc p
                            JOIN pg_namespace n ON p.pronamespace = n.oid
                            WHERE n.nspname = 'public' AND p.proname = '${nombreFuncion}';
                        `
                    });

                if (!funcionError && funcionInfo && funcionInfo.length > 0) {
                    const func = funcionInfo[0];
                    const status = func.has_fixed_search_path ? '✅ CORREGIDO' : '⚠️ PENDIENTE';
                    console.log(`   ${status} ${func.function_name}`);
                    console.log(`      └─ Security Definer: ${func.security_definer}`);
                    console.log(`      └─ Search Path Fijo: ${func.has_fixed_search_path}`);
                    console.log(`      └─ Config: ${func.config_settings || 'No configurado'}`);
                    
                    resultadosVerificacion.push({
                        nombre: nombreFuncion,
                        existe: true,
                        searchPathFijo: func.has_fixed_search_path,
                        securityDefiner: func.security_definer
                    });
                } else {
                    console.log(`   ❌ NO ENCONTRADA ${nombreFuncion}`);
                    resultadosVerificacion.push({
                        nombre: nombreFuncion,
                        existe: false,
                        searchPathFijo: false,
                        securityDefiner: false
                    });
                }
                console.log('');
            } catch (error) {
                console.log(`   ❌ ERROR verificando ${nombreFuncion}:`, error.message);
                resultadosVerificacion.push({
                    nombre: nombreFuncion,
                    existe: false,
                    searchPathFijo: false,
                    error: error.message
                });
            }
        }

        console.log('📋 PASO 3: Test funcional de las funciones...');
        console.log('');

        // Test función validate_operation_type
        try {
            console.log('🧪 Testing validate_operation_type...');
            
            const { data: testValid, error: testValidError } = await supabase
                .rpc('validate_operation_type', { operation_type: 'update' });

            const { data: testInvalid, error: testInvalidError } = await supabase
                .rpc('validate_operation_type', { operation_type: 'invalid' });

            if (!testValidError && !testInvalidError) {
                console.log(`   ✅ validate_operation_type('update'): ${testValid}`);
                console.log(`   ✅ validate_operation_type('invalid'): ${testInvalid}`);
            } else {
                console.log('   ⚠️ Error en test funcional:', testValidError?.message || testInvalidError?.message);
            }
        } catch (error) {
            console.log('   ⚠️ validate_operation_type no disponible para test');
        }

        console.log('');

        // Test función update_user_profile (solo verificar que existe, no ejecutar)
        try {
            console.log('🧪 Testing update_user_profile (verificación de existencia)...');
            
            const { data: funcExists, error: funcExistsError } = await supabase
                .rpc('sql', {
                    query: `
                        SELECT EXISTS(
                            SELECT 1 FROM pg_proc p
                            JOIN pg_namespace n ON p.pronamespace = n.oid
                            WHERE n.nspname = 'public' AND p.proname = 'update_user_profile'
                        ) as exists;
                    `
                });

            if (!funcExistsError && funcExists && funcExists[0]?.exists) {
                console.log('   ✅ update_user_profile: EXISTE y disponible');
            } else {
                console.log('   ⚠️ update_user_profile: No encontrada');
            }
        } catch (error) {
            console.log('   ⚠️ Error verificando update_user_profile');
        }

        console.log('');

        // Test trigger handle_updated_at
        try {
            console.log('🧪 Testing trigger handle_updated_at...');
            
            const { data: triggerInfo, error: triggerError } = await supabase
                .rpc('sql', {
                    query: `
                        SELECT 
                            trigger_name, 
                            event_object_table, 
                            action_timing, 
                            event_manipulation
                        FROM information_schema.triggers 
                        WHERE trigger_schema = 'public' 
                        AND event_object_table = 'users'
                        AND action_statement LIKE '%handle_updated_at%';
                    `
                });

            if (!triggerError && triggerInfo && triggerInfo.length > 0) {
                console.log('   ✅ Trigger handle_updated_at: ACTIVO');
                triggerInfo.forEach(trigger => {
                    console.log(`      └─ ${trigger.trigger_name} on ${trigger.event_object_table}`);
                    console.log(`      └─ ${trigger.action_timing} ${trigger.event_manipulation}`);
                });
            } else {
                console.log('   ⚠️ Trigger handle_updated_at: No encontrado');
            }
        } catch (error) {
            console.log('   ⚠️ Error verificando trigger handle_updated_at');
        }

        console.log('');
        console.log('📊 RESUMEN DE VERIFICACIÓN:');
        console.log('='.repeat(40));

        const funcionesCorregidas = resultadosVerificacion.filter(f => f.existe && f.searchPathFijo).length;
        const funcionesExistentes = resultadosVerificacion.filter(f => f.existe).length;
        const funcionesTotales = resultadosVerificacion.length;

        console.log(`✅ Funciones con search_path fijo: ${funcionesCorregidas}/${funcionesTotales}`);
        console.log(`📋 Funciones existentes: ${funcionesExistentes}/${funcionesTotales}`);
        console.log('');

        if (funcionesCorregidas === funcionesTotales) {
            console.log('🎉 ¡TODOS LOS WARNINGS CORREGIDOS!');
            console.log('✅ Todas las funciones tienen search_path fijo');
            console.log('✅ Los warnings de seguridad están solucionados');
        } else if (funcionesCorregidas > 0) {
            console.log('⚠️ CORRECCIÓN PARCIAL');
            console.log(`✅ ${funcionesCorregidas} funciones corregidas`);
            console.log(`⚠️ ${funcionesTotales - funcionesCorregidas} funciones pendientes`);
        } else {
            console.log('❌ WARNINGS NO CORREGIDOS');
            console.log('⚠️ Ninguna función tiene search_path fijo');
            console.log('🔧 Ejecutar script de solución SQL');
        }

        console.log('');
        console.log('🎯 ESTADO FINAL:');
        resultadosVerificacion.forEach(func => {
            const status = func.existe ? 
                (func.searchPathFijo ? '✅ CORREGIDO' : '⚠️ PENDIENTE') : 
                '❌ NO EXISTE';
            console.log(`   ${status} ${func.nombre}`);
        });

        console.log('');
        console.log('📋 PRÓXIMOS PASOS:');
        if (funcionesCorregidas === funcionesTotales) {
            console.log('   ✅ Warnings corregidos - No se requieren acciones');
            console.log('   📊 Verificar en Supabase Dashboard que warnings desaparecieron');
        } else {
            console.log('   🔧 Ejecutar: Blackbox/solucion-warnings-search-path-definitiva.sql');
            console.log('   📊 Re-ejecutar este test después de aplicar la solución');
        }

        // Guardar resultado del test
        const resultadoTest = {
            timestamp: new Date().toISOString(),
            funciones_verificadas: resultadosVerificacion,
            funciones_corregidas: funcionesCorregidas,
            funciones_totales: funcionesTotales,
            estado: funcionesCorregidas === funcionesTotales ? 'COMPLETADO' : 'PENDIENTE',
            warnings_solucionados: funcionesCorregidas === funcionesTotales
        };

        const fs = require('fs');
        fs.writeFileSync('Blackbox/test-warnings-resultado.json', JSON.stringify(resultadoTest, null, 2));

        console.log('');
        console.log('✅ TEST COMPLETADO');
        console.log('📄 Resultado guardado en: Blackbox/test-warnings-resultado.json');

    } catch (error) {
        console.error('❌ Error en el test:', error);
    }
}

// Ejecutar test
testWarningsSolucionados();
