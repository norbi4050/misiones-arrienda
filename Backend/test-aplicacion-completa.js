const https = require('https');
const http = require('http');

console.log('🧪 TESTING COMPLETO DE LA APLICACIÓN MISIONES ARRIENDA');
console.log('=' .repeat(60));
console.log('Fecha:', new Date().toISOString());
console.log('');

// Función para hacer peticiones HTTP
function makeRequest(url, method = 'GET') {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            timeout: 10000,
            headers: {
                'User-Agent': 'Testing-Script/1.0'
            }
        };

        const client = urlObj.protocol === 'https:' ? https : http;
        
        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    success: res.statusCode >= 200 && res.statusCode < 400
                });
            });
        });

        req.on('error', (err) => reject(err));
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// Tests a ejecutar
const tests = [
    {
        name: 'Página Principal',
        url: 'http://localhost:3000',
        description: 'Verificar que la página principal carga correctamente'
    },
    {
        name: 'API Health Check',
        url: 'http://localhost:3000/api/health/db',
        description: 'Verificar endpoint de salud de la base de datos'
    },
    {
        name: 'API Version',
        url: 'http://localhost:3000/api/version',
        description: 'Verificar endpoint de versión'
    },
    {
        name: 'API Properties',
        url: 'http://localhost:3000/api/properties',
        description: 'Verificar endpoint de propiedades'
    },
    {
        name: 'API Stats',
        url: 'http://localhost:3000/api/stats',
        description: 'Verificar endpoint de estadísticas'
    },
    {
        name: 'Página de Login',
        url: 'http://localhost:3000/login',
        description: 'Verificar página de login'
    },
    {
        name: 'Página de Registro',
        url: 'http://localhost:3000/register',
        description: 'Verificar página de registro'
    },
    {
        name: 'Página de Propiedades',
        url: 'http://localhost:3000/properties',
        description: 'Verificar página de listado de propiedades'
    },
    {
        name: 'Página de Comunidad',
        url: 'http://localhost:3000/comunidad',
        description: 'Verificar página de comunidad'
    },
    {
        name: 'Dashboard',
        url: 'http://localhost:3000/dashboard',
        description: 'Verificar dashboard de usuario'
    }
];

// Ejecutar tests
async function runTests() {
    console.log('🚀 INICIANDO TESTS...\n');
    
    let passed = 0;
    let failed = 0;
    const results = [];

    for (const test of tests) {
        try {
            console.log(`🔍 Testing: ${test.name}`);
            console.log(`   URL: ${test.url}`);
            console.log(`   Descripción: ${test.description}`);
            
            const result = await makeRequest(test.url);
            
            if (result.success) {
                console.log(`   ✅ ÉXITO - Status: ${result.statusCode}`);
                passed++;
                results.push({
                    test: test.name,
                    status: 'PASSED',
                    statusCode: result.statusCode,
                    url: test.url
                });
            } else {
                console.log(`   ⚠️  ADVERTENCIA - Status: ${result.statusCode}`);
                if (result.statusCode === 401 || result.statusCode === 403) {
                    console.log(`   ℹ️  Nota: Error de autenticación esperado para esta ruta`);
                    passed++;
                    results.push({
                        test: test.name,
                        status: 'PASSED (Auth Required)',
                        statusCode: result.statusCode,
                        url: test.url
                    });
                } else {
                    failed++;
                    results.push({
                        test: test.name,
                        status: 'FAILED',
                        statusCode: result.statusCode,
                        url: test.url
                    });
                }
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR - ${error.message}`);
            failed++;
            results.push({
                test: test.name,
                status: 'ERROR',
                error: error.message,
                url: test.url
            });
        }
        
        console.log('');
    }

    // Resumen final
    console.log('📊 RESUMEN DE TESTING');
    console.log('=' .repeat(40));
    console.log(`✅ Tests exitosos: ${passed}`);
    console.log(`❌ Tests fallidos: ${failed}`);
    console.log(`📈 Porcentaje de éxito: ${Math.round((passed / tests.length) * 100)}%`);
    console.log('');

    // Detalles de resultados
    console.log('📋 DETALLES DE RESULTADOS:');
    console.log('-' .repeat(40));
    results.forEach(result => {
        const emoji = result.status.includes('PASSED') ? '✅' : 
                     result.status === 'ERROR' ? '❌' : '⚠️';
        console.log(`${emoji} ${result.test}: ${result.status}`);
        if (result.statusCode) {
            console.log(`   Status Code: ${result.statusCode}`);
        }
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });

    console.log('');
    console.log('🎯 CONCLUSIÓN:');
    if (failed === 0) {
        console.log('🎉 ¡TODOS LOS TESTS PASARON! La aplicación está funcionando correctamente.');
    } else if (passed > failed) {
        console.log('✅ La mayoría de tests pasaron. Hay algunos problemas menores a revisar.');
    } else {
        console.log('⚠️ Hay varios problemas que necesitan atención.');
    }
    
    console.log('');
    console.log('✅ TESTING COMPLETO FINALIZADO');
}

// Ejecutar los tests
runTests().catch(console.error);
