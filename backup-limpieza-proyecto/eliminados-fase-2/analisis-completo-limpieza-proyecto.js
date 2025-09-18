const fs = require('fs');
const path = require('path');

// Función para analizar archivos y categorizarlos
function analizarArchivos() {
    const archivosRaiz = fs.readdirSync('.', { withFileTypes: true })
        .filter(dirent => dirent.isFile())
        .map(dirent => dirent.name);

    const categorias = {
        // Archivos CRÍTICOS - NO ELIMINAR
        criticos: [],
        
        // Archivos de configuración importantes
        configuracion: [],
        
        // Archivos duplicados (existe en raíz y Backend)
        duplicados: [],
        
        // Documentación temporal/reportes - CANDIDATOS A ELIMINAR
        documentacionTemporal: [],
        
        // Scripts de limpieza obsoletos - CANDIDATOS A ELIMINAR
        scriptsObsoletos: [],
        
        // Archivos SQL importantes
        sqlImportantes: [],
        
        // Archivos SQL temporales/duplicados - CANDIDATOS A ELIMINAR
        sqlTemporales: [],
        
        // Archivos de código fuente duplicados
        codigoDuplicado: [],
        
        // Otros archivos a revisar
        otros: []
    };

    archivosRaiz.forEach(archivo => {
        const ext = path.extname(archivo).toLowerCase();
        const nombre = archivo.toLowerCase();
        
        // Archivos CRÍTICOS que NO se deben eliminar
        if (archivo === '.env.local' || 
            archivo === 'README.md' || 
            archivo === 'CHANGELOG.md' ||
            archivo === '.gitignore') {
            categorias.criticos.push(archivo);
        }
        
        // Archivos de configuración importantes
        else if (archivo === 'package.json' || 
                 archivo === 'package-lock.json' ||
                 archivo === 'tsconfig.json' ||
                 archivo === 'tailwind.config.ts' ||
                 archivo === 'postcss.config.js' ||
                 archivo === 'next.config.js') {
            categorias.configuracion.push(archivo);
        }
        
        // Documentación temporal y reportes (CANDIDATOS A ELIMINAR)
        else if (nombre.startsWith('reporte-') ||
                 nombre.startsWith('instrucciones-') ||
                 nombre.startsWith('plan-') ||
                 nombre.startsWith('todo-') ||
                 nombre.startsWith('auditoria-') ||
                 nombre.startsWith('checklist-') ||
                 nombre.startsWith('diagnostico-') ||
                 nombre.startsWith('solucion-') ||
                 nombre.startsWith('estado-') ||
                 nombre.startsWith('progreso-') ||
                 nombre.startsWith('mapa-') ||
                 nombre.startsWith('investigacion-') ||
                 nombre.includes('chatgpt') ||
                 nombre.includes('blackbox') ||
                 nombre.includes('completado') ||
                 nombre.includes('final-') ||
                 nombre.includes('-2025')) {
            categorias.documentacionTemporal.push(archivo);
        }
        
        // Scripts de limpieza obsoletos (CANDIDATOS A ELIMINAR)
        else if (nombre.startsWith('cleanup-') ||
                 nombre.startsWith('analisis-limpieza') ||
                 nombre.startsWith('delete_') ||
                 nombre.startsWith('remove-') ||
                 nombre.includes('backup') ||
                 ext === '.bat' ||
                 ext === '.ps1' ||
                 (ext === '.py' && nombre.includes('delete'))) {
            categorias.scriptsObsoletos.push(archivo);
        }
        
        // Archivos SQL importantes vs temporales
        else if (ext === '.sql') {
            if (nombre.includes('fix-') ||
                nombre.includes('correccion-') ||
                nombre.includes('supabase-') ||
                nombre.includes('2025') ||
                nombre.includes('final') ||
                nombre.includes('ultra') ||
                nombre.includes('absoluto')) {
                categorias.sqlTemporales.push(archivo);
            } else {
                categorias.sqlImportantes.push(archivo);
            }
        }
        
        // Código fuente duplicado
        else if (ext === '.js' || ext === '.ts' || ext === '.tsx') {
            // Verificar si existe el mismo archivo en Backend
            const rutaBackend = path.join('Backend', archivo);
            if (fs.existsSync(rutaBackend)) {
                categorias.codigoDuplicado.push(archivo);
            } else if (nombre.includes('test-') ||
                      nombre.includes('cleanup-') ||
                      nombre.includes('analisis-')) {
                categorias.scriptsObsoletos.push(archivo);
            } else {
                categorias.otros.push(archivo);
            }
        }
        
        // Verificar duplicados con Backend
        else {
            const rutaBackend = path.join('Backend', archivo);
            if (fs.existsSync(rutaBackend)) {
                categorias.duplicados.push(archivo);
            } else {
                categorias.otros.push(archivo);
            }
        }
    });

    return categorias;
}

// Función para verificar archivos en src/ vs Backend/src/
function analizarCodigoDuplicado() {
    const duplicadosSrc = [];
    
    if (fs.existsSync('src') && fs.existsSync('Backend/src')) {
        // Comparar archivos en src/
        function compararDirectorios(dirRaiz, dirBackend, rutaRelativa = '') {
            const archivosRaiz = fs.readdirSync(dirRaiz, { withFileTypes: true });
            
            archivosRaiz.forEach(item => {
                const rutaCompleta = path.join(rutaRelativa, item.name);
                const archivoRaiz = path.join(dirRaiz, item.name);
                const archivoBackend = path.join(dirBackend, item.name);
                
                if (item.isDirectory()) {
                    if (fs.existsSync(archivoBackend)) {
                        compararDirectorios(archivoRaiz, archivoBackend, rutaCompleta);
                    }
                } else if (fs.existsSync(archivoBackend)) {
                    duplicadosSrc.push(rutaCompleta);
                }
            });
        }
        
        compararDirectorios('src', 'Backend/src');
    }
    
    return duplicadosSrc;
}

// Ejecutar análisis
console.log('🔍 ANÁLISIS COMPLETO DE LIMPIEZA DEL PROYECTO');
console.log('='.repeat(50));

const categorias = analizarArchivos();
const duplicadosSrc = analizarCodigoDuplicado();

// Mostrar resultados
console.log('\n📋 ARCHIVOS CRÍTICOS (NO ELIMINAR):');
categorias.criticos.forEach(archivo => console.log(`  ✅ ${archivo}`));

console.log('\n⚙️ ARCHIVOS DE CONFIGURACIÓN:');
categorias.configuracion.forEach(archivo => console.log(`  🔧 ${archivo}`));

console.log('\n📄 CÓDIGO DUPLICADO EN src/:');
duplicadosSrc.forEach(archivo => console.log(`  🔄 src/${archivo} (existe también en Backend/src/)`));

console.log('\n🔄 ARCHIVOS DUPLICADOS (raíz vs Backend):');
categorias.duplicados.forEach(archivo => console.log(`  🔄 ${archivo}`));

console.log('\n📚 DOCUMENTACIÓN TEMPORAL (CANDIDATOS A ELIMINAR):');
categorias.documentacionTemporal.forEach(archivo => console.log(`  🗑️ ${archivo}`));

console.log('\n🧹 SCRIPTS OBSOLETOS (CANDIDATOS A ELIMINAR):');
categorias.scriptsObsoletos.forEach(archivo => console.log(`  🗑️ ${archivo}`));

console.log('\n🗄️ SQL IMPORTANTES:');
categorias.sqlImportantes.forEach(archivo => console.log(`  💾 ${archivo}`));

console.log('\n🗄️ SQL TEMPORALES (CANDIDATOS A ELIMINAR):');
categorias.sqlTemporales.forEach(archivo => console.log(`  🗑️ ${archivo}`));

console.log('\n❓ OTROS ARCHIVOS:');
categorias.otros.forEach(archivo => console.log(`  ❓ ${archivo}`));

// Resumen
console.log('\n📊 RESUMEN:');
console.log(`  ✅ Archivos críticos: ${categorias.criticos.length}`);
console.log(`  🔧 Configuración: ${categorias.configuracion.length}`);
console.log(`  🔄 Duplicados: ${categorias.duplicados.length}`);
console.log(`  📄 Código duplicado src/: ${duplicadosSrc.length}`);
console.log(`  🗑️ Documentación temporal: ${categorias.documentacionTemporal.length}`);
console.log(`  🗑️ Scripts obsoletos: ${categorias.scriptsObsoletos.length}`);
console.log(`  💾 SQL importantes: ${categorias.sqlImportantes.length}`);
console.log(`  🗑️ SQL temporales: ${categorias.sqlTemporales.length}`);
console.log(`  ❓ Otros: ${categorias.otros.length}`);

const totalCandidatos = categorias.documentacionTemporal.length + 
                       categorias.scriptsObsoletos.length + 
                       categorias.sqlTemporales.length;

console.log(`\n🎯 TOTAL CANDIDATOS A ELIMINAR: ${totalCandidatos} archivos`);

// Guardar análisis en archivo
const analisis = {
    timestamp: new Date().toISOString(),
    categorias,
    duplicadosSrc,
    resumen: {
        criticos: categorias.criticos.length,
        configuracion: categorias.configuracion.length,
        duplicados: categorias.duplicados.length,
        codigoDuplicadoSrc: duplicadosSrc.length,
        documentacionTemporal: categorias.documentacionTemporal.length,
        scriptsObsoletos: categorias.scriptsObsoletos.length,
        sqlImportantes: categorias.sqlImportantes.length,
        sqlTemporales: categorias.sqlTemporales.length,
        otros: categorias.otros.length,
        totalCandidatosEliminar: totalCandidatos
    }
};

fs.writeFileSync('backup-limpieza-proyecto/analisis-detallado.json', JSON.stringify(analisis, null, 2));
console.log('\n💾 Análisis guardado en: backup-limpieza-proyecto/analisis-detallado.json');
