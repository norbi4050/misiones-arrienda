const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

console.log('🔍 AUDITORÍA COMPLETA - PROYECTO MISIONES ARRIENDA');
console.log('=' .repeat(70));
console.log('Fecha:', new Date().toISOString());
console.log('Objetivo: Verificar funcionalidad 100% del proyecto');
console.log('=' .repeat(70));
console.log('');

// Configuración
const LOCAL_BASE_URL = 'http://localhost:3000';
const OFFICIAL_BASE_URL = 'https://www.misionesarrienda.com.ar';

// Función para hacer peticiones HTTP
function makeRequest(url, method = 'GET', timeout = 10000) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            timeout: timeout,
            headers: {
                'User-Agent': 'Auditoria-Script/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'es-ES,es;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive'
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
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    size: data.length
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

// Tests de páginas principales
const paginasPrincipales = [
    { name: 'Página Principal', path: '/', description: 'Landing page con hero y propiedades destacadas' },
    { name: 'Propiedades', path: '/properties', description: 'Listado completo de propiedades' },
    { name: 'Login', path: '/login', description: 'Página de inicio de sesión' },
    { name: 'Registro', path: '/register', description: 'Página de registro de usuarios' },
    { name: 'Dashboard', path: '/dashboard', description: 'Panel de usuario' },
    { name: 'Perfil', path: '/profile', description: 'Perfil de usuario' },
    { name: 'Publicar', path: '/publicar', description: 'Publicar nueva propiedad' },
    { name: 'Comunidad', path: '/comunidad', description: 'Módulo de comunidad' },
    { name: 'Posadas', path: '/posadas', description: 'Propiedades en Posadas' },
    { name: 'Oberá', path: '/obera', description: 'Propiedades en Oberá' },
    { name: 'Eldorado', path: '/eldorado', description: 'Propiedades en Eldorado' },
    { name: 'Puerto Iguazú', path: '/puerto-iguazu', description: 'Propiedades en Puerto Iguazú' },
    { name: 'Privacidad', path: '/privacy', description: 'Política de privacidad' },
    { name: 'Términos', path: '/terms', description: 'Términos y condiciones' }
];

// Tests de API endpoints
const apiEndpoints = [
    { name: 'Health Check', path: '/api/health', description: 'Estado del sistema' },
    { name: 'Version', path: '/api/version', description: 'Versión de la API' },
    { name: 'Properties List', path: '/api/properties', description: 'Listado de propiedades' },
    { name: 'Stats', path: '/api/stats', description: 'Estadísticas generales' },
    { name: 'Auth Check', path: '/api/auth/check', description: 'Verificación de autenticación' },
    { name: 'User Profile', path: '/api/users/profile', description: 'Perfil de usuario' },
    { name: 'Favorites', path: '/api/favorites', description: 'Sistema de favoritos' },
    { name: 'Search History', path: '/api/search-history', description: 'Historial de búsquedas' },
    { name: 'Inquiries', path: '/api/inquiries', description: 'Consultas de propiedades' },
    { name: 'Comunidad Profiles', path: '/api/comunidad/profiles', description: 'Perfiles de comunidad' },
    { name: 'Admin Stats', path: '/api/admin/stats', description: 'Estadísticas de administración' },
    { name: 'Admin Users', path: '/api/admin/users', description: 'Gestión de usuarios' }
];

// Función principal de auditoría
async function ejecutarAuditoriaCompleta() {
    const resultados = {
        local: { paginas: [], apis: [], errores: [] },
        oficial: { paginas: [], apis: [], errores: [] },
        comparacion: [],
        resumen: {}
    };

    console.log('🚀 FASE 1: AUDITORÍA LOCAL (localhost:3000)');
    console.log('-' .repeat(50));
    
    // Testing de páginas locales
    console.log('\n📄 TESTING DE PÁGINAS PRINCIPALES:');
    for (const pagina of paginasPrincipales) {
        try {
            console.log(`\n🔍 ${pagina.name} (${pagina.path})`);
            console.log(`   📝 ${pagina.description}`);
            
            const resultado = await makeRequest(LOCAL_BASE_URL + pagina.path);
            
            if (resultado.success) {
                console.log(`   ✅ ÉXITO - Status: ${resultado.statusCode} - Tamaño: ${resultado.size} bytes`);
                
                // Análisis básico del contenido
                const contenido = resultado.data.toLowerCase();
                const tieneTitle = contenido.includes('<title>');
                const tieneMeta = contenido.includes('<meta');
                const tieneReact = contenido.includes('react') || contenido.includes('next');
                
                console.log(`   📊 Análisis: Title: ${tieneTitle ? '✅' : '❌'} | Meta: ${tieneMeta ? '✅' : '❌'} | React: ${tieneReact ? '✅' : '❌'}`);
                
                resultados.local.paginas.push({
                    nombre: pagina.name,
                    path: pagina.path,
                    status: 'SUCCESS',
                    statusCode: resultado.statusCode,
                    size: resultado.size,
                    tieneTitle,
                    tieneMeta,
                    tieneReact
                });
            } else {
                console.log(`   ⚠️ ADVERTENCIA - Status: ${resultado.statusCode}`);
                resultados.local.paginas.push({
                    nombre: pagina.name,
                    path: pagina.path,
                    status: 'WARNING',
                    statusCode: resultado.statusCode
                });
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR - ${error.message}`);
            resultados.local.errores.push({
                pagina: pagina.name,
                path: pagina.path,
                error: error.message
            });
        }
    }

    // Testing de APIs locales
    console.log('\n\n🔌 TESTING DE API ENDPOINTS:');
    for (const api of apiEndpoints) {
        try {
            console.log(`\n🔍 ${api.name} (${api.path})`);
            console.log(`   📝 ${api.description}`);
            
            const resultado = await makeRequest(LOCAL_BASE_URL + api.path);
            
            if (resultado.success) {
                console.log(`   ✅ ÉXITO - Status: ${resultado.statusCode} - Tamaño: ${resultado.size} bytes`);
                
                // Intentar parsear JSON si es posible
                let esJSON = false;
                let datosJSON = null;
                try {
                    datosJSON = JSON.parse(resultado.data);
                    esJSON = true;
                    console.log(`   📊 JSON válido con ${Object.keys(datosJSON).length} propiedades`);
                } catch (e) {
                    console.log(`   📊 Respuesta no-JSON (HTML/texto)`);
                }
                
                resultados.local.apis.push({
                    nombre: api.name,
                    path: api.path,
                    status: 'SUCCESS',
                    statusCode: resultado.statusCode,
                    size: resultado.size,
                    esJSON,
                    datos: esJSON ? Object.keys(datosJSON).length : null
                });
            } else {
                console.log(`   ⚠️ ADVERTENCIA - Status: ${resultado.statusCode}`);
                if (resultado.statusCode === 401 || resultado.statusCode === 403) {
                    console.log(`   ℹ️ Nota: Requiere autenticación (comportamiento esperado)`);
                }
                resultados.local.apis.push({
                    nombre: api.name,
                    path: api.path,
                    status: 'AUTH_REQUIRED',
                    statusCode: resultado.statusCode
                });
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR - ${error.message}`);
            resultados.local.errores.push({
                api: api.name,
                path: api.path,
                error: error.message
            });
        }
    }

    console.log('\n\n🌐 FASE 2: AUDITORÍA WEB OFICIAL (www.misionesarrienda.com.ar)');
    console.log('-' .repeat(60));
    
    // Testing de páginas oficiales (solo las principales)
    const paginasOficiales = paginasPrincipales.slice(0, 8); // Solo las más importantes
    
    console.log('\n📄 TESTING DE PÁGINAS OFICIALES:');
    for (const pagina of paginasOficiales) {
        try {
            console.log(`\n🔍 ${pagina.name} (${pagina.path})`);
            
            const resultado = await makeRequest(OFFICIAL_BASE_URL + pagina.path, 'GET', 15000);
            
            if (resultado.success) {
                console.log(`   ✅ ÉXITO - Status: ${resultado.statusCode} - Tamaño: ${resultado.size} bytes`);
                
                const contenido = resultado.data.toLowerCase();
                const tieneTitle = contenido.includes('<title>');
                const tieneMeta = contenido.includes('<meta');
                const tieneReact = contenido.includes('react') || contenido.includes('next');
                
                console.log(`   📊 Análisis: Title: ${tieneTitle ? '✅' : '❌'} | Meta: ${tieneMeta ? '✅' : '❌'} | React: ${tieneReact ? '✅' : '❌'}`);
                
                resultados.oficial.paginas.push({
                    nombre: pagina.name,
                    path: pagina.path,
                    status: 'SUCCESS',
                    statusCode: resultado.statusCode,
                    size: resultado.size,
                    tieneTitle,
                    tieneMeta,
                    tieneReact
                });
            } else {
                console.log(`   ⚠️ ADVERTENCIA - Status: ${resultado.statusCode}`);
                resultados.oficial.paginas.push({
                    nombre: pagina.name,
                    path: pagina.path,
                    status: 'WARNING',
                    statusCode: resultado.statusCode
                });
            }
            
        } catch (error) {
            console.log(`   ❌ ERROR - ${error.message}`);
            resultados.oficial.errores.push({
                pagina: pagina.name,
                path: pagina.path,
                error: error.message
            });
        }
    }

    // Generar comparación
    console.log('\n\n📊 FASE 3: COMPARACIÓN LOCAL VS OFICIAL');
    console.log('-' .repeat(50));
    
    for (const paginaLocal of resultados.local.paginas) {
        const paginaOficial = resultados.oficial.paginas.find(p => p.path === paginaLocal.path);
        
        if (paginaOficial) {
            const comparacion = {
                pagina: paginaLocal.nombre,
                path: paginaLocal.path,
                local: {
                    status: paginaLocal.status,
                    statusCode: paginaLocal.statusCode,
                    size: paginaLocal.size
                },
                oficial: {
                    status: paginaOficial.status,
                    statusCode: paginaOficial.statusCode,
                    size: paginaOficial.size
                },
                compatible: paginaLocal.status === paginaOficial.status && 
                           paginaLocal.statusCode === paginaOficial.statusCode
            };
            
            resultados.comparacion.push(comparacion);
            
            const emoji = comparacion.compatible ? '✅' : '⚠️';
            console.log(`${emoji} ${comparacion.pagina}:`);
            console.log(`   Local: ${comparacion.local.status} (${comparacion.local.statusCode}) - ${comparacion.local.size} bytes`);
            console.log(`   Oficial: ${comparacion.oficial.status} (${comparacion.oficial.statusCode}) - ${comparacion.oficial.size} bytes`);
            console.log(`   Compatible: ${comparacion.compatible ? 'SÍ' : 'NO'}`);
        }
    }

    // Generar resumen final
    const paginasExitosasLocal = resultados.local.paginas.filter(p => p.status === 'SUCCESS').length;
    const apisExitosasLocal = resultados.local.apis.filter(a => a.status === 'SUCCESS').length;
    const paginasExitosasOficial = resultados.oficial.paginas.filter(p => p.status === 'SUCCESS').length;
    const paginasCompatibles = resultados.comparacion.filter(c => c.compatible).length;

    resultados.resumen = {
        local: {
            paginas: {
                total: resultados.local.paginas.length,
                exitosas: paginasExitosasLocal,
                porcentaje: Math.round((paginasExitosasLocal / resultados.local.paginas.length) * 100)
            },
            apis: {
                total: resultados.local.apis.length,
                exitosas: apisExitosasLocal,
                porcentaje: Math.round((apisExitosasLocal / resultados.local.apis.length) * 100)
            },
            errores: resultados.local.errores.length
        },
        oficial: {
            paginas: {
                total: resultados.oficial.paginas.length,
                exitosas: paginasExitosasOficial,
                porcentaje: Math.round((paginasExitosasOficial / resultados.oficial.paginas.length) * 100)
            },
            errores: resultados.oficial.errores.length
        },
        compatibilidad: {
            total: resultados.comparacion.length,
            compatibles: paginasCompatibles,
            porcentaje: Math.round((paginasCompatibles / resultados.comparacion.length) * 100)
        }
    };

    // Mostrar resumen final
    console.log('\n\n📋 RESUMEN FINAL DE AUDITORÍA');
    console.log('=' .repeat(50));
    console.log(`\n🏠 PROYECTO LOCAL:`);
    console.log(`   📄 Páginas: ${resultados.resumen.local.paginas.exitosas}/${resultados.resumen.local.paginas.total} exitosas (${resultados.resumen.local.paginas.porcentaje}%)`);
    console.log(`   🔌 APIs: ${resultados.resumen.local.apis.exitosas}/${resultados.resumen.local.apis.total} exitosas (${resultados.resumen.local.apis.porcentaje}%)`);
    console.log(`   ❌ Errores: ${resultados.resumen.local.errores}`);

    console.log(`\n🌐 WEB OFICIAL:`);
    console.log(`   📄 Páginas: ${resultados.resumen.oficial.paginas.exitosas}/${resultados.resumen.oficial.paginas.total} exitosas (${resultados.resumen.oficial.paginas.porcentaje}%)`);
    console.log(`   ❌ Errores: ${resultados.resumen.oficial.errores}`);

    console.log(`\n🔄 COMPATIBILIDAD:`);
    console.log(`   📊 Páginas compatibles: ${resultados.resumen.compatibilidad.compatibles}/${resultados.resumen.compatibilidad.total} (${resultados.resumen.compatibilidad.porcentaje}%)`);

    // Determinar estado general
    let estadoGeneral = 'EXCELENTE';
    if (resultados.resumen.local.paginas.porcentaje < 80 || resultados.resumen.compatibilidad.porcentaje < 70) {
        estadoGeneral = 'NECESITA MEJORAS';
    } else if (resultados.resumen.local.paginas.porcentaje < 90 || resultados.resumen.compatibilidad.porcentaje < 85) {
        estadoGeneral = 'BUENO';
    }

    console.log(`\n🎯 ESTADO GENERAL: ${estadoGeneral}`);

    // Guardar resultados
    const reportePath = path.join(__dirname, '..', 'REPORTE-AUDITORIA-COMPLETA-FINAL.json');
    fs.writeFileSync(reportePath, JSON.stringify(resultados, null, 2));
    console.log(`\n📄 Reporte completo guardado en: ${reportePath}`);

    console.log('\n✅ AUDITORÍA COMPLETA FINALIZADA');
    console.log('=' .repeat(50));

    return resultados;
}

// Ejecutar auditoría
ejecutarAuditoriaCompleta().catch(console.error);
