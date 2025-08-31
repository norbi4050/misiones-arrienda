/**
 * 🧪 TESTING DE MEJORAS - AUDITORÍA 2025
 * =====================================
 * 
 * Script para validar la implementación de mejoras críticas
 * Basado en: AUDITORIA-COMPLETA-PROYECTO-MISIONES-ARRIENDA-2025.md
 * 
 * Fecha: 3 de Enero, 2025
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuración de colores para consola
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

// Función para logging con colores
function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

// Función para ejecutar comandos
function executeCommand(command, options = {}) {
    try {
        const result = execSync(command, { 
            encoding: 'utf8', 
            stdio: options.silent ? 'pipe' : 'inherit',
            ...options 
        });
        return { success: true, output: result };
    } catch (error) {
        return { success: false, error: error.message, output: error.stdout };
    }
}

// Función para verificar si un archivo existe
function fileExists(filePath) {
    return fs.existsSync(filePath);
}

// Función para leer archivo JSON
function readJsonFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(content);
    } catch (error) {
        return null;
    }
}

// Clase principal de testing
class AuditoriaTestRunner {
    constructor() {
        this.results = {
            total: 0,
            passed: 0,
            failed: 0,
            warnings: 0,
            details: []
        };
        this.startTime = Date.now();
    }

    // Ejecutar test individual
    runTest(testName, testFunction, category = 'General') {
        this.results.total++;
        log(`\n🧪 Ejecutando: ${testName}`, 'cyan');
        
        try {
            const result = testFunction();
            if (result.success) {
                this.results.passed++;
                log(`✅ PASÓ: ${testName}`, 'green');
                if (result.message) {
                    log(`   📝 ${result.message}`, 'blue');
                }
            } else {
                if (result.warning) {
                    this.results.warnings++;
                    log(`⚠️  ADVERTENCIA: ${testName}`, 'yellow');
                } else {
                    this.results.failed++;
                    log(`❌ FALLÓ: ${testName}`, 'red');
                }
                if (result.message) {
                    log(`   📝 ${result.message}`, 'yellow');
                }
            }
            
            this.results.details.push({
                category,
                name: testName,
                status: result.success ? 'PASSED' : (result.warning ? 'WARNING' : 'FAILED'),
                message: result.message || '',
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            this.results.failed++;
            log(`❌ ERROR: ${testName} - ${error.message}`, 'red');
            this.results.details.push({
                category,
                name: testName,
                status: 'ERROR',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    // Tests de estructura de archivos
    testFileStructure() {
        return this.runTest('Estructura de Archivos Limpia', () => {
            const duplicatedFolders = [
                'misiones-arrienda-v2',
                'misionesarrienda1',
                'src'
            ];
            
            const foundDuplicates = duplicatedFolders.filter(folder => 
                fileExists(path.join(process.cwd(), folder))
            );
            
            if (foundDuplicates.length > 0) {
                return {
                    success: false,
                    message: `Carpetas duplicadas encontradas: ${foundDuplicates.join(', ')}`
                };
            }
            
            // Verificar que Backend existe
            if (!fileExists(path.join(process.cwd(), 'Backend'))) {
                return {
                    success: false,
                    message: 'Carpeta Backend no encontrada'
                };
            }
            
            return {
                success: true,
                message: 'Estructura de archivos limpia y organizada'
            };
        }, 'Estructura');
    }

    // Tests de configuración
    testConfiguration() {
        return this.runTest('Archivos de Configuración', () => {
            const requiredFiles = [
                'Backend/package.json',
                'Backend/next.config.js',
                'Backend/tsconfig.json',
                'Backend/prisma/schema.prisma'
            ];
            
            const missingFiles = requiredFiles.filter(file => 
                !fileExists(path.join(process.cwd(), file))
            );
            
            if (missingFiles.length > 0) {
                return {
                    success: false,
                    message: `Archivos faltantes: ${missingFiles.join(', ')}`
                };
            }
            
            return {
                success: true,
                message: 'Todos los archivos de configuración presentes'
            };
        }, 'Configuración');
    }

    // Test de build
    testBuild() {
        return this.runTest('Build del Proyecto', () => {
            // Cambiar al directorio Backend
            const originalDir = process.cwd();
            const backendDir = path.join(originalDir, 'Backend');
            
            if (!fileExists(backendDir)) {
                return {
                    success: false,
                    message: 'Directorio Backend no encontrado'
                };
            }
            
            process.chdir(backendDir);
            
            try {
                // Verificar dependencias
                log('   📦 Verificando dependencias...', 'blue');
                const depsResult = executeCommand('npm list --depth=0', { silent: true });
                
                if (!depsResult.success) {
                    log('   📦 Instalando dependencias...', 'yellow');
                    const installResult = executeCommand('npm install', { silent: true });
                    if (!installResult.success) {
                        return {
                            success: false,
                            message: 'Error instalando dependencias'
                        };
                    }
                }
                
                // Ejecutar build
                log('   🔨 Ejecutando build...', 'blue');
                const buildResult = executeCommand('npm run build', { silent: true });
                
                if (!buildResult.success) {
                    // Guardar log de errores
                    fs.writeFileSync('build-test-errors.log', buildResult.output || buildResult.error);
                    return {
                        success: false,
                        message: 'Build falló - revisar build-test-errors.log'
                    };
                }
                
                return {
                    success: true,
                    message: 'Build ejecutado exitosamente'
                };
                
            } finally {
                process.chdir(originalDir);
            }
        }, 'Build');
    }

    // Test de TypeScript
    testTypeScript() {
        return this.runTest('Validación TypeScript', () => {
            const originalDir = process.cwd();
            const backendDir = path.join(originalDir, 'Backend');
            
            if (!fileExists(backendDir)) {
                return {
                    success: false,
                    message: 'Directorio Backend no encontrado'
                };
            }
            
            process.chdir(backendDir);
            
            try {
                log('   🔍 Verificando tipos TypeScript...', 'blue');
                const tscResult = executeCommand('npx tsc --noEmit', { silent: true });
                
                if (!tscResult.success) {
                    // Contar errores
                    const errorLines = (tscResult.output || '').split('\n').filter(line => 
                        line.includes('error TS')
                    );
                    
                    return {
                        success: false,
                        message: `${errorLines.length} errores TypeScript encontrados`
                    };
                }
                
                return {
                    success: true,
                    message: 'Sin errores TypeScript'
                };
                
            } finally {
                process.chdir(originalDir);
            }
        }, 'TypeScript');
    }

    // Test de Prisma
    testPrisma() {
        return this.runTest('Configuración Prisma', () => {
            const originalDir = process.cwd();
            const backendDir = path.join(originalDir, 'Backend');
            
            if (!fileExists(backendDir)) {
                return {
                    success: false,
                    message: 'Directorio Backend no encontrado'
                };
            }
            
            process.chdir(backendDir);
            
            try {
                log('   🗄️  Generando cliente Prisma...', 'blue');
                const generateResult = executeCommand('npx prisma generate', { silent: true });
                
                if (!generateResult.success) {
                    return {
                        success: false,
                        message: 'Error generando cliente Prisma'
                    };
                }
                
                // Verificar que el cliente se generó
                if (!fileExists('node_modules/.prisma/client')) {
                    return {
                        success: false,
                        warning: true,
                        message: 'Cliente Prisma generado pero no encontrado en node_modules'
                    };
                }
                
                return {
                    success: true,
                    message: 'Cliente Prisma generado correctamente'
                };
                
            } finally {
                process.chdir(originalDir);
            }
        }, 'Base de Datos');
    }

    // Test de variables de entorno
    testEnvironmentVariables() {
        return this.runTest('Variables de Entorno', () => {
            const backendDir = path.join(process.cwd(), 'Backend');
            const envPath = path.join(backendDir, '.env');
            const envExamplePath = path.join(backendDir, '.env.example');
            
            if (!fileExists(envPath) && !fileExists(envExamplePath)) {
                return {
                    success: false,
                    warning: true,
                    message: 'No se encontró .env ni .env.example'
                };
            }
            
            // Variables críticas que deberían estar definidas
            const criticalVars = [
                'DATABASE_URL',
                'NEXT_PUBLIC_SUPABASE_URL',
                'NEXT_PUBLIC_SUPABASE_ANON_KEY'
            ];
            
            if (fileExists(envPath)) {
                const envContent = fs.readFileSync(envPath, 'utf8');
                const missingVars = criticalVars.filter(varName => 
                    !envContent.includes(varName)
                );
                
                if (missingVars.length > 0) {
                    return {
                        success: false,
                        warning: true,
                        message: `Variables faltantes en .env: ${missingVars.join(', ')}`
                    };
                }
            }
            
            return {
                success: true,
                message: 'Configuración de variables de entorno OK'
            };
        }, 'Configuración');
    }

    // Test de seguridad básica
    testSecurity() {
        return this.runTest('Configuración de Seguridad', () => {
            const securityFiles = [
                'Backend/src/lib/security/rate-limiter.ts',
                'Backend/src/lib/security/security-headers.ts',
                'Backend/src/lib/security/security-middleware.ts'
            ];
            
            const existingFiles = securityFiles.filter(file => 
                fileExists(path.join(process.cwd(), file))
            );
            
            if (existingFiles.length === 0) {
                return {
                    success: false,
                    warning: true,
                    message: 'No se encontraron archivos de seguridad'
                };
            }
            
            return {
                success: true,
                message: `${existingFiles.length}/${securityFiles.length} archivos de seguridad encontrados`
            };
        }, 'Seguridad');
    }

    // Test de testing setup
    testTestingSetup() {
        return this.runTest('Configuración de Testing', () => {
            const backendDir = path.join(process.cwd(), 'Backend');
            const jestConfig = path.join(backendDir, 'jest.config.js');
            const jestSetup = path.join(backendDir, 'jest.setup.js');
            
            if (!fileExists(jestConfig)) {
                return {
                    success: false,
                    warning: true,
                    message: 'Jest no configurado (jest.config.js faltante)'
                };
            }
            
            // Verificar si hay tests
            const testDir = path.join(backendDir, 'src');
            let testFiles = 0;
            
            if (fileExists(testDir)) {
                const findTestFiles = (dir) => {
                    const files = fs.readdirSync(dir);
                    files.forEach(file => {
                        const fullPath = path.join(dir, file);
                        if (fs.statSync(fullPath).isDirectory()) {
                            findTestFiles(fullPath);
                        } else if (file.includes('.test.') || file.includes('.spec.')) {
                            testFiles++;
                        }
                    });
                };
                
                try {
                    findTestFiles(testDir);
                } catch (error) {
                    // Ignorar errores de permisos
                }
            }
            
            return {
                success: true,
                message: `Jest configurado, ${testFiles} archivos de test encontrados`
            };
        }, 'Testing');
    }

    // Test de documentación
    testDocumentation() {
        return this.runTest('Documentación del Proyecto', () => {
            const docsFiles = [
                'Backend/README.md',
                'AUDITORIA-COMPLETA-PROYECTO-MISIONES-ARRIENDA-2025.md',
                'Backend/docs'
            ];
            
            const existingDocs = docsFiles.filter(file => 
                fileExists(path.join(process.cwd(), file))
            );
            
            if (existingDocs.length < 2) {
                return {
                    success: false,
                    warning: true,
                    message: 'Documentación insuficiente'
                };
            }
            
            return {
                success: true,
                message: `${existingDocs.length}/${docsFiles.length} archivos de documentación encontrados`
            };
        }, 'Documentación');
    }

    // Ejecutar todos los tests
    async runAllTests() {
        log('\n🚀 INICIANDO TESTING DE MEJORAS - AUDITORÍA 2025', 'bright');
        log('=' .repeat(60), 'blue');
        log(`📅 Fecha: ${new Date().toLocaleString()}`, 'cyan');
        log(`📁 Directorio: ${process.cwd()}`, 'cyan');
        log('=' .repeat(60), 'blue');

        // Ejecutar tests por categoría
        log('\n📁 TESTS DE ESTRUCTURA', 'magenta');
        this.testFileStructure();

        log('\n⚙️  TESTS DE CONFIGURACIÓN', 'magenta');
        this.testConfiguration();
        this.testEnvironmentVariables();

        log('\n🔨 TESTS DE BUILD', 'magenta');
        this.testBuild();
        this.testTypeScript();

        log('\n🗄️  TESTS DE BASE DE DATOS', 'magenta');
        this.testPrisma();

        log('\n🔒 TESTS DE SEGURIDAD', 'magenta');
        this.testSecurity();

        log('\n🧪 TESTS DE TESTING', 'magenta');
        this.testTestingSetup();

        log('\n📚 TESTS DE DOCUMENTACIÓN', 'magenta');
        this.testDocumentation();

        // Generar reporte final
        this.generateReport();
    }

    // Generar reporte final
    generateReport() {
        const endTime = Date.now();
        const duration = ((endTime - this.startTime) / 1000).toFixed(2);

        log('\n' + '=' .repeat(60), 'blue');
        log('📊 REPORTE FINAL DE TESTING', 'bright');
        log('=' .repeat(60), 'blue');

        log(`\n📈 ESTADÍSTICAS:`, 'cyan');
        log(`   Total de tests: ${this.results.total}`, 'blue');
        log(`   ✅ Pasaron: ${this.results.passed}`, 'green');
        log(`   ❌ Fallaron: ${this.results.failed}`, 'red');
        log(`   ⚠️  Advertencias: ${this.results.warnings}`, 'yellow');
        log(`   ⏱️  Duración: ${duration}s`, 'blue');

        // Calcular porcentaje de éxito
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
        log(`   📊 Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : successRate >= 60 ? 'yellow' : 'red');

        // Estado general
        log(`\n🎯 ESTADO GENERAL:`, 'cyan');
        if (this.results.failed === 0) {
            if (this.results.warnings === 0) {
                log('   🎉 EXCELENTE - Todos los tests pasaron', 'green');
            } else {
                log('   ✅ BUENO - Tests pasaron con advertencias', 'yellow');
            }
        } else if (this.results.failed <= 2) {
            log('   ⚠️  ACEPTABLE - Pocos tests fallaron', 'yellow');
        } else {
            log('   ❌ CRÍTICO - Múltiples tests fallaron', 'red');
        }

        // Recomendaciones
        log(`\n💡 RECOMENDACIONES:`, 'cyan');
        if (this.results.failed > 0) {
            log('   1. Revisar y corregir tests fallidos', 'yellow');
            log('   2. Ejecutar nuevamente después de correcciones', 'yellow');
        }
        if (this.results.warnings > 0) {
            log('   3. Atender advertencias para mejorar calidad', 'yellow');
        }
        if (successRate < 80) {
            log('   4. Implementar mejoras antes de deployment', 'yellow');
        }

        // Guardar reporte detallado
        const reportData = {
            timestamp: new Date().toISOString(),
            duration: duration,
            summary: this.results,
            recommendations: this.generateRecommendations()
        };

        const reportPath = path.join(process.cwd(), 'Backend', 'testing-mejoras-reporte.json');
        try {
            fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
            log(`\n📄 Reporte detallado guardado en: ${reportPath}`, 'blue');
        } catch (error) {
            log(`\n⚠️  No se pudo guardar el reporte: ${error.message}`, 'yellow');
        }

        log('\n' + '=' .repeat(60), 'blue');
        log('🏁 TESTING COMPLETADO', 'bright');
        log('=' .repeat(60), 'blue');
    }

    // Generar recomendaciones basadas en resultados
    generateRecommendations() {
        const recommendations = [];

        if (this.results.failed > 0) {
            recommendations.push('Corregir tests fallidos antes de continuar');
        }

        if (this.results.warnings > 0) {
            recommendations.push('Revisar advertencias para mejorar calidad');
        }

        const successRate = (this.results.passed / this.results.total) * 100;
        if (successRate < 80) {
            recommendations.push('Implementar mejoras adicionales antes de deployment');
        }

        if (successRate >= 90) {
            recommendations.push('Proyecto listo para Fase 2 de implementación');
        }

        return recommendations;
    }
}

// Ejecutar testing si se llama directamente
if (require.main === module) {
    const runner = new AuditoriaTestRunner();
    runner.runAllTests().catch(error => {
        console.error('Error ejecutando tests:', error);
        process.exit(1);
    });
}

module.exports = AuditoriaTestRunner;
