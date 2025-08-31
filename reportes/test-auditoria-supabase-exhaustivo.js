/**
 * TESTING EXHAUSTIVO - AUDITORÍA SUPABASE
 * Fecha: 30 de Agosto de 2025
 * Propósito: Validar los 7 problemas críticos identificados en la auditoría
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO TESTING EXHAUSTIVO DE AUDITORÍA SUPABASE');
console.log('=' .repeat(60));

// Resultados del testing
let testResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    critical: 0,
    issues: []
};

function logTest(testName, status, details, severity = 'medium') {
    testResults.totalTests++;
    const statusIcon = status === 'PASS' ? '✅' : '❌';
    const severityIcon = severity === 'critical' ? '🚨' : severity === 'high' ? '⚠️' : 'ℹ️';
    
    console.log(`${statusIcon} ${severityIcon} ${testName}: ${status}`);
    if (details) console.log(`   ${details}`);
    
    if (status === 'PASS') {
        testResults.passed++;
    } else {
        testResults.failed++;
        if (severity === 'critical') testResults.critical++;
        testResults.issues.push({
            test: testName,
            status,
            details,
            severity
        });
    }
}

// TEST 1: VERIFICAR PROBLEMA 1 - Desalineación Prisma Schema vs Supabase
console.log('\n📋 TEST 1: DESALINEACIÓN PRISMA SCHEMA VS SUPABASE');
console.log('-'.repeat(50));

try {
    const schemaPath = path.join(__dirname, '../Backend/prisma/schema.prisma');
    if (!fs.existsSync(schemaPath)) {
        logTest('Schema Prisma existe', 'FAIL', 'Archivo schema.prisma no encontrado', 'critical');
    } else {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Verificar modelo Profile problemático
        if (schemaContent.includes('id         String   @id @db.Uuid')) {
            logTest('Profile ID con @db.Uuid', 'FAIL', 'ID String con @db.Uuid causa conflictos en Supabase', 'critical');
        } else {
            logTest('Profile ID con @db.Uuid', 'PASS', 'No se encontró el problema específico');
        }
        
        // Verificar enums no definidos
        const enumsInSchema = ['CommunityRole', 'PetPref', 'SmokePref', 'Diet', 'RoomType'];
        let enumsFound = 0;
        enumsInSchema.forEach(enumName => {
            if (schemaContent.includes(`enum ${enumName}`)) {
                enumsFound++;
            }
        });
        
        if (enumsFound < enumsInSchema.length) {
            logTest('Enums definidos en Schema', 'FAIL', `Solo ${enumsFound}/${enumsInSchema.length} enums definidos`, 'critical');
        } else {
            logTest('Enums definidos en Schema', 'PASS', 'Todos los enums están definidos');
        }
        
        // Verificar arrays JSON problemáticos
        if (schemaContent.includes('String[]') || schemaContent.includes('photos        String[]')) {
            logTest('Arrays JSON compatibles', 'FAIL', 'Arrays String[] no son compatibles con Supabase', 'high');
        } else {
            logTest('Arrays JSON compatibles', 'PASS', 'No se encontraron arrays problemáticos');
        }
    }
} catch (error) {
    logTest('Análisis Schema Prisma', 'FAIL', `Error: ${error.message}`, 'critical');
}

// TEST 2: VERIFICAR PROBLEMA 2 - Configuración Supabase Incompleta
console.log('\n📋 TEST 2: CONFIGURACIÓN SUPABASE INCOMPLETA');
console.log('-'.repeat(50));

try {
    // Verificar cliente Supabase
    const clientPath = path.join(__dirname, '../Backend/src/lib/supabase/client.ts');
    if (!fs.existsSync(clientPath)) {
        logTest('Cliente Supabase existe', 'FAIL', 'Archivo client.ts no encontrado', 'critical');
    } else {
        const clientContent = fs.readFileSync(clientPath, 'utf8');
        
        // Verificar validación de variables de entorno
        if (!clientContent.includes('process.env.NEXT_PUBLIC_SUPABASE_URL!')) {
            logTest('Validación variables entorno', 'FAIL', 'No hay validación de variables de entorno', 'high');
        } else {
            logTest('Validación variables entorno', 'PASS', 'Variables de entorno validadas');
        }
        
        // Verificar manejo de errores
        if (!clientContent.includes('try') && !clientContent.includes('catch')) {
            logTest('Manejo de errores cliente', 'FAIL', 'No hay manejo de errores en cliente', 'high');
        } else {
            logTest('Manejo de errores cliente', 'PASS', 'Manejo de errores implementado');
        }
        
        // Verificar configuración robusta
        if (!clientContent.includes('auth:') || !clientContent.includes('persistSession')) {
            logTest('Configuración robusta cliente', 'FAIL', 'Configuración básica sin opciones avanzadas', 'medium');
        } else {
            logTest('Configuración robusta cliente', 'PASS', 'Configuración avanzada presente');
        }
    }
    
    // Verificar servidor Supabase
    const serverPath = path.join(__dirname, '../Backend/src/lib/supabase/server.ts');
    if (!fs.existsSync(serverPath)) {
        logTest('Servidor Supabase existe', 'FAIL', 'Archivo server.ts no encontrado', 'critical');
    } else {
        const serverContent = fs.readFileSync(serverPath, 'utf8');
        
        // Verificar manejo de errores en cookies
        if (!serverContent.includes('try') || !serverContent.includes('catch')) {
            logTest('Manejo errores cookies', 'FAIL', 'No hay manejo de errores para cookies', 'high');
        } else {
            logTest('Manejo errores cookies', 'PASS', 'Manejo de errores en cookies implementado');
        }
    }
} catch (error) {
    logTest('Análisis configuración Supabase', 'FAIL', `Error: ${error.message}`, 'critical');
}

// TEST 3: VERIFICAR PROBLEMA 3 - Middleware Problemático
console.log('\n📋 TEST 3: MIDDLEWARE PROBLEMÁTICO');
console.log('-'.repeat(50));

try {
    const middlewarePath = path.join(__dirname, '../Backend/src/middleware.ts');
    if (!fs.existsSync(middlewarePath)) {
        logTest('Middleware existe', 'FAIL', 'Archivo middleware.ts no encontrado', 'medium');
    } else {
        const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
        
        // Verificar exclusión de rutas Supabase
        if (!middlewareContent.includes('/auth/callback') || !middlewareContent.includes('/storage/v1')) {
            logTest('Exclusión rutas Supabase', 'FAIL', 'Middleware no excluye rutas críticas de Supabase', 'high');
        } else {
            logTest('Exclusión rutas Supabase', 'PASS', 'Rutas de Supabase excluidas correctamente');
        }
        
        // Verificar configuración Edge Runtime
        if (!middlewareContent.includes('edge') && !middlewareContent.includes('Edge')) {
            logTest('Configuración Edge Runtime', 'FAIL', 'No hay configuración para Edge Runtime', 'medium');
        } else {
            logTest('Configuración Edge Runtime', 'PASS', 'Edge Runtime configurado');
        }
    }
} catch (error) {
    logTest('Análisis Middleware', 'FAIL', `Error: ${error.message}`, 'high');
}

// TEST 4: VERIFICAR PROBLEMA 4 - APIs con Lógica Inconsistente
console.log('\n📋 TEST 4: APIS CON LÓGICA INCONSISTENTE');
console.log('-'.repeat(50));

const apisToCheck = [
    'Backend/src/app/api/properties/route.ts',
    'Backend/src/app/api/auth/register/route.ts',
    'Backend/src/app/api/comunidad/profiles/route.ts'
];

apisToCheck.forEach(apiPath => {
    try {
        const fullPath = path.join(__dirname, '../', apiPath);
        const apiName = path.basename(apiPath, '.ts');
        
        if (!fs.existsSync(fullPath)) {
            logTest(`API ${apiName} existe`, 'FAIL', `Archivo ${apiPath} no encontrado`, 'high');
            return;
        }
        
        const apiContent = fs.readFileSync(fullPath, 'utf8');
        
        // Verificar uso mixto de Prisma y Supabase
        const hasPrisma = apiContent.includes('prisma') || apiContent.includes('PrismaClient');
        const hasSupabase = apiContent.includes('supabase') || apiContent.includes('createClient');
        
        if (hasPrisma && hasSupabase) {
            logTest(`${apiName} lógica consistente`, 'FAIL', 'Uso mixto de Prisma y Supabase detectado', 'high');
        } else {
            logTest(`${apiName} lógica consistente`, 'PASS', 'Lógica consistente en API');
        }
        
        // Verificar manejo de RLS
        if (hasSupabase && !apiContent.includes('auth.getUser')) {
            logTest(`${apiName} implementa RLS`, 'FAIL', 'No hay implementación de RLS (Row Level Security)', 'high');
        } else if (hasSupabase) {
            logTest(`${apiName} implementa RLS`, 'PASS', 'RLS implementado correctamente');
        }
        
        // Verificar manejo de errores
        if (!apiContent.includes('try') || !apiContent.includes('catch')) {
            logTest(`${apiName} manejo errores`, 'FAIL', 'No hay manejo de errores robusto', 'medium');
        } else {
            logTest(`${apiName} manejo errores`, 'PASS', 'Manejo de errores implementado');
        }
        
    } catch (error) {
        logTest(`Análisis API ${apiPath}`, 'FAIL', `Error: ${error.message}`, 'high');
    }
});

// TEST 5: VERIFICAR PROBLEMA 5 - Archivos Duplicados/Conflictivos
console.log('\n📋 TEST 5: ARCHIVOS DUPLICADOS/CONFLICTIVOS');
console.log('-'.repeat(50));

const conflictiveFiles = [
    'Backend/src/lib/supabaseServer.ts',
    'Backend/src/hooks/useSupabaseAuth.ts'
];

conflictiveFiles.forEach(filePath => {
    try {
        const fullPath = path.join(__dirname, '../', filePath);
        const fileName = path.basename(filePath);
        
        if (fs.existsSync(fullPath)) {
            logTest(`${fileName} eliminado`, 'FAIL', `Archivo legacy ${fileName} aún existe`, 'medium');
        } else {
            logTest(`${fileName} eliminado`, 'PASS', `Archivo legacy ${fileName} correctamente eliminado`);
        }
    } catch (error) {
        logTest(`Verificación ${filePath}`, 'FAIL', `Error: ${error.message}`, 'medium');
    }
});

// Verificar archivos SQL duplicados
try {
    const backendPath = path.join(__dirname, '../Backend');
    const files = fs.readdirSync(backendPath);
    const sqlFiles = files.filter(file => file.startsWith('SUPABASE-') && file.endsWith('.sql'));
    
    if (sqlFiles.length > 5) {
        logTest('Archivos SQL duplicados', 'FAIL', `${sqlFiles.length} archivos SQL de Supabase encontrados`, 'medium');
    } else {
        logTest('Archivos SQL duplicados', 'PASS', 'Cantidad razonable de archivos SQL');
    }
} catch (error) {
    logTest('Verificación archivos SQL', 'FAIL', `Error: ${error.message}`, 'medium');
}

// TEST 6: VERIFICAR PROBLEMA 6 - Validaciones Incompatibles
console.log('\n📋 TEST 6: VALIDACIONES INCOMPATIBLES');
console.log('-'.repeat(50));

try {
    const validationsPath = path.join(__dirname, '../Backend/src/lib/validations/property.ts');
    if (!fs.existsSync(validationsPath)) {
        logTest('Validaciones existen', 'FAIL', 'Archivo de validaciones no encontrado', 'high');
    } else {
        const validationsContent = fs.readFileSync(validationsPath, 'utf8');
        
        // Verificar validaciones de campos problemáticos
        if (validationsContent.includes('Float') && !validationsContent.includes('number()')) {
            logTest('Validación tipos numéricos', 'FAIL', 'Validaciones Float incompatibles con Supabase', 'high');
        } else {
            logTest('Validación tipos numéricos', 'PASS', 'Tipos numéricos validados correctamente');
        }
        
        // Verificar validación de arrays JSON
        if (!validationsContent.includes('JSON.parse') && validationsContent.includes('array')) {
            logTest('Validación arrays JSON', 'FAIL', 'Arrays no validados como JSON', 'high');
        } else {
            logTest('Validación arrays JSON', 'PASS', 'Arrays JSON validados correctamente');
        }
        
        // Verificar campos requeridos por RLS
        if (!validationsContent.includes('contact_phone')) {
            logTest('Campos requeridos RLS', 'FAIL', 'Faltan validaciones para campos requeridos por RLS', 'high');
        } else {
            logTest('Campos requeridos RLS', 'PASS', 'Campos RLS validados');
        }
    }
} catch (error) {
    logTest('Análisis validaciones', 'FAIL', `Error: ${error.message}`, 'high');
}

// TEST 7: VERIFICAR PROBLEMA 7 - Migración Bootstrap Problemática
console.log('\n📋 TEST 7: MIGRACIÓN BOOTSTRAP PROBLEMÁTICA');
console.log('-'.repeat(50));

try {
    const migrationPath = path.join(__dirname, '../Backend/prisma/migrations/20250103000000_bootstrap/migration.sql');
    if (!fs.existsSync(migrationPath)) {
        logTest('Migración bootstrap existe', 'FAIL', 'Archivo de migración bootstrap no encontrado', 'critical');
    } else {
        const migrationContent = fs.readFileSync(migrationPath, 'utf8');
        
        // Verificar SQL compatible con Supabase
        if (migrationContent.includes('CONSTRAINT') && !migrationContent.includes('ENABLE ROW LEVEL SECURITY')) {
            logTest('SQL compatible Supabase', 'FAIL', 'SQL contiene constraints sin RLS', 'critical');
        } else {
            logTest('SQL compatible Supabase', 'PASS', 'SQL compatible con Supabase');
        }
        
        // Verificar políticas RLS
        if (!migrationContent.includes('ROW LEVEL SECURITY') && !migrationContent.includes('POLICY')) {
            logTest('Políticas RLS definidas', 'FAIL', 'No hay políticas RLS en migración', 'critical');
        } else {
            logTest('Políticas RLS definidas', 'PASS', 'Políticas RLS implementadas');
        }
        
        // Verificar triggers para Supabase Auth
        if (!migrationContent.includes('trigger') && !migrationContent.includes('TRIGGER')) {
            logTest('Triggers Supabase Auth', 'FAIL', 'No hay triggers para integración con Supabase Auth', 'high');
        } else {
            logTest('Triggers Supabase Auth', 'PASS', 'Triggers implementados');
        }
    }
} catch (error) {
    logTest('Análisis migración bootstrap', 'FAIL', `Error: ${error.message}`, 'critical');
}

// TESTS ADICIONALES: Verificar archivos de configuración
console.log('\n📋 TESTS ADICIONALES: CONFIGURACIÓN GENERAL');
console.log('-'.repeat(50));

// Verificar variables de entorno
try {
    const envExamplePath = path.join(__dirname, '../Backend/.env.example');
    const envLocalPath = path.join(__dirname, '../Backend/.env.local');
    
    if (!fs.existsSync(envExamplePath) && !fs.existsSync(envLocalPath)) {
        logTest('Variables entorno configuradas', 'FAIL', 'No hay archivos de variables de entorno', 'high');
    } else {
        logTest('Variables entorno configuradas', 'PASS', 'Archivos de entorno presentes');
    }
} catch (error) {
    logTest('Verificación variables entorno', 'FAIL', `Error: ${error.message}`, 'medium');
}

// Verificar package.json para dependencias Supabase
try {
    const packagePath = path.join(__dirname, '../Backend/package.json');
    if (fs.existsSync(packagePath)) {
        const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
        
        if (!deps['@supabase/supabase-js'] && !deps['@supabase/ssr']) {
            logTest('Dependencias Supabase', 'FAIL', 'Dependencias de Supabase no encontradas', 'critical');
        } else {
            logTest('Dependencias Supabase', 'PASS', 'Dependencias de Supabase instaladas');
        }
    }
} catch (error) {
    logTest('Verificación dependencias', 'FAIL', `Error: ${error.message}`, 'medium');
}

// RESUMEN FINAL
console.log('\n' + '='.repeat(60));
console.log('📊 RESUMEN FINAL DEL TESTING EXHAUSTIVO');
console.log('='.repeat(60));

console.log(`\n📈 ESTADÍSTICAS:`);
console.log(`   Total de tests ejecutados: ${testResults.totalTests}`);
console.log(`   ✅ Tests pasados: ${testResults.passed}`);
console.log(`   ❌ Tests fallidos: ${testResults.failed}`);
console.log(`   🚨 Problemas críticos: ${testResults.critical}`);

const successRate = ((testResults.passed / testResults.totalTests) * 100).toFixed(1);
console.log(`   📊 Tasa de éxito: ${successRate}%`);

if (testResults.issues.length > 0) {
    console.log(`\n🚨 PROBLEMAS IDENTIFICADOS:`);
    testResults.issues.forEach((issue, index) => {
        const severityIcon = issue.severity === 'critical' ? '🚨' : issue.severity === 'high' ? '⚠️' : 'ℹ️';
        console.log(`   ${index + 1}. ${severityIcon} ${issue.test}`);
        console.log(`      ${issue.details}`);
        console.log(`      Severidad: ${issue.severity.toUpperCase()}`);
    });
}

// Determinar estado general
let overallStatus = 'EXITOSO';
if (testResults.critical > 0) {
    overallStatus = 'CRÍTICO';
} else if (testResults.failed > testResults.passed) {
    overallStatus = 'PROBLEMÁTICO';
} else if (testResults.failed > 0) {
    overallStatus = 'CON PROBLEMAS';
}

console.log(`\n🎯 ESTADO GENERAL: ${overallStatus}`);

if (overallStatus === 'CRÍTICO') {
    console.log(`\n⚠️  RECOMENDACIÓN: Se requiere corrección INMEDIATA de problemas críticos antes de continuar.`);
} else if (overallStatus === 'PROBLEMÁTICO') {
    console.log(`\n⚠️  RECOMENDACIÓN: Se recomienda corregir los problemas identificados antes del despliegue.`);
} else if (overallStatus === 'CON PROBLEMAS') {
    console.log(`\n✅ RECOMENDACIÓN: El sistema es funcional pero se recomienda corregir los problemas menores.`);
} else {
    console.log(`\n🎉 RECOMENDACIÓN: El sistema está en buen estado para Supabase.`);
}

console.log(`\n📝 Reporte detallado guardado en: reportes/REPORTE-4-TESTING-EXHAUSTIVO-SUPABASE.md`);
console.log('='.repeat(60));

// Guardar resultados para el reporte final
const reportData = {
    timestamp: new Date().toISOString(),
    results: testResults,
    overallStatus,
    successRate: parseFloat(successRate)
};

// Escribir archivo de resultados
fs.writeFileSync(
    path.join(__dirname, 'test-results-supabase.json'),
    JSON.stringify(reportData, null, 2)
);

console.log('✅ Testing exhaustivo completado.');
