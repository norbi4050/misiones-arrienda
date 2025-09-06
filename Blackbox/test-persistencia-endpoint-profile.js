const { createClient } = require('@supabase/supabase-js');

console.log('🧪 TEST ESPECÍFICO - PERSISTENCIA ENDPOINT PROFILE');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function testPersistenciaEndpoint() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Simular exactamente lo que hace el endpoint');
    console.log('👤 Usuario crítico:', '6403f9d2-e846-4c70-87e0-e051127d9500');
    console.log('');

    const resultados = {
        paso1_estado_inicial: null,
        paso2_actualizacion: null,
        paso3_verificacion_inmediata: null,
        paso4_verificacion_con_select_especifico: null,
        problema_identificado: null,
        solucion_propuesta: null
    };

    try {
        // =====================================================
        // PASO 1: OBTENER ESTADO INICIAL (como GET del endpoint)
        // =====================================================
        console.log('🔍 PASO 1: ESTADO INICIAL DEL USUARIO');
        console.log('-'.repeat(50));

        const { data: estadoInicial, error: errorInicial } = await supabase
            .from('users')
            .select('id,name,email,phone,avatar,bio,occupation,age,user_type,company_name,license_number,property_count,full_name,location,search_type,budget_range,profile_image,preferred_areas,family_size,pet_friendly,move_in_date,employment_status,monthly_income,verified,email_verified,rating,review_count,created_at,updated_at')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (errorInicial) {
            console.log('❌ ERROR obteniendo estado inicial:', errorInicial.message);
            resultados.paso1_estado_inicial = { error: errorInicial.message };
            return resultados;
        }

        console.log('✅ Estado inicial obtenido exitosamente');
        console.log(`   └─ Nombre actual: ${estadoInicial.name || 'null'}`);
        console.log(`   └─ Teléfono actual: ${estadoInicial.phone || 'null'}`);
        console.log(`   └─ Bio actual: ${estadoInicial.bio || 'null'}`);
        console.log(`   └─ Ubicación actual: ${estadoInicial.location || 'null'}`);
        console.log(`   └─ Última actualización: ${estadoInicial.updated_at}`);

        resultados.paso1_estado_inicial = {
            exitoso: true,
            datos: {
                name: estadoInicial.name,
                phone: estadoInicial.phone,
                bio: estadoInicial.bio,
                location: estadoInicial.location,
                updated_at: estadoInicial.updated_at
            }
        };

        // =====================================================
        // PASO 2: SIMULAR ACTUALIZACIÓN (como PUT del endpoint)
        // =====================================================
        console.log('');
        console.log('🔍 PASO 2: SIMULANDO ACTUALIZACIÓN DEL ENDPOINT');
        console.log('-'.repeat(50));

        const datosActualizacion = {
            name: 'Usuario Test Persistencia',
            phone: '+54 376 555777',
            bio: 'Bio actualizada para test de persistencia',
            location: 'Posadas, Misiones - Test Persistencia',
            updated_at: new Date().toISOString()
        };

        console.log('📝 Datos a actualizar (simulando endpoint):');
        Object.keys(datosActualizacion).forEach(key => {
            console.log(`   └─ ${key}: ${datosActualizacion[key]}`);
        });

        // Usar exactamente la misma query que el endpoint
        const { data: datosActualizados, error: errorActualizacion } = await supabase
            .from('users')
            .update(datosActualizacion)
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .select('id,name,email,phone,avatar,bio,occupation,age,user_type,company_name,license_number,property_count,full_name,location,search_type,budget_range,profile_image,preferred_areas,family_size,pet_friendly,move_in_date,employment_status,monthly_income,verified,email_verified,rating,review_count,created_at,updated_at')
            .single();

        if (errorActualizacion) {
            console.log('❌ ERROR en actualización:', errorActualizacion.message);
            console.log(`   └─ Código: ${errorActualizacion.code}`);
            console.log(`   └─ Detalles: ${errorActualizacion.details}`);
            
            resultados.paso2_actualizacion = { 
                error: errorActualizacion.message,
                codigo: errorActualizacion.code,
                detalles: errorActualizacion.details
            };
            resultados.problema_identificado = 'Error en operación UPDATE';
            return resultados;
        }

        console.log('✅ Actualización exitosa');
        console.log(`   └─ Nombre actualizado: ${datosActualizados.name}`);
        console.log(`   └─ Teléfono actualizado: ${datosActualizados.phone}`);
        console.log(`   └─ Bio actualizada: ${datosActualizados.bio}`);
        console.log(`   └─ Ubicación actualizada: ${datosActualizados.location}`);
        console.log(`   └─ Timestamp: ${datosActualizados.updated_at}`);

        resultados.paso2_actualizacion = {
            exitoso: true,
            datos_enviados: datosActualizacion,
            datos_recibidos: {
                name: datosActualizados.name,
                phone: datosActualizados.phone,
                bio: datosActualizados.bio,
                location: datosActualizados.location,
                updated_at: datosActualizados.updated_at
            }
        };

        // =====================================================
        // PASO 3: VERIFICACIÓN INMEDIATA (simulando recarga)
        // =====================================================
        console.log('');
        console.log('🔍 PASO 3: VERIFICACIÓN INMEDIATA (simulando recarga)');
        console.log('-'.repeat(50));

        // Esperar un momento para simular recarga de página
        await new Promise(resolve => setTimeout(resolve, 2000));

        const { data: verificacionInmediata, error: errorVerificacion } = await supabase
            .from('users')
            .select('id,name,email,phone,avatar,bio,occupation,age,user_type,company_name,license_number,property_count,full_name,location,search_type,budget_range,profile_image,preferred_areas,family_size,pet_friendly,move_in_date,employment_status,monthly_income,verified,email_verified,rating,review_count,created_at,updated_at')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (errorVerificacion) {
            console.log('❌ ERROR en verificación inmediata:', errorVerificacion.message);
            resultados.paso3_verificacion_inmediata = { error: errorVerificacion.message };
        } else {
            console.log('📊 COMPARACIÓN DESPUÉS DE RECARGA:');
            
            const camposComparar = ['name', 'phone', 'bio', 'location'];
            let persistenciaCorrecta = true;
            
            camposComparar.forEach(campo => {
                const valorEsperado = datosActualizacion[campo];
                const valorActual = verificacionInmediata[campo];
                const coincide = valorEsperado === valorActual;
                
                console.log(`   └─ ${campo}:`);
                console.log(`      Esperado: "${valorEsperado}"`);
                console.log(`      Actual: "${valorActual}"`);
                console.log(`      Estado: ${coincide ? '✅ COINCIDE' : '❌ NO COINCIDE'}`);
                
                if (!coincide) {
                    persistenciaCorrecta = false;
                }
            });

            resultados.paso3_verificacion_inmediata = {
                exitoso: true,
                persistencia_correcta: persistenciaCorrecta,
                datos_verificados: {
                    name: verificacionInmediata.name,
                    phone: verificacionInmediata.phone,
                    bio: verificacionInmediata.bio,
                    location: verificacionInmediata.location,
                    updated_at: verificacionInmediata.updated_at
                }
            };

            if (persistenciaCorrecta) {
                console.log('✅ PERSISTENCIA CORRECTA: Todos los datos se mantuvieron');
            } else {
                console.log('❌ PROBLEMA DE PERSISTENCIA: Algunos datos no se mantuvieron');
                resultados.problema_identificado = 'Datos no persisten después de recarga';
            }
        }

        // =====================================================
        // PASO 4: VERIFICACIÓN CON SELECT ESPECÍFICO
        // =====================================================
        console.log('');
        console.log('🔍 PASO 4: VERIFICACIÓN CON SELECT ESPECÍFICO');
        console.log('-'.repeat(50));

        // Probar con select más simple para ver si es problema de campos
        const { data: verificacionSimple, error: errorSimple } = await supabase
            .from('users')
            .select('id, name, phone, bio, location, updated_at')
            .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .single();

        if (errorSimple) {
            console.log('❌ ERROR en verificación simple:', errorSimple.message);
            resultados.paso4_verificacion_con_select_especifico = { error: errorSimple.message };
        } else {
            console.log('✅ Verificación con SELECT específico exitosa');
            console.log(`   └─ Nombre: ${verificacionSimple.name}`);
            console.log(`   └─ Teléfono: ${verificacionSimple.phone}`);
            console.log(`   └─ Bio: ${verificacionSimple.bio}`);
            console.log(`   └─ Ubicación: ${verificacionSimple.location}`);
            console.log(`   └─ Actualizado: ${verificacionSimple.updated_at}`);

            resultados.paso4_verificacion_con_select_especifico = {
                exitoso: true,
                datos: verificacionSimple
            };
        }

        // =====================================================
        // ANÁLISIS FINAL Y DIAGNÓSTICO
        // =====================================================
        console.log('');
        console.log('📊 ANÁLISIS FINAL');
        console.log('='.repeat(70));

        if (!resultados.problema_identificado) {
            if (resultados.paso3_verificacion_inmediata?.persistencia_correcta) {
                resultados.problema_identificado = 'No se detectó problema de persistencia';
                resultados.solucion_propuesta = 'El problema puede estar en el frontend o cache del navegador';
                console.log('✅ CONCLUSIÓN: La persistencia en base de datos funciona correctamente');
                console.log('💡 RECOMENDACIÓN: Revisar cache del navegador o estado del frontend');
            } else {
                resultados.problema_identificado = 'Problema de persistencia confirmado';
                resultados.solucion_propuesta = 'Investigar políticas RLS o triggers de la tabla';
                console.log('❌ CONCLUSIÓN: Problema de persistencia confirmado en base de datos');
            }
        }

        // Verificar políticas RLS que podrían estar causando el problema
        console.log('');
        console.log('🔍 VERIFICACIÓN ADICIONAL: POLÍTICAS RLS');
        console.log('-'.repeat(50));

        const { data: politicasRLS, error: errorPoliticas } = await supabase
            .from('pg_policies')
            .select('policyname, cmd, qual, with_check')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .eq('cmd', 'UPDATE');

        if (errorPoliticas) {
            console.log('❌ Error obteniendo políticas RLS:', errorPoliticas.message);
        } else {
            console.log(`📋 Políticas UPDATE encontradas: ${politicasRLS.length}`);
            
            politicasRLS.forEach(politica => {
                console.log(`   └─ ${politica.policyname}:`);
                console.log(`      USING: ${politica.qual || 'N/A'}`);
                console.log(`      WITH CHECK: ${politica.with_check || 'N/A'}`);
                
                // Verificar si la política podría estar bloqueando updates
                if (politica.with_check && politica.with_check.includes('auth.uid()')) {
                    console.log('      ⚠️ ADVERTENCIA: WITH CHECK podría estar bloqueando updates');
                }
            });
        }

        console.log('');
        console.log('🎯 DIAGNÓSTICO FINAL:');
        console.log(`   Problema identificado: ${resultados.problema_identificado}`);
        console.log(`   Solución propuesta: ${resultados.solucion_propuesta}`);

        // Guardar resultados
        const fs = require('fs');
        fs.writeFileSync(
            'test-persistencia-endpoint-resultado.json',
            JSON.stringify(resultados, null, 2)
        );

        console.log('');
        console.log('💾 Resultados guardados en: test-persistencia-endpoint-resultado.json');
        console.log('✅ TEST DE PERSISTENCIA COMPLETADO');

        return resultados;

    } catch (error) {
        console.error('❌ Error crítico en test:', error.message);
        resultados.problema_identificado = 'Error crítico en test';
        resultados.solucion_propuesta = 'Revisar configuración de Supabase';
        return resultados;
    }
}

// Ejecutar test
if (require.main === module) {
    testPersistenciaEndpoint().catch(console.error);
}

module.exports = { testPersistenciaEndpoint };
