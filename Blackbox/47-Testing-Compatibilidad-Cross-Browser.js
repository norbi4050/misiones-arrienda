// 47. TESTING DE COMPATIBILIDAD CROSS-BROWSER
// Fecha: 9 de Enero 2025
// Objetivo: Probar la compatibilidad del sitio web en diferentes navegadores y versiones

const https = require('https');
const fs = require('fs');
const { execSync } = require('child_process');

console.log('🌐 INICIANDO TESTING DE COMPATIBILIDAD CROSS-BROWSER');
console.log('=' .repeat(70));

// Configuración de testing
const BASE_URL = 'http://localhost:3000';
const TIMEOUT = 20000; // 20 segundos

// Navegadores y versiones a simular
const browserConfigs = {
    chrome: {
        name: 'Google Chrome',
        versions: ['Latest', '120', '119', '118'],
        userAgents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36'
        ],
        features: ['ES6', 'CSS Grid', 'Flexbox', 'WebP', 'Service Workers']
    },
    firefox: {
        name: 'Mozilla Firefox',
        versions: ['Latest', '121', '120', '119'],
        userAgents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:120.0) Gecko/20100101 Firefox/120.0',
            'Mozilla/5.0 (X11; Linux x86_64; rv:119.0) Gecko/20100101 Firefox/119.0'
        ],
        features: ['ES6', 'CSS Grid', 'Flexbox', 'WebP', 'Service Workers']
    },
    safari: {
        name: 'Safari',
        versions: ['17', '16', '15', '14'],
        userAgents: [
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1 Safari/605.1.15'
        ],
        features: ['ES6', 'CSS Grid', 'Flexbox', 'WebP Limited', 'Service Workers Limited']
    },
    edge: {
        name: 'Microsoft Edge',
        versions: ['Latest', '120', '119', '118'],
        userAgents: [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 Edg/121.0.0.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36 Edg/119.0.0.0',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.0.0'
        ],
        features: ['ES6', 'CSS Grid', 'Flexbox', 'WebP', 'Service Workers']
    },
    mobile: {
        name: 'Mobile Browsers',
        versions: ['iOS Safari', 'Chrome Mobile', 'Samsung Internet', 'Opera Mobile'],
        userAgents: [
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
            'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 14; SAMSUNG SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36',
            'Mozilla/5.0 (Linux; Android 14; SM-G998B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36 OPR/76.2.4027.73374'
        ],
        features: ['ES6', 'CSS Grid', 'Flexbox', 'WebP', 'Touch Events']
    }
};

// Páginas críticas a probar
const criticalPages = [
    {
        name: 'Homepage',
        url: '/',
        critical: true,
        features: ['Hero Section', 'Navigation', 'Search Bar', 'Property Grid']
    },
    {
        name: 'Properties Listing',
        url: '/properties',
        critical: true,
        features: ['Filters', 'Property Cards', 'Pagination', 'Search']
    },
    {
        name: 'Property Detail',
        url: '/properties/1',
        critical: true,
        features: ['Image Gallery', 'Contact Form', 'Map', 'Similar Properties']
    },
    {
        name: 'Login Page',
        url: '/login',
        critical: true,
        features: ['Form Validation', 'Authentication', 'Responsive Design']
    },
    {
        name: 'Register Page',
        url: '/register',
        critical: true,
        features: ['Form Validation', 'User Registration', 'Responsive Design']
    },
    {
        name: 'Publish Property',
        url: '/publicar',
        critical: false,
        features: ['Complex Form', 'File Upload', 'Form Validation', 'Multi-step']
    },
    {
        name: 'Community Page',
        url: '/comunidad',
        critical: false,
        features: ['User Profiles', 'Interactive Elements', 'Social Features']
    },
    {
        name: 'Dashboard',
        url: '/dashboard',
        critical: false,
        features: ['User Dashboard', 'Data Visualization', 'Interactive Components']
    }
];

// Función para hacer peticiones HTTP con User-Agent específico
function makeRequest(url, userAgent) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(BASE_URL + url);
        
        const options = {
            hostname: urlObj.hostname,
            port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
            path: urlObj.pathname + urlObj.search,
            method: 'GET',
            headers: {
                'User-Agent': userAgent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
                'Upgrade-Insecure-Requests': '1'
            },
            timeout: TIMEOUT
        };

        const protocol = urlObj.protocol === 'https:' ? https : require('http');
        const startTime = Date.now();
        
        const req = protocol.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                const endTime = Date.now();
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: body,
                    responseTime: endTime - startTime,
                    contentLength: Buffer.byteLength(body),
                    success: res.statusCode >= 200 && res.statusCode < 400
                });
            });
        });

        req.on('error', (err) => {
            const endTime = Date.now();
            reject({
                error: err.message,
                responseTime: endTime - startTime,
                success: false
            });
        });

        req.on('timeout', () => {
            req.destroy();
            const endTime = Date.now();
            reject({
                error: 'Request timeout',
                responseTime: endTime - startTime,
                success: false
            });
        });

        req.end();
    });
}

// Función para analizar el contenido HTML
function analyzeHTML(html, page) {
    const analysis = {
        hasDoctype: html.includes('<!DOCTYPE'),
        hasViewport: html.includes('viewport'),
        hasCharset: html.includes('charset'),
        hasTitle: html.includes('<title>') && !html.includes('<title></title>'),
        hasMetaDescription: html.includes('name="description"'),
        hasCSS: html.includes('.css') || html.includes('<style>'),
        hasJS: html.includes('.js') || html.includes('<script>'),
        hasImages: html.includes('<img') || html.includes('background-image'),
        hasForms: html.includes('<form'),
        hasButtons: html.includes('<button') || html.includes('type="submit"'),
        hasLinks: html.includes('<a href'),
        contentLength: html.length,
        estimatedLoadTime: Math.round(html.length / 1000) // Rough estimate
    };

    // Buscar características específicas de la página
    if (page.features) {
        analysis.pageFeatures = {};
        page.features.forEach(feature => {
            switch (feature) {
                case 'Hero Section':
                    analysis.pageFeatures[feature] = html.includes('hero') || html.includes('banner');
                    break;
                case 'Navigation':
                    analysis.pageFeatures[feature] = html.includes('<nav') || html.includes('navbar');
                    break;
                case 'Search Bar':
                    analysis.pageFeatures[feature] = html.includes('search') || html.includes('type="search"');
                    break;
                case 'Property Grid':
                    analysis.pageFeatures[feature] = html.includes('grid') || html.includes('property');
                    break;
                case 'Filters':
                    analysis.pageFeatures[feature] = html.includes('filter') || html.includes('select');
                    break;
                case 'Form Validation':
                    analysis.pageFeatures[feature] = html.includes('required') || html.includes('validation');
                    break;
                case 'File Upload':
                    analysis.pageFeatures[feature] = html.includes('type="file"');
                    break;
                default:
                    analysis.pageFeatures[feature] = html.toLowerCase().includes(feature.toLowerCase());
            }
        });
    }

    return analysis;
}

// Función para probar una página en un navegador específico
async function testPageInBrowser(page, browserKey, browserConfig, userAgentIndex) {
    const userAgent = browserConfig.userAgents[userAgentIndex];
    const version = browserConfig.versions[userAgentIndex];
    
    try {
        console.log(`  🔍 Testing ${page.name} in ${browserConfig.name} ${version}...`);
        
        const response = await makeRequest(page.url, userAgent);
        const analysis = analyzeHTML(response.body, page);
        
        // Calcular puntuación de compatibilidad
        let compatibilityScore = 0;
        let totalChecks = 0;
        
        // Checks básicos
        const basicChecks = [
            'hasDoctype', 'hasViewport', 'hasCharset', 'hasTitle', 
            'hasCSS', 'hasJS'
        ];
        
        basicChecks.forEach(check => {
            totalChecks++;
            if (analysis[check]) compatibilityScore++;
        });
        
        // Checks de características de página
        if (analysis.pageFeatures) {
            Object.values(analysis.pageFeatures).forEach(hasFeature => {
                totalChecks++;
                if (hasFeature) compatibilityScore++;
            });
        }
        
        const compatibilityPercentage = totalChecks > 0 ? 
            Math.round((compatibilityScore / totalChecks) * 100) : 0;
        
        return {
            browser: browserConfig.name,
            version: version,
            userAgent: userAgent,
            page: page.name,
            url: page.url,
            success: response.success,
            statusCode: response.statusCode,
            responseTime: response.responseTime,
            contentLength: response.contentLength,
            analysis: analysis,
            compatibilityScore: compatibilityScore,
            totalChecks: totalChecks,
            compatibilityPercentage: compatibilityPercentage,
            issues: []
        };
        
    } catch (error) {
        return {
            browser: browserConfig.name,
            version: browserConfig.versions[userAgentIndex],
            userAgent: userAgent,
            page: page.name,
            url: page.url,
            success: false,
            error: error.error || error.message,
            compatibilityPercentage: 0,
            issues: ['Failed to load page']
        };
    }
}

// Función para detectar problemas específicos
function detectCompatibilityIssues(result, browserKey) {
    const issues = [];
    
    // Problemas específicos por navegador
    if (browserKey === 'safari') {
        if (!result.analysis.hasViewport) {
            issues.push('Missing viewport meta tag - critical for Safari mobile');
        }
        if (result.analysis.hasJS && result.responseTime > 5000) {
            issues.push('Slow JavaScript execution - Safari may timeout');
        }
    }
    
    if (browserKey === 'firefox') {
        if (!result.analysis.hasDoctype) {
            issues.push('Missing DOCTYPE - Firefox may render in quirks mode');
        }
    }
    
    if (browserKey === 'mobile') {
        if (!result.analysis.hasViewport) {
            issues.push('Missing viewport - page will not be mobile responsive');
        }
        if (result.contentLength > 500000) {
            issues.push('Large page size - may cause issues on mobile networks');
        }
    }
    
    // Problemas generales
    if (!result.analysis.hasCharset) {
        issues.push('Missing charset declaration - may cause encoding issues');
    }
    
    if (!result.analysis.hasTitle || result.analysis.hasTitle === false) {
        issues.push('Missing or empty title tag - poor SEO and UX');
    }
    
    if (result.responseTime > 3000) {
        issues.push('Slow response time - may cause user abandonment');
    }
    
    if (result.statusCode >= 400) {
        issues.push(`HTTP error ${result.statusCode} - page not accessible`);
    }
    
    return issues;
}

// Función principal de testing
async function runCrossBrowserTesting() {
    const results = {
        timestamp: new Date().toISOString(),
        testDuration: 0,
        browsers: {},
        summary: {
            totalTests: 0,
            passedTests: 0,
            failedTests: 0,
            averageCompatibility: 0,
            criticalIssues: 0,
            browserCompatibility: {}
        }
    };
    
    const testStartTime = Date.now();
    
    console.log('🚀 Iniciando testing de compatibilidad cross-browser...\n');
    
    // Probar cada navegador
    for (const [browserKey, browserConfig] of Object.entries(browserConfigs)) {
        console.log(`🌐 NAVEGADOR: ${browserConfig.name.toUpperCase()}`);
        console.log('-'.repeat(50));
        
        results.browsers[browserKey] = {
            name: browserConfig.name,
            versions: browserConfig.versions,
            features: browserConfig.features,
            pages: {},
            summary: {
                totalTests: 0,
                passedTests: 0,
                averageCompatibility: 0,
                issues: []
            }
        };
        
        // Probar cada página en cada versión del navegador
        for (let i = 0; i < browserConfig.userAgents.length; i++) {
            for (const page of criticalPages) {
                const testResult = await testPageInBrowser(page, browserKey, browserConfig, i);
                
                // Detectar problemas de compatibilidad
                testResult.issues = detectCompatibilityIssues(testResult, browserKey);
                
                // Almacenar resultado
                const pageKey = `${page.name}_${browserConfig.versions[i]}`;
                results.browsers[browserKey].pages[pageKey] = testResult;
                
                // Actualizar contadores
                results.summary.totalTests++;
                results.browsers[browserKey].summary.totalTests++;
                
                if (testResult.success && testResult.compatibilityPercentage >= 80) {
                    results.summary.passedTests++;
                    results.browsers[browserKey].summary.passedTests++;
                    console.log(`    ✅ ${page.name} (${browserConfig.versions[i]}): ${testResult.compatibilityPercentage}%`);
                } else {
                    results.summary.failedTests++;
                    console.log(`    ❌ ${page.name} (${browserConfig.versions[i]}): ${testResult.compatibilityPercentage}%`);
                    
                    if (page.critical) {
                        results.summary.criticalIssues++;
                    }
                }
                
                // Mostrar problemas encontrados
                if (testResult.issues.length > 0) {
                    console.log(`       Issues: ${testResult.issues.slice(0, 2).join(', ')}`);
                    results.browsers[browserKey].summary.issues.push(...testResult.issues);
                }
                
                // Pausa entre requests
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        // Calcular compatibilidad promedio del navegador
        const browserTests = Object.values(results.browsers[browserKey].pages);
        const avgCompatibility = browserTests.length > 0 ? 
            browserTests.reduce((sum, test) => sum + test.compatibilityPercentage, 0) / browserTests.length : 0;
        
        results.browsers[browserKey].summary.averageCompatibility = Math.round(avgCompatibility);
        results.summary.browserCompatibility[browserKey] = Math.round(avgCompatibility);
        
        console.log(`\n  📊 Resumen ${browserConfig.name}:`);
        console.log(`     Compatibilidad promedio: ${Math.round(avgCompatibility)}%`);
        console.log(`     Tests pasados: ${results.browsers[browserKey].summary.passedTests}/${results.browsers[browserKey].summary.totalTests}`);
        console.log('');
        
        // Pausa entre navegadores
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Calcular estadísticas finales
    const allCompatibilityScores = [];
    Object.values(results.browsers).forEach(browser => {
        Object.values(browser.pages).forEach(page => {
            allCompatibilityScores.push(page.compatibilityPercentage);
        });
    });
    
    results.summary.averageCompatibility = allCompatibilityScores.length > 0 ?
        Math.round(allCompatibilityScores.reduce((a, b) => a + b, 0) / allCompatibilityScores.length) : 0;
    
    results.testDuration = Date.now() - testStartTime;
    
    // Generar resumen final
    console.log('=' .repeat(70));
    console.log('📊 RESUMEN FINAL DE COMPATIBILIDAD CROSS-BROWSER');
    console.log('=' .repeat(70));
    console.log(`🎯 Compatibilidad Promedio General: ${results.summary.averageCompatibility}%`);
    console.log(`✅ Tests Pasados: ${results.summary.passedTests}/${results.summary.totalTests}`);
    console.log(`⚠️  Problemas Críticos: ${results.summary.criticalIssues}`);
    console.log(`⏱️  Duración Total: ${Math.round(results.testDuration / 1000)}s`);
    console.log('');
    
    // Compatibilidad por navegador
    console.log('🌐 COMPATIBILIDAD POR NAVEGADOR:');
    Object.entries(results.summary.browserCompatibility).forEach(([browser, score]) => {
        const browserName = browserConfigs[browser].name;
        const status = score >= 90 ? '✅' : score >= 75 ? '⚠️' : '❌';
        console.log(`   ${status} ${browserName}: ${score}%`);
    });
    
    // Recomendaciones
    console.log('\n🔍 RECOMENDACIONES:');
    if (results.summary.averageCompatibility >= 90) {
        console.log('✅ Excelente compatibilidad cross-browser');
    } else if (results.summary.averageCompatibility >= 75) {
        console.log('⚠️  Buena compatibilidad, algunas mejoras recomendadas');
    } else {
        console.log('❌ Compatibilidad deficiente, requiere atención urgente');
    }
    
    if (results.summary.criticalIssues > 0) {
        console.log(`⚠️  ${results.summary.criticalIssues} problemas críticos requieren solución inmediata`);
    }
    
    // Guardar resultados
    const reportPath = 'Blackbox/48-Reporte-Testing-Compatibilidad-Cross-Browser.json';
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`\n📄 Reporte detallado guardado en: ${reportPath}`);
    
    return results;
}

// Ejecutar testing si es llamado directamente
if (require.main === module) {
    runCrossBrowserTesting().catch(console.error);
}

module.exports = { runCrossBrowserTesting };
