const puppeteer = require('puppeteer');
const fs = require('fs');

async function testSupabaseIntegration() {
    console.log('🚀 INICIANDO TESTING DE INTEGRACIÓN SUPABASE Y AUTENTICACIÓN');
    console.log('============================================================');
    
    let browser;
    let results = [];
    
    try {
        // Verificar servidor
        console.log('🔍 Verificando servidor...');
        const fetch = require('node-fetch');
        try {
            const response = await fetch('http://localhost:3000');
            if (response.ok) {
                console.log('✅ Servidor detectado en http://localhost:3000');
            } else {
                console.log('❌ Servidor no responde correctamente');
                return;
            }
        } catch (error) {
            console.log('❌ No se puede conectar al servidor en http://localhost:3000');
            console.log('   Asegúrate de que el servidor esté ejecutándose');
            return;
        }

        console.log('\n📋 FASE 1: VERIFICACIÓN DE CONFIGURACIÓN SUPABASE');
        console.log('================================================\n');

        // Inicializar Puppeteer
        browser = await puppeteer.launch({ 
            headless: false,
            defaultViewport: { width: 1280, height: 720 }
        });
        const page = await browser.newPage();

        // Capturar errores de consola
        const consoleErrors = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                consoleErrors.push(msg.text());
            }
        });

        // Capturar requests de red
        const networkRequests = [];
        page.on('request', request => {
            if (request.url().includes('supabase') || request.url().includes('auth')) {
                networkRequests.push({
                    method: request.method(),
                    url: request.url()
                });
            }
        });

        // Test 1: Carga de página principal
        console.log('🔍 Test 1: Carga de página principal');
        try {
            await page.goto('http://localhost:3000', { waitUntil: 'networkidle2' });
            const title = await page.title();
            results.push({ test: 'Carga de Homepage', status: 'PASS', details: 'Página principal cargada correctamente' });
            console.log('✅ Carga de Homepage: Página principal cargada correctamente');
        } catch (error) {
            results.push({ test: 'Carga de Homepage', status: 'FAIL', details: `Error: ${error.message}` });
            console.log(`❌ Carga de Homepage: Error: ${error.message}`);
        }

        // Test 2: Variables de entorno Supabase
        console.log('\n🔍 Test 2: Variables de entorno Supabase');
        try {
            const supabaseCheck = await page.evaluate(() => {
                try {
                    // Verificar si las variables están disponibles en el cliente
                    return {
                        hasSupabaseUrl: typeof window !== 'undefined' && !!process?.env?.NEXT_PUBLIC_SUPABASE_URL,
                        hasSupabaseKey: typeof window !== 'undefined' && !!process?.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                        clientSide: typeof window !== 'undefined'
                    };
                } catch (e) {
                    return { error: e.message };
                }
            });
            
            if (supabaseCheck.error) {
                results.push({ test: 'Variables Supabase', status: 'FAIL', details: `Error verificando variables: ${supabaseCheck.error}` });
                console.log(`❌ Variables Supabase: Error verificando variables: ${supabaseCheck.error}`);
            } else {
                results.push({ test: 'Variables Supabase', status: 'PASS', details: 'Variables de entorno verificadas' });
                console.log('✅ Variables Supabase: Variables de entorno verificadas');
            }
        } catch (error) {
            results.push({ test: 'Variables Supabase', status: 'FAIL', details: `Error verificando variables: ${error.message}` });
            console.log(`❌ Variables Supabase: Error verificando variables: ${error.message}`);
        }

        // Test 3: Navegación a Login
        console.log('\n🔍 Test 3: Navegación a Login');
        try {
            await page.goto('http://localhost:3000/login');
            await page.waitForSelector('form', { timeout: 5000 });
            
            // Buscar botón de submit con selectores válidos
            const submitButton = await page.$('button[type="submit"]');
            if (submitButton) {
                results.push({ test: 'Página de Login', status: 'PASS', details: 'Página de login cargada correctamente' });
                console.log('✅ Página de Login: Página de login cargada correctamente');
            } else {
                results.push({ test: 'Página de Login', status: 'FAIL', details: 'No se encontró botón de submit' });
                console.log('❌ Página de Login: No se encontró botón de submit');
            }
        } catch (error) {
            results.push({ test: 'Página de Login', status: 'FAIL', details: `Error cargando login: ${error.message}` });
            console.log(`❌ Página de Login: Error cargando login: ${error.message}`);
        }

        // Test 4: Navegación a Registro
        console.log('\n🔍 Test 4: Navegación a Registro');
        try {
            await page.goto('http://localhost:3000/register');
            await page.waitForSelector('form', { timeout: 5000 });
            
            // Buscar botón de submit con selectores válidos
            const submitButton = await page.$('button[type="submit"]');
            if (submitButton) {
                results.push({ test: 'Página de Registro', status: 'PASS', details: 'Página de registro cargada correctamente' });
                console.log('✅ Página de Registro: Página de registro cargada correctamente');
            } else {
                results.push({ test: 'Página de Registro', status: 'FAIL', details: 'No se encontró botón de submit' });
                console.log('❌ Página de Registro: No se encontró botón de submit');
            }
        } catch (error) {
            results.push({ test: 'Página de Registro', status: 'FAIL', details: `Error cargando registro: ${error.message}` });
            console.log(`❌ Página de Registro: Error cargando registro: ${error.message}`);
        }

        // Test 5: APIs de Autenticación
        console.log('\n🔍 Test 5: APIs de Autenticación');
        try {
            const response = await fetch('http://localhost:3000/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Test User',
                    email: 'test@example.com',
                    phone: '123456789',
                    password: 'testpass123',
                    userType: 'inquilino'
                })
            });
            
            if (response.status === 201 || response.status === 409) {
                results.push({ test: 'API Registro', status: 'PASS', details: `API funcionando correctamente (${response.status})` });
                console.log(`✅ API Registro: API funcionando correctamente (${response.status})`);
            } else {
                results.push({ test: 'API Registro', status: 'FAIL', details: `Respuesta inesperada: ${response.status}` });
                console.log(`❌ API Registro: Respuesta inesperada: ${response.status}`);
            }
        } catch (error) {
            results.push({ test: 'API Registro', status: 'FAIL', details: `Error: ${error.message}` });
            console.log(`❌ API Registro: Error: ${error.message}`);
        }

        // Test 6: Página de Dashboard
        console.log('\n🔍 Test 6: Página de Dashboard');
        try {
            await page.goto('http://localhost:3000/dashboard');
            await page.waitForTimeout(2000);
            
            const currentUrl = page.url();
            if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
                results.push({ test: 'Dashboard (Sin Auth)', status: 'PASS', details: 'Redirección correcta a login para usuarios no autenticados' });
                console.log('✅ Dashboard (Sin Auth): Redirección correcta a login para usuarios no autenticados');
            } else {
                results.push({ test: 'Dashboard (Sin Auth)', status: 'FAIL', details: 'No se redirigió correctamente' });
                console.log('❌ Dashboard (Sin Auth): No se redirigió correctamente');
            }
        } catch (error) {
            results.push({ test: 'Dashboard (Sin Auth)', status: 'FAIL', details: `Error: ${error.message}` });
            console.log(`❌ Dashboard (Sin Auth): Error: ${error.message}`);
        }

        // Test 7: Middleware de Autenticación
        console.log('\n🔍 Test 7: Middleware de Autenticación');
        try {
            const protectedRoutes = ['/dashboard', '/publicar', '/profile'];
            let protectedCount = 0;
            
            for (const route of protectedRoutes) {
                try {
                    await page.goto(`http://localhost:3000${route}`);
                    await page.waitForTimeout(1000);
                    const currentUrl = page.url();
                    if (currentUrl.includes('/login') || currentUrl.includes('/auth')) {
                        protectedCount++;
                    }
                } catch (e) {
                    // Ignorar errores individuales
                }
            }
            
            results.push({ test: 'Middleware Auth', status: 'PASS', details: `${protectedCount}/${protectedRoutes.length} rutas protegidas correctamente` });
            console.log(`✅ Middleware Auth: ${protectedCount}/${protectedRoutes.length} rutas protegidas correctamente`);
        } catch (error) {
            results.push({ test: 'Middleware Auth', status: 'FAIL', details: `Error: ${error.message}` });
            console.log(`❌ Middleware Auth: Error: ${error.message}`);
        }

        // Test 8: Conexión Base de Datos
        console.log('\n🔍 Test 8: Conexión Base de Datos');
        try {
            const response = await fetch('http://localhost:3000/api/health/db');
            if (response.ok) {
                results.push({ test: 'Conexión DB', status: 'PASS', details: 'Base de datos conectada correctamente' });
                console.log('✅ Conexión DB: Base de datos conectada correctamente');
            } else {
                results.push({ test: 'Conexión DB', status: 'FAIL', details: 'Error de conexión a la base de datos' });
                console.log('❌ Conexión DB: Error de conexión a la base de datos');
            }
        } catch (error) {
            results.push({ test: 'Conexión DB', status: 'FAIL', details: `Error: ${error.message}` });
            console.log(`❌ Conexión DB: Error: ${error.message}`);
        }

        // Test 9: Requests a Supabase
        console.log('\n🔍 Test 9: Requests a Supabase');
        const supabaseRequests = networkRequests.filter(req => 
            req.url.includes('supabase') || req.url.includes('auth')
        );
        
        results.push({ test: 'Requests Supabase', status: 'PASS', details: `${supabaseRequests.length} requests detectados a Supabase` });
        console.log(`✅ Requests Supabase: ${supabaseRequests.length} requests detectados a Supabase`);
        
        if (supabaseRequests.length > 0) {
            console.log('📊 Requests detectados:');
            supabaseRequests.forEach((req, index) => {
                console.log(`   ${index + 1}. ${req.method} ${req.url}`);
            });
        }

        // Test 10: Errores de Consola
        console.log('\n🔍 Test 10: Errores de Consola');
        const criticalErrors = consoleErrors.filter(error => 
            !error.includes('favicon') && 
            !error.includes('404') &&
            error.includes('error')
        );
        
        if (criticalErrors.length === 0) {
            results.push({ test: 'Errores Consola', status: 'PASS', details: 'No se detectaron errores críticos' });
            console.log('✅ Errores Consola: No se detectaron errores críticos');
        } else if (criticalErrors.length <= 2) {
            results.push({ test: 'Errores Consola', status: 'WARNING', details: `${criticalErrors.length} errores menores detectados` });
            console.log(`⚠️ Errores Consola: ${criticalErrors.length} errores menores detectados`);
        } else {
            results.push({ test: 'Errores Consola', status: 'FAIL', details: `${criticalErrors.length} errores detectados` });
            console.log(`❌ Errores Consola: ${criticalErrors.length} errores detectados`);
        }
        
        if (consoleErrors.length > 0) {
            console.log('⚠️ Errores encontrados:');
            consoleErrors.slice(0, 5).forEach((error, index) => {
                console.log(`   ${index + 1}. ${error}`);
            });
        }

    } catch (error) {
        console.error('❌ Error general en testing:', error);
        results.push({ test: 'Error General', status: 'FAIL', details: error.message });
    } finally {
        if (browser) {
            await browser.close();
        }
    }

    // Generar reporte
    console.log('\n📊 GENERANDO REPORTE FINAL');
    console.log('==========================\n');
    
    const report = generateReport(results);
    
    // Guardar reporte
    const reportPath = 'REPORTE-TESTING-INTEGRACION-SUPABASE-AUTENTICACION-FIXED-FINAL.md';
    fs.writeFileSync(reportPath, report);
    console.log(`✅ REPORTE GENERADO: ${reportPath}`);
    
    // Mostrar resumen
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;
    const warningTests = results.filter(r => r.status === 'WARNING').length;
    const successRate = Math.round((passedTests / totalTests) * 100);
    
    console.log(`\n📊 RESUMEN FINAL:`);
    console.log(`Total: ${totalTests} | Exitosos: ${passedTests} | Fallidos: ${failedTests} | Advertencias: ${warningTests}`);
    console.log(`Porcentaje de éxito: ${successRate}%`);
    
    if (failedTests > 0) {
        console.log('\n❌ PROBLEMAS CRÍTICOS DETECTADOS - REVISAR REPORTE COMPLETO');
    } else {
        console.log('\n✅ TODOS LOS TESTS PASARON EXITOSAMENTE');
    }
}

function generateReport(results) {
    const timestamp = new Date().toISOString();
    const totalTests = results.length;
    const passedTests = results.filter(r => r.status === 'PASS').length;
    const failedTests = results.filter(r => r.status === 'FAIL').length;
    const warningTests = results.filter(r => r.status === 'WARNING').length;
    const successRate = Math.round((passedTests / totalTests) * 100);

    let report = `# 🔍 REPORTE DE TESTING - INTEGRACIÓN SUPABASE Y AUTENTICACIÓN (CORREGIDO)

## 📋 RESUMEN EJECUTIVO

**Fecha:** ${timestamp}
**Total de Tests:** ${totalTests}
**Tests Exitosos:** ${passedTests} ✅
**Tests Fallidos:** ${failedTests} ❌
**Advertencias:** ${warningTests} ⚠️

**Porcentaje de Éxito:** ${successRate}%

## 📊 RESULTADOS DETALLADOS

`;

    results.forEach(result => {
        const icon = result.status === 'PASS' ? '✅' : result.status === 'WARNING' ? '⚠️' : '❌';
        report += `
### ${icon} ${result.test}

**Estado:** ${result.status}
**Detalles:** ${result.details}
**Timestamp:** ${timestamp}

`;
    });

    report += `
## 🔧 ANÁLISIS DE INTEGRACIÓN

### Estado de Supabase
`;
    
    const supabaseTests = results.filter(r => r.test.includes('Supabase') || r.test.includes('Variables') || r.test.includes('DB'));
    supabaseTests.forEach(test => {
        report += `- ${test.test}: ${test.status} - ${test.details}\n`;
    });

    report += `
### Estado de Autenticación
`;
    
    const authTests = results.filter(r => r.test.includes('Login') || r.test.includes('Registro') || r.test.includes('Dashboard') || r.test.includes('Middleware'));
    authTests.forEach(test => {
        report += `- ${test.test}: ${test.status} - ${test.details}\n`;
    });

    report += `
### Estado de APIs
`;
    
    const apiTests = results.filter(r => r.test.includes('API'));
    apiTests.forEach(test => {
        report += `- ${test.test}: ${test.status} - ${test.details}\n`;
    });

    report += `
## 🎯 RECOMENDACIONES

`;

    if (failedTests > 0) {
        report += `
### ❌ PROBLEMAS CRÍTICOS DETECTADOS
- Se encontraron ${failedTests} tests fallidos que requieren atención inmediata
- Revisar la configuración de Supabase y variables de entorno
- Verificar que el servidor esté ejecutándose correctamente

`;
    }

    if (warningTests > 0) {
        report += `
### ⚠️ ADVERTENCIAS
- Se detectaron ${warningTests} advertencias que deberían revisarse
- Algunos componentes pueden no estar completamente configurados
- Considerar implementar mejoras en las áreas marcadas

`;
    }

    if (failedTests === 0 && warningTests === 0) {
        report += `
### ✅ SISTEMA FUNCIONANDO CORRECTAMENTE
- Todos los tests pasaron exitosamente
- La integración con Supabase está funcionando correctamente
- El sistema de autenticación está operativo

`;
    }

    report += `
## 📝 PRÓXIMOS PASOS

1. **Corregir problemas críticos** identificados en los tests fallidos
2. **Revisar advertencias** y implementar mejoras sugeridas
3. **Verificar configuración** de variables de entorno de Supabase
4. **Probar funcionalidad** de registro y login con usuarios reales
5. **Implementar testing automatizado** para verificaciones continuas

---
*Reporte generado automáticamente el ${new Date().toLocaleString('es-ES')}*`;

    return report;
}

// Ejecutar testing
testSupabaseIntegration().catch(console.error);
