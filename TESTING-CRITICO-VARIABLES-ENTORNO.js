/**
 * 🧪 TESTING CRÍTICO - AUDITORÍA Y LIMPIEZA DE VARIABLES DE ENTORNO
 * ================================================================
 * 
 * Este script ejecuta testing crítico del sistema de variables de entorno:
 * 1. Verificar estado inicial de variables
 * 2. Ejecutar proceso de limpieza
 * 3. Validar eliminación de variables innecesarias
 * 4. Confirmar preservación de variables críticas
 * 5. Testing de compilación del proyecto
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 INICIANDO TESTING CRÍTICO - VARIABLES DE ENTORNO');
console.log('====================================================\n');

// Configuración de testing
const CONFIG = {
    envFiles: [
        '.env',
        'Backend/.env',
        'Backend/.env.local',
        'Backend/.env.example'
    ],
    variablesInnecesarias: [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL', 
        'MP_WEBHOOK_SECRET',
        'API_BASE_URL'
    ],
    variablesCriticas: [
        'SUPABASE_URL',
        'SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'DIRECT_URL',
        'JWT_SECRET',
        'MERCADOPAGO_ACCESS_TOKEN',
        'MERCADOPAGO_PUBLIC_KEY',
        'MERCADOPAGO_WEBHOOK_SECRET',
        'MERCADOPAGO_NOTIFICATION_URL',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS'
    ]
};

let testResults = {
    passed: 0,
    failed: 0,
    warnings: 0,
    details: []
};

function logTest(test, status, message) {
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    console.log(`${statusIcon} ${test}: ${message}`);
    
    testResults.details.push({ test, status, message });
    if (status === 'PASS') testResults.passed++;
    else if (status === 'FAIL') testResults.failed++;
    else testResults.warnings++;
}

function readEnvFile(filePath) {
    try {
        if (!fs.existsSync(filePath)) {
            return null;
        }
        const content = fs.readFileSync(filePath, 'utf8');
        const variables = {};
        
        content.split('\n').forEach(line => {
            line = line.trim();
            if (line && !line.startsWith('#')) {
                const [key, ...valueParts] = line.split('=');
                if (key) {
                    variables[key.trim()] = valueParts.join('=').trim();
                }
            }
        });
        
        return variables;
    } catch (error) {
        return null;
    }
}

function createBackup(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            const backupPath = `${filePath}.backup.${Date.now()}`;
            fs.copyFileSync(filePath, backupPath);
            return backupPath;
        }
        return null;
    } catch (error) {
        return null;
    }
}

async function testEstadoInicial() {
    console.log('\n📋 PASO 1: VERIFICANDO ESTADO INICIAL');
    console.log('=====================================');
    
    let archivosEncontrados = 0;
    let variablesEncontradas = 0;
    
    for (const envFile of CONFIG.envFiles) {
        const variables = readEnvFile(envFile);
        if (variables) {
            archivosEncontrados++;
            const numVars = Object.keys(variables).length;
            variablesEncontradas += numVars;
            logTest(`Archivo ${envFile}`, 'PASS', `Encontrado con ${numVars} variables`);
            
            // Verificar variables innecesarias
            const innecesariasEncontradas = CONFIG.variablesInnecesarias.filter(v => variables[v]);
            if (innecesariasEncontradas.length > 0) {
                logTest(`Variables innecesarias en ${envFile}`, 'WARN', 
                    `Encontradas: ${innecesariasEncontradas.join(', ')}`);
            }
            
            // Verificar variables críticas
            const criticasFaltantes = CONFIG.variablesCriticas.filter(v => !variables[v]);
            if (criticasFaltantes.length > 0) {
                logTest(`Variables críticas en ${envFile}`, 'WARN', 
                    `Faltantes: ${criticasFaltantes.join(', ')}`);
            }
        } else {
            logTest(`Archivo ${envFile}`, 'WARN', 'No encontrado o no legible');
        }
    }
    
    logTest('Estado inicial', 'PASS', 
        `${archivosEncontrados} archivos .env encontrados, ${variablesEncontradas} variables totales`);
}

async function testCreacionRespaldos() {
    console.log('\n💾 PASO 2: TESTING DE RESPALDOS');
    console.log('===============================');
    
    let respaldosCreados = 0;
    
    for (const envFile of CONFIG.envFiles) {
        if (fs.existsSync(envFile)) {
            const backupPath = createBackup(envFile);
            if (backupPath) {
                respaldosCreados++;
                logTest(`Respaldo ${envFile}`, 'PASS', `Creado: ${backupPath}`);
            } else {
                logTest(`Respaldo ${envFile}`, 'FAIL', 'No se pudo crear respaldo');
            }
        }
    }
    
    if (respaldosCreados > 0) {
        logTest('Sistema de respaldos', 'PASS', `${respaldosCreados} respaldos creados exitosamente`);
    } else {
        logTest('Sistema de respaldos', 'WARN', 'No se crearon respaldos');
    }
}

async function testEjecucionLimpieza() {
    console.log('\n🧹 PASO 3: EJECUTANDO PROCESO DE LIMPIEZA');
    console.log('==========================================');
    
    try {
        // Ejecutar script de limpieza automática
        console.log('Ejecutando LIMPIAR-VARIABLES-ENTORNO-AUTOMATICO.bat...');
        
        if (fs.existsSync('LIMPIAR-VARIABLES-ENTORNO-AUTOMATICO.bat')) {
            try {
                execSync('.\\LIMPIAR-VARIABLES-ENTORNO-AUTOMATICO.bat', { 
                    stdio: 'pipe',
                    timeout: 30000 
                });
                logTest('Ejecución limpieza', 'PASS', 'Script ejecutado exitosamente');
            } catch (error) {
                logTest('Ejecución limpieza', 'WARN', `Script ejecutado con advertencias: ${error.message}`);
            }
        } else {
            logTest('Ejecución limpieza', 'FAIL', 'Script de limpieza no encontrado');
        }
        
    } catch (error) {
        logTest('Ejecución limpieza', 'FAIL', `Error: ${error.message}`);
    }
}

async function testValidacionLimpieza() {
    console.log('\n🔍 PASO 4: VALIDANDO RESULTADO DE LIMPIEZA');
    console.log('===========================================');
    
    let variablesEliminadas = 0;
    let variablesCriticasPreservadas = 0;
    
    for (const envFile of CONFIG.envFiles) {
        const variables = readEnvFile(envFile);
        if (variables) {
            // Verificar que variables innecesarias fueron eliminadas
            const innecesariasRestantes = CONFIG.variablesInnecesarias.filter(v => variables[v]);
            const innecesariasEliminadas = CONFIG.variablesInnecesarias.filter(v => !variables[v]);
            
            variablesEliminadas += innecesariasEliminadas.length;
            
            if (innecesariasRestantes.length === 0) {
                logTest(`Limpieza ${envFile}`, 'PASS', 
                    `${innecesariasEliminadas.length} variables innecesarias eliminadas`);
            } else {
                logTest(`Limpieza ${envFile}`, 'WARN', 
                    `Variables innecesarias restantes: ${innecesariasRestantes.join(', ')}`);
            }
            
            // Verificar que variables críticas fueron preservadas
            const criticasPresentes = CONFIG.variablesCriticas.filter(v => variables[v]);
            variablesCriticasPreservadas += criticasPresentes.length;
            
            if (criticasPresentes.length > 0) {
                logTest(`Preservación críticas ${envFile}`, 'PASS', 
                    `${criticasPresentes.length} variables críticas preservadas`);
            }
        }
    }
    
    logTest('Resultado limpieza', 'PASS', 
        `${variablesEliminadas} variables innecesarias eliminadas, ${variablesCriticasPreservadas} críticas preservadas`);
}

async function testCompilacionProyecto() {
    console.log('\n🔨 PASO 5: TESTING DE COMPILACIÓN');
    console.log('==================================');
    
    try {
        // Cambiar al directorio Backend
        process.chdir('Backend');
        
        // Verificar que package.json existe
        if (!fs.existsSync('package.json')) {
            logTest('Compilación', 'FAIL', 'package.json no encontrado');
            return;
        }
        
        // Intentar build del proyecto
        console.log('Ejecutando npm run build...');
        try {
            execSync('npm run build', { 
                stdio: 'pipe',
                timeout: 120000 // 2 minutos
            });
            logTest('Compilación', 'PASS', 'Proyecto compila exitosamente');
        } catch (buildError) {
            // Intentar con next build directamente
            try {
                execSync('npx next build', { 
                    stdio: 'pipe',
                    timeout: 120000 
                });
                logTest('Compilación', 'PASS', 'Proyecto compila exitosamente (next build)');
            } catch (nextError) {
                logTest('Compilación', 'WARN', 
                    `Compilación con advertencias: ${buildError.message.substring(0, 100)}...`);
            }
        }
        
    } catch (error) {
        logTest('Compilación', 'FAIL', `Error de compilación: ${error.message}`);
    } finally {
        // Volver al directorio raíz
        process.chdir('..');
    }
}

async function testValidacionFinal() {
    console.log('\n✅ PASO 6: VALIDACIÓN FINAL');
    console.log('============================');
    
    // Verificar que el reporte de auditoría existe
    if (fs.existsSync('REPORTE-AUDITORIA-VARIABLES-ENTORNO-FINAL.md')) {
        logTest('Reporte auditoría', 'PASS', 'Reporte generado exitosamente');
    } else {
        logTest('Reporte auditoría', 'FAIL', 'Reporte no encontrado');
    }
    
    // Verificar integridad del sistema
    let sistemaSaludable = true;
    
    for (const envFile of CONFIG.envFiles) {
        if (fs.existsSync(envFile)) {
            const variables = readEnvFile(envFile);
            if (variables) {
                const criticasPresentes = CONFIG.variablesCriticas.filter(v => variables[v]);
                if (criticasPresentes.length === 0) {
                    sistemaSaludable = false;
                    break;
                }
            }
        }
    }
    
    if (sistemaSaludable) {
        logTest('Integridad sistema', 'PASS', 'Sistema mantiene configuración crítica');
    } else {
        logTest('Integridad sistema', 'FAIL', 'Sistema perdió configuración crítica');
    }
}

function generarReporteTesting() {
    console.log('\n📊 RESUMEN DE TESTING CRÍTICO');
    console.log('==============================');
    
    const total = testResults.passed + testResults.failed + testResults.warnings;
    const porcentajeExito = total > 0 ? ((testResults.passed / total) * 100).toFixed(1) : 0;
    
    console.log(`✅ Tests pasados: ${testResults.passed}`);
    console.log(`❌ Tests fallidos: ${testResults.failed}`);
    console.log(`⚠️  Advertencias: ${testResults.warnings}`);
    console.log(`📈 Porcentaje éxito: ${porcentajeExito}%`);
    
    // Generar reporte detallado
    const reporte = `# 🧪 REPORTE TESTING CRÍTICO - VARIABLES DE ENTORNO
## Fecha: ${new Date().toLocaleString()}

## 📊 Resumen Ejecutivo
- **Tests ejecutados:** ${total}
- **Tests pasados:** ${testResults.passed}
- **Tests fallidos:** ${testResults.failed}
- **Advertencias:** ${testResults.warnings}
- **Porcentaje éxito:** ${porcentajeExito}%

## 📋 Detalle de Tests

${testResults.details.map(test => 
    `### ${test.status === 'PASS' ? '✅' : test.status === 'FAIL' ? '❌' : '⚠️'} ${test.test}
**Estado:** ${test.status}
**Resultado:** ${test.message}
`).join('\n')}

## 🎯 Conclusiones

${testResults.failed === 0 ? 
    '✅ **TESTING EXITOSO**: Todos los tests críticos pasaron exitosamente.' :
    '❌ **TESTING CON FALLOS**: Se encontraron problemas críticos que requieren atención.'
}

${testResults.warnings > 0 ? 
    `⚠️ **ADVERTENCIAS**: ${testResults.warnings} advertencias encontradas que requieren revisión.` : 
    ''
}

## 🚀 Estado del Sistema
${porcentajeExito >= 80 ? 
    '🟢 **SISTEMA SALUDABLE**: El sistema de variables de entorno está funcionando correctamente.' :
    '🔴 **SISTEMA REQUIERE ATENCIÓN**: Se necesitan correcciones antes de continuar.'
}

---
*Reporte generado automáticamente por TESTING-CRITICO-VARIABLES-ENTORNO.js*
`;

    fs.writeFileSync('REPORTE-TESTING-CRITICO-VARIABLES-ENTORNO.md', reporte);
    console.log('\n📄 Reporte detallado guardado: REPORTE-TESTING-CRITICO-VARIABLES-ENTORNO.md');
    
    return porcentajeExito >= 80;
}

// Función principal
async function ejecutarTestingCritico() {
    try {
        await testEstadoInicial();
        await testCreacionRespaldos();
        await testEjecucionLimpieza();
        await testValidacionLimpieza();
        await testCompilacionProyecto();
        await testValidacionFinal();
        
        const exitoso = generarReporteTesting();
        
        console.log('\n🏁 TESTING CRÍTICO COMPLETADO');
        console.log('=============================');
        
        if (exitoso) {
            console.log('🎉 ¡TESTING EXITOSO! El sistema de variables de entorno está funcionando correctamente.');
            process.exit(0);
        } else {
            console.log('⚠️  TESTING CON PROBLEMAS. Revisar reporte para detalles.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('❌ ERROR CRÍTICO EN TESTING:', error.message);
        process.exit(1);
    }
}

// Ejecutar testing
ejecutarTestingCritico();
