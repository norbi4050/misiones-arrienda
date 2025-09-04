/**
 * BLACKBOX AI - SCRIPT DE LIMPIEZA COMPLETA DEL PROYECTO
 * Archivo: 92-Script-Limpieza-Completa-Proyecto.js
 * 
 * Este script identifica y organiza todos los archivos del proyecto,
 * manteniendo solo los archivos esenciales para el funcionamiento
 * y moviendo documentos importantes a la carpeta Blackbox.
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 INICIANDO LIMPIEZA COMPLETA DEL PROYECTO MISIONES ARRIENDA');
console.log('=' .repeat(60));

// Archivos esenciales que DEBEN mantenerse en el proyecto
const archivosEsenciales = [
    // Archivos de configuración del proyecto
    '.gitignore',
    'README.md',
    'package.json',
    'package-lock.json',
    'tsconfig.json',
    'tailwind.config.ts',
    'next.config.js',
    'postcss.config.js',
    'vercel.json',
    'jest.config.js',
    'jest.setup.js',
    
    // Archivos de código fuente (todo en src/)
    // Archivos de base de datos (prisma/)
    // Archivos públicos (public/)
    // Archivos de configuración de deployment
    '.github/',
    'supabase/',
    
    // Variables de entorno (si existen)
    '.env',
    '.env.local',
    '.env.example'
];

// Patrones de archivos que son innecesarios
const patronesInnecesarios = [
    /^REPORTE-.*\.md$/,
    /^AUDITORIA-.*\.(md|js|sql)$/,
    /^TESTING-.*\.(js|bat|md)$/,
    /^test-.*\.(js|bat)$/,
    /^EJECUTAR-.*\.bat$/,
    /^SOLUCION-.*\.(md|bat|js|sql)$/,
    /^PLAN-.*\.md$/,
    /^GUIA-.*\.md$/,
    /^DIAGNOSTICO-.*\.(md|js|bat)$/,
    /^ANALISIS-.*\.md$/,
    /^IMPLEMENTAR-.*\.(js|bat)$/,
    /^CORREGIR-.*\.(js|bat)$/,
    /^LIMPIAR-.*\.bat$/,
    /^ELIMINAR-.*\.bat$/,
    /^SUBIR-.*\.bat$/,
    /^DEPLOY-.*\.bat$/,
    /^VERIFICAR-.*\.(js|bat)$/,
    /^APLICAR-.*\.(js|bat)$/,
    /^CONFIGURAR-.*\.bat$/,
    /^SINCRONIZAR-.*\.bat$/,
    /^PROBAR-.*\.bat$/,
    /^CONTINUAR-.*\.bat$/,
    /^INVESTIGAR-.*\.bat$/,
    /^SUPABASE-.*\.sql$/,
    /^ESQUEMA-.*\.sql$/,
    /.*-FINAL\.(md|js|bat|sql|txt)$/,
    /.*-COMPLETO\.(md|js|bat)$/,
    /.*-EXHAUSTIVO\.(md|js|bat)$/,
    /.*-COMPLETADO\.(md|js|bat)$/,
    /.*-EXITOSO\.(md|js|bat)$/,
    /.*-CORREGIDO\.(md|js|bat)$/,
    /.*-SOLUCIONADO\.(md|js|bat)$/,
    /.*-IMPLEMENTADO\.(md|js|bat)$/,
    /FASE-\d+.*\.(md|js|bat)$/,
    /PHASE-\d+.*\.(md|js|bat)$/,
    /TODO-.*\.md$/,
    /CHECKLIST-.*\.md$/,
    /COMANDOS-.*\.(md|bat)$/,
    /INSTRUCCIONES-.*\.(md|bat)$/,
    /PASOS-.*\.(md|bat)$/,
    /ERROR-.*\.(md|js|bat)$/,
    /PROBLEMA-.*\.(md|js|bat)$/,
    /MEJORAS-.*\.(md|js|bat)$/,
    /RESUMEN-.*\.md$/,
    /REVISION-.*\.md$/,
    /PROXIMOS-.*\.md$/,
    /VARIABLES-.*\.md$/,
    /GITHUB-.*\.md$/,
    /NETLIFY-.*\.md$/,
    /VERCEL-.*\.md$/,
    /DEPLOYMENT-.*\.md$/,
    /SISTEMA-.*\.md$/,
    /PLATAFORMA-.*\.md$/,
    /SEMANA-.*\.md$/,
    /LIMPIEZA-.*\.md$/,
    /PROYECTO-.*\.md$/,
    /ESTADISTICAS-.*\.md$/,
    /DATOS-.*\.md$/,
    /MERCADOPAGO-.*\.md$/,
    /CURRENCY-.*\.md$/,
    /REGISTRO-.*\.md$/,
    /LOGIN-.*\.md$/,
    /AUTH-.*\.md$/,
    /PERFIL-.*\.md$/,
    /USUARIO-.*\.md$/,
    /COMUNIDAD-.*\.md$/,
    /PROPERTIES-.*\.md$/,
    /API-.*\.md$/,
    /DATABASE-.*\.md$/,
    /TYPESCRIPT-.*\.md$/,
    /CSS-.*\.md$/,
    /IMAGENES-.*\.md$/,
    /NAVEGACION-.*\.md$/,
    /UX-.*\.md$/,
    /SEO-.*\.md$/,
    /PERFORMANCE-.*\.md$/,
    /SECURITY-.*\.md$/,
    /MONITORING-.*\.md$/
];

// Directorios que deben eliminarse completamente
const directoriosEliminar = [
    'reportes/',
    'CONSOLIDADOS/',
    'BACKUP-PRE-LIMPIEZA/',
    'misiones-arrienda-v2/',
    'misionesarrienda1/',
    'src/' // Este src en la raíz parece ser duplicado
];

function esArchivoEsencial(archivo) {
    return archivosEsenciales.some(esencial => {
        if (esencial.endsWith('/')) {
            return archivo.startsWith(esencial);
        }
        return archivo === esencial;
    });
}

function esArchivoInnecesario(archivo) {
    const nombreArchivo = path.basename(archivo);
    return patronesInnecesarios.some(patron => patron.test(nombreArchivo));
}

function analizarArchivos() {
    console.log('📊 ANÁLISIS DE ARCHIVOS DEL PROYECTO');
    console.log('-'.repeat(40));
    
    const archivosRaiz = fs.readdirSync('.').filter(item => {
        const stat = fs.statSync(item);
        return stat.isFile();
    });
    
    const esenciales = [];
    const innecesarios = [];
    const dudosos = [];
    
    archivosRaiz.forEach(archivo => {
        if (esArchivoEsencial(archivo)) {
            esenciales.push(archivo);
        } else if (esArchivoInnecesario(archivo)) {
            innecesarios.push(archivo);
        } else {
            dudosos.push(archivo);
        }
    });
    
    console.log(`✅ Archivos esenciales encontrados: ${esenciales.length}`);
    esenciales.forEach(archivo => console.log(`   - ${archivo}`));
    
    console.log(`\n🗑️  Archivos innecesarios encontrados: ${innecesarios.length}`);
    innecesarios.slice(0, 10).forEach(archivo => console.log(`   - ${archivo}`));
    if (innecesarios.length > 10) {
        console.log(`   ... y ${innecesarios.length - 10} más`);
    }
    
    console.log(`\n❓ Archivos dudosos encontrados: ${dudosos.length}`);
    dudosos.forEach(archivo => console.log(`   - ${archivo}`));
    
    return { esenciales, innecesarios, dudosos };
}

function main() {
    try {
        const analisis = analizarArchivos();
        
        console.log('\n🎯 RESUMEN DE LIMPIEZA REQUERIDA:');
        console.log(`- Mantener: ${analisis.esenciales.length} archivos esenciales`);
        console.log(`- Eliminar: ${analisis.innecesarios.length} archivos innecesarios`);
        console.log(`- Revisar: ${analisis.dudosos.length} archivos dudosos`);
        
        console.log('\n✅ ANÁLISIS COMPLETADO');
        console.log('📝 Próximo paso: Ejecutar limpieza automática');
        
    } catch (error) {
        console.error('❌ Error durante el análisis:', error.message);
    }
}

if (require.main === module) {
    main();
}

module.exports = { analizarArchivos, esArchivoEsencial, esArchivoInnecesario };
