/**
 * SCRIPT DE SOLUCIÓN AUTOMÁTICA - PROBLEMAS BACKEND/API
 * =====================================================
 * 
 * Este script implementa soluciones automáticas para los problemas
 * críticos detectados en la verificación del backend/API.
 * 
 * Fecha: 2025-01-21
 * Versión: 1.0
 */

const { spawn, exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ========================================
// CONFIGURACIÓN
// ========================================

const CONFIG = {
    BACKEND_DIR: './Backend',
    BACKEND_URL: 'http://localhost:3000',
    SUPABASE_URL: 'https://qfeyhaaxymmnohqdele.supabase.co',
    TIMEOUT: 30000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 5000
};

// ========================================
// SISTEMA DE LOGGING
// ========================================

function log(message, type = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = {
        'INFO': '📋',
        'SUCCESS': '✅',
        'ERROR': '❌',
        'WARNING': '⚠️',
        'PROGRESS': '🔄'
    }[type] || '📋';
    
    console.log(`${prefix} [${timestamp}] ${message}`);
}

// ========================================
// UTILIDADES
// ========================================

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function executeCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        log(`Ejecutando: ${command}`, 'PROGRESS');
        
        const child = exec(command, {
            timeout: CONFIG.TIMEOUT,
            ...options
        }, (error, stdout, stderr) => {
            if (error) {
                log(`Error ejecutando comando: ${error.message}`, 'ERROR');
                reject(error);
            } else {
                log(`Comando ejecutado exitosamente`, 'SUCCESS');
                resolve({ stdout, stderr });
            }
        });
        
        // Mostrar output en tiempo real
        if (child.stdout) {
            child.stdout.on('data', (data) => {
                process.stdout.write(data);
            });
        }
        
        if (child.stderr) {
            child.stderr.on('data', (data) => {
                process.stderr.write(data);
            });
        }
    });
}

function checkFileExists(filePath) {
    try {
        return fs.existsSync(filePath);
    } catch (error) {
        return false;
    }
}

function makeHttpRequest(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const req = client.request(url, { timeout }, (res) => {
            resolve({
                statusCode: res.statusCode,
                headers: res.headers
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        req.end();
    });
}

// ========================================
// VERIFICACIONES PREVIAS
// ========================================

async function checkPrerequisites() {
    log('Verificando prerequisitos...', 'PROGRESS');
    
    const checks = [];
    
    // Verificar Node.js
    try {
        const { stdout } = await executeCommand('node --version');
        log(`Node.js detectado: ${stdout.trim()}`, 'SUCCESS');
        checks.push({ name: 'Node.js', status: true, version: stdout.trim() });
    } catch (error) {
        log('Node.js no encontrado', 'ERROR');
        checks.push({ name: 'Node.js', status: false, error: error.message });
    }
    
    // Verificar npm
    try {
        const { stdout } = await executeCommand('npm --version');
        log(`npm detectado: ${stdout.trim()}`, 'SUCCESS');
        checks.push({ name: 'npm', status: true, version: stdout.trim() });
    } catch (error) {
        log('npm no encontrado', 'ERROR');
        checks.push({ name: 'npm', status: false, error: error.message });
    }
    
    // Verificar directorio Backend
    if (checkFileExists(CONFIG.BACKEND_DIR)) {
        log('Directorio Backend encontrado', 'SUCCESS');
        checks.push({ name: 'Backend Directory', status: true });
    } else {
        log('Directorio Backend no encontrado', 'ERROR');
        checks.push({ name: 'Backend Directory', status: false });
    }
    
    // Verificar package.json
    const packageJsonPath = path.join(CONFIG.BACKEND_DIR, 'package.json');
    if (checkFileExists(packageJsonPath)) {
        log('package.json encontrado', 'SUCCESS');
        checks.push({ name: 'package.json', status: true });
    } else {
        log('package.json no encontrado', 'ERROR');
        checks.push({ name: 'package.json', status: false });
    }
    
    return checks;
}

// ========================================
// VERIFICACIÓN DE CONECTIVIDAD
// ========================================

async function checkConnectivity() {
    log('Verificando conectividad...', 'PROGRESS');
    
    const results = [];
    
    // Verificar conectividad a internet
    try {
        await makeHttpRequest('https://www.google.com', 3000);
        log('Conectividad a internet: OK', 'SUCCESS');
        results.push({ target: 'Internet', status: true });
    } catch (error) {
        log('Sin conectividad a internet', 'ERROR');
        results.push({ target: 'Internet', status: false, error: error.message });
    }
    
    // Verificar Supabase
    try {
        await makeHttpRequest(CONFIG.SUPABASE_URL, 5000);
        log('Conectividad a Supabase: OK', 'SUCCESS');
        results.push({ target: 'Supabase', status: true });
    } catch (error) {
        log(`Error conectando a Supabase: ${error.message}`, 'ERROR');
        results.push({ target: 'Supabase', status: false, error: error.message });
    }
    
    return results;
}

// ========================================
// INSTALACIÓN DE DEPENDENCIAS
// ========================================

async function installDependencies() {
    log('Instalando dependencias...', 'PROGRESS');
    
    try {
        // Cambiar al directorio Backend
        process.chdir(CONFIG.BACKEND_DIR);
        
        // Limpiar cache de npm
        log('Limpiando cache de npm...', 'PROGRESS');
        await executeCommand('npm cache clean --force');
        
        // Instalar dependencias
        log('Instalando dependencias con npm...', 'PROGRESS');
        await executeCommand('npm install');
        
        log('Dependencias instaladas exitosamente', 'SUCCESS');
        return true;
    } catch (error) {
        log(`Error instalando dependencias: ${error.message}`, 'ERROR');
        
        // Intentar con yarn como alternativa
        try {
            log('Intentando con yarn...', 'PROGRESS');
            await executeCommand('yarn install');
            log('Dependencias instaladas con yarn', 'SUCCESS');
            return true;
        } catch (yarnError) {
            log(`Error con yarn: ${yarnError.message}`, 'ERROR');
            return false;
        }
    } finally {
        // Volver al directorio original
        process.chdir('..');
    }
}

// ========================================
// VERIFICACIÓN DE VARIABLES DE ENTORNO
// ========================================

async function checkEnvironmentVariables() {
    log('Verificando variables de entorno...', 'PROGRESS');
    
    const envFiles = [
        path.join(CONFIG.BACKEND_DIR, '.env'),
        path.join(CONFIG.BACKEND_DIR, '.env.local'),
        path.join(CONFIG.BACKEND_DIR, '.env.development')
    ];
    
    const results = [];
    
    for (const envFile of envFiles) {
        if (checkFileExists(envFile)) {
            log(`Archivo encontrado: ${envFile}`, 'SUCCESS');
            
            try {
                const content = fs.readFileSync(envFile, 'utf8');
                const hasSupabaseUrl = content.includes('NEXT_PUBLIC_SUPABASE_URL');
                const hasSupabaseKey = content.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY');
                
                results.push({
                    file: envFile,
                    exists: true,
                    hasSupabaseUrl,
                    hasSupabaseKey,
                    complete: hasSupabaseUrl && hasSupabaseKey
                });
                
                if (hasSupabaseUrl && hasSupabaseKey) {
                    log(`Variables de Supabase encontradas en ${envFile}`, 'SUCCESS');
                } else {
                    log(`Variables de Supabase incompletas en ${envFile}`, 'WARNING');
                }
            } catch (error) {
                log(`Error leyendo ${envFile}: ${error.message}`, 'ERROR');
                results.push({
                    file: envFile,
                    exists: true,
                    error: error.message
                });
            }
        } else {
            results.push({
                file: envFile,
                exists: false
            });
        }
    }
    
    return results;
}

// ========================================
// CREACIÓN DE ARCHIVO .env
// ========================================

async function createEnvironmentFile() {
    log('Creando archivo de variables de entorno...', 'PROGRESS');
    
    const envContent = `# Configuración de Supabase
NEXT_PUBLIC_SUPABASE_URL=https://qfeyhaaxymmnohqdele.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MTY3MzgsImV4cCI6MjA3MTM5MjczOH0.Ej9OtbNgKhzuD5Ej9OtbNgKhzuD5Ej9OtbNgKhzuD5
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTgxNjczOCwiZXhwIjoyMDcxMzkyNzM4fQ.5wJb1p0Rmg1dVIayIT4wZO_seDXTIwhVa36CyEgK-yM

# Configuración de la aplicación
NEXTAUTH_SECRET=tu-secret-key-aqui
NEXTAUTH_URL=http://localhost:3000

# Base de datos
DATABASE_URL="postgresql://postgres:[password]@db.qfeyhaaxymmnohqdele.supabase.co:5432/postgres"
`;
    
    try {
        const envPath = path.join(CONFIG.BACKEND_DIR, '.env.local');
        fs.writeFileSync(envPath, envContent);
        log(`Archivo .env.local creado exitosamente`, 'SUCCESS');
        return true;
    } catch (error) {
        log(`Error creando archivo .env: ${error.message}`, 'ERROR');
        return false;
    }
}

// ========================================
// INICIO DEL SERVIDOR
// ========================================

async function startServer() {
    log('Iniciando servidor backend...', 'PROGRESS');
    
    try {
        // Cambiar al directorio Backend
        process.chdir(CONFIG.BACKEND_DIR);
        
        // Verificar si hay un proceso en el puerto 3000
        try {
            await makeHttpRequest(CONFIG.BACKEND_URL, 2000);
            log('Servidor ya está ejecutándose en puerto 3000', 'WARNING');
            return true;
        } catch (error) {
            // El servidor no está ejecutándose, proceder a iniciarlo
        }
        
        log('Iniciando servidor con npm run dev...', 'PROGRESS');
        
        // Iniciar servidor en background
        const serverProcess = spawn('npm', ['run', 'dev'], {
            detached: true,
            stdio: 'pipe'
        });
        
        // Esperar un momento para que el servidor inicie
        await sleep(10000);
        
        // Verificar si el servidor está respondiendo
        for (let attempt = 1; attempt <= CONFIG.RETRY_ATTEMPTS; attempt++) {
            try {
                await makeHttpRequest(CONFIG.BACKEND_URL, 5000);
                log('Servidor iniciado exitosamente', 'SUCCESS');
                return true;
            } catch (error) {
                if (attempt < CONFIG.RETRY_ATTEMPTS) {
                    log(`Intento ${attempt} fallido, reintentando...`, 'WARNING');
                    await sleep(CONFIG.RETRY_DELAY);
                } else {
                    log('Servidor no responde después de múltiples intentos', 'ERROR');
                    return false;
                }
            }
        }
        
    } catch (error) {
        log(`Error iniciando servidor: ${error.message}`, 'ERROR');
        return false;
    } finally {
        // Volver al directorio original
        process.chdir('..');
    }
}

// ========================================
// VERIFICACIÓN FINAL
// ========================================

async function finalVerification() {
    log('Realizando verificación final...', 'PROGRESS');
    
    const results = {
        backend: false,
        supabase: false,
        endpoints: []
    };
    
    // Verificar servidor backend
    try {
        const response = await makeHttpRequest(CONFIG.BACKEND_URL, 5000);
        results.backend = response.statusCode < 500;
        log(`Backend: ${results.backend ? 'OK' : 'ERROR'}`, results.backend ? 'SUCCESS' : 'ERROR');
    } catch (error) {
        log(`Backend: ERROR - ${error.message}`, 'ERROR');
    }
    
    // Verificar Supabase
    try {
        await makeHttpRequest(CONFIG.SUPABASE_URL, 5000);
        results.supabase = true;
        log('Supabase: OK', 'SUCCESS');
    } catch (error) {
        log(`Supabase: ERROR - ${error.message}`, 'ERROR');
    }
    
    // Verificar endpoints específicos
    const endpoints = ['/api/health', '/api/properties'];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeHttpRequest(`${CONFIG.BACKEND_URL}${endpoint}`, 3000);
            const success = response.statusCode < 500;
            results.endpoints.push({ endpoint, success, statusCode: response.statusCode });
            log(`${endpoint}: ${success ? 'OK' : 'ERROR'} (${response.statusCode})`, success ? 'SUCCESS' : 'ERROR');
        } catch (error) {
            results.endpoints.push({ endpoint, success: false, error: error.message });
            log(`${endpoint}: ERROR - ${error.message}`, 'ERROR');
        }
    }
    
    return results;
}

// ========================================
// GENERACIÓN DE REPORTE
// ========================================

function generateReport(results) {
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalSteps: 0,
            successfulSteps: 0,
            failedSteps: 0
        },
        details: results,
        recommendations: []
    };
    
    // Calcular resumen
    const allResults = Object.values(results).flat();
    report.summary.totalSteps = allResults.length;
    report.summary.successfulSteps = allResults.filter(r => r.status || r.success).length;
    report.summary.failedSteps = report.summary.totalSteps - report.summary.successfulSteps;
    
    // Generar recomendaciones
    if (report.summary.failedSteps === 0) {
        report.recommendations.push('✅ Todos los problemas han sido resueltos exitosamente');
        report.recommendations.push('🔄 Re-ejecutar el script de verificación para confirmar');
    } else {
        report.recommendations.push('⚠️ Algunos problemas persisten');
        report.recommendations.push('🔍 Revisar los logs para más detalles');
        report.recommendations.push('🛠️ Considerar intervención manual');
    }
    
    return report;
}

async function saveReport(report) {
    const filename = `180-REPORTE-SOLUCION-AUTOMATICA-${new Date().toISOString().split('T')[0]}.json`;
    
    try {
        fs.writeFileSync(filename, JSON.stringify(report, null, 2));
        log(`Reporte guardado: ${filename}`, 'SUCCESS');
    } catch (error) {
        log(`Error guardando reporte: ${error.message}`, 'ERROR');
    }
}

// ========================================
// FUNCIÓN PRINCIPAL
// ========================================

async function runAutomaticSolution() {
    console.log('🚀 INICIANDO SOLUCIÓN AUTOMÁTICA DE PROBLEMAS BACKEND/API');
    console.log('=========================================================');
    console.log(`📅 Fecha: ${new Date().toLocaleString()}`);
    console.log('=========================================================\n');
    
    const results = {};
    
    try {
        // Paso 1: Verificar prerequisitos
        log('PASO 1: Verificando prerequisitos', 'PROGRESS');
        results.prerequisites = await checkPrerequisites();
        
        // Paso 2: Verificar conectividad
        log('PASO 2: Verificando conectividad', 'PROGRESS');
        results.connectivity = await checkConnectivity();
        
        // Paso 3: Instalar dependencias
        log('PASO 3: Instalando dependencias', 'PROGRESS');
        results.dependencies = await installDependencies();
        
        // Paso 4: Verificar variables de entorno
        log('PASO 4: Verificando variables de entorno', 'PROGRESS');
        results.environment = await checkEnvironmentVariables();
        
        // Paso 5: Crear archivo .env si es necesario
        const needsEnvFile = !results.environment.some(env => env.complete);
        if (needsEnvFile) {
            log('PASO 5: Creando archivo de variables de entorno', 'PROGRESS');
            results.envCreation = await createEnvironmentFile();
        }
        
        // Paso 6: Iniciar servidor
        log('PASO 6: Iniciando servidor backend', 'PROGRESS');
        results.serverStart = await startServer();
        
        // Paso 7: Verificación final
        log('PASO 7: Verificación final', 'PROGRESS');
        results.finalVerification = await finalVerification();
        
        // Generar y guardar reporte
        const report = generateReport(results);
        await saveReport(report);
        
        // Mostrar resumen final
        console.log('\n' + '='.repeat(60));
        console.log('📊 RESUMEN DE SOLUCIÓN AUTOMÁTICA');
        console.log('='.repeat(60));
        console.log(`✅ Pasos exitosos: ${report.summary.successfulSteps}`);
        console.log(`❌ Pasos fallidos: ${report.summary.failedSteps}`);
        console.log(`📈 Tasa de éxito: ${Math.round((report.summary.successfulSteps / report.summary.totalSteps) * 100)}%`);
        console.log('='.repeat(60));
        
        console.log('\n📋 RECOMENDACIONES:');
        report.recommendations.forEach(rec => console.log(`   ${rec}`));
        
        console.log('\n🎉 SOLUCIÓN AUTOMÁTICA COMPLETADA');
        
        // Código de salida basado en el éxito
        process.exit(report.summary.failedSteps === 0 ? 0 : 1);
        
    } catch (error) {
        log(`Error crítico en solución automática: ${error.message}`, 'ERROR');
        process.exit(1);
    }
}

// ========================================
// EJECUCIÓN
// ========================================

if (require.main === module) {
    runAutomaticSolution().catch(error => {
        console.error('💥 Error fatal:', error);
        process.exit(1);
    });
}

module.exports = {
    runAutomaticSolution,
    CONFIG
};
