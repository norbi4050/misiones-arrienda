// =====================================================
// DIAGNÓSTICO: WARNINGS SEARCH PATH SUPABASE 2025
// =====================================================
// Fecha: 2025-01-27
// Problema: Function Search Path Mutable warnings
// Funciones afectadas: update_user_profile, validate_operation_type, update_updated_at_column
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase con credenciales actualizadas
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

console.log('🔍 DIAGNÓSTICO: WARNINGS SEARCH PATH SUPABASE');
console.log('='.repeat(60));
console.log('');

async function diagnosticarWarningsSearchPath() {
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

        console.log('📋 PASO 2: Analizar warnings reportados...');
        console.log('');
        
        const warningsReportados = [
            {
                name: 'update_user_profile',
                title: 'Function Search Path Mutable',
                level: 'WARN',
                description: 'Function has a role mutable search_path',
                remediation: 'https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable'
            },
            {
                name: 'validate_operation_type',
                title: 'Function Search Path Mutable',
                level: 'WARN',
                description: 'Function has a role mutable search_path',
                remediation: 'https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable'
            },
            {
                name: 'update_updated_at_column',
                title: 'Function Search Path Mutable',
                level: 'WARN',
                description: 'Function has a role mutable search_path',
                remediation: 'https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable'
            }
        ];

        console.log('🚨 WARNINGS IDENTIFICADOS:');
        warningsReportados.forEach((warning, index) => {
            console.log(`   ${index + 1}. ${warning.name}`);
            console.log(`      └─ Nivel: ${warning.level}`);
            console.log(`      └─ Problema: ${warning.description}`);
            console.log('');
        });

        console.log('📋 PASO 3: Verificar funciones existentes en la base de datos...');
        console.log('');

        // Consultar funciones existentes
        const { data: funciones, error: funcionesError } = await supabase
            .rpc('sql', {
                query: `
                    SELECT 
                        routine_name,
                        routine_type,
                        routine_definition,
                        security_type,
                        routine_schema
                    FROM information_schema.routines 
                    WHERE routine_schema = 'public' 
                    AND routine_name IN ('update_user_profile', 'validate_operation_type', 'update_updated_at_column')
                    ORDER BY routine_name;
                `
            });

        if (funcionesError) {
            console.log('⚠️ No se pudieron obtener funciones directamente, intentando método alternativo...');
            
            // Método alternativo: consultar pg_proc
            const { data: funcionesAlt, error: funcionesAltError } = await supabase
                .rpc('sql', {
                    query: `
                        SELECT 
                            proname as function_name,
                            prosecdef as security_definer,
                            proconfig as config_settings
                        FROM pg_proc p
                        JOIN pg_namespace n ON p.pronamespace = n.oid
                        WHERE n.nspname = 'public'
                        AND proname IN ('update_user_profile', 'validate_operation_type', 'update_updated_at_column');
                    `
                });

            if (funcionesAltError) {
                console.log('❌ Error obteniendo funciones:', funcionesAltError.message);
            } else {
                console.log('✅ Funciones encontradas (método alternativo):');
                if (funcionesAlt && funcionesAlt.length > 0) {
                    funcionesAlt.forEach(func => {
                        console.log(`   📋 ${func.function_name}`);
                        console.log(`      └─ Security Definer: ${func.security_definer}`);
                        console.log(`      └─ Config: ${func.config_settings || 'No configurado'}`);
                        console.log('');
                    });
                } else {
                    console.log('   ⚠️ No se encontraron las funciones reportadas en los warnings');
                }
            }
        } else {
            console.log('✅ Funciones encontradas:');
            if (funciones && funciones.length > 0) {
                funciones.forEach(func => {
                    console.log(`   📋 ${func.routine_name} (${func.routine_type})`);
                    console.log(`      └─ Schema: ${func.routine_schema}`);
                    console.log(`      └─ Security: ${func.security_type}`);
                    console.log('');
                });
            } else {
                console.log('   ⚠️ No se encontraron las funciones reportadas en los warnings');
            }
        }

        console.log('📋 PASO 4: Analizar el problema de search_path...');
        console.log('');
        
        console.log('🔍 ¿QUÉ ES EL PROBLEMA search_path?');
        console.log('   El search_path determina en qué esquemas PostgreSQL busca objetos');
        console.log('   Si es "mutable", puede ser modificado por el usuario');
        console.log('   Esto puede ser un riesgo de seguridad en funciones SECURITY DEFINER');
        console.log('');

        console.log('🎯 SOLUCIÓN RECOMENDADA:');
        console.log('   Fijar el search_path en las funciones usando:');
        console.log('   SET search_path = public, pg_temp');
        console.log('');

        console.log('📋 PASO 5: Verificar si las funciones realmente existen...');
        console.log('');

        // Verificar funciones una por una
        const funcionesAVerificar = ['update_user_profile', 'validate_operation_type', 'update_updated_at_column'];
        const funcionesEncontradas = [];
        const funcionesNoEncontradas = [];

        for (const nombreFuncion of funcionesAVerificar) {
            try {
                const { data: existeFuncion, error: errorFuncion } = await supabase
                    .rpc('sql', {
                        query: `
                            SELECT EXISTS(
                                SELECT 1 FROM pg_proc p
                                JOIN pg_namespace n ON p.pronamespace = n.oid
                                WHERE n.nspname = 'public' AND p.proname = '${nombreFuncion}'
                            ) as existe;
                        `
                    });

                if (!errorFuncion && existeFuncion && existeFuncion[0]?.existe) {
                    funcionesEncontradas.push(nombreFuncion);
                    console.log(`   ✅ ${nombreFuncion}: EXISTE`);
                } else {
                    funcionesNoEncontradas.push(nombreFuncion);
                    console.log(`   ❌ ${nombreFuncion}: NO EXISTE`);
                }
            } catch (error) {
                funcionesNoEncontradas.push(nombreFuncion);
                console.log(`   ❌ ${nombreFuncion}: ERROR AL VERIFICAR`);
            }
        }

        console.log('');
        console.log('📊 RESUMEN DEL DIAGNÓSTICO:');
        console.log('='.repeat(40));
        console.log(`✅ Funciones encontradas: ${funcionesEncontradas.length}`);
        console.log(`❌ Funciones no encontradas: ${funcionesNoEncontradas.length}`);
        console.log('');

        if (funcionesEncontradas.length > 0) {
            console.log('🔧 FUNCIONES QUE NECESITAN CORRECCIÓN:');
            funcionesEncontradas.forEach(func => {
                console.log(`   📋 ${func} - Necesita search_path fijo`);
            });
        }

        if (funcionesNoEncontradas.length > 0) {
            console.log('⚠️ FUNCIONES REPORTADAS PERO NO ENCONTRADAS:');
            funcionesNoEncontradas.forEach(func => {
                console.log(`   📋 ${func} - Posiblemente ya eliminada o renombrada`);
            });
        }

        console.log('');
        console.log('🎯 PRÓXIMOS PASOS:');
        console.log('   1. Si las funciones existen: Aplicar corrección de search_path');
        console.log('   2. Si no existen: Los warnings pueden ser obsoletos');
        console.log('   3. Verificar si hay funciones similares con otros nombres');
        console.log('   4. Crear script de corrección SQL');
        console.log('');

        // Guardar resultado del diagnóstico
        const resultadoDiagnostico = {
            timestamp: new Date().toISOString(),
            warnings_reportados: warningsReportados,
            funciones_encontradas: funcionesEncontradas,
            funciones_no_encontradas: funcionesNoEncontradas,
            estado_conexion: 'exitosa',
            recomendacion: funcionesEncontradas.length > 0 ? 'aplicar_correccion' : 'verificar_warnings_obsoletos'
        };

        const fs = require('fs');
        fs.writeFileSync('Blackbox/diagnostico-warnings-resultado.json', JSON.stringify(resultadoDiagnostico, null, 2));

        console.log('✅ DIAGNÓSTICO COMPLETADO');
        console.log('📄 Resultado guardado en: Blackbox/diagnostico-warnings-resultado.json');

    } catch (error) {
        console.error('❌ Error en el diagnóstico:', error);
    }
}

// Ejecutar diagnóstico
diagnosticarWarningsSearchPath();
