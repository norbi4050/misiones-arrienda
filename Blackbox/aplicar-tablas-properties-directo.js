const { createClient } = require('@supabase/supabase-js');

console.log('🔧 APLICAR TABLAS PROPERTIES - MÉTODO DIRECTO');
console.log('=' .repeat(70));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function aplicarTablasPropertiesDirecto() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('📅 Fecha:', new Date().toISOString());
    console.log('🎯 Objetivo: Crear tablas usando métodos directos de Supabase');
    console.log('');

    const resultado = {
        inicio: new Date().toISOString(),
        pasos_ejecutados: [],
        tablas_creadas: [],
        errores: [],
        exito: false
    };

    try {
        // =====================================================
        // PASO 1: VERIFICAR CONEXIÓN
        // =====================================================
        console.log('🔌 PASO 1: VERIFICANDO CONEXIÓN');
        console.log('-'.repeat(50));

        const { data: testConnection, error: connectionError } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (connectionError) {
            console.log('❌ Error de conexión:', connectionError.message);
            return resultado;
        }

        console.log('✅ Conexión exitosa');

        // =====================================================
        // PASO 2: CREAR TABLA PROPERTIES USANDO INSERT
        // =====================================================
        console.log('');
        console.log('🏗️ PASO 2: CREANDO DATOS DE PRUEBA EN PROPERTIES');
        console.log('-'.repeat(50));

        // Primero intentamos insertar datos para ver si la tabla existe
        console.log('🧪 Probando si tabla properties existe...');
        
        const { data: testProperties, error: testPropertiesError } = await supabase
            .from('properties')
            .select('id')
            .limit(1);

        if (testPropertiesError && testPropertiesError.code === 'PGRST106') {
            console.log('❌ Tabla properties NO EXISTE (confirmado)');
            console.log('');
            console.log('🚨 PROBLEMA CRÍTICO IDENTIFICADO:');
            console.log('   └─ La tabla "properties" no existe en Supabase');
            console.log('   └─ Esta es la causa del error 400');
            console.log('   └─ Necesitas crear la tabla manualmente en Supabase');
            console.log('');
            console.log('📋 INSTRUCCIONES PARA SOLUCIONAR:');
            console.log('   1. Ve a https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele');
            console.log('   2. Navega a "SQL Editor"');
            console.log('   3. Ejecuta el script: Blackbox/crear-tablas-properties-completas.sql');
            console.log('   4. Verifica que las tablas se crearon correctamente');
            
            resultado.errores.push({
                paso: 'verificar_tabla_properties',
                error: 'Tabla properties no existe',
                solucion: 'Ejecutar script SQL manualmente en Supabase Dashboard'
            });
            
        } else if (testPropertiesError) {
            console.log('❌ Error verificando tabla properties:', testPropertiesError.message);
            resultado.errores.push({
                paso: 'verificar_tabla_properties',
                error: testPropertiesError.message
            });
        } else {
            console.log('✅ Tabla properties EXISTE');
            resultado.tablas_creadas.push('properties');
        }

        // =====================================================
        // PASO 3: VERIFICAR TABLA PROPERTY_INQUIRIES
        // =====================================================
        console.log('');
        console.log('🔍 PASO 3: VERIFICANDO TABLA PROPERTY_INQUIRIES');
        console.log('-'.repeat(50));

        const { data: testInquiries, error: testInquiriesError } = await supabase
            .from('property_inquiries')
            .select('id')
            .limit(1);

        if (testInquiriesError && testInquiriesError.code === 'PGRST106') {
            console.log('❌ Tabla property_inquiries NO EXISTE');
            resultado.errores.push({
                paso: 'verificar_tabla_inquiries',
                error: 'Tabla property_inquiries no existe'
            });
        } else if (testInquiriesError) {
            console.log('❌ Error verificando tabla property_inquiries:', testInquiriesError.message);
            resultado.errores.push({
                paso: 'verificar_tabla_inquiries',
                error: testInquiriesError.message
            });
        } else {
            console.log('✅ Tabla property_inquiries EXISTE');
            resultado.tablas_creadas.push('property_inquiries');
        }

        // =====================================================
        // PASO 4: VERIFICAR OTRAS TABLAS NECESARIAS
        // =====================================================
        console.log('');
        console.log('🔍 PASO 4: VERIFICANDO OTRAS TABLAS');
        console.log('-'.repeat(50));

        const tablasAdicionales = ['favorites', 'agents', 'conversations', 'messages'];
        
        for (const tabla of tablasAdicionales) {
            const { data, error } = await supabase
                .from(tabla)
                .select('id')
                .limit(1);

            if (error && error.code === 'PGRST106') {
                console.log(`❌ Tabla ${tabla}: NO EXISTE`);
                resultado.errores.push({
                    paso: 'verificar_tablas_adicionales',
                    tabla: tabla,
                    error: 'Tabla no existe'
                });
            } else if (error) {
                console.log(`⚠️ Tabla ${tabla}: Error - ${error.message}`);
                resultado.errores.push({
                    paso: 'verificar_tablas_adicionales',
                    tabla: tabla,
                    error: error.message
                });
            } else {
                console.log(`✅ Tabla ${tabla}: EXISTE`);
                resultado.tablas_creadas.push(tabla);
            }
        }

        // =====================================================
        // PASO 5: INTENTAR CREAR DATOS DE PRUEBA SI ES POSIBLE
        // =====================================================
        console.log('');
        console.log('📊 PASO 5: INTENTANDO CREAR DATOS DE PRUEBA');
        console.log('-'.repeat(50));

        if (resultado.tablas_creadas.includes('properties')) {
            console.log('🧪 Intentando insertar propiedad de prueba...');
            
            const propiedadPrueba = {
                id: 'prop-test-001',
                title: 'Casa 3 dormitorios en Posadas Centro',
                description: 'Hermosa casa familiar en el centro de Posadas, cerca de todos los servicios.',
                price: 150000,
                property_type: 'casa',
                bedrooms: 3,
                bathrooms: 2,
                area_m2: 120.5,
                address: 'Av. Mitre 1234',
                city: 'Posadas',
                user_id: '6403f9d2-e846-4c70-87e0-e051127d9500',
                status: 'active',
                contact_phone: '+54 376 123456',
                contact_email: 'test@misionesarrienda.com'
            };

            const { data: insertResult, error: insertError } = await supabase
                .from('properties')
                .insert(propiedadPrueba)
                .select();

            if (insertError) {
                if (insertError.message.includes('duplicate key') || insertError.message.includes('already exists')) {
                    console.log('✅ Propiedad de prueba ya existe');
                } else {
                    console.log('❌ Error insertando propiedad de prueba:', insertError.message);
                    resultado.errores.push({
                        paso: 'insertar_datos_prueba',
                        error: insertError.message
                    });
                }
            } else {
                console.log('✅ Propiedad de prueba insertada exitosamente');
                resultado.pasos_ejecutados.push({
                    paso: 'insertar_datos_prueba',
                    resultado: 'exitoso'
                });
            }
        }

        // =====================================================
        // PASO 6: PROBAR LA CONSULTA ORIGINAL
        // =====================================================
        console.log('');
        console.log('🧪 PASO 6: PROBANDO LA CONSULTA ORIGINAL');
        console.log('-'.repeat(50));

        if (resultado.tablas_creadas.includes('properties')) {
            console.log('🔍 Probando consulta que causaba error 400...');
            
            try {
                const { data: testQuery, error: testError } = await supabase
                    .from('properties')
                    .select('id, inquiries:property_inquiries(id)')
                    .eq('user_id', '6403f9d2-e846-4c70-87e0-e051127d9500');

                if (testError) {
                    console.log('❌ La consulta original sigue fallando:', testError.message);
                    console.log(`   └─ Código: ${testError.code}`);
                    
                    if (testError.message.includes('property_inquiries')) {
                        console.log('   🎯 Problema: Tabla property_inquiries no existe o relación mal configurada');
                    }
                    
                    resultado.errores.push({
                        paso: 'probar_consulta_original',
                        error: testError.message,
                        codigo: testError.code
                    });
                } else {
                    console.log('✅ ¡La consulta original ahora funciona!');
                    console.log(`   └─ Propiedades encontradas: ${testQuery ? testQuery.length : 0}`);
                    resultado.pasos_ejecutados.push({
                        paso: 'probar_consulta_original',
                        resultado: 'exitoso',
                        propiedades_encontradas: testQuery ? testQuery.length : 0
                    });
                    resultado.exito = true;
                }
            } catch (error) {
                console.log('❌ Error crítico probando consulta:', error.message);
                resultado.errores.push({
                    paso: 'probar_consulta_original',
                    error: error.message,
                    critico: true
                });
            }
        } else {
            console.log('⚠️ No se puede probar la consulta: tabla properties no existe');
        }

        // =====================================================
        // RESULTADO FINAL
        // =====================================================
        console.log('');
        console.log('🎯 RESULTADO FINAL');
        console.log('='.repeat(70));

        const tablasEncontradas = resultado.tablas_creadas.length;
        const erroresCriticos = resultado.errores.filter(e => e.critico).length;

        if (tablasEncontradas === 0) {
            console.log('❌ PROBLEMA CRÍTICO: NINGUNA TABLA EXISTE');
            console.log('');
            console.log('🚨 ACCIÓN REQUERIDA INMEDIATA:');
            console.log('   1. Ve a Supabase Dashboard: https://supabase.com/dashboard/project/qfeyhaaxyemmnohqdele');
            console.log('   2. Navega a "SQL Editor"');
            console.log('   3. Copia y pega el contenido de: Blackbox/crear-tablas-properties-completas.sql');
            console.log('   4. Ejecuta el script completo');
            console.log('   5. Verifica que las tablas se crearon');
            console.log('   6. Vuelve a ejecutar este script para verificar');
            
        } else if (resultado.exito) {
            console.log('✅ PROBLEMA SOLUCIONADO EXITOSAMENTE');
            console.log(`   └─ Tablas encontradas: ${tablasEncontradas}`);
            console.log('   └─ Error 400 properties: SOLUCIONADO');
            console.log('   └─ Consulta original: FUNCIONA');
            
        } else {
            console.log('⚠️ SOLUCIÓN PARCIAL');
            console.log(`   └─ Tablas encontradas: ${tablasEncontradas}`);
            console.log(`   └─ Errores: ${resultado.errores.length}`);
            console.log('   └─ Revisar errores para completar solución');
        }

        // Guardar resultado
        const fs = require('fs');
        fs.writeFileSync(
            'aplicar-tablas-properties-resultado.json',
            JSON.stringify(resultado, null, 2)
        );

        console.log('');
        console.log('💾 Resultado guardado en: aplicar-tablas-properties-resultado.json');
        console.log('✅ VERIFICACIÓN COMPLETADA');

        return resultado;

    } catch (error) {
        console.error('❌ Error crítico:', error.message);
        resultado.errores.push({
            paso: 'ejecucion_general',
            error: error.message,
            critico: true
        });
        return resultado;
    }
}

// Ejecutar aplicación
if (require.main === module) {
    aplicarTablasPropertiesDirecto().catch(console.error);
}

module.exports = { aplicarTablasPropertiesDirecto };
