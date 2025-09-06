const http = require('http');
const https = require('https');

console.log('🔍 TESTING DE FUNCIONALIDAD DEL SERVIDOR');
console.log('=' .repeat(50));
console.log('Fecha:', new Date().toISOString());
console.log('');

// Función para hacer peticiones HTTP simples
function testEndpoint(url, description) {
    return new Promise((resolve) => {
        const urlObj = new URL(url);
        const client = urlObj.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname,
            method: 'GET',
            timeout: 8000,
            headers: {
                'User-Agent': 'Test-Script/1.0'
            }
        };

        console.log(`🔍 Testing: ${description}`);
        console.log(`   URL: ${url}`);

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                const success = res.statusCode >= 200 && res.statusCode < 400;
                console.log(`   ${success ? '✅' : '⚠️'} Status: ${res.statusCode} - Size: ${data.length} bytes`);
                
                if (success && data.length > 0) {
                    // Verificar si contiene elementos típicos de una página web
                    const hasHtml = data.toLowerCase().includes('<html');
                    const hasTitle = data.toLowerCase().includes('<title');
                    const hasBody = data.toLowerCase().includes('<body');
                    
                    if (hasHtml || hasTitle || hasBody) {
                        console.log(`   📄 Contenido: HTML válido detectado`);
                    } else if (data.startsWith('{') || data.startsWith('[')) {
                        console.log(`   📊 Contenido: JSON detectado`);
                    } else {
                        console.log(`   📝 Contenido: Texto/Otro formato`);
                    }
                }
                
                resolve({
                    url,
                    description,
                    success,
                    statusCode: res.statusCode,
                    size: data.length,
                    hasContent: data.length > 0
                });
            });
        });

        req.on('error', (err) => {
            console.log(`   ❌ ERROR: ${err.message}`);
            resolve({
                url,
                description,
                success: false,
                error: err.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            console.log(`   ⏰ TIMEOUT: Request timed out`);
            resolve({
                url,
                description,
                success: false,
                error: 'Timeout'
            });
        });

        req.end();
    });
}

// Tests principales
async function ejecutarTests() {
    console.log('🚀 INICIANDO TESTS DE FUNCIONALIDAD\n');
    
    const tests = [
        {
            url: 'http://localhost:3000',
            description: 'Página Principal Local'
        },
        {
            url: 'http://localhost:3000/properties',
            description: 'Página de Propiedades Local'
        },
        {
            url: 'http://localhost:3000/api/health',
            description: 'API Health Check Local'
        },
        {
            url: 'http://localhost:3000/api/version',
            description: 'API Version Local'
        },
        {
            url: 'https://www.misionesarrienda.com.ar',
            description: 'Página Principal Oficial'
        },
        {
            url: 'https://www.misionesarrienda.com.ar/properties',
            description: 'Página de Propiedades Oficial'
        }
    ];

    const resultados = [];
    
    for (const test of tests) {
        const resultado = await testEndpoint(test.url, test.description);
        resultados.push(resultado);
        console.log(''); // Línea en blanco entre tests
    }

    // Resumen
    console.log('📊 RESUMEN DE RESULTADOS');
    console.log('-' .repeat(30));
    
    const exitosos = resultados.filter(r => r.success).length;
    const fallidos = resultados.filter(r => !r.success).length;
    
    console.log(`✅ Tests exitosos: ${exitosos}`);
    console.log(`❌ Tests fallidos: ${fallidos}`);
    console.log(`📈 Porcentaje de éxito: ${Math.round((exitosos / resultados.length) * 100)}%`);
    
    console.log('\n📋 DETALLES:');
    resultados.forEach(resultado => {
        const emoji = resultado.success ? '✅' : '❌';
        console.log(`${emoji} ${resultado.description}: ${resultado.success ? 'OK' : 'FAILED'}`);
        if (resultado.statusCode) {
            console.log(`   Status: ${resultado.statusCode}`);
        }
        if (resultado.error) {
            console.log(`   Error: ${resultado.error}`);
        }
    });

    // Análisis específico
    console.log('\n🔍 ANÁLISIS ESPECÍFICO:');
    
    const localPrincipal = resultados.find(r => r.url === 'http://localhost:3000');
    const oficialPrincipal = resultados.find(r => r.url === 'https://www.misionesarrienda.com.ar');
    
    if (localPrincipal && oficialPrincipal) {
        console.log('\n📊 COMPARACIÓN PÁGINA PRINCIPAL:');
        console.log(`   Local: ${localPrincipal.success ? '✅' : '❌'} (${localPrincipal.statusCode || 'Error'})`);
        console.log(`   Oficial: ${oficialPrincipal.success ? '✅' : '❌'} (${oficialPrincipal.statusCode || 'Error'})`);
        
        if (localPrincipal.success && oficialPrincipal.success) {
            console.log(`   🎯 Ambas páginas funcionan correctamente`);
        } else if (localPrincipal.success && !oficialPrincipal.success) {
            console.log(`   ⚠️ Local funciona, oficial tiene problemas`);
        } else if (!localPrincipal.success && oficialPrincipal.success) {
            console.log(`   ⚠️ Oficial funciona, local tiene problemas`);
        } else {
            console.log(`   ❌ Ambas páginas tienen problemas`);
        }
    }

    // Conclusión
    console.log('\n🎯 CONCLUSIÓN:');
    if (exitosos === resultados.length) {
        console.log('🎉 ¡PERFECTO! Todos los tests pasaron exitosamente.');
        console.log('   El proyecto local está funcionando correctamente.');
        console.log('   La web oficial está accesible.');
        console.log('   La compatibilidad es excelente.');
    } else if (exitosos >= resultados.length * 0.8) {
        console.log('✅ BUENO: La mayoría de tests pasaron.');
        console.log('   Hay algunos problemas menores a revisar.');
    } else if (exitosos >= resultados.length * 0.5) {
        console.log('⚠️ REGULAR: Algunos tests fallaron.');
        console.log('   Se requiere atención a los problemas identificados.');
    } else {
        console.log('❌ CRÍTICO: Muchos tests fallaron.');
        console.log('   Se requiere revisión urgente del proyecto.');
    }

    console.log('\n✅ TESTING COMPLETADO');
    console.log('=' .repeat(50));
    
    return resultados;
}

// Ejecutar tests
ejecutarTests().catch(console.error);
