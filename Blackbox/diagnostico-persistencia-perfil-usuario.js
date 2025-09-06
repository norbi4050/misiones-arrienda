const { createClient } = require('@supabase/supabase-js');

console.log('🔍 DIAGNÓSTICO - PROBLEMA PERSISTENCIA PERFIL USUARIO');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function diagnosticarPersistenciaPerfil() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Problema: Edición de perfil se guarda pero no persiste al recargar');
    console.log('👤 Usuario crítico:', '6403f9d2-e846-4c70-87e0-e051127d9500');
    console.log('');

    const diagnostico = {
        problema_identificado: null,
        causa_raiz: null,
        solucion_propuesta: null,
        tests_realizados: [],
        errores_encontrados: []
    };

    try {
        // =====================================================
        // PASO 1: VERIFICAR ESTADO ACTUAL DEL USUARIO
        // =====================================================
        console.log('🔍 PASO 1: VERIFICANDO ESTADO ACTUAL DEL USUARIO');
        console.log('-'.repeat(50));

        const { data: usuarioActual, error: errorUsuario } = await supabase
            .from('users')
            .select('*')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (errorUsuario) {
            console.log('❌ ERROR: No se puede obtener usuario actual');
            console.log(`   └─ ${errorUsuario.message}`);
            diagnostico.errores_encontrados.push({
                paso: 'obtener_usuario',
                error: errorUsuario.message
            });
            return diagnostico;
        }

        console.log('✅ Usuario encontrado exitosamente');
        console.log(`   └─ Email: ${usuarioActual.email}`);
        console.log(`   └─ Nombre: ${usuarioActual.name || 'null'}`);
        console.log(`   └─ Teléfono: ${usuarioActual.phone || 'null'}`);
        console.log(`   └─ Última actualización: ${usuarioActual.updated_at}`);
        console.log(`   └─ Fecha creación: ${usuarioActual.created_at}`);

        diagnostico.tests_realizados.push({
            test: 'obtener_usuario_actual',
            resultado: 'exitoso',
            datos: {
                email: usuarioActual.email,
                name: usuarioActual.name,
                phone: usuarioActual.phone,
                updated_at: usuarioActual.updated_at
            }
        });

        // =====================================================
        // PASO 2: SIMULAR ACTUALIZACIÓN DE PERFIL
        // =====================================================
        console.log('');
        console.log('🔍 PASO 2: SIMULANDO ACTUALIZACIÓN DE PERFIL');
        console.log('-'.repeat(50));

        const datosActualizacion = {
            name: 'Usuario Test Actualizado',
            phone: '+54 376 999888',
            bio: 'Bio actualizada para testing',
            location: 'Posadas, Misiones - Actualizado',
            updated_at: new Date().toISOString()
        };

        console.log('📝 Datos a actualizar:');
        Object.keys(datosActualizacion).forEach(key => {
            console.log(`   └─ ${key}: ${datosActualizacion[key]}`);
        });

        const { data: usuarioActualizado, error: errorActualizacion } = await supabase
            .from('users')
            .update(datosActualizacion)
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .select('*')
            .single();

        if (errorActualizacion) {
            console.log('❌ ERROR: Fallo en actualización');
            console.log(`   └─ ${errorActualizacion.message}`);
            console.log(`   └─ Código: ${errorActualizacion.code}`);
            console.log(`   └─ Detalles: ${errorActualizacion.details}`);
            
            diagnostico.errores_encontrados.push({
                paso: 'actualizar_perfil',
                error: errorActualizacion.message,
                codigo: errorActualizacion.code,
                detalles: errorActualizacion.details
            });
            
            diagnostico.problema_identificado = 'Error en operación UPDATE';
            diagnostico.causa_raiz = errorActualizacion.message;
        } else {
            console.log('✅ Actualización exitosa');
            console.log(`   └─ Nombre actualizado: ${usuarioActualizado.name}`);
            console.log(`   └─ Teléfono actualizado: ${usuarioActualizado.phone}`);
            console.log(`   └─ Bio actualizada: ${usuarioActualizado.bio}`);
            console.log(`   └─ Timestamp: ${usuarioActualizado.updated_at}`);

            diagnostico.tests_realizados.push({
                test: 'actualizar_perfil',
                resultado: 'exitoso',
                datos_actualizados: datosActualizacion
            });
        }

        // =====================================================
        // PASO 3: VERIFICAR PERSISTENCIA INMEDIATA
        // =====================================================
        console.log('');
        console.log('🔍 PASO 3: VERIFICANDO PERSISTENCIA INMEDIATA');
        console.log('-'.repeat(50));

        // Esperar un momento para simular recarga
        await new Promise(resolve => setTimeout(resolve, 1000));

        const { data: usuarioVerificacion, error: errorVerificacion } = await supabase
            .from('users')
            .select('*')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (errorVerificacion) {
            console.log('❌ ERROR: No se puede verificar persistencia');
            console.log(`   └─ ${errorVerificacion.message}`);
            
            diagnostico.errores_encontrados.push({
                paso: 'verificar_persistencia',
                error: errorVerificacion.message
            });
        } else {
            console.log('📊 COMPARACIÓN DE DATOS:');
            
            const camposComparar = ['name', 'phone', 'bio', 'location', 'updated_at'];
            let persistenciaCorrecta = true;
            
            camposComparar.forEach(campo => {
                const valorEsperado = datosActualizacion[campo];
                const valorActual = usuarioVerificacion[campo];
                const coincide = valorEsperado === valorActual;
                
                console.log(`   └─ ${campo}:`);
                console.log(`      Esperado: ${valorEsperado}`);
                console.log(`      Actual: ${valorActual}`);
                console.log(`      Estado: ${coincide ? '✅ COINCIDE' : '❌ NO COINCIDE'}`);
                
                if (!coincide) {
                    persistenciaCorrecta = false;
                }
            });

            if (persistenciaCorrecta) {
                console.log('✅ PERSISTENCIA CORRECTA: Todos los datos se guardaron');
                diagnostico.tests_realizados.push({
                    test: 'verificar_persistencia',
                    resultado: 'exitoso',
                    persistencia: 'correcta'
                });
            } else {
                console.log('❌ PROBLEMA DE PERSISTENCIA: Algunos datos no se guardaron');
                diagnostico.problema_identificado = 'Datos no persisten correctamente';
                diagnostico.tests_realizados.push({
                    test: 'verificar_persistencia',
                    resultado: 'fallido',
                    persistencia: 'incorrecta'
                });
            }
        }

        // =====================================================
        // PASO 4: VERIFICAR POLÍTICAS RLS
        // =====================================================
        console.log('');
        console.log('🔍 PASO 4: VERIFICANDO POLÍTICAS RLS');
        console.log('-'.repeat(50));

        const { data: politicas, error: errorPoliticas } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, qual, with_check')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (errorPoliticas) {
            console.log('❌ ERROR: No se pueden obtener políticas RLS');
            diagnostico.errores_encontrados.push({
                paso: 'verificar_politicas',
                error: errorPoliticas.message
            });
        } else {
            console.log('🛡️ POLÍTICAS RLS ACTIVAS:');
            
            const politicasUpdate = politicas.filter(p => p.cmd === 'UPDATE');
            
            if (politicasUpdate.length === 0) {
                console.log('❌ PROBLEMA: No hay políticas UPDATE activas');
                diagnostico.problema_identificado = 'Falta política RLS para UPDATE';
                diagnostico.causa_raiz = 'Sin políticas UPDATE, las actualizaciones pueden fallar';
            } else {
                politicasUpdate.forEach(politica => {
                    console.log(`   └─ ${politica.policyname}:`);
                    console.log(`      USING: ${politica.qual || 'N/A'}`);
                    console.log(`      WITH CHECK: ${politica.with_check || 'N/A'}`);
                    
                    // Verificar si la política es problemática
                    if (politica.qual && politica.qual.includes('auth.uid()') && !politica.qual.includes('( SELECT auth.uid()')) {
                        console.log('      ⚠️ ADVERTENCIA: Política no optimizada');
                        diagnostico.errores_encontrados.push({
                            paso: 'verificar_politicas',
                            problema: 'Política RLS no optimizada',
                            politica: politica.policyname
                        });
                    }
                });
            }
        }

        // =====================================================
        // PASO 5: VERIFICAR TRIGGERS Y FUNCIONES
        // =====================================================
        console.log('');
        console.log('🔍 PASO 5: VERIFICANDO TRIGGERS Y FUNCIONES');
        console.log('-'.repeat(50));

        const { data: triggers, error: errorTriggers } = await supabase
            .from('information_schema.triggers')
            .select('trigger_name, event_object_table, action_timing, event_manipulation')
            .eq('trigger_schema', 'public')
            .eq('event_object_table', 'users');

        if (errorTriggers) {
            console.log('❌ ERROR: No se pueden obtener triggers');
        } else {
            console.log('🔄 TRIGGERS EN TABLA USERS:');
            
            if (triggers.length === 0) {
                console.log('   ⚠️ No hay triggers activos');
            } else {
                triggers.forEach(trigger => {
                    console.log(`   └─ ${trigger.trigger_name}:`);
                    console.log(`      Evento: ${trigger.event_manipulation}`);
                    console.log(`      Timing: ${trigger.action_timing}`);
                });
            }
        }

        // =====================================================
        // PASO 6: ANÁLISIS DEL ENDPOINT API
        // =====================================================
        console.log('');
        console.log('🔍 PASO 6: ANALIZANDO ENDPOINT API');
        console.log('-'.repeat(50));

        console.log('📋 Verificando archivo del endpoint...');
        
        try {
            const fs = require('fs');
            const endpointPath = '../Backend/src/app/api/users/profile/route.ts';
            
            if (fs.existsSync(endpointPath)) {
                console.log('✅ Archivo del endpoint encontrado');
                
                const endpointContent = fs.readFileSync(endpointPath, 'utf8');
                
                // Verificar aspectos críticos del endpoint
                const verificaciones = [
                    { check: 'supabase.from(', descripcion: 'Uso de Supabase client' },
                    { check: '.update(', descripcion: 'Operación UPDATE' },
                    { check: '.select(', descripcion: 'SELECT después de UPDATE' },
                    { check: 'auth.uid()', descripcion: 'Verificación de usuario autenticado' },
                    { check: 'error', descripcion: 'Manejo de errores' }
                ];
                
                verificaciones.forEach(v => {
                    const presente = endpointContent.includes(v.check);
                    console.log(`   └─ ${v.descripcion}: ${presente ? '✅ Presente' : '❌ Ausente'}`);
                    
                    if (!presente && v.check !== 'error') {
                        diagnostico.errores_encontrados.push({
                            paso: 'analizar_endpoint',
                            problema: `Falta ${v.descripcion}`,
                            archivo: endpointPath
                        });
                    }
                });
                
            } else {
                console.log('❌ Archivo del endpoint no encontrado');
                diagnostico.errores_encontrados.push({
                    paso: 'analizar_endpoint',
                    problema: 'Archivo del endpoint no existe',
                    archivo: endpointPath
                });
            }
        } catch (error) {
            console.log('❌ Error analizando endpoint:', error.message);
        }

        // =====================================================
        // DIAGNÓSTICO FINAL
        // =====================================================
        console.log('');
        console.log('📊 DIAGNÓSTICO FINAL');
        console.log('='.repeat(70));

        if (diagnostico.errores_encontrados.length === 0) {
            diagnostico.problema_identificado = 'Sistema funcionando correctamente';
            diagnostico.causa_raiz = 'No se detectaron problemas técnicos';
            diagnostico.solucion_propuesta = 'Verificar comportamiento en frontend/cache del navegador';
        } else {
            // Analizar errores para determinar causa raíz
            const erroresCriticos = diagnostico.errores_encontrados.filter(e => 
                e.paso === 'actualizar_perfil' || e.paso === 'verificar_persistencia'
            );
            
            if (erroresCriticos.length > 0) {
                diagnostico.problema_identificado = 'Error en operaciones de base de datos';
                diagnostico.causa_raiz = erroresCriticos[0].error;
                diagnostico.solucion_propuesta = 'Corregir políticas RLS o estructura de tabla';
            } else {
                diagnostico.problema_identificado = 'Problemas menores detectados';
                diagnostico.causa_raiz = 'Configuración subóptima pero funcional';
                diagnostico.solucion_propuesta = 'Optimizar configuración detectada';
            }
        }

        console.log(`🎯 PROBLEMA IDENTIFICADO: ${diagnostico.problema_identificado}`);
        console.log(`🔍 CAUSA RAÍZ: ${diagnostico.causa_raiz}`);
        console.log(`💡 SOLUCIÓN PROPUESTA: ${diagnostico.solucion_propuesta}`);
        
        console.log('');
        console.log(`📊 RESUMEN:`);
        console.log(`   Tests realizados: ${diagnostico.tests_realizados.length}`);
        console.log(`   Errores encontrados: ${diagnostico.errores_encontrados.length}`);
        
        if (diagnostico.errores_encontrados.length > 0) {
            console.log('');
            console.log('❌ ERRORES DETALLADOS:');
            diagnostico.errores_encontrados.forEach((error, index) => {
                console.log(`   ${index + 1}. [${error.paso}] ${error.problema || error.error}`);
            });
        }

        // Guardar diagnóstico completo
        const fs = require('fs');
        fs.writeFileSync(
            'diagnostico-persistencia-perfil-resultado.json',
            JSON.stringify(diagnostico, null, 2)
        );

        console.log('');
        console.log('💾 Diagnóstico completo guardado en: diagnostico-persistencia-perfil-resultado.json');
        console.log('');
        console.log('✅ DIAGNÓSTICO COMPLETADO');

        return diagnostico;

    } catch (error) {
        console.error('❌ Error crítico en diagnóstico:', error.message);
        diagnostico.errores_encontrados.push({
            paso: 'diagnostico_general',
            error: error.message,
            stack: error.stack
        });
        return diagnostico;
    }
}

// Ejecutar diagnóstico
if (require.main === module) {
    diagnosticarPersistenciaPerfil().catch(console.error);
}

module.exports = { diagnosticarPersistenciaPerfil };
