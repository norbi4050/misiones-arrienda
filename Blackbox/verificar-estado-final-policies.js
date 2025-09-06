// =====================================================
// VERIFICACIÓN FINAL DEL ESTADO DE POLÍTICAS
// =====================================================

const fs = require('fs');

async function verificarEstadoFinal() {
    const logFile = 'Blackbox/VERIFICACION-FINAL-POLICIES-RESULTADO.txt';
    let log = '';

    log += '🔍 VERIFICACIÓN FINAL: ESTADO DE POLÍTICAS RLS\n';
    log += '=' .repeat(60) + '\n';
    log += `Timestamp: ${new Date().toISOString()}\n\n`;

    try {
        // Leer el archivo SQL de solución
        const sqlFile = 'Blackbox/SQL-FIX-REMAINING-PROBLEMATIC-POLICIES.sql';
        if (fs.existsSync(sqlFile)) {
            const sqlContent = fs.readFileSync(sqlFile, 'utf8');
            log += '📄 CONTENIDO DEL ARCHIVO SQL DE SOLUCIÓN:\n';
            log += '-' .repeat(40) + '\n';
            log += sqlContent + '\n\n';
        } else {
            log += '❌ ARCHIVO SQL NO ENCONTRADO\n\n';
        }

        // Verificar archivos de ejecución
        const jsFile = 'Blackbox/aplicar-fix-remaining-problematic-policies.js';
        const batFile = 'Blackbox/EJECUTAR-FIX-REMAINING-POLICIES.bat';

        log += '📁 ARCHIVOS DE EJECUCIÓN:\n';
        log += `- JS Script: ${fs.existsSync(jsFile) ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}\n`;
        log += `- Batch File: ${fs.existsSync(batFile) ? '✅ ENCONTRADO' : '❌ NO ENCONTRADO'}\n\n`;

        // Verificar reporte anterior
        const reportFile = 'Blackbox/REPORTE-FIX-REMAINING-POLICIES.json';
        if (fs.existsSync(reportFile)) {
            log += '📊 REPORTE DE EJECUCIÓN ANTERIOR ENCONTRADO:\n';
            const report = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
            log += JSON.stringify(report, null, 2) + '\n\n';
        } else {
            log += '📊 NO SE ENCONTRÓ REPORTE DE EJECUCIÓN ANTERIOR\n\n';
        }

        // Instrucciones para ejecutar
        log += '🚀 INSTRUCCIONES PARA EJECUTAR LA SOLUCIÓN:\n';
        log += '-' .repeat(50) + '\n';
        log += '1. Abrir terminal en directorio Blackbox\n';
        log += '2. Ejecutar: node aplicar-fix-remaining-problematic-policies.js\n';
        log += '3. O ejecutar: ./EJECUTAR-FIX-REMAINING-POLICIES.bat\n';
        log += '4. Verificar reporte generado\n\n';

        log += '🎯 RESULTADO ESPERADO:\n';
        log += '- ✅ 12 políticas recreadas correctamente\n';
        log += '- ✅ 0 políticas problemáticas restantes\n';
        log += '- ✅ AUTH_RLS_INITPLAN warnings eliminados\n\n';

        log += '✅ VERIFICACIÓN COMPLETADA\n';

        fs.writeFileSync(logFile, log);
        console.log('✅ Verificación completada - revisar VERIFICACION-FINAL-POLICIES-RESULTADO.txt');

    } catch (error) {
        log += `❌ ERROR EN VERIFICACIÓN: ${error.message}\n`;
        fs.writeFileSync(logFile, log);
        console.log('❌ Error en verificación:', error.message);
    }
}

// Ejecutar verificación
verificarEstadoFinal();
