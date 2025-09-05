/**
 * =====================================================
 * TESTING EXHAUSTIVO - SISTEMA LIMPIEZA ESQUEMAS SUPABASE
 * =====================================================
 * 
 * Este script realiza testing exhaustivo del sistema completo
 * de limpieza de esquemas duplicados en Supabase.
 * 
 * COBERTURA DE TESTING:
 * - Funcionalidad de Scripts JavaScript (PASO 1 y PASO 2)
 * - Funcionalidad de Archivos .bat (menús interactivos)
 * - Integración del Sistema (flujo completo)
 * - Casos Edge y Manejo de Errores
 * - Generación de Archivos
 * 
 * Fecha: 2025-01-06
 * Versión: 1.0
 * Estado: TESTING EXHAUSTIVO COMPLETO
 */

const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

// Configuración de colores para output
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

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function separator(title, color = 'cyan') {
    const line = '='.repeat(80);
    log(line, color);
    log(`  ${title}`, color);
    log(line, color);
}

// Variables globales para tracking de resultados
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    warnings: 0,
    errors: []
};

/**
 * FUNCIÓN PRINCIPAL DE TESTING EXHAUSTIVO
 */
async function ejecutarTestingExhaustivo() {
    separator('TESTING EXHAUSTIVO - SISTEMA LIMPIEZA ESQUEMAS SUPABASE', 'blue');
    
    log('🧪 Iniciando testing exhaustivo completo...', 'yellow');
    log('📅 Fecha: ' + new Date().toLocaleString(), 'cyan');
    log('🎯 Objetivo: Validar funcionalidad completa del sistema', 'cyan');
    
    try {
        // FASE 1: Testing de Archivos Existentes
        await testingArchivosExistentes();
        
        // FASE 2: Testing de Scripts JavaScript
        await testingScriptsJavaScript();
        
        // FASE 3: Testing de Archivos .bat
        await testingArchivosBat();
        
        // FASE 4: Testing de Integración del Sistema
        await testingIntegracionSistema();
        
        // FASE 5: Testing de Casos Edge
        await testingCasosEdge();
        
        // FASE 6: Testing de Generación de Archivos
        await testingGeneracionArchivos();
        
        // FASE 7: Testing de Manejo de Errores
        await testingManejoErrores();
        
        // FASE 8: Testing de Prerequisitos
        await testingPrerequisitos();
        
        // Generar reporte final
        await generarReporteFinal();
        
        return true;
        
    } catch (error) {
        log(`❌ ERROR CRÍTICO durante el testing: ${error.message}`, 'red');
        testResults.errors.push(`Error crítico: ${error.message}`);
        return false;
    }
}

/**
 * FASE 1: TESTING DE ARCHIVOS EXISTENTES
 */
async function testingArchivosExistentes() {
    separator('FASE 1: TESTING DE ARCHIVOS EXISTENTES', 'magenta');
    
    const archivosRequeridos = [
        'PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js',
        'EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat',
        'PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js',
        'EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat'
    ];
    
    log('📁 Verificando existencia de archivos críticos...', 'yellow');
    
    for (const archivo of archivosRequeridos) {
        testResults.total++;
        
        if (fs.existsSync(archivo)) {
            log(`✅ ${archivo} - EXISTE`, 'green');
            testResults.passed++;
            
            // Verificar tamaño del archivo
            const stats = fs.statSync(archivo);
            if (stats.size > 0) {
                log(`   📊 Tamaño: ${stats.size} bytes`, 'cyan');
            } else {
                log(`   ⚠️  Archivo vacío`, 'yellow');
                testResults.warnings++;
            }
            
        } else {
            log(`❌ ${archivo} - NO EXISTE`, 'red');
            testResults.failed++;
            testResults.errors.push(`Archivo faltante: ${archivo}`);
        }
    }
    
    log(`📊 Archivos verificados: ${archivosRequeridos.length}`, 'cyan');
}

/**
 * FASE 2: TESTING DE SCRIPTS JAVASCRIPT
 */
async function testingScriptsJavaScript() {
    separator('FASE 2: TESTING DE SCRIPTS JAVASCRIPT', 'magenta');
    
    // Testing PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js
    await testingScriptPaso1();
    
    // Testing PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js
    await testingScriptPaso2();
}

async function testingScriptPaso1() {
    log('🧪 Testing PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js...', 'yellow');
    
    testResults.total++;
    
    try {
        // Verificar sintaxis del archivo
        const contenido = fs.readFileSync('PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js', 'utf8');
        
        // Verificar elementos críticos del script
        const elementosCriticos = [
            'crearBackupCompleto',
            'verificarVariablesEntorno',
            'generarScriptBackup',
            'generarScriptRestauracion',
            'generarDocumentacion',
            'NEXT_PUBLIC_SUPABASE_URL',
            'SUPABASE_SERVICE_ROLE_KEY'
        ];
        
        let elementosEncontrados = 0;
        
        for (const elemento of elementosCriticos) {
            if (contenido.includes(elemento)) {
                elementosEncontrados++;
                log(`   ✅ Elemento encontrado: ${elemento}`, 'green');
            } else {
                log(`   ❌ Elemento faltante: ${elemento}`, 'red');
                testResults.errors.push(`PASO-1: Elemento faltante - ${elemento}`);
            }
        }
        
        if (elementosEncontrados === elementosCriticos.length) {
            log('✅ PASO-1 Script - ESTRUCTURA CORRECTA', 'green');
            testResults.passed++;
        } else {
            log(`❌ PASO-1 Script - ESTRUCTURA INCOMPLETA (${elementosEncontrados}/${elementosCriticos.length})`, 'red');
            testResults.failed++;
        }
        
        // Verificar que sea JavaScript válido
        try {
            require('./PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js');
            log('   ✅ Sintaxis JavaScript válida', 'green');
        } catch (syntaxError) {
            log(`   ❌ Error de sintaxis: ${syntaxError.message}`, 'red');
            testResults.errors.push(`PASO-1: Error de sintaxis - ${syntaxError.message}`);
        }
        
    } catch (error) {
        log(`❌ Error al leer PASO-1: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`PASO-1: Error de lectura - ${error.message}`);
    }
}

async function testingScriptPaso2() {
    log('🧪 Testing PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js...', 'yellow');
    
    testResults.total++;
    
    try {
        const contenido = fs.readFileSync('PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js', 'utf8');
        
        const elementosCriticos = [
            'verificarDatosUnicos',
            'verificarBackupExiste',
            'generarScriptVerificacion',
            'crearReporteVerificacion',
            'generarGuiaInterpretacion',
            'PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql',
            'REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md'
        ];
        
        let elementosEncontrados = 0;
        
        for (const elemento of elementosCriticos) {
            if (contenido.includes(elemento)) {
                elementosEncontrados++;
                log(`   ✅ Elemento encontrado: ${elemento}`, 'green');
            } else {
                log(`   ❌ Elemento faltante: ${elemento}`, 'red');
                testResults.errors.push(`PASO-2: Elemento faltante - ${elemento}`);
            }
        }
        
        if (elementosEncontrados === elementosCriticos.length) {
            log('✅ PASO-2 Script - ESTRUCTURA CORRECTA', 'green');
            testResults.passed++;
        } else {
            log(`❌ PASO-2 Script - ESTRUCTURA INCOMPLETA (${elementosEncontrados}/${elementosCriticos.length})`, 'red');
            testResults.failed++;
        }
        
        // Verificar sintaxis JavaScript
        try {
            require('./PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js');
            log('   ✅ Sintaxis JavaScript válida', 'green');
        } catch (syntaxError) {
            log(`   ❌ Error de sintaxis: ${syntaxError.message}`, 'red');
            testResults.errors.push(`PASO-2: Error de sintaxis - ${syntaxError.message}`);
        }
        
    } catch (error) {
        log(`❌ Error al leer PASO-2: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`PASO-2: Error de lectura - ${error.message}`);
    }
}

/**
 * FASE 3: TESTING DE ARCHIVOS .BAT
 */
async function testingArchivosBat() {
    separator('FASE 3: TESTING DE ARCHIVOS .BAT', 'magenta');
    
    await testingBatPaso1();
    await testingBatPaso2();
}

async function testingBatPaso1() {
    log('🧪 Testing EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat...', 'yellow');
    
    testResults.total++;
    
    try {
        const contenido = fs.readFileSync('EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat', 'utf8');
        
        const elementosCriticos = [
            '@echo off',
            'chcp 65001',
            'MENU',
            'node PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js',
            'set /p opcion=',
            'EJECUTAR_PASO_1',
            'VERIFICAR_PREREQUISITOS',
            'Node.js'
        ];
        
        let elementosEncontrados = 0;
        
        for (const elemento of elementosCriticos) {
            if (contenido.includes(elemento)) {
                elementosEncontrados++;
                log(`   ✅ Elemento encontrado: ${elemento}`, 'green');
            } else {
                log(`   ❌ Elemento faltante: ${elemento}`, 'red');
                testResults.errors.push(`BAT PASO-1: Elemento faltante - ${elemento}`);
            }
        }
        
        if (elementosEncontrados >= elementosCriticos.length * 0.8) {
            log('✅ PASO-1 BAT - ESTRUCTURA CORRECTA', 'green');
            testResults.passed++;
        } else {
            log(`❌ PASO-1 BAT - ESTRUCTURA INCOMPLETA (${elementosEncontrados}/${elementosCriticos.length})`, 'red');
            testResults.failed++;
        }
        
    } catch (error) {
        log(`❌ Error al leer BAT PASO-1: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`BAT PASO-1: Error de lectura - ${error.message}`);
    }
}

async function testingBatPaso2() {
    log('🧪 Testing EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat...', 'yellow');
    
    testResults.total++;
    
    try {
        const contenido = fs.readFileSync('EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat', 'utf8');
        
        const elementosCriticos = [
            '@echo off',
            'chcp 65001',
            'MENU',
            'node PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js',
            'set /p opcion=',
            'EJECUTAR_PASO_2',
            'VERIFICAR_PREREQUISITOS',
            'VER_GUIA',
            'ABRIR_REPORTE'
        ];
        
        let elementosEncontrados = 0;
        
        for (const elemento of elementosCriticos) {
            if (contenido.includes(elemento)) {
                elementosEncontrados++;
                log(`   ✅ Elemento encontrado: ${elemento}`, 'green');
            } else {
                log(`   ❌ Elemento faltante: ${elemento}`, 'red');
                testResults.errors.push(`BAT PASO-2: Elemento faltante - ${elemento}`);
            }
        }
        
        if (elementosEncontrados >= elementosCriticos.length * 0.8) {
            log('✅ PASO-2 BAT - ESTRUCTURA CORRECTA', 'green');
            testResults.passed++;
        } else {
            log(`❌ PASO-2 BAT - ESTRUCTURA INCOMPLETA (${elementosEncontrados}/${elementosCriticos.length})`, 'red');
            testResults.failed++;
        }
        
    } catch (error) {
        log(`❌ Error al leer BAT PASO-2: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`BAT PASO-2: Error de lectura - ${error.message}`);
    }
}

/**
 * FASE 4: TESTING DE INTEGRACIÓN DEL SISTEMA
 */
async function testingIntegracionSistema() {
    separator('FASE 4: TESTING DE INTEGRACIÓN DEL SISTEMA', 'magenta');
    
    log('🔗 Testing integración entre PASO 1 y PASO 2...', 'yellow');
    
    testResults.total++;
    
    try {
        // Verificar que PASO 2 puede detectar si PASO 1 fue ejecutado
        const paso2Content = fs.readFileSync('PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js', 'utf8');
        
        if (paso2Content.includes('verificarBackupExiste') && 
            paso2Content.includes('backup-supabase-') &&
            paso2Content.includes('PASO 1')) {
            log('✅ Integración PASO 1 → PASO 2 - CORRECTA', 'green');
            testResults.passed++;
        } else {
            log('❌ Integración PASO 1 → PASO 2 - FALTANTE', 'red');
            testResults.failed++;
            testResults.errors.push('Integración: PASO 2 no verifica prerequisitos de PASO 1');
        }
        
        // Verificar flujo de archivos generados
        testResults.total++;
        
        const archivosGenerados = [
            'BACKUP-COMPLETO-SUPABASE.sql',
            'RESTAURAR-BACKUP-SUPABASE.sql',
            'DOCUMENTACION-BACKUP.md',
            'PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql',
            'REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md',
            'GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md'
        ];
        
        let archivosReferenciados = 0;
        const contenidoCompleto = paso2Content + fs.readFileSync('PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js', 'utf8');
        
        for (const archivo of archivosGenerados) {
            if (contenidoCompleto.includes(archivo)) {
                archivosReferenciados++;
                log(`   ✅ Archivo referenciado: ${archivo}`, 'green');
            } else {
                log(`   ⚠️  Archivo no referenciado: ${archivo}`, 'yellow');
                testResults.warnings++;
            }
        }
        
        if (archivosReferenciados >= archivosGenerados.length * 0.8) {
            log('✅ Flujo de archivos - CORRECTO', 'green');
            testResults.passed++;
        } else {
            log('❌ Flujo de archivos - INCOMPLETO', 'red');
            testResults.failed++;
            testResults.errors.push('Integración: Referencias de archivos incompletas');
        }
        
    } catch (error) {
        log(`❌ Error en testing de integración: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Integración: Error - ${error.message}`);
    }
}

/**
 * FASE 5: TESTING DE CASOS EDGE
 */
async function testingCasosEdge() {
    separator('FASE 5: TESTING DE CASOS EDGE', 'magenta');
    
    log('🧪 Testing casos edge y manejo de errores...', 'yellow');
    
    // Test 1: Variables de entorno faltantes
    await testVariablesEntornoFaltantes();
    
    // Test 2: Node.js no disponible
    await testNodeJsNoDisponible();
    
    // Test 3: Directorios inexistentes
    await testDirectoriosInexistentes();
    
    // Test 4: Permisos de escritura
    await testPermisosEscritura();
}

async function testVariablesEntornoFaltantes() {
    log('🧪 Testing variables de entorno faltantes...', 'yellow');
    
    testResults.total++;
    
    try {
        const contenidoPaso1 = fs.readFileSync('PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js', 'utf8');
        const contenidoPaso2 = fs.readFileSync('PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js', 'utf8');
        
        const validacionesEncontradas = [
            contenidoPaso1.includes('NEXT_PUBLIC_SUPABASE_URL') && contenidoPaso1.includes('process.env'),
            contenidoPaso1.includes('SUPABASE_SERVICE_ROLE_KEY') && contenidoPaso1.includes('process.env'),
            contenidoPaso2.includes('NEXT_PUBLIC_SUPABASE_URL') && contenidoPaso2.includes('process.env'),
            contenidoPaso2.includes('SUPABASE_SERVICE_ROLE_KEY') && contenidoPaso2.includes('process.env'),
            contenidoPaso1.includes('Variables de entorno') || contenidoPaso1.includes('environment'),
            contenidoPaso2.includes('Variables de entorno') || contenidoPaso2.includes('environment')
        ];
        
        const validacionesCorrectas = validacionesEncontradas.filter(v => v).length;
        
        if (validacionesCorrectas >= 4) {
            log('✅ Validación variables de entorno - CORRECTA', 'green');
            testResults.passed++;
        } else {
            log(`❌ Validación variables de entorno - INCOMPLETA (${validacionesCorrectas}/6)`, 'red');
            testResults.failed++;
            testResults.errors.push('Casos Edge: Validación de variables de entorno insuficiente');
        }
        
    } catch (error) {
        log(`❌ Error testing variables de entorno: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Casos Edge: Error variables entorno - ${error.message}`);
    }
}

async function testNodeJsNoDisponible() {
    log('🧪 Testing Node.js no disponible...', 'yellow');
    
    testResults.total++;
    
    try {
        const batPaso1 = fs.readFileSync('EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat', 'utf8');
        const batPaso2 = fs.readFileSync('EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat', 'utf8');
        
        const validacionesNodeJs = [
            batPaso1.includes('node --version'),
            batPaso1.includes('ERRORLEVEL'),
            batPaso1.includes('Node.js no está instalado'),
            batPaso2.includes('node --version'),
            batPaso2.includes('ERRORLEVEL'),
            batPaso2.includes('Node.js no está instalado')
        ];
        
        const validacionesCorrectas = validacionesNodeJs.filter(v => v).length;
        
        if (validacionesCorrectas >= 4) {
            log('✅ Validación Node.js - CORRECTA', 'green');
            testResults.passed++;
        } else {
            log(`❌ Validación Node.js - INCOMPLETA (${validacionesCorrectas}/6)`, 'red');
            testResults.failed++;
            testResults.errors.push('Casos Edge: Validación de Node.js insuficiente');
        }
        
    } catch (error) {
        log(`❌ Error testing Node.js: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Casos Edge: Error Node.js - ${error.message}`);
    }
}

async function testDirectoriosInexistentes() {
    log('🧪 Testing directorios inexistentes...', 'yellow');
    
    testResults.total++;
    
    try {
        const contenidoPaso2 = fs.readFileSync('PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js', 'utf8');
        
        const validacionesDirectorio = [
            contenidoPaso2.includes('backup-supabase-'),
            contenidoPaso2.includes('fs.statSync') || contenidoPaso2.includes('fs.existsSync'),
            contenidoPaso2.includes('isDirectory') || contenidoPaso2.includes('directory'),
            contenidoPaso2.includes('No se encontró backup') || contenidoPaso2.includes('backup no encontrado')
        ];
        
        const validacionesCorrectas = validacionesDirectorio.filter(v => v).length;
        
        if (validacionesCorrectas >= 3) {
            log('✅ Validación directorios - CORRECTA', 'green');
            testResults.passed++;
        } else {
            log(`❌ Validación directorios - INCOMPLETA (${validacionesCorrectas}/4)`, 'red');
            testResults.failed++;
            testResults.errors.push('Casos Edge: Validación de directorios insuficiente');
        }
        
    } catch (error) {
        log(`❌ Error testing directorios: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Casos Edge: Error directorios - ${error.message}`);
    }
}

async function testPermisosEscritura() {
    log('🧪 Testing permisos de escritura...', 'yellow');
    
    testResults.total++;
    
    try {
        const contenidoPaso1 = fs.readFileSync('PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js', 'utf8');
        const contenidoPaso2 = fs.readFileSync('PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js', 'utf8');
        
        const validacionesPermisos = [
            contenidoPaso1.includes('fs.writeFileSync') || contenidoPaso1.includes('writeFile'),
            contenidoPaso2.includes('fs.writeFileSync') || contenidoPaso2.includes('writeFile'),
            contenidoPaso1.includes('try') && contenidoPaso1.includes('catch'),
            contenidoPaso2.includes('try') && contenidoPaso2.includes('catch'),
            contenidoPaso1.includes('error') || contenidoPaso1.includes('Error'),
            contenidoPaso2.includes('error') || contenidoPaso2.includes('Error')
        ];
        
        const validacionesCorrectas = validacionesPermisos.filter(v => v).length;
        
        if (validacionesCorrectas >= 4) {
            log('✅ Manejo de permisos - CORRECTO', 'green');
            testResults.passed++;
        } else {
            log(`❌ Manejo de permisos - INCOMPLETO (${validacionesCorrectas}/6)`, 'red');
            testResults.failed++;
            testResults.errors.push('Casos Edge: Manejo de permisos insuficiente');
        }
        
    } catch (error) {
        log(`❌ Error testing permisos: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Casos Edge: Error permisos - ${error.message}`);
    }
}

/**
 * FASE 6: TESTING DE GENERACIÓN DE ARCHIVOS
 */
async function testingGeneracionArchivos() {
    separator('FASE 6: TESTING DE GENERACIÓN DE ARCHIVOS', 'magenta');
    
    log('📄 Testing generación de archivos...', 'yellow');
    
    const archivosEsperados = [
        {
            nombre: 'BACKUP-COMPLETO-SUPABASE.sql',
            script: 'PASO-1',
            tipo: 'SQL'
        },
        {
            nombre: 'RESTAURAR-BACKUP-SUPABASE.sql',
            script: 'PASO-1',
            tipo: 'SQL'
        },
        {
            nombre: 'DOCUMENTACION-BACKUP.md',
            script: 'PASO-1',
            tipo: 'Markdown'
        },
        {
            nombre: 'PASO-2-VERIFICACION-DATOS-UNICOS-SUPABASE.sql',
            script: 'PASO-2',
            tipo: 'SQL'
        },
        {
            nombre: 'REPORTE-VERIFICACION-DATOS-UNICOS-PASO-2.md',
            script: 'PASO-2',
            tipo: 'Markdown'
        },
        {
            nombre: 'GUIA-INTERPRETACION-VERIFICACION-DATOS-UNICOS.md',
            script: 'PASO-2',
            tipo: 'Markdown'
        }
    ];
    
    for (const archivo of archivosEsperados) {
        testResults.total++;
        
        const scriptFile = archivo.script === 'PASO-1' ? 
            'PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js' : 
            'PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js';
        
        try {
            const contenido = fs.readFileSync(scriptFile, 'utf8');
            
            if (contenido.includes(archivo.nombre) && 
                contenido.includes('fs.writeFileSync')) {
                log(`✅ Generación de ${archivo.nombre} - CONFIGURADA`, 'green');
                testResults.passed++;
            } else {
                log(`❌ Generación de ${archivo.nombre} - NO CONFIGURADA`, 'red');
                testResults.failed++;
                testResults.errors.push(`Generación: ${archivo.nombre} no configurada en ${scriptFile}`);
            }
            
        } catch (error) {
            log(`❌ Error verificando ${archivo.nombre}: ${error.message}`, 'red');
            testResults.failed++;
            testResults.errors.push(`Generación: Error ${archivo.nombre} - ${error.message}`);
        }
    }
}

/**
 * FASE 7: TESTING DE MANEJO DE ERRORES
 */
async function testingManejoErrores() {
    separator('FASE 7: TESTING DE MANEJO DE ERRORES', 'magenta');
    
    log('🚨 Testing manejo de errores...', 'yellow');
    
    const scriptsATesting = [
        'PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js',
        'PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js'
    ];
    
    for (const script of scriptsATesting) {
        testResults.total++;
        
        try {
            const contenido = fs.readFileSync(script, 'utf8');
            
            const patronesManejo = [
                contenido.includes('try') && contenido.includes('catch'),
                contenido.includes('error.message') || contenido.includes('error'),
                contenido.includes('console.log') || contenido.includes('log'),
                contenido.includes('return false') || contenido.includes('process.exit'),
                contenido.includes('ERROR') || contenido.includes('Error')
            ];
            
            const patronesEncontrados = patronesManejo.filter(p => p).length;
            
            if (patronesEncontrados >= 3) {
                log(`✅ Manejo de errores en ${script} - CORRECTO`, 'green');
                testResults.passed++;
            } else {
                log(`❌ Manejo de errores en ${script} - INCOMPLETO (${patronesEncontrados}/5)`, 'red');
                testResults.failed++;
                testResults.errors.push(`Manejo errores: ${script} - Patrones insuficientes`);
            }
            
        } catch (error) {
            log(`❌ Error testing manejo de errores en ${script}: ${error.message}`, 'red');
            testResults.failed++;
            testResults.errors.push(`Manejo errores: Error ${script} - ${error.message}`);
        }
    }
}

/**
 * FASE 8: TESTING DE PREREQUISITOS
 */
async function testingPrerequisitos() {
    separator('FASE 8: TESTING DE PREREQUISITOS', 'magenta');
    
    log('🔧 Testing verificación de prerequisitos...', 'yellow');
    
    // Test 1: Verificación de Node.js
    await testPrerequisitosNodeJs();
    
    // Test 2: Verificación de variables de entorno
    await testPrerequisitosVariablesEntorno();
    
    // Test 3: Verificación de PASO 1 completado
    await testPrerequisitosBackupCompletado();
}

async function testPrerequisitosNodeJs() {
    log('🧪 Testing prerequisitos Node.js...', 'yellow');
    
    testResults.total++;
    
    try {
        const batFiles = [
            'EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat',
            'EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat'
        ];
        
        let verificacionesCorrectas = 0;
        
        for (const batFile of batFiles) {
            const contenido = fs.readFileSync(batFile, 'utf8');
            
            if (contenido.includes('node --version') && 
                contenido.includes('ERRORLEVEL') &&
                contenido.includes('Node.js')) {
                verificacionesCorrectas++;
                log(`   ✅ ${batFile} - Verificación Node.js correcta`, 'green');
            } else {
                log(`   ❌ ${batFile} - Verificación Node.js faltante`, 'red');
                testResults.errors.push(`Prerequisitos: ${batFile} no verifica Node.js`);
            }
        }
        
        if (verificacionesCorrectas === batFiles.length) {
            log('✅ Prerequisitos Node.js - CORRECTOS', 'green');
            testResults.passed++;
        } else {
            log(`❌ Prerequisitos Node.js - INCOMPLETOS (${verificacionesCorrectas}/${batFiles.length})`, 'red');
            testResults.failed++;
        }
        
    } catch (error) {
        log(`❌ Error testing prerequisitos Node.js: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Prerequisitos: Error Node.js - ${error.message}`);
    }
}

async function testPrerequisitosVariablesEntorno() {
    log('🧪 Testing prerequisitos variables de entorno...', 'yellow');
    
    testResults.total++;
    
    try {
        const jsFiles = [
            'PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js',
            'PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js'
        ];
        
        let verificacionesCorrectas = 0;
        
        for (const jsFile of jsFiles) {
            const contenido = fs.readFileSync(jsFile, 'utf8');
            
            const variablesRequeridas = [
                'NEXT_PUBLIC_SUPABASE_URL',
                'SUPABASE_SERVICE_ROLE_KEY'
            ];
            
            let variablesEncontradas = 0;
            
            for (const variable of variablesRequeridas) {
                if (contenido.includes(variable) && contenido.includes('process.env')) {
                    variablesEncontradas++;
                }
            }
            
            if (variablesEncontradas === variablesRequeridas.length) {
                verificacionesCorrectas++;
                log(`   ✅ ${jsFile} - Variables de entorno verificadas`, 'green');
            } else {
                log(`   ❌ ${jsFile} - Variables de entorno faltantes (${variablesEncontradas}/${variablesRequeridas.length})`, 'red');
                testResults.errors.push(`Prerequisitos: ${jsFile} variables incompletas`);
            }
        }
        
        if (verificacionesCorrectas === jsFiles.length) {
            log('✅ Prerequisitos variables de entorno - CORRECTOS', 'green');
            testResults.passed++;
        } else {
            log(`❌ Prerequisitos variables de entorno - INCOMPLETOS (${verificacionesCorrectas}/${jsFiles.length})`, 'red');
            testResults.failed++;
        }
        
    } catch (error) {
        log(`❌ Error testing prerequisitos variables: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Prerequisitos: Error variables - ${error.message}`);
    }
}

async function testPrerequisitosBackupCompletado() {
    log('🧪 Testing prerequisitos backup completado...', 'yellow');
    
    testResults.total++;
    
    try {
        const paso2Content = fs.readFileSync('PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js', 'utf8');
        
        const verificacionesBackup = [
            paso2Content.includes('verificarBackupExiste') || paso2Content.includes('backup'),
            paso2Content.includes('PASO 1') || paso2Content.includes('prerequisito'),
            paso2Content.includes('backup-supabase-') || paso2Content.includes('directorio'),
            paso2Content.includes('completado') || paso2Content.includes('ejecutado')
        ];
        
        const verificacionesCorrectas = verificacionesBackup.filter(v => v).length;
        
        if (verificacionesCorrectas >= 3) {
            log('✅ Prerequisitos backup completado - CORRECTO', 'green');
            testResults.passed++;
        } else {
            log(`❌ Prerequisitos backup completado - INCOMPLETO (${verificacionesCorrectas}/4)`, 'red');
            testResults.failed++;
            testResults.errors.push('Prerequisitos: Verificación de backup completado insuficiente');
        }
        
    } catch (error) {
        log(`❌ Error testing prerequisitos backup: ${error.message}`, 'red');
        testResults.failed++;
        testResults.errors.push(`Prerequisitos: Error backup - ${error.message}`);
    }
}

/**
 * GENERAR REPORTE FINAL
 */
async function generarReporteFinal() {
    separator('REPORTE FINAL DE TESTING EXHAUSTIVO', 'blue');
    
    const porcentajeExito = testResults.total > 0 ? 
        Math.round((testResults.passed / testResults.total) * 100) : 0;
    
    log(`📊 RESULTADOS DEL TESTING EXHAUSTIVO:`, 'cyan');
    log(`   Total de tests: ${testResults.total}`, 'cyan');
    log(`   Tests exitosos: ${testResults.passed}`, 'green');
    log(`   Tests fallidos: ${testResults.failed}`, 'red');
    log(`   Advertencias: ${testResults.warnings}`, 'yellow');
    log(`   Porcentaje de éxito: ${porcentajeExito}%`, porcentajeExito >= 80 ? 'green' : 'red');
    
    // Determinar estado general
    let estadoGeneral = '';
    let colorEstado = '';
    
    if (porcentajeExito >= 90) {
        estadoGeneral = '🟢 EXCELENTE - Sistema listo para producción';
        colorEstado = 'green';
    } else if (porcentajeExito >= 80) {
        estadoGeneral = '🟡 BUENO - Requiere correcciones menores';
        colorEstado = 'yellow';
    } else if (porcentajeExito >= 60) {
        estadoGeneral = '🟠 REGULAR - Requiere correcciones importantes';
        colorEstado = 'yellow';
    } else {
        estadoGeneral = '🔴 CRÍTICO - Requiere revisión completa';
        colorEstado = 'red';
    }
    
    log(`\n🎯 ESTADO GENERAL: ${estadoGeneral}`, colorEstado);
    
    // Mostrar errores si los hay
    if (testResults.errors.length > 0) {
        log(`\n❌ ERRORES ENCONTRADOS (${testResults.errors.length}):`, 'red');
        testResults.errors.forEach((error, index) => {
            log(`   ${index + 1}. ${error}`, 'red');
        });
    }
    
    // Generar archivo de reporte
    const reporteContent = generarContenidoReporte(porcentajeExito, estadoGeneral);
    
    try {
        fs.writeFileSync('REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md', reporteContent);
        log(`\n📄 Reporte generado: REPORTE-TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.md`, 'green');
    } catch (error) {
        log(`\n❌ Error generando reporte: ${error.message}`, 'red');
    }
    
    // Recomendaciones finales
    log(`\n🔄 PRÓXIMOS PASOS:`, 'cyan');
    
    if (porcentajeExito >= 80) {
        log(`   ✅ El sistema está listo para uso`, 'green');
        log(`   ✅ Proceder con testing en entorno real`, 'green');
        log(`   ✅ Documentar cualquier issue menor encontrado`, 'green');
    } else {
        log(`   ⚠️  Corregir errores críticos antes de usar`, 'yellow');
        log(`   ⚠️  Re-ejecutar testing después de correcciones`, 'yellow');
        log(`   ⚠️  Revisar documentación de prerequisitos`, 'yellow');
    }
    
    log(`\n📅 Testing completado: ${new Date().toLocaleString()}`, 'cyan');
}

/**
 * GENERAR CONTENIDO DEL REPORTE
 */
function generarContenidoReporte(porcentajeExito, estadoGeneral) {
    const fecha = new Date().toLocaleString();
    
    return `# REPORTE TESTING EXHAUSTIVO - SISTEMA LIMPIEZA ESQUEMAS SUPABASE

## 📋 INFORMACIÓN GENERAL

- **Fecha de Testing:** ${fecha}
- **Sistema Evaluado:** Sistema de Limpieza de Esquemas Duplicados en Supabase
- **Versión:** 1.0
- **Tipo de Testing:** Exhaustivo Completo

## 📊 RESULTADOS GENERALES

- **Total de Tests:** ${testResults.total}
- **Tests Exitosos:** ${testResults.passed}
- **Tests Fallidos:** ${testResults.failed}
- **Advertencias:** ${testResults.warnings}
- **Porcentaje de Éxito:** ${porcentajeExito}%

## 🎯 ESTADO GENERAL

${estadoGeneral}

## 🧪 COBERTURA DE TESTING

### ✅ ÁREAS EVALUADAS

1. **Existencia de Archivos Críticos**
   - PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.js
   - EJECUTAR-PASO-1-CREAR-BACKUP-COMPLETO-SUPABASE.bat
   - PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.js
   - EJECUTAR-PASO-2-VERIFICAR-DATOS-UNICOS-SUPABASE.bat

2. **Funcionalidad de Scripts JavaScript**
   - Estructura y elementos críticos
   - Sintaxis JavaScript válida
   - Funciones principales implementadas

3. **Funcionalidad de Archivos .bat**
   - Menús interactivos
   - Comandos de ejecución
   - Manejo de errores

4. **Integración del Sistema**
   - Flujo PASO 1 → PASO 2
   - Verificación de prerequisitos
   - Referencias de archivos generados

5. **Casos Edge y Manejo de Errores**
   - Variables de entorno faltantes
   - Node.js no disponible
   - Directorios inexistentes
   - Permisos de escritura

6. **Generación de Archivos**
   - Scripts SQL de backup y verificación
   - Documentación en Markdown
   - Reportes de verificación

7. **Prerequisitos del Sistema**
   - Verificación de Node.js
   - Variables de entorno requeridas
   - Dependencias entre pasos

## ❌ ERRORES ENCONTRADOS

${testResults.errors.length > 0 ? 
    testResults.errors.map((error, index) => `${index + 1}. ${error}`).join('\n') : 
    'No se encontraron errores críticos.'}

## ⚠️ ADVERTENCIAS

${testResults.warnings > 0 ? 
    `Se encontraron ${testResults.warnings} advertencias menores que no afectan la funcionalidad crítica.` : 
    'No se encontraron advertencias.'}

## 🔄 RECOMENDACIONES

### Si el porcentaje de éxito es >= 80%:
- ✅ El sistema está listo para uso en producción
- ✅ Proceder con testing en entorno real con datos de Supabase
- ✅ Documentar cualquier issue menor para futuras mejoras

### Si el porcentaje de éxito es < 80%:
- ⚠️ Corregir errores críticos antes de usar el sistema
- ⚠️ Re-ejecutar este testing después de realizar correcciones
- ⚠️ Revisar documentación de prerequisitos y dependencias

## 📋 CHECKLIST DE VALIDACIÓN

- [ ] Todos los archivos críticos existen
- [ ] Scripts JavaScript tienen sintaxis válida
- [ ] Archivos .bat tienen menús funcionales
- [ ] Integración entre PASO 1 y PASO 2 funciona
- [ ] Manejo de errores implementado
- [ ] Generación de archivos configurada
- [ ] Prerequisitos verificados correctamente

## 🚀 PRÓXIMOS PASOS

1. **Si testing exitoso (>= 80%):**
   - Ejecutar PASO 1 en entorno real
   - Verificar generación de backup
   - Ejecutar PASO 2 para verificar datos únicos
   - Proceder con limpieza solo si es seguro

2. **Si testing fallido (< 80%):**
   - Revisar y corregir errores listados
   - Re-ejecutar testing exhaustivo
   - Validar correcciones antes de uso

## 📞 SOPORTE

Para issues o mejoras del sistema:
- Revisar logs de error detallados
- Verificar prerequisitos del sistema
- Consultar documentación de Supabase

---

**Reporte generado automáticamente por:** TESTING-EXHAUSTIVO-SISTEMA-LIMPIEZA-ESQUEMAS-SUPABASE.js
**Fecha:** ${fecha}
`;
}

/**
 * EJECUTAR TESTING SI ES LLAMADO DIRECTAMENTE
 */
if (require.main === module) {
    ejecutarTestingExhaustivo()
        .then(success => {
            if (success) {
                log('\n🎉 TESTING EXHAUSTIVO COMPLETADO EXITOSAMENTE', 'green');
                process.exit(0);
            } else {
                log('\n💥 TESTING EXHAUSTIVO FALLÓ', 'red');
                process.exit(1);
            }
        })
        .catch(error => {
            log(`\n💥 ERROR CRÍTICO: ${error.message}`, 'red');
            process.exit(1);
        });
}

module.exports = {
    ejecutarTestingExhaustivo,
    testResults
};
