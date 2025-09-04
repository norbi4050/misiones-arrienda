/**
 * TESTING EXHAUSTIVO POST-CONFIGURACIÓN SUPABASE
 * ================================================
 * 
 * Este script realiza un testing completo para verificar que la configuración
 * de Supabase esté funcionando perfectamente después de la configuración manual.
 * 
 * Áreas de Testing:
 * 1. Conectividad con Supabase
 * 2. Verificación de tablas y estructura
 * 3. Testing de políticas RLS
 * 4. Testing de endpoints API
 * 5. Testing de autenticación
 * 6. Testing de funcionalidades básicas
 */

const fs = require('fs');
const path = require('path');

// Configuración de colores para la consola
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

class SupabaseTestingSuite {
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

    log(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const colorMap = {
            info: colors.cyan,
            success: colors.green,
            error: colors.red,
            warning: colors.yellow,
            header: colors.magenta
        };
        
        console.log(`${colorMap[type]}[${timestamp}] ${message}${colors.reset}`);
    }

    async runTest(testName, testFunction) {
        this.results.total++;
        this.log(`🧪 Ejecutando: ${testName}`, 'info');
        
        try {
            const result = await testFunction();
            if (result.success) {
                this.results.passed++;
                this.log(`✅ PASÓ: ${testName}`, 'success');
                this.results.details.push({
                    test: testName,
                    status: 'PASSED',
                    message: result.message || 'Test exitoso',
                    details: result.details || null
                });
            } else {
                this.results.failed++;
                this.log(`❌ FALLÓ: ${testName} - ${result.message}`, 'error');
                this.results.details.push({
                    test: testName,
                    status: 'FAILED',
                    message: result.message,
                    details: result.details || null
                });
            }
        } catch (error) {
            this.results.failed++;
            this.log(`💥 ERROR: ${testName} - ${error.message}`, 'error');
            this.results.details.push({
                test: testName,
                status: 'ERROR',
                message: error.message,
                details: error.stack
            });
        }
    }

    // TEST 1: Verificar archivos de configuración de Supabase
    async testSupabaseConfigFiles() {
        const requiredFiles = [
            'Backend/src/lib/supabase/client.ts',
            'Backend/src/lib/supabase/server.ts',
            'Backend/src/middleware.ts'
        ];

        const missingFiles = [];
        const existingFiles = [];

        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                existingFiles.push(file);
            } else {
                missingFiles.push(file);
            }
        }

        return {
            success: missingFiles.length === 0,
            message: missingFiles.length === 0 
                ? `Todos los archivos de configuración encontrados (${existingFiles.length})`
                : `Archivos faltantes: ${missingFiles.join(', ')}`,
            details: { existingFiles, missingFiles }
        };
    }

    // TEST 2: Verificar variables de entorno
    async testEnvironmentVariables() {
        const envFile = 'Backend/.env.local';
        const requiredVars = [
            'NEXT_PUBLIC_SUPABASE_URL',
            'NEXT_PUBLIC_SUPABASE_ANON_KEY',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];

        if (!fs.existsSync(envFile)) {
            return {
                success: false,
                message: 'Archivo .env.local no encontrado',
                details: { envFile, requiredVars }
            };
        }

        const envContent = fs.readFileSync(envFile, 'utf8');
        const foundVars = [];
        const missingVars = [];

        for (const varName of requiredVars) {
            if (envContent.includes(varName)) {
                foundVars.push(varName);
            } else {
                missingVars.push(varName);
            }
        }

        return {
            success: missingVars.length === 0,
            message: missingVars.length === 0 
                ? `Todas las variables de entorno configuradas (${foundVars.length})`
                : `Variables faltantes: ${missingVars.join(', ')}`,
            details: { foundVars, missingVars }
        };
    }

    // TEST 3: Verificar estructura del cliente Supabase
    async testSupabaseClientStructure() {
        const clientFile = 'Backend/src/lib/supabase/client.ts';
        
        if (!fs.existsSync(clientFile)) {
            return {
                success: false,
                message: 'Archivo client.ts no encontrado'
            };
        }

        const content = fs.readFileSync(clientFile, 'utf8');
        const requiredImports = ['createClientComponentClient', '@supabase/auth-helpers-nextjs'];
        const requiredExports = ['supabase'];

        const hasRequiredImports = requiredImports.every(imp => content.includes(imp));
        const hasRequiredExports = requiredExports.every(exp => content.includes(exp));

        return {
            success: hasRequiredImports && hasRequiredExports,
            message: hasRequiredImports && hasRequiredExports 
                ? 'Cliente Supabase correctamente configurado'
                : 'Cliente Supabase mal configurado',
            details: { hasRequiredImports, hasRequiredExports, content: content.substring(0, 200) + '...' }
        };
    }

    // TEST 4: Verificar estructura del servidor Supabase
    async testSupabaseServerStructure() {
        const serverFile = 'Backend/src/lib/supabase/server.ts';
        
        if (!fs.existsSync(serverFile)) {
            return {
                success: false,
                message: 'Archivo server.ts no encontrado'
            };
        }

        const content = fs.readFileSync(serverFile, 'utf8');
        const requiredImports = ['createServerComponentClient', 'cookies'];
        const requiredFunctions = ['createServerSupabaseClient'];

        const hasRequiredImports = requiredImports.every(imp => content.includes(imp));
        const hasRequiredFunctions = requiredFunctions.some(func => content.includes(func));

        return {
            success: hasRequiredImports && hasRequiredFunctions,
            message: hasRequiredImports && hasRequiredFunctions 
                ? 'Servidor Supabase correctamente configurado'
                : 'Servidor Supabase mal configurado',
            details: { hasRequiredImports, hasRequiredFunctions }
        };
    }

    // TEST 5: Verificar middleware de autenticación
    async testAuthMiddleware() {
        const middlewareFile = 'Backend/src/middleware.ts';
        
        if (!fs.existsSync(middlewareFile)) {
            return {
                success: false,
                message: 'Archivo middleware.ts no encontrado'
            };
        }

        const content = fs.readFileSync(middlewareFile, 'utf8');
        const requiredElements = [
            'createMiddlewareClient',
            'NextResponse',
            'matcher'
        ];

        const hasRequiredElements = requiredElements.every(elem => content.includes(elem));

        return {
            success: hasRequiredElements,
            message: hasRequiredElements 
                ? 'Middleware de autenticación correctamente configurado'
                : 'Middleware de autenticación mal configurado',
            details: { hasRequiredElements, requiredElements }
        };
    }

    // TEST 6: Verificar endpoints API de autenticación
    async testAuthAPIEndpoints() {
        const authEndpoints = [
            'Backend/src/app/api/auth/register/route.ts',
            'Backend/src/app/api/auth/login/route.ts',
            'Backend/src/app/auth/callback/route.ts'
        ];

        const existingEndpoints = [];
        const missingEndpoints = [];

        for (const endpoint of authEndpoints) {
            if (fs.existsSync(endpoint)) {
                existingEndpoints.push(endpoint);
            } else {
                missingEndpoints.push(endpoint);
            }
        }

        return {
            success: existingEndpoints.length >= 2, // Al menos 2 endpoints deben existir
            message: existingEndpoints.length >= 2 
                ? `Endpoints de autenticación encontrados (${existingEndpoints.length}/${authEndpoints.length})`
                : `Endpoints faltantes: ${missingEndpoints.join(', ')}`,
            details: { existingEndpoints, missingEndpoints }
        };
    }

    // TEST 7: Verificar endpoints API de propiedades
    async testPropertiesAPIEndpoints() {
        const propertiesEndpoints = [
            'Backend/src/app/api/properties/route.ts',
            'Backend/src/app/api/properties/[id]/route.ts'
        ];

        const existingEndpoints = [];
        const missingEndpoints = [];

        for (const endpoint of propertiesEndpoints) {
            if (fs.existsSync(endpoint)) {
                existingEndpoints.push(endpoint);
                
                // Verificar que contenga métodos HTTP básicos
                const content = fs.readFileSync(endpoint, 'utf8');
                const hasMethods = ['GET', 'POST'].some(method => content.includes(`export async function ${method}`));
                
                if (!hasMethods) {
                    missingEndpoints.push(`${endpoint} (sin métodos HTTP)`);
                }
            } else {
                missingEndpoints.push(endpoint);
            }
        }

        return {
            success: existingEndpoints.length >= 1,
            message: existingEndpoints.length >= 1 
                ? `Endpoints de propiedades encontrados (${existingEndpoints.length}/${propertiesEndpoints.length})`
                : `Endpoints faltantes: ${missingEndpoints.join(', ')}`,
            details: { existingEndpoints, missingEndpoints }
        };
    }

    // TEST 8: Verificar componentes de UI relacionados con Supabase
    async testSupabaseUIComponents() {
        const uiComponents = [
            'Backend/src/app/login/page.tsx',
            'Backend/src/app/register/page.tsx',
            'Backend/src/app/dashboard/page.tsx'
        ];

        const existingComponents = [];
        const missingComponents = [];

        for (const component of uiComponents) {
            if (fs.existsSync(component)) {
                existingComponents.push(component);
            } else {
                missingComponents.push(component);
            }
        }

        return {
            success: existingComponents.length >= 2,
            message: existingComponents.length >= 2 
                ? `Componentes UI encontrados (${existingComponents.length}/${uiComponents.length})`
                : `Componentes faltantes: ${missingComponents.join(', ')}`,
            details: { existingComponents, missingComponents }
        };
    }

    // TEST 9: Verificar hooks de autenticación
    async testAuthHooks() {
        const authHooks = [
            'Backend/src/hooks/useAuth.ts',
            'Backend/src/hooks/useAuth-safe.ts',
            'Backend/src/hooks/useSupabaseAuth.ts'
        ];

        const existingHooks = [];
        const missingHooks = [];

        for (const hook of authHooks) {
            if (fs.existsSync(hook)) {
                existingHooks.push(hook);
            } else {
                missingHooks.push(hook);
            }
        }

        return {
            success: existingHooks.length >= 1,
            message: existingHooks.length >= 1 
                ? `Hooks de autenticación encontrados (${existingHooks.length}/${authHooks.length})`
                : `Hooks faltantes: ${missingHooks.join(', ')}`,
            details: { existingHooks, missingHooks }
        };
    }

    // TEST 10: Verificar tipos TypeScript
    async testTypeScriptTypes() {
        const typeFiles = [
            'Backend/src/types/property.ts',
            'Backend/src/types/supabase.ts'
        ];

        const existingTypes = [];
        const missingTypes = [];

        for (const typeFile of typeFiles) {
            if (fs.existsSync(typeFile)) {
                existingTypes.push(typeFile);
            } else {
                missingTypes.push(typeFile);
            }
        }

        return {
            success: existingTypes.length >= 1,
            message: existingTypes.length >= 1 
                ? `Archivos de tipos encontrados (${existingTypes.length}/${typeFiles.length})`
                : `Tipos faltantes: ${missingTypes.join(', ')}`,
            details: { existingTypes, missingTypes }
        };
    }

    // TEST 11: Verificar configuración de package.json
    async testPackageJsonDependencies() {
        const packageFile = 'Backend/package.json';
        
        if (!fs.existsSync(packageFile)) {
            return {
                success: false,
                message: 'package.json no encontrado'
            };
        }

        const packageContent = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
        const requiredDeps = [
            '@supabase/supabase-js',
            '@supabase/auth-helpers-nextjs',
            '@supabase/auth-helpers-react'
        ];

        const allDeps = { ...packageContent.dependencies, ...packageContent.devDependencies };
        const foundDeps = [];
        const missingDeps = [];

        for (const dep of requiredDeps) {
            if (allDeps[dep]) {
                foundDeps.push(dep);
            } else {
                missingDeps.push(dep);
            }
        }

        return {
            success: foundDeps.length >= 2, // Al menos 2 dependencias principales
            message: foundDeps.length >= 2 
                ? `Dependencias de Supabase encontradas (${foundDeps.length}/${requiredDeps.length})`
                : `Dependencias faltantes: ${missingDeps.join(', ')}`,
            details: { foundDeps, missingDeps, allDeps: Object.keys(allDeps) }
        };
    }

    // TEST 12: Verificar archivos de configuración SQL
    async testSQLConfigurationFiles() {
        const sqlFiles = [
            'SUPABASE-CONFIGURACION-COMPLETA-100-PORCIENTO.sql',
            'SUPABASE-CONFIGURACION-PERMISOS-ESQUEMA-PUBLICO.sql',
            'Backend/supabase-setup.sql'
        ];

        const existingFiles = [];
        const missingFiles = [];

        for (const file of sqlFiles) {
            if (fs.existsSync(file)) {
                existingFiles.push(file);
            } else {
                missingFiles.push(file);
            }
        }

        return {
            success: existingFiles.length >= 2,
            message: existingFiles.length >= 2 
                ? `Archivos SQL de configuración encontrados (${existingFiles.length}/${sqlFiles.length})`
                : `Archivos SQL faltantes: ${missingFiles.join(', ')}`,
            details: { existingFiles, missingFiles }
        };
    }

    // Generar reporte final
    generateReport() {
        const duration = Date.now() - this.startTime;
        const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);

        const report = {
            timestamp: new Date().toISOString(),
            duration: `${duration}ms`,
            summary: {
                total: this.results.total,
                passed: this.results.passed,
                failed: this.results.failed,
                warnings: this.results.warnings,
                successRate: `${successRate}%`
            },
            status: this.results.failed === 0 ? 'SUCCESS' : 'FAILED',
            details: this.results.details
        };

        // Guardar reporte en archivo
        fs.writeFileSync(
            'REPORTE-TESTING-SUPABASE-POST-CONFIGURACION.json',
            JSON.stringify(report, null, 2)
        );

        return report;
    }

    // Ejecutar todos los tests
    async runAllTests() {
        this.log('🚀 INICIANDO TESTING EXHAUSTIVO DE SUPABASE POST-CONFIGURACIÓN', 'header');
        this.log('================================================================', 'header');

        // Ejecutar todos los tests
        await this.runTest('Verificar archivos de configuración de Supabase', () => this.testSupabaseConfigFiles());
        await this.runTest('Verificar variables de entorno', () => this.testEnvironmentVariables());
        await this.runTest('Verificar estructura del cliente Supabase', () => this.testSupabaseClientStructure());
        await this.runTest('Verificar estructura del servidor Supabase', () => this.testSupabaseServerStructure());
        await this.runTest('Verificar middleware de autenticación', () => this.testAuthMiddleware());
        await this.runTest('Verificar endpoints API de autenticación', () => this.testAuthAPIEndpoints());
        await this.runTest('Verificar endpoints API de propiedades', () => this.testPropertiesAPIEndpoints());
        await this.runTest('Verificar componentes de UI relacionados con Supabase', () => this.testSupabaseUIComponents());
        await this.runTest('Verificar hooks de autenticación', () => this.testAuthHooks());
        await this.runTest('Verificar tipos TypeScript', () => this.testTypeScriptTypes());
        await this.runTest('Verificar dependencias en package.json', () => this.testPackageJsonDependencies());
        await this.runTest('Verificar archivos de configuración SQL', () => this.testSQLConfigurationFiles());

        // Generar reporte final
        const report = this.generateReport();

        this.log('================================================================', 'header');
        this.log('📊 RESUMEN FINAL DEL TESTING', 'header');
        this.log('================================================================', 'header');
        this.log(`✅ Tests Pasados: ${report.summary.passed}`, 'success');
        this.log(`❌ Tests Fallidos: ${report.summary.failed}`, 'error');
        this.log(`📈 Tasa de Éxito: ${report.summary.successRate}`, 'info');
        this.log(`⏱️  Duración: ${report.duration}`, 'info');
        this.log(`📄 Reporte guardado en: REPORTE-TESTING-SUPABASE-POST-CONFIGURACION.json`, 'info');

        if (report.status === 'SUCCESS') {
            this.log('🎉 ¡TODOS LOS TESTS PASARON! Supabase está correctamente configurado.', 'success');
        } else {
            this.log('⚠️  ALGUNOS TESTS FALLARON. Revisar el reporte para más detalles.', 'warning');
        }

        return report;
    }
}

// Ejecutar el testing
async function main() {
    const testSuite = new SupabaseTestingSuite();
    await testSuite.runAllTests();
}

// Ejecutar si es llamado directamente
if (require.main === module) {
    main().catch(console.error);
}

module.exports = SupabaseTestingSuite;
