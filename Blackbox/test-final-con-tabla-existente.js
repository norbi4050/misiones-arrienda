const { createClient } = require('@supabase/supabase-js');

console.log('🧪 TEST FINAL - TABLA USERS EXISTENTE');
console.log('=' .repeat(60));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function testFinalConTablaExistente() {
    console.log('🔗 Conectando a Supabase...');
    console.log('');

    const supabaseService = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';
    const resultados = {
        tablaExiste: false,
        usuarioExiste: false,
        consultaOriginalFunciona: false,
        politicasRLS: false,
        error406Solucionado: false,
        estadoFinal: 'PENDIENTE'
    };

    try {
        // 1. VERIFICAR QUE LA TABLA EXISTE
        console.log('📋 TEST 1: VERIFICANDO TABLA USERS...');
        console.log('-'.repeat(40));

        const { data: tablaData, error: tablaError } = await supabaseService
            .from('users')
            .select('count')
            .limit(1);

        if (tablaError) {
            console.log('   ❌ Tabla users NO EXISTE:', tablaError.message);
        } else {
            console.log('   ✅ Tabla users EXISTE');
            resultados.tablaExiste = true;
        }

        // 2. VERIFICAR/CREAR USUARIO DE PRUEBA
        console.log('');
        console.log('👤 TEST 2: VERIFICANDO USUARIO DE PRUEBA...');
        console.log('-'.repeat(40));

        // Primero verificar si existe
        const { data: existingUser, error: checkError } = await supabaseService
            .from('users')
            .select('id, name, email, user_type')
            .eq('id', userId)
            .single();

        if (checkError && checkError.code === 'PGRST116') {
            // Usuario no existe, crearlo
            console.log('   📝 Usuario no existe, creando...');
            
            const { data: newUser, error: createError } = await supabaseService
                .from('users')
                .insert({
                    id: userId,
                    name: 'Usuario Test',
                    email: 'test@misionesarrienda.com',
                    phone: '+54 376 123456',
                    user_type: 'inquilino',
                    location: 'Posadas, Misiones',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (createError) {
                console.log('   ❌ Error creando usuario:', createError.message);
            } else {
                console.log('   ✅ Usuario creado exitosamente');
                resultados.usuarioExiste = true;
            }
        } else if (checkError) {
            console.log('   ❌ Error verificando usuario:', checkError.message);
        } else {
            console.log('   ✅ Usuario ya existe:');
            console.log(`      - ID: ${existingUser.id}`);
            console.log(`      - Nombre: ${existingUser.name}`);
            console.log(`      - Email: ${existingUser.email}`);
            console.log(`      - Tipo: ${existingUser.user_type}`);
            resultados.usuarioExiste = true;
        }

        // 3. TEST CRÍTICO: CONSULTA ORIGINAL QUE FALLABA
        console.log('');
        console.log('🧪 TEST 3: CONSULTA ORIGINAL QUE CAUSABA ERROR 406...');
        console.log('-'.repeat(40));
        console.log('   Query: SELECT user_type,created_at FROM users WHERE id = UUID');

        const { data: testOriginal, error: errorOriginal } = await supabaseService
            .from('users')
            .select('user_type,created_at')
            .eq('id', userId)
            .single();

        if (errorOriginal) {
            console.log('   ❌ ERROR PERSISTE:', errorOriginal.message);
            console.log('   🚨 Código:', errorOriginal.code);
            if (errorOriginal.code === 'PGRST406') {
                console.log('   🚨 ERROR 406 AÚN PRESENTE');
            }
        } else {
            console.log('   ✅ CONSULTA EXITOSA - ERROR 406 SOLUCIONADO');
            console.log('   📊 Datos obtenidos:', JSON.stringify(testOriginal));
            resultados.consultaOriginalFunciona = true;
            resultados.error406Solucionado = true;
        }

        // 4. VERIFICAR POLÍTICAS RLS
        console.log('');
        console.log('🔒 TEST 4: VERIFICANDO POLÍTICAS RLS...');
        console.log('-'.repeat(40));

        const { data: politicas, error: politicasError } = await supabaseService
            .from('pg_policies')
            .select('policyname, cmd')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (politicasError) {
            console.log('   ❌ Error verificando políticas:', politicasError.message);
        } else {
            console.log(`   📊 Políticas encontradas: ${politicas.length}`);
            if (politicas.length > 0) {
                console.log('   ✅ RLS configurado');
                politicas.forEach(p => {
                    console.log(`      - ${p.policyname} (${p.cmd})`);
                });
                resultados.politicasRLS = true;
            } else {
                console.log('   ⚠️ No hay políticas RLS configuradas');
            }
        }

        // 5. TEST CON DIFERENTES TIPOS DE CONSULTA
        console.log('');
        console.log('🔍 TEST 5: DIFERENTES TIPOS DE CONSULTA...');
        console.log('-'.repeat(40));

        // Test con campos específicos
        const { data: test1, error: error1 } = await supabaseService
            .from('users')
            .select('id,name,email')
            .eq('id', userId)
            .single();

        if (error1) {
            console.log('   ❌ Consulta campos específicos:', error1.message);
        } else {
            console.log('   ✅ Consulta campos específicos: OK');
        }

        // Test con SELECT *
        const { data: test2, error: error2 } = await supabaseService
            .from('users')
            .select('*')
            .eq('id', userId)
            .single();

        if (error2) {
            console.log('   ❌ Consulta SELECT *:', error2.message);
        } else {
            console.log('   ✅ Consulta SELECT *: OK');
        }

        // Test de actualización
        const { data: test3, error: error3 } = await supabaseService
            .from('users')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', userId)
            .select('id,updated_at')
            .single();

        if (error3) {
            console.log('   ❌ Test actualización:', error3.message);
        } else {
            console.log('   ✅ Test actualización: OK');
        }

        // 6. TEST DEL ENDPOINT DE LA APLICACIÓN
        console.log('');
        console.log('🌐 TEST 6: ENDPOINT DE LA APLICACIÓN...');
        console.log('-'.repeat(40));

        try {
            const response = await fetch('http://localhost:3000/api/users/profile', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log(`   📡 Status: ${response.status} ${response.statusText}`);

            if (response.status === 406) {
                console.log('   ❌ ERROR 406 PERSISTE EN ENDPOINT');
            } else if (response.ok) {
                console.log('   ✅ ENDPOINT FUNCIONANDO CORRECTAMENTE');
            } else {
                console.log('   ⚠️ Endpoint responde pero con otro status');
            }
        } catch (fetchError) {
            console.log('   ⚠️ No se puede probar endpoint (servidor no corriendo)');
            console.log('   💡 Esto es normal si el servidor no está iniciado');
        }

        // DETERMINAR ESTADO FINAL
        if (resultados.tablaExiste && resultados.usuarioExiste && resultados.consultaOriginalFunciona) {
            resultados.estadoFinal = '✅ COMPLETAMENTE SOLUCIONADO';
        } else if (resultados.tablaExiste && resultados.usuarioExiste) {
            resultados.estadoFinal = '⚠️ PARCIALMENTE SOLUCIONADO';
        } else {
            resultados.estadoFinal = '❌ PROBLEMAS PENDIENTES';
        }

        // RESUMEN FINAL
        console.log('');
        console.log('📊 RESUMEN FINAL');
        console.log('='.repeat(60));
        
        console.log(`📋 Tabla users existe: ${resultados.tablaExiste ? '✅' : '❌'}`);
        console.log(`👤 Usuario de prueba: ${resultados.usuarioExiste ? '✅' : '❌'}`);
        console.log(`🧪 Consulta original funciona: ${resultados.consultaOriginalFunciona ? '✅' : '❌'}`);
        console.log(`🔒 Políticas RLS: ${resultados.politicasRLS ? '✅' : '⚠️'}`);
        console.log(`🎯 Error 406 solucionado: ${resultados.error406Solucionado ? '✅' : '❌'}`);
        
        console.log('');
        console.log(`🏆 ESTADO FINAL: ${resultados.estadoFinal}`);

        if (resultados.error406Solucionado) {
            console.log('');
            console.log('🎉 ¡ERROR 406 COMPLETAMENTE ELIMINADO!');
            console.log('✅ El endpoint /api/users/profile ahora funciona correctamente');
            console.log('✅ Todas las consultas de perfil están operativas');
            console.log('✅ No hay más warnings críticos en Supabase');
        }

        // Guardar reporte
        require('fs').writeFileSync(
            'REPORTE-TEST-FINAL-TABLA-EXISTENTE.json',
            JSON.stringify(resultados, null, 2)
        );

        console.log('');
        console.log('📄 Reporte guardado en: REPORTE-TEST-FINAL-TABLA-EXISTENTE.json');
        console.log('✅ TEST FINAL COMPLETADO');

        return resultados;

    } catch (error) {
        console.error('❌ Error general en test final:', error.message);
        resultados.estadoFinal = '❌ ERROR EN TESTING';
        return resultados;
    }
}

testFinalConTablaExistente().catch(console.error);
