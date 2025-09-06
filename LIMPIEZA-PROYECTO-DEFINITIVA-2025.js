const fs = require('fs');
const path = require('path');

console.log('🧹 INICIANDO LIMPIEZA DEFINITIVA DEL PROYECTO');
console.log('===============================================');

// Archivos y carpetas ESENCIALES que NO se deben eliminar
const ARCHIVOS_ESENCIALES = [
    // Archivos de configuración del proyecto
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tailwind.config.ts',
    'postcss.config.js',
    'next.config.js',
    'next-env.d.ts',
    '.eslintrc.json',
    '.gitignore',
    'README.md',
    'vercel.json',
    'netlify.toml',
    '.vercelignore',
    
    // Archivos de entorno
    '.env',
    '.env.local',
    '.env.example',
    
    // Archivos de base de datos
    'prisma',
    'schema.prisma',
    'migration.sql',
    'supabase-setup.sql',
    
    // Archivos del proyecto web
    'index.html',
    'login.html',
    'register.html',
    'property-detail.html',
    
    // Directorios esenciales
    'src',
    'public',
    'node_modules',
    '.next',
    '.git',
    'supabase',
    '.github'
];

// Patrones de archivos NO ESENCIALES que se pueden eliminar
const PATRONES_ELIMINAR = [
    // Archivos de testing y diagnóstico
    /^test-.*\.js$/,
    /^testing-.*\.js$/,
    /^diagnostico-.*\.js$/,
    /^auditoria-.*\.js$/,
    /^verificar-.*\.js$/,
    /^verificacion-.*\.js$/,
    
    // Archivos de reportes
    /^REPORTE-.*\.md$/,
    /^reporte-.*\.md$/,
    /^ANALISIS-.*\.md$/,
    /^analisis-.*\.md$/,
    /^AUDITORIA-.*\.md$/,
    /^auditoria-.*\.md$/,
    
    // Archivos de soluciones y correcciones
    /^SOLUCION-.*\.(js|md|sql)$/,
    /^solucion-.*\.(js|md|sql)$/,
    /^CORREGIR-.*\.(js|md|sql)$/,
    /^corregir-.*\.(js|md|sql)$/,
    /^IMPLEMENTAR-.*\.(js|md|sql)$/,
    /^implementar-.*\.(js|md|sql)$/,
    
    // Archivos de ejecución y scripts de testing
    /^ejecutar-.*\.bat$/,
    /^EJECUTAR-.*\.bat$/,
    /^TESTING-.*\.js$/,
    /^TEST-.*\.js$/,
    
    // Archivos de planes y guías
    /^PLAN-.*\.md$/,
    /^plan-.*\.md$/,
    /^GUIA-.*\.md$/,
    /^guia-.*\.md$/,
    /^TODO-.*\.md$/,
    /^todo-.*\.md$/,
    
    // Archivos de pasos y fases
    /^PASO-\d+-.*\.(js|md|sql|bat)$/,
    /^paso-\d+-.*\.(js|md|sql|bat)$/,
    /^FASE-\d+-.*\.(js|md|sql|bat)$/,
    /^fase-\d+-.*\.(js|md|sql|bat)$/,
    
    // Archivos de scripts SQL no esenciales
    /^SUPABASE-.*\.sql$/,
    /^supabase-.*\.sql$/,
    
    // Archivos de configuración temporal
    /^CONFIGURAR-.*\.(js|bat)$/,
    /^configurar-.*\.(js|bat)$/,
    /^APLICAR-.*\.(js|bat)$/,
    /^aplicar-.*\.(js|bat)$/,
    
    // Archivos de limpieza y eliminación
    /^LIMPIAR-.*\.(js|bat)$/,
    /^limpiar-.*\.(js|bat)$/,
    /^ELIMINAR-.*\.(js|bat)$/,
    /^eliminar-.*\.(js|bat)$/,
    
    // Archivos de sincronización
    /^SINCRONIZAR-.*\.(js|bat)$/,
    /^sincronizar-.*\.(js|bat)$/,
    
    // Archivos de deployment específicos (mantener solo los esenciales)
    /^DEPLOY-.*\.bat$/,
    /^deploy-.*\.bat$/,
    /^SUBIR-.*\.bat$/,
    /^subir-.*\.bat$/,
    
    // Archivos de variables de entorno específicos
    /^VARIABLES-ENTORNO-.*\.md$/,
    /^variables-entorno-.*\.md$/,
    
    // Archivos de comandos específicos
    /^COMANDOS-.*\.(md|bat)$/,
    /^comandos-.*\.(md|bat)$/,
    
    // Archivos de instrucciones específicas
    /^INSTRUCCIONES-.*\.md$/,
    /^instrucciones-.*\.md$/,
    
    // Archivos de problemas y errores
    /^PROBLEMA-.*\.md$/,
    /^problema-.*\.md$/,
    /^ERROR-.*\.md$/,
    /^error-.*\.md$/,
    
    // Archivos de mejoras y optimizaciones
    /^MEJORAS-.*\.md$/,
    /^mejoras-.*\.md$/,
    /^OPTIMIZACION-.*\.(js|md|sql)$/,
    /^optimizacion-.*\.(js|md|sql)$/,
    
    // Archivos de consolidación
    /^CONSOLIDAR-.*\.(js|bat)$/,
    /^consolidar-.*\.(js|bat)$/,
    /^CONSOLIDACION-.*\.(js|md)$/,
    /^consolidacion-.*\.(js|md)$/,
    
    // Archivos de scripts de verificación
    /^SCRIPT-.*\.(js|sql)$/,
    /^script-.*\.(js|sql)$/,
    
    // Archivos de investigación
    /^investigacion-.*\.js$/,
    /^INVESTIGACION-.*\.js$/,
    
    // Archivos de backup específicos
    /^backup-.*\.(js|md)$/,
    /^BACKUP-.*\.(js|md)$/,
    
    // Archivos JSON de reportes
    /^.*-REPORTE.*\.json$/,
    /^.*-reporte.*\.json$/,
    /^REPORTE-.*\.json$/,
    /^reporte-.*\.json$/
];

// Directorios NO ESENCIALES que se pueden eliminar
const DIRECTORIOS_ELIMINAR = [
    'backup-supabase-2025-09-05',
    'reportes',
    'CONSOLIDADOS',
    'misiones-arrienda-v2',
    'misionesarrienda1',
    'src/app/properties', // Solo si está duplicado fuera de Backend
    'src/app/publicar'    // Solo si está duplicado fuera de Backend
];

let archivosEliminados = 0;
let directoriosEliminados = 0;
let errores = [];

function esArchivoEsencial(nombreArchivo) {
    // Verificar si es un archivo esencial
    for (const esencial of ARCHIVOS_ESENCIALES) {
        if (nombreArchivo.includes(esencial)) {
            return true;
        }
    }
    return false;
}

function debeEliminarArchivo(nombreArchivo) {
    // No eliminar archivos esenciales
    if (esArchivoEsencial(nombreArchivo)) {
        return false;
    }
    
    // Verificar patrones de eliminación
    for (const patron of PATRONES_ELIMINAR) {
        if (patron.test(nombreArchivo)) {
            return true;
        }
    }
    
    return false;
}

function limpiarDirectorio(dirPath, esRaiz = false) {
    try {
        const items = fs.readdirSync(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stat = fs.statSync(itemPath);
            
            if (stat.isDirectory()) {
                // Verificar si es un directorio que se debe eliminar completamente
                if (DIRECTORIOS_ELIMINAR.includes(item)) {
                    try {
                        fs.rmSync(itemPath, { recursive: true, force: true });
                        console.log(`🗂️  Directorio eliminado: ${item}`);
                        directoriosEliminados++;
                    } catch (error) {
                        errores.push(`Error eliminando directorio ${item}: ${error.message}`);
                    }
                } else {
                    // Limpiar recursivamente directorios esenciales
                    limpiarDirectorio(itemPath);
                }
            } else {
                // Es un archivo
                if (debeEliminarArchivo(item)) {
                    try {
                        fs.unlinkSync(itemPath);
                        console.log(`📄 Archivo eliminado: ${item}`);
                        archivosEliminados++;
                    } catch (error) {
                        errores.push(`Error eliminando archivo ${item}: ${error.message}`);
                    }
                } else {
                    console.log(`✅ Archivo conservado: ${item}`);
                }
            }
        }
    } catch (error) {
        errores.push(`Error leyendo directorio ${dirPath}: ${error.message}`);
    }
}

function mostrarResumen() {
    console.log('\n===============================================');
    console.log('📊 RESUMEN DE LIMPIEZA COMPLETADA');
    console.log('===============================================');
    console.log(`📄 Archivos eliminados: ${archivosEliminados}`);
    console.log(`🗂️  Directorios eliminados: ${directoriosEliminados}`);
    console.log(`❌ Errores encontrados: ${errores.length}`);
    
    if (errores.length > 0) {
        console.log('\n⚠️  ERRORES ENCONTRADOS:');
        errores.forEach((error, index) => {
            console.log(`${index + 1}. ${error}`);
        });
    }
    
    console.log('\n✅ ARCHIVOS ESENCIALES CONSERVADOS:');
    console.log('- Código fuente del proyecto (Backend/src/)');
    console.log('- Archivos de configuración (package.json, tsconfig.json, etc.)');
    console.log('- Archivos de base de datos esenciales (prisma/schema.prisma)');
    console.log('- Archivos HTML del proyecto');
    console.log('- Configuraciones de deployment (vercel.json, netlify.toml)');
    console.log('- Variables de entorno (.env files)');
    console.log('- Repositorio Git (.git/)');
    
    console.log('\n🎯 PROYECTO LIMPIO Y LISTO PARA PRODUCCIÓN');
}

// Ejecutar limpieza
console.log('🔍 Iniciando análisis de archivos...\n');
limpiarDirectorio('.', true);
mostrarResumen();
