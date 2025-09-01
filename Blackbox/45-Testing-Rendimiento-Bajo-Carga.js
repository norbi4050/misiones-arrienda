// 45. TESTING DE RENDIMIENTO BAJO CARGA
// Fecha: 9 de Enero 2025
// Objetivo: Probar el rendimiento del sistema bajo diferentes cargas de trabajo

const https = require('https');
const fs = require('fs');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');

console.log('⚡ INICIANDO TESTING DE RENDIMIENTO BAJO CARGA');
console.log('=' .repeat(70));

// Configuración de testing
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 30000; // 30 segundos para pruebas de carga

// Configuraciones de carga
const loadConfigs = {
    light: {
        name: 'Carga Ligera',
        concurrent: 5,
        requests: 50,
        duration: 30000 // 30 segundos
    },
    medium: {
        name: 'Carga Media',
        concurrent: 15,
        requests: 150,
        duration: 60000 // 1 minuto
    },
    heavy: {
        name: 'Carga Pesada',
        concurrent: 30,
        requests: 300,
        duration: 120000 // 2 minutos
    },
    spike: {
        name: 'Pico de Carga',
        concurrent: 50,
        requests: 100,
        duration: 10000 // 10 segundos
    }
};

// Endpoints a probar
const endpoints = [
    {
        name: 'Homepage',
        url: '/',
        method: 'GET',
        critical: true
    },
    {
        name: 'API Properties',
        url: '/api/properties',
        method: 'GET',
        critical: true
    },
    {
        name: 'API Health Check',
        url: '/api/health/db',
        method: 'GET',
        critical: true
    },
    {
        name: 'Properties Page',
        url: '/properties',
        method: 'GET',
        critical: false
    },
    {
        name: 'Login Page',
        url: '/login',
        method: 'GET',
        critical: false
    },
    {
        name: 'API Stats',
        url: '/api/stats',
        method: 'GET',
        critical: false
    },
    {
        name: 'Search Properties',
        url: '/api/properties?search=casa',
        method: 'GET',
        critical: true
    },
    {
        name: 'Community Page',
        url: '/comunidad',
        method: 'GET',
        critical: false
    }
];

// Función para hacer peticiones HTTP
function makeRequest(url, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        const urlObj = new URL(BASE_URL + url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'Load-Testing/1.0',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            timeout: TIMEOUT
        };

        if (data) {
            const postData = JSON.stringify(data);
            options.headers['Content-Length'] = Buffer.byteLength(postData);
        }

        const protocol = urlObj.protocol === 'https:' ? https : require('http');
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const endTime = Date.now();
                resolve({
                    statusCode: res.statusCode,
                    responseTime: endTime - startTime,
                    contentLength: Buffer.byteLength(body),
                    success: res.statusCode >= 200 && res.statusCode < 400,
                    url: url,
                    timestamp: startTime
                });
            });
        });

        req.on('error', (err) => {
            const endTime = Date.now();
            reject({
                error: err.message,
                responseTime: endTime - startTime,
                success: false,
                url: url,
                timestamp: startTime
            });
        });

        req.on('timeout', () => {
            req.destroy();
            const endTime = Date.now();
            reject({
                error: 'Request timeout',
                responseTime: endTime - startTime,
                success: false,
                url: url,
                timestamp: startTime
            });
        });

        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
}

// Worker para ejecutar requests concurrentes
if (!isMainThread) {
    const { endpoint, requests, workerId } = workerData;
    
    async function runWorker() {
        const results = [];
        
        for (let i = 0; i < requests; i++) {
            try {
                const result = await makeRequest(endpoint.url, endpoint.method);
                results.push(result);
                
                // Pequeña pausa para evitar saturar completamente
                await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
            } catch (error) {
                results.push(error);
            }
        }
        
        parentPort.postMessage({
            workerId,
            results,
            endpoint: endpoint.name
        });
    }
    
    runWorker();
}

// Función para ejecutar test de carga en un endpoint
async function runLoadTest(endpoint, config) {
    return new Promise((resolve) => {
        console.log(`🔄 Testing ${endpoint.name} con ${config.name}...`);
        
        const workers = [];
        const allResults = [];
        const requestsPerWorker = Math.ceil(config.requests / config.concurrent);
        let completedWorkers = 0;
        
        const startTime = Date.now();
        
        // Crear workers
        for (let i = 0; i < config.concurrent; i++) {
            const worker = new Worker(__filename, {
                workerData: {
                    endpoint,
                    requests: requestsPerWorker,
                    workerId: i
                }
            });
            
            worker.on('message', (data) => {
                allResults.push(...data.results);
                completedWorkers++;
                
                if (completedWorkers === config.concurrent) {
                    const endTime = Date.now();
                    const totalTime = endTime - startTime;
                    
                    // Calcular estadísticas
                    const stats = calculateStats(allResults, totalTime, endpoint.name);
                    resolve(stats);
                }
            });
            
            worker.on('error', (error) => {
                console.error(`Worker ${i} error:`, error);
                completedWorkers++;
                
                if (completedWorkers === config.concurrent) {
                    const endTime = Date.now();
                    const totalTime = endTime - startTime;
                    const stats = calculateStats(allResults, totalTime, endpoint.name);
                    resolve(stats);
                }
            });
            
            workers.push(worker);
        }
        
        // Timeout de seguridad
        setTimeout(() => {
            workers.forEach(worker => worker.terminate());
            if (completedWorkers < config.concurrent) {
                const endTime = Date.now();
                const totalTime = endTime - startTime;
                const stats = calculateStats(allResults, totalTime, endpoint.name);
                stats.timedOut = true;
                resolve(stats);
            }
        }, config.duration);
    });
}

// Función para calcular estadísticas
function calculateStats(results, totalTime, endpointName) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const responseTimes = successful.map(r => r.responseTime);
    
    if (responseTimes.length === 0) {
        return {
            endpoint: endpointName,
            totalRequests: results.length,
            successful: 0,
            failed: results.length,
            successRate: 0,
            avgResponseTime: 0,
            minResponseTime: 0,
            maxResponseTime: 0,
            p95ResponseTime: 0,
            p99ResponseTime: 0,
            requestsPerSecond: 0,
            totalTime: totalTime,
            errors: failed.map(f => f.error || 'Unknown error')
        };
    }
    
    responseTimes.sort((a, b) => a - b);
    
    const stats = {
        endpoint: endpointName,
        totalRequests: results.length,
        successful: successful.length,
        failed: failed.length,
        successRate: ((successful.length / results.length) * 100).toFixed(2),
        avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
        minResponseTime: Math.min(...responseTimes),
        maxResponseTime: Math.max(...responseTimes),
        p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
        p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
        requestsPerSecond: ((successful.length / totalTime) * 1000).toFixed(2),
        totalTime: totalTime,
        errors: [...new Set(failed.map(f => f.error || 'Unknown error'))]
    };
    
    return stats;
}

// Función principal de testing
async function runPerformanceTesting() {
    const results = {
        timestamp: new Date().toISOString(),
        testDuration: 0,
        loadConfigs: {},
        summary: {
            totalTests: 0,
            criticalEndpointsPassed: 0,
            criticalEndpointsTotal: 0,
            overallHealthScore: 0
        }
    };
    
    const testStartTime = Date.now();
    
    console.log('🚀 Iniciando testing de rendimiento...\n');
    
    // Ejecutar tests para cada configuración de carga
    for (const [configKey, config] of Object.entries(loadConfigs)) {
        console.log(`📊 CONFIGURACIÓN: ${config.name.toUpperCase()}`);
        console.log('-'.repeat(50));
        
        results.loadConfigs[configKey] = {
            name: config.name,
            config: config,
            endpoints: {},
            summary: {
                avgSuccessRate: 0,
                avgResponseTime: 0,
                totalRequests: 0,
                totalSuccessful: 0,
                criticalEndpointsPassed: 0
            }
        };
        
        // Probar cada endpoint
        for (const endpoint of endpoints) {
            try {
                const stats = await runLoadTest(endpoint, config);
                results.loadConfigs[configKey].endpoints[endpoint.name] = stats;
                
                // Mostrar resultados
                console.log(`  📈 ${endpoint.name}:`);
                console.log(`     ✅ Exitosos: ${stats.successful}/${stats.totalRequests} (${stats.successRate}%)`);
                console.log(`     ⏱️  Tiempo promedio: ${stats.avgResponseTime}ms`);
                console.log(`     🚀 Requests/seg: ${stats.requestsPerSecond}`);
                console.log(`     📊 P95: ${stats.p95ResponseTime}ms, P99: ${stats.p99ResponseTime}ms`);
                
                if (stats.errors.length > 0) {
                    console.log(`     ❌ Errores: ${stats.errors.slice(0, 3).join(', ')}`);
                }
                
                results.summary.totalTests++;
                
                // Evaluar endpoints críticos
                if (endpoint.critical) {
                    results.summary.criticalEndpointsTotal++;
                    if (parseFloat(stats.successRate) >= 95 && stats.avgResponseTime < 2000) {
                        results.summary.criticalEndpointsPassed++;
                    }
                }
                
            } catch (error) {
                console.log(`  ❌ ${endpoint.name}: Error - ${error.message}`);
                results.loadConfigs[configKey].endpoints[endpoint.name] = {
                    endpoint: endpoint.name,
                    error: error.message,
                    successful: 0,
                    failed: 1,
                    successRate: 0
                };
            }
            
            // Pausa entre endpoints para no saturar
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // Calcular resumen de la configuración
        const configStats = Object.values(results.loadConfigs[configKey].endpoints);
        const validStats = configStats.filter(s => !s.error);
        
        if (validStats.length > 0) {
            results.loadConfigs[configKey].summary.avgSuccessRate = 
                (validStats.reduce((sum, s) => sum + parseFloat(s.successRate), 0) / validStats.length).toFixed(2);
            results.loadConfigs[configKey].summary.avgResponseTime = 
                Math.round(validStats.reduce((sum, s) => sum + s.avgResponseTime, 0) / validStats.length);
            results.loadConfigs[configKey].summary.totalRequests = 
                validStats.reduce((sum, s) => sum + s.totalRequests, 0);
            results.loadConfigs[configKey].summary.totalSuccessful = 
                validStats.reduce((sum, s) => sum + s.successful, 0);
        }
        
        console.log(`\n  📋 Resumen ${config.name}:`);
        console.log(`     Tasa de éxito promedio: ${results.loadConfigs[configKey].summary.avgSuccessRate}%`);
        console.log(`     Tiempo de respuesta promedio: ${results.loadConfigs[configKey].summary.avgResponseTime}ms`);
        console.log('');
        
        // Pausa entre configuraciones
        await new Promise(resolve => setTimeout(resolve, 5000));
    }
    
    // Calcular puntuación general de salud
    const criticalPassRate = results.summary.criticalEndpointsTotal > 0 ? 
        (results.summary.criticalEndpointsPassed / results.summary.criticalEndpointsTotal) * 100 : 0;
    
    results.summary.overallHealthScore = Math.round(criticalPassRate);
    results.testDuration = Date.now() - testStartTime;
    
    // Generar resumen final
    console.log('=' .repeat(70));
    console.log('📊 RESUMEN FINAL DE RENDIMIENTO');
    console.log('=' .repeat(70));
    console.log(`🎯 Puntuación de Salud General: ${results.summary.overallHealthScore}%`);
    console.log(`✅ Endpoints Críticos Pasados: ${results.summary.criticalEndpointsPassed}/${results.summary.criticalEndpointsTotal}`);
    console.log(`⏱️  Duración Total del Test: ${Math.round(results.testDuration / 1000)}s`);
    console.log('');
    
    // Resumen por configuración
    for (const [configKey, configData] of Object.entries(results.loadConfigs)) {
        console.log(`📈 ${configData.name}:`);
        console.log(`   Tasa de éxito: ${configData.summary.avgSuccessRate}%`);
        console.log(`   Tiempo promedio: ${configData.summary.avgResponseTime}ms`);
        console.log(`   Total requests: ${configData.summary.totalRequests}`);
    }
    
    // Recomendaciones
    console.log('\n🔍 RECOMENDACIONES:');
    if (results.summary.overallHealthScore >= 90) {
        console.log('✅ Excelente rendimiento bajo carga');
    } else if (results.summary.overallHealthScore >= 75) {
        console.log('⚠️  Rendimiento aceptable, considerar optimizaciones');
    } else {
        console.log('❌ Rendimiento deficiente, requiere optimización urgente');
    }
    
    // Guardar resultados
    const reportPath = 'Blackbox/46-Reporte-Testing-Rendimiento-Bajo-Carga.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);
    
    return results;
}

// Ejecutar testing si es llamado directamente
if (require.main === module && isMainThread) {
    runPerformanceTesting().catch(console.error);
}

module.exports = { runPerformanceTesting };
