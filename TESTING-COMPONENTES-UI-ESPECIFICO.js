const fs = require('fs');
const path = require('path');

console.log('========================================');
console.log('🔍 TESTING ESPECÍFICO COMPONENTES UI');
console.log('========================================');

// Lista completa de componentes UI esperados
const componentesEsperados = [
    'Backend/src/components/ui/button.tsx',
    'Backend/src/components/ui/input.tsx',
    'Backend/src/components/ui/card.tsx',
    'Backend/src/components/ui/select.tsx',
    'Backend/src/components/ui/badge.tsx',
    'Backend/src/components/ui/textarea.tsx',
    'Backend/src/components/ui/label.tsx',
    'Backend/src/components/ui/checkbox.tsx',
    'Backend/src/components/ui/tabs.tsx',
    'Backend/src/components/ui/progress.tsx',
    'Backend/src/components/ui/modal.tsx',
    'Backend/src/components/ui/toast.tsx',
    'Backend/src/components/ui/dropdown.tsx',
    'Backend/src/components/ui/spinner.tsx',
    'Backend/src/components/ui/tooltip.tsx',
    'Backend/src/components/ui/image-upload.tsx'
];

console.log('\n📋 VERIFICANDO COMPONENTES UI...');

let componentesEncontrados = 0;
let componentesFaltantes = [];

componentesEsperados.forEach((componente, index) => {
    const existe = fs.existsSync(componente);
    if (existe) {
        const content = fs.readFileSync(componente, 'utf8');
        const lineas = content.split('\n').length;
        console.log(`✅ ${index + 1}. ${path.basename(componente)} (${lineas} líneas)`);
        componentesEncontrados++;
    } else {
        console.log(`❌ ${index + 1}. ${path.basename(componente)} - FALTANTE`);
        componentesFaltantes.push(componente);
    }
});

console.log('\n========================================');
console.log('📊 RESUMEN COMPONENTES UI');
console.log('========================================');

console.log(`\n✅ Componentes encontrados: ${componentesEncontrados}/${componentesEsperados.length}`);
console.log(`❌ Componentes faltantes: ${componentesFaltantes.length}`);

const porcentaje = Math.round((componentesEncontrados / componentesEsperados.length) * 100);
console.log(`📊 Porcentaje completado: ${porcentaje}%`);

if (componentesFaltantes.length > 0) {
    console.log('\n🔧 COMPONENTES FALTANTES:');
    componentesFaltantes.forEach((componente, index) => {
        console.log(`   ${index + 1}. ${path.basename(componente)}`);
    });
}

// Verificar componentes recién creados
console.log('\n🔍 VERIFICANDO COMPONENTES RECIÉN CREADOS...');
const componentesNuevos = [
    'Backend/src/components/ui/modal.tsx',
    'Backend/src/components/ui/toast.tsx',
    'Backend/src/components/ui/dropdown.tsx',
    'Backend/src/components/ui/spinner.tsx',
    'Backend/src/components/ui/tooltip.tsx'
];

componentesNuevos.forEach(componente => {
    if (fs.existsSync(componente)) {
        const content = fs.readFileSync(componente, 'utf8');
        const lineas = content.split('\n').length;
        console.log(`✅ ${path.basename(componente)} creado exitosamente (${lineas} líneas)`);
    } else {
        console.log(`❌ ${path.basename(componente)} no se creó correctamente`);
    }
});

console.log('\n========================================');
console.log('✅ TESTING ESPECÍFICO COMPLETADO');
console.log('========================================');
