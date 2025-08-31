const fs = require('fs');
const path = require('path');

console.log('============================================================');
console.log('🧪 TESTING DE LIMPIEZA DE VARIABLES DE ENTORNO');
console.log('============================================================');
console.log();

// Función para leer archivo .env
function readEnvFile(filePath) {
    try {
        if (fs.existsSync(filePath)) {
            return fs.readFileSync(filePath, 'utf8');
        }
        return null;
    } catch (error) {
        console.log(`❌ Error leyendo ${filePath}: ${error.message}`);
        return null;
    }
}

// Función para verificar variables
function checkVariables(content, fileName) {
    if (!content) {
        console.log(`⚠️ ${fileName} no encontrado`);
        return { found: [], missing: [] };
    }

    const lines = content.split('\n');
    const variables = {};
    
    lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
            const [key] = trimmed.split('=');
            if (key) {
                variables[key.trim()] = true;
            }
        }
    });

    // Variables que NO deben estar (eliminadas)
    const shouldNotExist = [
        'NEXTAUTH_SECRET',
        'NEXTAUTH_URL', 
        'MP_WEBHOOK_SECRET',
        'API_BASE_URL'
    ];

    // Variables que SÍ deben estar (críticas)
    const shouldExist = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'NEXT_PUBLIC_SUPABASE_ANON_KEY',
        'SUPABASE_SERVICE_ROLE_KEY',
        'DATABASE_URL',
        'DIRECT_URL',
        'JWT_SECRET',
        'NEXT_PUBLIC_BASE_URL',
        'NODE_ENV',
        'MERCADOPAGO_ACCESS_TOKEN',
        'MERCADOPAGO_PUBLIC_KEY',
        'MERCADOPAGO_CLIENT_ID',
        'MERCADOPAGO_CLIENT_SECRET',
        'SMTP_HOST',
        'SMTP_PORT',
        'SMTP_USER',
        'SMTP_PASS'
    ];

    const found = [];
    const missing = [];
    const shouldNotExistButFound = [];

    // Verificar variables que NO deben existir
    shouldNotExist.forEach(varName => {
        if (variables[varName]) {
            shouldNotExistButFound.push(varName);
        }
    });

    // Verificar variables que SÍ deben existir
    shouldExist.forEach(varName => {
        if (variables[varName]) {
            found.push(varName);
        } else {
            missing.push(varName);
        }
    });

    return { found, missing, shouldNotExistButFound, totalVars: Object.keys(variables).length };
}

// Rutas de archivos .env
const envFiles = [
    { path: 'Backend/.env', name: '.env' },
    { path: 'Backend/.env.local', name: '.env.local' },
    { path: 'Backend/.env.production', name: '.env.production' },
    { path: 'Backend/.env.template', name: '.env.template' }
];

let totalTests = 0;
let passedTests = 0;
let totalVariablesFound = 0;
let totalVariablesMissing = 0;
let totalVariablesShouldNotExist = 0;

console.log('🔍 Verificando archivos .env...');
console.log();

envFiles.forEach(({ path: filePath, name }) => {
    console.log(`📄 Analizando ${name}:`);
    
    const content = readEnvFile(filePath);
    const result = checkVariables(content, name);
    
    if (content) {
        console.log(`   📊 Total de variables: ${result.totalVars}`);
        
        // Variables críticas encontradas
        if (result.found.length > 0) {
            console.log(`   ✅ Variables críticas encontradas (${result.found.length}):`);
            result.found.forEach(varName => {
                console.log(`      ✅ ${varName}`);
            });
            totalVariablesFound += result.found.length;
        }
        
        // Variables críticas faltantes
        if (result.missing.length > 0) {
            console.log(`   ❌ Variables críticas faltantes (${result.missing.length}):`);
            result.missing.forEach(varName => {
                console.log(`      ❌ ${varName}`);
            });
            totalVariablesMissing += result.missing.length;
        }
        
        // Variables que no deberían existir pero están
        if (result.shouldNotExistButFound.length > 0) {
            console.log(`   🗑️ Variables innecesarias encontradas (${result.shouldNotExistButFound.length}):`);
            result.shouldNotExistButFound.forEach(varName => {
                console.log(`      🗑️ ${varName} - DEBE SER ELIMINADA`);
            });
            totalVariablesShouldNotExist += result.shouldNotExistButFound.length;
        } else {
            console.log(`   ✅ No se encontraron variables innecesarias`);
            passedTests++;
        }
        
        totalTests++;
    }
    
    console.log();
});

// Verificar que el proyecto compile
console.log('🔧 Verificando compilación del proyecto...');
const { execSync } = require('child_process');

try {
    process.chdir('Backend');
    console.log('   📦 Ejecutando npm run build...');
    
    const buildOutput = execSync('npm run build', { 
        encoding: 'utf8', 
        stdio: 'pipe',
        timeout: 120000 // 2 minutos timeout
    });
    
    console.log('   ✅ Compilación exitosa');
    passedTests++;
    totalTests++;
    
} catch (error) {
    console.log('   ❌ Error en compilación:');
    console.log(`   ${error.message}`);
    totalTests++;
} finally {
    process.chdir('..');
}

console.log();
console.log('============================================================');
console.log('📊 RESULTADOS DEL TESTING');
console.log('============================================================');
console.log();

console.log(`🧪 Tests ejecutados: ${totalTests}`);
console.log(`✅ Tests exitosos: ${passedTests}`);
console.log(`❌ Tests fallidos: ${totalTests - passedTests}`);
console.log();

console.log(`📈 Estadísticas de variables:`);
console.log(`   ✅ Variables críticas encontradas: ${totalVariablesFound}`);
console.log(`   ❌ Variables críticas faltantes: ${totalVariablesMissing}`);
console.log(`   🗑️ Variables innecesarias encontradas: ${totalVariablesShouldNotExist}`);
console.log();

// Evaluación final
const successRate = (passedTests / totalTests) * 100;

if (successRate === 100 && totalVariablesShouldNotExist === 0) {
    console.log('🎉 LIMPIEZA EXITOSA - TODAS LAS PRUEBAS PASARON');
    console.log('✅ Variables innecesarias eliminadas correctamente');
    console.log('✅ Variables críticas presentes');
    console.log('✅ Proyecto compila correctamente');
} else if (successRate >= 80) {
    console.log('⚠️ LIMPIEZA PARCIAL - ALGUNAS MEJORAS NECESARIAS');
    if (totalVariablesShouldNotExist > 0) {
        console.log(`🗑️ ${totalVariablesShouldNotExist} variables innecesarias aún presentes`);
    }
    if (totalVariablesMissing > 0) {
        console.log(`❌ ${totalVariablesMissing} variables críticas faltantes`);
    }
} else {
    console.log('❌ LIMPIEZA FALLIDA - PROBLEMAS CRÍTICOS DETECTADOS');
    console.log('🔧 Revisar configuración de variables de entorno');
}

console.log();
console.log(`📊 Tasa de éxito: ${successRate.toFixed(1)}%`);
console.log();

// Recomendaciones
if (totalVariablesShouldNotExist > 0) {
    console.log('🔧 RECOMENDACIONES:');
    console.log('1. Ejecutar LIMPIAR-VARIABLES-ENTORNO-AUTOMATICO.bat');
    console.log('2. Verificar manualmente los archivos .env');
    console.log('3. Eliminar variables innecesarias identificadas');
    console.log();
}

if (totalVariablesMissing > 0) {
    console.log('⚠️ VARIABLES CRÍTICAS FALTANTES:');
    console.log('1. Revisar REPORTE-AUDITORIA-VARIABLES-ENTORNO-FINAL.md');
    console.log('2. Configurar variables críticas faltantes');
    console.log('3. Verificar configuración de Supabase y base de datos');
    console.log();
}

console.log('📖 Para más detalles, consultar:');
console.log('   - REPORTE-AUDITORIA-VARIABLES-ENTORNO-FINAL.md');
console.log('   - LIMPIAR-VARIABLES-ENTORNO-AUTOMATICO.bat');
console.log();

console.log('============================================================');
console.log('✨ Testing completado');
console.log('============================================================');

// Exit code para CI/CD
process.exit(successRate === 100 && totalVariablesShouldNotExist === 0 ? 0 : 1);
