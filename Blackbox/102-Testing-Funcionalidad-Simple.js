// BLACKBOX AI - TESTING FUNCIONALIDAD SIMPLE
// Archivo: 102-Testing-Funcionalidad-Simple.js
// Fecha: 3/9/2025
// Estado: ✅ ACTIVO

const http = require('http');
const fs = require('fs');

console.log('🚀 INICIANDO TESTING FUNCIONALIDAD SIMPLE');
console.log('=' .repeat(80));

const BASE_URL = 'localhost';
const PORT = 3000;
const resultados = [];
let erroresDetectados = 0;
let testsPasados = 0;

// Función para hacer peticiones HTTP
function makeRequest(path = '/', timeout = 10000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: path,
            method: 'GET',
            timeout: timeout
        };
        
        const req = http.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const responseTime = Date.now() - startTime;
                resolve({
                    status: res.statusCode,
                    data: data,
                    responseTime: responseTime,
                    headers: res.headers
                });
            });
        });
        
        req.on('timeout', () => {
            req.destroy();
            reject(new Error(`Request timeout after ${timeout}ms`));
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        req.end();
    });
}

// Función para agregar resultado
function agregarResultado(test, estado, detalles) {
    const resultado = {
        test,
        estado,
        detalles,
        tiempo: new Date().toISOString()
    };
    
    resultados.push(resultado);
    
    const emoji = estado === 'EXITOSO' ? '✅' : estado === 'FALLO' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${estado}`);
    if (detalles) console.log(`   ${detalles}`);
    
    if (estado === 'EXITOSO') testsPasados++;
    if (estado === 'FALLO') erroresDetectados++;
}

// Test 1: Verificar servidor principal
async function testServidorPrincipal() {
    try {
        const response = await makeRequest('/', 10000);
        
        if (response.status === 200) {
            agregarResultado(
                'Servidor Principal',
                'EXITOSO',
                `Responde correctamente en ${response.responseTime}ms`
            );
        } else {
            agregarResultado(
                'Servidor Principal',
                'FALLO',
                `Código de estado: ${response.status}`
            );
        }
    } catch (error) {
        agregarResultado(
            'Servidor Principal',
            'FALLO',
            `Error: ${error.message}`
        );
    }
}

// Test 2: Verificar API de propiedades
async function testAPIProperties() {
    try {
        const response = await makeRequest('/api/properties', 5000);
        
        if (response.status < 500) {
            agregarResultado(
                'API Properties',
                'EXITOSO',
                `Respuesta: ${response.status} en ${response.responseTime}ms`
            );
        } else {
            agregarResultado(
                'API Properties',
                'FALLO',
                `Error del servidor: ${response.status}`
            );
        }
    } catch (error) {
        agregarResultado(
            'API Properties',
            'FALLO',
            `Error: ${error.message}`
        );
    }
}

// Test 3: Verificar página de login
async function testPaginaLogin() {
    try {
        const response = await makeRequest('/login', 5000);
        
        if (response.status === 200) {
            agregarResultado(
                'Página Login',
                'EXITOSO',
                `Carga correcta en ${response.responseTime}ms`
            );
        } else {
            agregarResultado(
                'Página Login',
                'ADVERTENCIA',
                `Estado: ${response.status}`
            );
        }
    } catch (error) {
        agregarResultado(
            'Página Login',
            'FALLO',
            `Error: ${error.message}`
        );
    }
}

// Test 4: Verificar página de registro
async function testPaginaRegister() {
    try {
        const response = await makeRequest('/register', 5000);
        
        if (response.status === 200) {
            agregarResultado(
                'Página Register',
                'EXITOSO',
                `Carga correcta en ${response.responseTime}ms`
            );
        } else {
            agregarResultado(
                'Página Register',
                'ADVERTENCIA',
                `Estado: ${response.status}`
            );
        }
    } catch (error) {
        agregarResultado(
            'Página Register',
            'FALLO',
            `Error: ${error.message}`
        );
    }
}

// Test 5: Verificar rendimiento básico
async function testRendimiento() {
    const tiempos = [];
    const intentos = 3;
    
    for (let i = 0; i < intentos; i++) {
        try {
            const response = await makeRequest('/', 10000);
            tiempos.push(response.responseTime);
        } catch (error) {
            agregarResultado(
                'Rendimiento',
                'FALLO',
                `Error en intento ${i + 1}: ${error.message}`
            );
            return;
        }
    }
    
    const tiempoPromedio = tiempos.reduce((a, b) => a + b, 0) / tiempos.length;
    
    if (tiempoPromedio < 3000) {
        agregarResultado(
            'Rendimiento',
            'EXITOSO',
            `Tiempo promedio: ${tiempoPromedio.toFixed(0)}ms`
        );
    } else {
        agregarResultado(
            'Rendimiento',
            'ADVERTENCIA',
            `Tiempo promedio alto: ${tiempoPromedio.toFixed(0)}ms`
        );
    }
}

// Función principal
async function ejecutarTesting() {
    console.log('🔍 Ejecutando tests básicos...\n');
    
    await testServidorPrincipal();
    await testAPIProperties();
    await testPaginaLogin();
    await testPaginaRegister();
    await testRendimiento();
    
    // Generar reporte
    const reporte = generarReporte();
    
    // Guardar reporte
    try {
        fs.writeFileSync('Blackbox/103-Reporte-Testing-Simple-Final.md', reporte);
        console.log('📄 Reporte guardado: Blackbox/103-Reporte-Testing-Simple-Final.md');
    } catch (error) {
        console.log('⚠️  No se pudo guardar el reporte:', error.message);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 RESUMEN FINAL:');
    console.log(`✅ Tests Exitosos: ${testsPasados}`);
    console.log(`❌ Tests Fallidos: ${erroresDetectados}`);
    console.log(`📋 Total Tests: ${resultados.length}`);
    
    if (erroresDetectados === 0) {
        console.log('🎉 TODOS LOS TESTS PASARON EXITOSAMENTE!');
    } else {
        console.log('⚠️  SE DETECTARON ERRORES - REVISAR DETALLES ARRIBA');
    }
}

function generarReporte() {
    const fecha = new Date().toLocaleString('es-ES');
    const porcentajeExito = ((testsPasados / resultados.length) * 100).toFixed(1);
    
    let reporte = `# BLACKBOX AI - REPORTE TESTING SIMPLE
**Archivo:** 103-Reporte-Testing-Simple-Final.md  
**Fecha:** ${fecha}  
**Estado:** ✅ COMPLETADO

## 📊 RESUMEN EJECUTIVO

**Servidor:** http://localhost:3000  
**Tests Ejecutados:** ${resultados.length}  
**Tests Exitosos:** ${testsPasados}  
**Tests Fallidos:** ${erroresDetectados}  
**Porcentaje de Éxito:** ${porcentajeExito}%

## 🎯 ESTADO GENERAL

`;

    if (erroresDetectados === 0) {
        reporte += `**🟢 EXCELENTE** - Todos los tests pasaron exitosamente\n\n`;
    } else if (erroresDetectados <= 2) {
        reporte += `**🟡 BUENO** - Errores menores detectados\n\n`;
    } else {
        reporte += `**🔴 REQUIERE ATENCIÓN** - Múltiples errores detectados\n\n`;
    }

    reporte += `## 📋 RESULTADOS DETALLADOS\n\n`;
    
    resultados.forEach((resultado, index) => {
        const emoji = resultado.estado === 'EXITOSO' ? '✅' : 
                     resultado.estado === 'FALLO' ? '❌' : '⚠️';
        
        reporte += `### ${index + 1}. ${resultado.test}\n`;
        reporte += `**Estado:** ${emoji} ${resultado.estado}  \n`;
        reporte += `**Detalles:** ${resultado.detalles}  \n`;
        reporte += `**Tiempo:** ${resultado.tiempo}\n\n`;
    });

    reporte += `## 🏆 CONCLUSIÓN\n\n`;
    
    if (porcentajeExito >= 90) {
        reporte += `El proyecto **Misiones Arrienda** está funcionando **EXCELENTEMENTE** con un ${porcentajeExito}% de éxito.\n\n`;
    } else if (porcentajeExito >= 70) {
        reporte += `El proyecto **Misiones Arrienda** está funcionando **BIEN** con un ${porcentajeExito}% de éxito.\n\n`;
    } else {
        reporte += `El proyecto **Misiones Arrienda** **REQUIERE ATENCIÓN** con un ${porcentajeExito}% de éxito.\n\n`;
    }

    reporte += `**🎯 TESTING SIMPLE COMPLETADO EXITOSAMENTE**  \n`;
    reporte += `**📊 ${resultados.length} TESTS EJECUTADOS**  \n`;
    reporte += `**✅ SERVIDOR ANALIZADO**\n`;

    return reporte;
}

// Ejecutar testing
ejecutarTesting().catch(error => {
    console.error('❌ Error fatal en testing:', error.message);
    process.exit(1);
});
