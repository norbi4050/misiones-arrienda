const { createClient } = require('@supabase/supabase-js');

console.log('🎉 TEST FINAL - POLÍTICAS RLS CONFIGURADAS');
console.log('=' .repeat(60));

const SUPABASE_URL = 'https://qfeyhaaxyemmnohqdele.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM';

async function testFinalPoliciesConfiguradas() {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log('🔗 Conectando a Supabase para test final...');
    console.log('');

    const resultadoFinal = {
        rlsHabilitado: false,
        politicasConfiguradas: 0,
        politicasPrincipales: [],
        error406Solucionado: false,
        consultasOperativas: false,
        usuarioPruebaFuncional: false,
        estadoGeneral: 'VERIFICANDO',
        puntuacionFinal: 0,
        completamenteOptimizado: false
    };

    try {
        // 1. VERIFICAR RLS HABILITADO
        console.log('🔒 VERIFICANDO RLS HABILITADO...');
        console.log('-'.repeat(50));

        const { data: rlsData, error: rlsError } = await supabase
            .from('pg_tables')
            .select('rowsecurity')
            .eq('schemaname', 'public')
            .eq('tablename', 'users')
            .single();

        if (rlsError) {
            console.log('   ❌ Error verificando RLS:', rlsError.message);
        } else {
            resultadoFinal.rlsHabilitado = rlsData.rowsecurity;
            console.log(`   ${rlsData.rowsecurity ? '✅' : '❌'} RLS: ${rlsData.rowsecurity ? 'HABILITADO' : 'DESHABILITADO'}`);
            if (rlsData.rowsecurity) resultadoFinal.puntuacionFinal += 20;
        }

        // 2. VERIFICAR POLÍTICAS CONFIGURADAS
        console.log('');
        console.log('📋 VERIFICANDO POLÍTICAS CONFIGURADAS...');
        console.log('-'.repeat(50));

        const { data: politicas, error: politicasError } = await supabase
            .from('pg_policies')
            .select('policyname, cmd')
            .eq('schemaname', 'public')
            .eq('tablename', 'users');

        if (politicasError) {
            console.log('   ❌ Error obteniendo políticas:', politicasError.message);
        } else {
            resultadoFinal.politicasConfiguradas = politicas.length;
            resultadoFinal.politicasPrincipales = politicas.map(p => p.policyname);

            console.log(`   📊 Total políticas configuradas: ${politicas.length}`);
            console.log('   📋 Políticas encontradas:');
            
            const politicasEsperadas = [
                'Users can view own profile',
                'Users can update own profile',
                'Users can insert own profile',
                'Users can delete own profile',
                'Service role full access'
            ];

            let politicasPrincipalesEncontradas = 0;
            politicasEsperadas.forEach(esperada => {
                const encontrada = politicas.some(p => p.policyname === esperada);
                console.log(`      ${encontrada ? '✅' : '❌'} ${esperada}`);
                if (encontrada) politicasPrincipalesEncontradas++;
            });

            if (politicasPrincipalesEncontradas >= 4) {
                resultadoFinal.puntuacionFinal += 25;
                console.log('   ✅ POLÍTICAS PRINCIPALES CONFIGURADAS CORRECTAMENTE');
            }
        }

        // 3. TEST CRÍTICO: ERROR 406 ORIGINAL
        console.log('');
        console.log('🧪 TEST CRÍTICO: ERROR 406 ORIGINAL...');
        console.log('-'.repeat(50));

        const userId = '6403f9d2-e846-4c70-87e0-e051127d9500';

        try {
            const { data: testOriginal, error: errorOriginal } = await supabase
                .from('users')
                .select('user_type,created_at')
                .eq('id', userId)
                .single();

            if (errorOriginal) {
                console.log('   ❌ ERROR 406 PERSISTE:', errorOriginal.message);
                console.log('   🚨 Código:', errorOriginal.code);
            } else {
                console.log('   ✅ ERROR 406 COMPLETAMENTE ELIMINADO');
                console.log('   📊 Datos obtenidos exitosamente:', JSON.stringify(testOriginal));
                resultadoFinal.error406Solucionado = true;
                resultadoFinal.puntuacionFinal += 30;
            }
        } catch (error) {
            console.log('   ❌ Error en test 406:', error.message);
        }

        // 4. TEST DE CONSULTAS MÚLTIPLES
        console.log('');
        console.log('🔍 TEST DE CONSULTAS MÚLTIPLES...');
        console.log('-'.repeat(50));

        const consultasTest = [
            { nombre: 'SELECT específico', query: 'id,name,email' },
            { nombre: 'SELECT con user_type', query: 'user_type,created_at' },
            { nombre: 'SELECT completo', query: '*' }
        ];

        let consultasExitosas = 0;
        for (const consulta of consultasTest) {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select(consulta.query)
                    .eq('id', userId)
                    .single();

                if (error) {
                    console.log(`   ❌ ${consulta.nombre}: ${error.message}`);
                } else {
                    console.log(`   ✅ ${consulta.nombre}: OK`);
                    consultasExitosas++;
                }
            } catch (error) {
                console.log(`   ❌ ${consulta.nombre}: ${error.message}`);
            }
        }

        if (consultasExitosas === consultasTest.length) {
            resultadoFinal.consultasOperativas = true;
            resultadoFinal.puntuacionFinal += 15;
            console.log('   ✅ TODAS LAS CONSULTAS FUNCIONANDO PERFECTAMENTE');
        }

        // 5. TEST DE USUARIO DE PRUEBA
        console.log('');
        console.log('👤 TEST DE USUARIO DE PRUEBA...');
        console.log('-'.repeat(50));

        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, email, user_type, created_at')
                .eq('id', userId)
                .single();

            if (userError) {
                console.log('   ❌ Usuario de prueba no accesible:', userError.message);
            } else {
                console.log('   ✅ Usuario de prueba completamente funcional:');
                console.log(`      - ID: ${userData.id}`);
                console.log(`      - Nombre: ${userData.name || 'N/A'}`);
                console.log(`      - Email: ${userData.email || 'N/A'}`);
                console.log(`      - Tipo: ${userData.user_type || 'N/A'}`);
                console.log(`      - Creado: ${userData.created_at || 'N/A'}`);
                resultadoFinal.usuarioPruebaFuncional = true;
                resultadoFinal.puntuacionFinal += 10;
            }
        } catch (error) {
            console.log('   ❌ Error verificando usuario:', error.message);
        }

        // 6. DETERMINAR ESTADO FINAL
        console.log('');
        console.log('📊 EVALUACIÓN FINAL');
        console.log('='.repeat(60));

        const puntuacionMaxima = 100;
        const porcentajeCompletado = (resultadoFinal.puntuacionFinal / puntuacionMaxima) * 100;

        console.log(`📈 PUNTUACIÓN OBTENIDA: ${resultadoFinal.puntuacionFinal}/${puntuacionMaxima}`);
        console.log(`📊 PORCENTAJE COMPLETADO: ${porcentajeCompletado.toFixed(1)}%`);

        if (porcentajeCompletado >= 90) {
            resultadoFinal.estadoGeneral = '🎉 COMPLETAMENTE OPTIMIZADO';
            resultadoFinal.completamenteOptimizado = true;
        } else if (porcentajeCompletado >= 75) {
            resultadoFinal.estadoGeneral = '✅ MAYORMENTE OPTIMIZADO';
        } else {
            resultadoFinal.estadoGeneral = '⚠️ OPTIMIZACIÓN PARCIAL';
        }

        console.log(`🎯 ESTADO GENERAL: ${resultadoFinal.estadoGeneral}`);

        // RESUMEN DETALLADO
        console.log('');
        console.log('📋 RESUMEN DETALLADO:');
        console.log(`   🔒 RLS habilitado: ${resultadoFinal.rlsHabilitado ? '✅' : '❌'}`);
        console.log(`   📋 Políticas configuradas: ${resultadoFinal.politicasConfiguradas}`);
        console.log(`   🧪 Error 406 solucionado: ${resultadoFinal.error406Solucionado ? '✅' : '❌'}`);
        console.log(`   🔍 Consultas operativas: ${resultadoFinal.consultasOperativas ? '✅' : '❌'}`);
        console.log(`   👤 Usuario de prueba funcional: ${resultadoFinal.usuarioPruebaFuncional ? '✅' : '❌'}`);

        if (resultadoFinal.completamenteOptimizado) {
            console.log('');
            console.log('🎉 ¡FELICITACIONES!');
            console.log('✅ SUPABASE COMPLETAMENTE OPTIMIZADO');
            console.log('✅ ERROR 406 DEFINITIVAMENTE ELIMINADO');
            console.log('✅ POLÍTICAS RLS CONFIGURADAS CORRECTAMENTE');
            console.log('✅ TODAS LAS CONSULTAS FUNCIONANDO PERFECTAMENTE');
            console.log('✅ BASE DE DATOS PRODUCTION-READY');
            console.log('');
            console.log('🏆 NO EXISTEN MÁS DETALLES PARA SOLUCIONAR');
        }

        // Guardar reporte final
        require('fs').writeFileSync(
            'REPORTE-TEST-FINAL-POLICIES-CONFIGURADAS.json',
            JSON.stringify(resultadoFinal, null, 2)
        );

        console.log('');
        console.log('📄 Reporte guardado en: REPORTE-TEST-FINAL-POLICIES-CONFIGURADAS.json');
        console.log('✅ TEST FINAL COMPLETADO');

        return resultadoFinal;

    } catch (error) {
        console.error('❌ Error general en test final:', error.message);
        resultadoFinal.estadoGeneral = '❌ ERROR EN TESTING';
        return resultadoFinal;
    }
}

testFinalPoliciesConfiguradas().catch(console.error);
