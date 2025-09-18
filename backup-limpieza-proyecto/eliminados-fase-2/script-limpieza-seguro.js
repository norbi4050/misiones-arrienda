const fs = require('fs');
const path = require('path');

// Cargar el análisis detallado
const analisis = JSON.parse(fs.readFileSync('analisis-limpieza-detallado.json', 'utf8'));

console.log('🧹 INICIANDO LIMPIEZA SEGURA DEL PROYECTO');
console.log('='.repeat(50));

// Crear backup de archivos importantes antes de eliminar
function crearBackup() {
    console.log('\n📦 Creando backup de archivos importantes...');
    
    const backupDir = 'backup-limpieza-proyecto';
    
    // Crear subdirectorios en backup
    const subdirs = ['documentacion', 'scripts-obsoletos', 'sql-temporal', 'reportes'];
    subdirs.forEach(subdir => {
        const dirPath = path.join(backupDir, subdir);
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }
    });
    
    return backupDir;
}

// Función para mover archivo a backup antes de eliminar
function moverABackup(archivo, categoria, backupDir) {
    try {
        const sourceFile = archivo.path;
        let targetSubdir = 'otros';
        
        switch(categoria) {
            case 'auditoria':
            case 'reporte':
            case 'instrucciones':
            case 'plan':
                targetSubdir = 'documentacion';
                break;
            case 'testing':
            case 'otros':
                targetSubdir = 'scripts-obsoletos';
                break;
            case 'sql-desarrollo':
                targetSubdir = 'sql-temporal';
                break;
        }
        
        const fileName = path.basename(sourceFile);
        const targetFile = path.join(backupDir, targetSubdir, fileName);
        
        if (fs.existsSync(sourceFile)) {
            fs.copyFileSync(sourceFile, targetFile);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error moviendo ${archivo.path} a backup:`, error.message);
        return false;
    }
}

// Función para eliminar archivo de forma segura
function eliminarArchivo(archivo) {
    try {
        if (fs.existsSync(archivo.path)) {
            fs.unlinkSync(archivo.path);
            return true;
        }
        return false;
    } catch (error) {
        console.error(`❌ Error eliminando ${archivo.path}:`, error.message);
        return false;
    }
}

// Función principal de limpieza
function ejecutarLimpieza() {
    const backupDir = crearBackup();
    
    let archivosEliminados = 0;
    let archivosBackup = 0;
    let errores = 0;
    
    console.log(`\n🗑️ Procesando ${analisis.filesToDelete.length} archivos para eliminar...`);
    
    // Procesar archivos por categoría
    const categorias = {};
    analisis.filesToDelete.forEach(archivo => {
        if (!categorias[archivo.category]) {
            categorias[archivo.category] = [];
        }
        categorias[archivo.category].push(archivo);
    });
    
    // Mostrar resumen por categoría
    console.log('\n📊 Archivos por categoría:');
    Object.keys(categorias).forEach(categoria => {
        console.log(`  ${categoria}: ${categorias[categoria].length} archivos`);
    });
    
    // Procesar eliminación
    analisis.filesToDelete.forEach((archivo, index) => {
        const progreso = Math.round(((index + 1) / analisis.filesToDelete.length) * 100);
        process.stdout.write(`\r🔄 Progreso: ${progreso}% (${index + 1}/${analisis.filesToDelete.length})`);
        
        // Crear backup primero
        if (moverABackup(archivo, archivo.category, backupDir)) {
            archivosBackup++;
        }
        
        // Eliminar archivo original
        if (eliminarArchivo(archivo)) {
            archivosEliminados++;
        } else {
            errores++;
        }
    });
    
    console.log('\n\n✅ LIMPIEZA COMPLETADA');
    console.log('='.repeat(30));
    console.log(`📁 Archivos respaldados: ${archivosBackup}`);
    console.log(`🗑️ Archivos eliminados: ${archivosEliminados}`);
    console.log(`❌ Errores: ${errores}`);
    console.log(`💾 Backup guardado en: ${backupDir}`);
    
    // Mostrar archivos que requieren revisión manual
    if (analisis.filesToReview.length > 0) {
        console.log(`\n⚠️ ARCHIVOS PARA REVISAR MANUALMENTE: ${analisis.filesToReview.length}`);
        analisis.filesToReview.forEach(archivo => {
            console.log(`  📄 ${archivo.path} - ${archivo.reason}`);
        });
    }
    
    return {
        eliminados: archivosEliminados,
        backup: archivosBackup,
        errores: errores
    };
}

// Función para verificar archivos duplicados entre raíz y Backend
function verificarDuplicados() {
    console.log('\n🔍 Verificando archivos duplicados...');
    
    const duplicados = [];
    const archivosRaiz = ['package.json', 'tsconfig.json', 'tailwind.config.ts', 'postcss.config.js'];
    
    archivosRaiz.forEach(archivo => {
        const rutaRaiz = archivo;
        const rutaBackend = path.join('Backend', archivo);
        
        if (fs.existsSync(rutaRaiz) && fs.existsSync(rutaBackend)) {
            duplicados.push({
                raiz: rutaRaiz,
                backend: rutaBackend
            });
        }
    });
    
    if (duplicados.length > 0) {
        console.log('⚠️ Archivos duplicados encontrados:');
        duplicados.forEach(dup => {
            console.log(`  🔄 ${dup.raiz} <-> ${dup.backend}`);
        });
    } else {
        console.log('✅ No se encontraron duplicados críticos');
    }
    
    return duplicados;
}

// Función para generar reporte final
function generarReporte(resultado) {
    const reporte = {
        timestamp: new Date().toISOString(),
        limpieza: resultado,
        archivosOriginales: analisis.summary.totalFiles,
        archivosRestantes: analisis.summary.totalFiles - resultado.eliminados,
        espacioLiberado: analisis.summary.deletableSizeMB + ' MB',
        backupLocation: 'backup-limpieza-proyecto/',
        archivosParaRevisar: analisis.filesToReview.length
    };
    
    fs.writeFileSync('backup-limpieza-proyecto/reporte-limpieza.json', JSON.stringify(reporte, null, 2));
    
    console.log('\n📋 REPORTE FINAL:');
    console.log(`  📊 Archivos originales: ${reporte.archivosOriginales}`);
    console.log(`  📊 Archivos restantes: ${reporte.archivosRestantes}`);
    console.log(`  💾 Espacio liberado: ${reporte.espacioLiberado}`);
    console.log(`  📁 Backup en: ${reporte.backupLocation}`);
    console.log(`  ⚠️ Para revisar: ${reporte.archivosParaRevisar} archivos`);
}

// Ejecutar limpieza
try {
    const duplicados = verificarDuplicados();
    const resultado = ejecutarLimpieza();
    generarReporte(resultado);
    
    console.log('\n🎉 PROYECTO LIMPIADO EXITOSAMENTE');
    console.log('💡 Revisa los archivos marcados para revisión manual');
    console.log('💡 El backup está disponible en backup-limpieza-proyecto/');
    
} catch (error) {
    console.error('\n❌ ERROR DURANTE LA LIMPIEZA:', error.message);
    process.exit(1);
}
