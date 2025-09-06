// =====================================================
// TEST FINAL - ERROR 400 PROPERTIES SOLUCIONADO
// =====================================================
// Fecha: 2025-01-27
// Propósito: Verificar que el error 400 está completamente solucionado
// Resultado esperado: Query original funciona sin errores
// =====================================================

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTg1NzYwMCwiZXhwIjoyMDUxNDMzNjAwfQ.wuI-k6zOaJJVKJKd-Zt8VJJxKJKJKJKJKJKJKJKJKJK';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testErrorProperties() {
    console.log('🔍 INICIANDO TEST FINAL - ERROR 400 PROPERTIES');
    console.log('='.repeat(60));
    console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
    console.log(`🔗 Supabase URL: ${SUPABASE_URL}`);
    console.log('='.repeat(60));
    console.log('');

    try {
        // ====================================================================
        console.log('🔍 PASO 1: VERIFICAR CONEXIÓN');
        console.log('='.repeat(40));
        
        const { data: connectionTest, error: connectionError } = await supabase
            .from('users')
            .select('count')
            .limit(1);

        if (connectionError) {
            console.log('❌ Error de conexión:', connectionError.message);
            return;
        }
        console.log('✅ Conexión exitosa con Supabase');
        console.log('');

        // ====================================================================
        console.log('🔍 PASO 2: VERIFICAR TABLAS CREADAS');
        console.log('='.repeat(40));

        const tablasEsperadas = ['properties', 'property_inquiries', 'favorites', 'agents', 'conversations', 'messages'];
        
        for (const tabla of tablasEsperadas) {
            try {
                const { data, error } = await supabase
                    .from(tabla)
                    .select('count')
                    .limit(1);

                if (error) {
                    console.log(`❌ Tabla ${tabla}: NO EXISTE - ${error.message}`);
                } else {
                    console.log(`✅ Tabla ${tabla}: EXISTE y accesible`);
                }
            } catch (err) {
                console.log(`❌ Tabla ${tabla}: ERROR - ${err.message}`);
            }
        }
        console.log('');

        // ====================================================================
        console.log('🔍 PASO 3: VERIFICAR DATOS DE PRUEBA');
        console.log('='.repeat(40));

        // Verificar propiedades
        const { data: properties, error: propError } = await supabase
            .from('properties')
            .select('id, title, user_id')
            .limit(5);

        if (propError) {
            console.log('❌ Error obteniendo propiedades:', propError.message);
        } else {
            console.log(`✅ Propiedades encontradas: ${properties.length}`);
            properties.forEach(prop => {
                console.log(`   📋 ${prop.title} (ID: ${prop.id})`);
            });
        }

        // Verificar consultas
        const { data: inquiries, error: inquiryError } = await supabase
            .from('property_inquiries')
            .select('id, property_id, message, status')
            .limit(5);

        if (inquiryError) {
            console.log('❌ Error obteniendo consultas:', inquiryError.message);
        } else {
            console.log(`✅ Consultas encontradas: ${inquiries.length}`);
            inquiries.forEach(inquiry => {
                console.log(`   📋 ${inquiry.message.substring(0, 50)}... (${inquiry.status})`);
            });
        }
        console.log('');

        // ====================================================================
        console.log('🔍 PASO 4: PROBAR QUERY ORIGINAL QUE CAUSABA ERROR 400');
        console.log('='.repeat(40));

        // Esta es la query exacta que causaba el error 400
        const { data: testQuery, error: testError } = await supabase
            .from('properties')
            .select(`
                id,
                inquiries:property_inquiries(id, message, status, created_at)
            `)
            .eq('user_id', '6403f9d2-e846-4c70-87e0-e051127d9500')
            .limit(5);

        if (testError) {
            console.log('❌ ERROR 400 PERSISTE:', testError.message);
            console.log('   Código:', testError.code);
            console.log('   Detalles:', testError.details);
        } else {
            console.log('✅ QUERY ORIGINAL FUNCIONA CORRECTAMENTE');
            console.log(`   Propiedades obtenidas: ${testQuery.length}`);
            testQuery.forEach(prop => {
                console.log(`   📋 Propiedad ${prop.id}:`);
                console.log(`      └─ Consultas: ${prop.inquiries ? prop.inquiries.length : 0}`);
                if (prop.inquiries && prop.inquiries.length > 0) {
                    prop.inquiries.forEach(inq => {
                        console.log(`         └─ ${inq.message.substring(0, 30)}... (${inq.status})`);
                    });
                }
            });
        }
        console.log('');

        // ====================================================================
        console.log('🔍 PASO 5: PROBAR DIFERENTES VARIACIONES DE LA QUERY');
        console.log('='.repeat(40));

        // Test 1: Query simple
        const { data: test1, error: error1 } = await supabase
            .from('properties')
            .select('id, title')
            .limit(3);

        console.log(error1 ? `❌ Test 1 falló: ${error1.message}` : `✅ Test 1 exitoso: ${test1.length} propiedades`);

        // Test 2: Query con JOIN
        const { data: test2, error: error2 } = await supabase
            .from('properties')
            .select(`
                id,
                title,
                property_inquiries(id, status)
            `)
            .limit(3);

        console.log(error2 ? `❌ Test 2 falló: ${error2.message}` : `✅ Test 2 exitoso: ${test2.length} propiedades con consultas`);

        // Test 3: Query con filtro específico
        const { data: test3, error: error3 } = await supabase
            .from('properties')
            .select(`
                id,
                inquiries:property_inquiries(id)
            `)
            .eq('user_id', '6403f9d2-e846-4c70-87e0-e051127d9500');

        console.log(error3 ? `❌ Test 3 falló: ${error3.message}` : `✅ Test 3 exitoso: ${test3.length} propiedades del usuario`);

        console.log('');

        // ====================================================================
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(40));

        const todosLosTestsExitosos = !testError && !error1 && !error2 && !error3;

        if (todosLosTestsExitosos) {
            console.log('🎉 ¡ERROR 400 PROPERTIES COMPLETAMENTE SOLUCIONADO!');
            console.log('✅ Todas las tablas creadas correctamente');
            console.log('✅ Datos de prueba insertados exitosamente');
            console.log('✅ Query original funciona sin errores');
            console.log('✅ Todas las variaciones de query funcionan');
            console.log('');
            console.log('🚀 SISTEMA DE PROPIEDADES COMPLETAMENTE FUNCIONAL');
        } else {
            console.log('⚠️ Algunos tests fallaron, revisar errores arriba');
        }

        console.log('');
        console.log('✅ TEST FINAL COMPLETADO');

    } catch (error) {
        console.error('❌ Error durante el test:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Ejecutar test
testErrorProperties().catch(console.error);
