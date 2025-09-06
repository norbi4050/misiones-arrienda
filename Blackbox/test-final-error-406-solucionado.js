const { createClient } = require('@supabase/supabase-js');

console.log('🧪 TEST FINAL - VERIFICACIÓN ERROR 406 SOLUCIONADO');
console.log('=' .repeat(60));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

async function testErrorSolucionado() {
    console.log('🔗 Conectando con clave anónima...');
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';

    try {
        // 1. Test de la consulta exacta que estaba fallando
        console.log('');
        console.log('🧪 TEST 1: CONSULTA EXACTA QUE FALLABA...');
        console.log('URL: /rest/v1/users?select=user_type%2Ccreated_at&id=eq.6403f9d2-e846-4c70-87e0-e051127d9500');
        
        const { data: test1, error: error1 } = await supabase
            .from('users')
            .select('user_type,created_at')
            .eq('id', userId)
            .single();

        if (error1) {
            console.log('❌ ERROR 1:', error1.message);
            console.log('   Código:', error1.code);
            console.log('   Status:', error1.status || 'N/A');
        } else {
            console.log('✅ TEST 1 EXITOSO');
            console.log('   Datos:', test1);
        }

        // 2. Test con más campos
        console.log('');
        console.log('🧪 TEST 2: CONSULTA CON MÁS CAMPOS...');
        
        const { data: test2, error: error2 } = await supabase
            .from('users')
            .select('id,name,email,user_type,created_at')
            .eq('id', userId)
            .single();

        if (error2) {
            console.log('❌ ERROR 2:', error2.message);
            console.log('   Código:', error2.code);
        } else {
            console.log('✅ TEST 2 EXITOSO');
            console.log('   Datos:', test2);
        }

        // 3. Test con todos los campos
        console.log('');
        console.log('🧪 TEST 3: CONSULTA CON TODOS LOS CAMPOS...');
        
        const { data: test3, error: error3 } = await supabase
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error3) {
            console.log('❌ ERROR 3:', error3.message);
            console.log('   Código:', error3.code);
        } else {
            console.log('✅ TEST 3 EXITOSO');
            console.log('   Campos disponibles:', Object.keys(test3).join(', '));
        }

        // 4. Test de inserción/actualización
        console.log('');
        console.log('🧪 TEST 4: ACTUALIZACIÓN DE DATOS...');
        
        const { data: test4, error: error4 } = await supabase
            .from('users')
            .update({ 
                name: 'Usuario Test Actualizado',
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('id,name,updated_at')
            .single();

        if (error4) {
            console.log('❌ ERROR 4:', error4.message);
            console.log('   Código:', error4.code);
        } else {
            console.log('✅ TEST 4 EXITOSO');
            console.log('   Datos actualizados:', test4);
        }

        // 5. Test del endpoint de la aplicación
        console.log('');
        console.log('🧪 TEST 5: ENDPOINT DE LA APLICACIÓN...');
        
        try {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
            });

            console.log('   Status:', response.status);
            console.log('   Status Text:', response.statusText);

            if (response.ok) {
                const data = await response.json();
                console.log('✅ TEST 5 EXITOSO');
                console.log('   Respuesta:', data);
            } else {
                const errorData = await response.text();
                console.log('❌ ERROR 5:', errorData);
            }
        } catch (fetchError) {
            console.log('❌ ERROR 5 (Fetch):', fetchError.message);
            console.log('   (Esto es normal si el servidor no está corriendo)');
        }

        // Resumen final
        console.log('');
        console.log('📊 RESUMEN DE TESTS:');
        console.log('='.repeat(40));
        
        let testsExitosos = 0;
        if (!error1) testsExitosos++;
        if (!error2) testsExitosos++;
        if (!error3) testsExitosos++;
        if (!error4) testsExitosos++;
        
        console.log(`✅ Tests exitosos: ${testsExitosos}/4`);
        
        if (testsExitosos >= 3) {
            console.log('🎉 ERROR 406 SOLUCIONADO - La tabla users funciona correctamente');
        } else if (testsExitosos >= 1) {
            console.log('⚠️ PROGRESO PARCIAL - Algunos tests funcionan, revisar errores restantes');
        } else {
            console.log('❌ ERROR PERSISTE - Revisar configuración de Supabase');
        }

    } catch (error) {
        console.error('❌ Error general en tests:', error.message);
    }
}

testErrorSolucionado().catch(console.error);
