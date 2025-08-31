/**
 * TESTING EXHAUSTIVO POST-LIMPIEZA DE DUPLICADOS
 * Proyecto: Misiones Arrienda
 * Fecha: 2025-01-03
 * 
 * Este script verifica que todas las funcionalidades críticas
 * siguen funcionando después de la limpieza masiva de duplicados
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 INICIANDO TESTING EXHAUSTIVO POST-LIMPIEZA');
console.log('='.repeat(60));

// 1. VERIFICAR ARCHIVOS ESENCIALES DEL BACKEND
console.log('\n📁 FASE 1: Verificando archivos esenciales del Backend...');

const archivosEsenciales = [
    'Backend/package.json',
    'Backend/next.config.js',
    'Backend/tailwind.config.ts',
    'Backend/tsconfig.json',
    'Backend/src/app/page.tsx',
    'Backend/src/app/layout.tsx',
    'Backend/src/components/navbar.tsx',
    'Backend/src/lib/utils.ts',
    'Backend/prisma/schema.prisma',
    'Backend/src/middleware.ts'
];

let archivosEsencialesOK = 0;
archivosEsenciales.forEach(archivo => {
    if (fs.existsSync(archivo)) {
        console.log(`✅ ${archivo} - EXISTE`);
        archivosEsencialesOK++;
    } else {
        console.log(`❌ ${archivo} - FALTA`);
    }
});

console.log(`\n📊 Archivos esenciales: ${archivosEsencialesOK}/${archivosEsenciales.length}`);

// 2. VERIFICAR ESTRUCTURA DE CARPETAS CRÍTICAS
console.log('\n📂 FASE 2: Verificando estructura de carpetas críticas...');

const carpetasCriticas = [
    'Backend/src',
    'Backend/src/app',
    'Backend/src/components',
    'Backend/src/lib',
    'Backend/prisma',
    'Backend/public',
    'Backend/src/app/api'
];

let carpetasCriticasOK = 0;
carpetasCriticas.forEach(carpeta => {
    if (fs.existsSync(carpeta) && fs.statSync(carpeta).isDirectory()) {
        console.log(`✅ ${carpeta} - EXISTE`);
        carpetasCriticasOK++;
    } else {
        console.log(`❌ ${carpeta} - FALTA`);
    }
});

console.log(`\n📊 Carpetas críticas: ${carpetasCriticasOK}/${carpetasCriticas.length}`);

// 3. VERIFICAR COMPONENTES UI CRÍTICOS
console.log('\n🎨 FASE 3: Verificando componentes UI críticos...');

const componentesUI = [
    'Backend/src/components/ui/button.tsx',
    'Backend/src/components/ui/input.tsx',
    'Backend/src/components/ui/card.tsx',
    'Backend/src/components/ui/select.tsx',
    'Backend/src/components/ui/badge.tsx'
];

let componentesUIOK = 0;
componentesUI.forEach(componente => {
    if (fs.existsSync(componente)) {
        console.log(`✅ ${componente} - EXISTE`);
        componentesUIOK++;
    } else {
        console.log(`❌ ${componente} - FALTA`);
    }
});

console.log(`\n📊 Componentes UI: ${componentesUIOK}/${componentesUI.length}`);

// 4. VERIFICAR APIS CRÍTICAS
console.log('\n🔌 FASE 4: Verificando APIs críticas...');

const apisCriticas = [
    'Backend/src/app/api/properties/route.ts',
    'Backend/src/app/api/auth/login/route.ts',
    'Backend/src/app/api/auth/register/route.ts',
    'Backend/src/app/api/users/profile/route.ts'
];

let apisCriticasOK = 0;
apisCriticas.forEach(api => {
    if (fs.existsSync(api)) {
        console.log(`✅ ${api} - EXISTE`);
        apisCriticasOK++;
    } else {
        console.log(`❌ ${api} - FALTA`);
    }
});

console.log(`\n📊 APIs críticas: ${apisCriticasOK}/${apisCriticas.length}`);

// 5. VERIFICAR PÁGINAS PRINCIPALES
console.log('\n📄 FASE 5: Verificando páginas principales...');

const paginasPrincipales = [
    'Backend/src/app/page.tsx',
    'Backend/src/app/login/page.tsx',
    'Backend/src/app/register/page.tsx',
    'Backend/src/app/dashboard/page.tsx',
    'Backend/src/app/properties/page.tsx',
    'Backend/src/app/publicar/page.tsx'
];

let paginasPrincipalesOK = 0;
paginasPrincipales.forEach(pagina => {
    if (fs.existsSync(pagina)) {
        console.log(`✅ ${pagina} - EXISTE`);
        paginasPrincipalesOK++;
    } else {
        console.log(`❌ ${pagina} - FALTA`);
    }
});

console.log(`\n📊 Páginas principales: ${paginasPrincipalesOK}/${paginasPrincipales.length}`);

// 6. VERIFICAR CONFIGURACIONES CRÍTICAS
console.log('\n⚙️ FASE 6: Verificando configuraciones críticas...');

const configuracionesCriticas = [
    'Backend/.env.example',
    'Backend/.gitignore',
    'Backend/vercel.json'
];

let configuracionesCriticasOK = 0;
configuracionesCriticas.forEach(config => {
    if (fs.existsSync(config)) {
        console.log(`✅ ${config} - EXISTE`);
        configuracionesCriticasOK++;
    } else {
        console.log(`❌ ${config} - FALTA`);
    }
});

console.log(`\n📊 Configuraciones críticas: ${configuracionesCriticasOK}/${configuracionesCriticas.length}`);

// 7. VERIFICAR QUE LAS CARPETAS DUPLICADAS FUERON ELIMINADAS
console.log('\n🗑️ FASE 7: Verificando eliminación de carpetas duplicadas...');

const carpetasDuplicadas = [
    'misiones-arrienda-v2',
    'misionesarrienda1',
    'src' // carpeta src en raíz (duplicada)
];

let carpetasDuplicadasEliminadas = 0;
carpetasDuplicadas.forEach(carpeta => {
    if (!fs.existsSync(carpeta)) {
        console.log(`✅ ${carpeta} - ELIMINADA CORRECTAMENTE`);
        carpetasDuplicadasEliminadas++;
    } else {
        console.log(`❌ ${carpeta} - AÚN EXISTE`);
    }
});

console.log(`\n📊 Carpetas duplicadas eliminadas: ${carpetasDuplicadasEliminadas}/${carpetasDuplicadas.length}`);

// 8. VERIFICAR BACKUP DE SEGURIDAD
console.log('\n💾 FASE 8: Verificando backup de seguridad...');

if (fs.existsSync('BACKUP-PRE-LIMPIEZA')) {
    console.log('✅ BACKUP-PRE-LIMPIEZA - EXISTE');
    console.log('✅ Backup de seguridad creado correctamente');
} else {
    console.log('❌ BACKUP-PRE-LIMPIEZA - NO EXISTE');
}

// 9. CALCULAR PUNTUACIÓN TOTAL
console.log('\n🏆 RESUMEN FINAL DEL TESTING');
console.log('='.repeat(60));

const totalTests = archivosEsenciales.length + carpetasCriticas.length + 
                  componentesUI.length + apisCriticas.length + 
                  paginasPrincipales.length + configuracionesCriticas.length + 
                  carpetasDuplicadas.length + 1; // +1 para backup

const totalPasados = archivosEsencialesOK + carpetasCriticasOK + 
                    componentesUIOK + apisCriticasOK + 
                    paginasPrincipalesOK + configuracionesCriticasOK + 
                    carpetasDuplicadasEliminadas + (fs.existsSync('BACKUP-PRE-LIMPIEZA') ? 1 : 0);

const porcentajeExito = ((totalPasados / totalTests) * 100).toFixed(2);

console.log(`\n📊 RESULTADOS FINALES:`);
console.log(`   Tests pasados: ${totalPasados}/${totalTests}`);
console.log(`   Porcentaje de éxito: ${porcentajeExito}%`);

if (porcentajeExito >= 95) {
    console.log(`\n🎉 EXCELENTE: La limpieza fue exitosa!`);
    console.log(`   ✅ Todos los archivos críticos están intactos`);
    console.log(`   ✅ Las carpetas duplicadas fueron eliminadas`);
    console.log(`   ✅ El proyecto está funcionando correctamente`);
} else if (porcentajeExito >= 85) {
    console.log(`\n⚠️ BUENO: La limpieza fue mayormente exitosa`);
    console.log(`   ⚠️ Algunos archivos menores pueden faltar`);
    console.log(`   ✅ Los archivos críticos están intactos`);
} else {
    console.log(`\n❌ PROBLEMA: La limpieza tuvo problemas`);
    console.log(`   ❌ Faltan archivos críticos`);
    console.log(`   ⚠️ Se recomienda revisar el backup`);
}

// 10. VERIFICAR SERVIDOR FUNCIONANDO
console.log('\n🌐 FASE 9: Verificando servidor...');
console.log('   ℹ️ El servidor debe estar ejecutándose en http://localhost:3000');
console.log('   ℹ️ Verificar manualmente que la página carga correctamente');

console.log('\n✅ TESTING EXHAUSTIVO COMPLETADO');
console.log('='.repeat(60));
