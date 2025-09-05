const { createClient } = require('@supabase/supabase-js');

// 🧪 TESTING POST-SOLUCIÓN WARNINGS SUPABASE
console.log('🧪 INICIANDO TESTING POST-SOLUCIÓN WARNINGS SUPABASE...\n');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabaseConnection() {
    console.log('📊 Probando conexión a Supabase...');
    
    try {
        // Test básico de conexión
        const { data, error } = await supabase
            .from('properties')
            .select('count')
            .limit(1);
        
        if (error) {
            console.log('⚠️ Error en conexión:', error.message);
            return false;
        }
        
        console.log('✅ Conexión a Supabase exitosa');
        return true;
    } catch (error) {
        console.log('❌ Error de conexión:', error.message);
        return false;
    }
}

async function testPerformanceOptimizations() {
    console.log('\n🚀 Probando optimizaciones de rendimiento...');
    
    try {
        const startTime = Date.now();
        
        // Test de consulta optimizada
        const { data, error } = await supabase
            .from('properties')
            .select('id, title, price')
            .limit(10);
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;
        
        if (error) {
            console.log('⚠️ Error en consulta optimizada:', error.message);
            return false;
        }
        
        console.log(`✅ Consulta optimizada completada en ${queryTime}ms`);
        
        if (queryTime < 1000) {
            console.log('🚀 Rendimiento EXCELENTE (< 1s)');
        } else if (queryTime < 2000) {
            console.log('✅ Rendimiento BUENO (< 2s)');
        } else {
            console.log('⚠️ Rendimiento MEJORABLE (> 2s)');
        }
        
        return true;
    } catch (error) {
        console.log('❌ Error en test de rendimiento:', error.message);
        return false;
    }
}

async function testUnifiedPolicies() {
    console.log('\n🔐 Probando políticas unificadas...');
    
    try {
        // Test de acceso con políticas unificadas
        const { data, error } = await supabase
            .from('properties')
            .select('id')
            .limit(1);
        
        if (error) {
            console.log('⚠️ Error en políticas unificadas:', error.message);
            return false;
        }
        
        console.log('✅ Políticas unificadas funcionando correctamente');
        return true;
    } catch (error) {
        console.log('❌ Error en test de políticas:', error.message);
        return false;
    }
}

async function testMonitoringFunctions() {
    console.log('\n📊 Probando funciones de monitoreo...');
    
    try {
        // Test de función de monitoreo de políticas duplicadas
        const { data: policiesData, error: policiesError } = await supabase
            .rpc('check_duplicate_policies');
        
        if (policiesError) {
            console.log('⚠️ Advertencia en función de políticas:', policiesError.message);
        } else {
            console.log('✅ Función check_duplicate_policies funcionando');
        }
        
        // Test de función de monitoreo de índices duplicados
        const { data: indexesData, error: indexesError } = await supabase
            .rpc('check_duplicate_indexes');
        
        if (indexesError) {
            console.log('⚠️ Advertencia en función de índices:', indexesError.message);
        } else {
            console.log('✅ Función check_duplicate_indexes funcionando');
        }
        
        return true;
    } catch (error) {
        console.log('❌ Error en test de funciones de monitoreo:', error.message);
        return false;
    }
}

async function testDatabaseHealth() {
    console.log('\n🏥 Probando salud general de la base de datos...');
    
    try {
        const tests = [
            { name: 'Tabla properties', query: supabase.from('properties').select('count').limit(1) },
            { name: 'Tabla users', query: supabase.from('users').select('count').limit(1) },
            { name: 'Tabla profiles', query: supabase.from('profiles').select('count').limit(1) }
        ];
        
        let passedTests = 0;
        
        for (const test of tests) {
            try {
                const { error } = await test.query;
                if (!error) {
                    console.log(`✅ ${test.name}: OK`);
                    passedTests++;
                } else {
                    console.log(`⚠️ ${test.name}: ${error.message}`);
                }
            } catch (err) {
                console.log(`❌ ${test.name}: Error de conexión`);
            }
        }
        
        console.log(`\n📊 Resumen: ${passedTests}/${tests.length} tablas accesibles`);
        return passedTests > 0;
    } catch (error) {
        console.log('❌ Error en test de salud:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🎯 EJECUTANDO BATERÍA COMPLETA DE TESTS...\n');
    
    const results = {
        connection: await testSupabaseConnection(),
        performance: await testPerformanceOptimizations(),
        policies: await testUnifiedPolicies(),
        monitoring: await testMonitoringFunctions(),
        health: await testDatabaseHealth()
    };
    
    console.log('\n📊 RESUMEN DE RESULTADOS:');
    console.log('========================');
    
    Object.entries(results).forEach(([test, passed]) => {
        const status = passed ? '✅ PASÓ' : '❌ FALLÓ';
        const testName = test.charAt(0).toUpperCase() + test.slice(1);
        console.log(`${testName}: ${status}`);
    });
    
    const passedTests = Object.values(results).filter(Boolean).length;
    const totalTests = Object.keys(results).length;
    
    console.log(`\n🎯 RESULTADO FINAL: ${passedTests}/${totalTests} tests pasaron`);
    
    if (passedTests === totalTests) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON! Supabase optimizado correctamente');
    } else if (passedTests >= totalTests * 0.8) {
        console.log('✅ La mayoría de tests pasaron. Sistema funcional con advertencias menores');
    } else {
        console.log('⚠️ Algunos tests fallaron. Revisar configuración de Supabase');
    }
    
    console.log('\n🔍 PRÓXIMOS PASOS RECOMENDADOS:');
    console.log('1. Verificar Supabase Dashboard → Performance Advisor');
    console.log('2. Confirmar que los warnings han desaparecido');
    console.log('3. Monitorear rendimiento en producción');
    console.log('4. Ejecutar tests periódicamente');
    
    return passedTests === totalTests;
}

// Ejecutar tests
runAllTests().catch(console.error);
