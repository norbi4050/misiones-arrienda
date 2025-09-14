const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO FASE 3: MEJORAS EN PROFILE STATS');
console.log('=' .repeat(60));

// Verificar que los archivos existen
const filesToCheck = [
  'Backend/src/components/ui/profile-stats-enhanced.tsx',
  'Backend/src/components/ui/profile-stats.tsx', // Original debe existir
  'Backend/src/hooks/useUserStats.ts',
  'Backend/src/hooks/useUserFavorites.ts'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - EXISTE`);
  } else {
    console.log(`❌ ${file} - NO EXISTE`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ FALTAN ARCHIVOS CRÍTICOS');
  process.exit(1);
}

// Verificar contenido del componente mejorado
console.log('\n📋 VERIFICANDO CONTENIDO DEL COMPONENTE MEJORADO:');

const enhancedStatsContent = fs.readFileSync('Backend/src/components/ui/profile-stats-enhanced.tsx', 'utf8');

const requiredFeatures = [
  { name: 'Estados de carga', pattern: /isLoading.*?Loader2.*?animate-spin/s },
  { name: 'Mensajes motivacionales', pattern: /motivationalMessage/s },
  { name: 'Manejo de errores mejorado', pattern: /AlertCircle.*?Problema cargando/s },
  { name: 'Integración con hooks', pattern: /useUserStats.*?useUserFavorites/s },
  { name: 'Layout compacto mejorado', pattern: /layout === 'compact'/s },
  { name: 'Componente detallado', pattern: /ProfileStatsDetailed/s },
  { name: 'Logros y achievements', pattern: /achievements.*?earned/s }
];

let featuresImplemented = 0;

requiredFeatures.forEach(feature => {
  if (feature.pattern.test(enhancedStatsContent)) {
    console.log(`✅ ${feature.name} - IMPLEMENTADO`);
    featuresImplemented++;
  } else {
    console.log(`❌ ${feature.name} - NO ENCONTRADO`);
  }
});

// Verificar estructura de TypeScript
console.log('\n🔧 VERIFICANDO ESTRUCTURA TYPESCRIPT:');

const tsFeatures = [
  { name: 'Interfaces definidas', pattern: /interface.*?Props/s },
  { name: 'Tipos opcionales', pattern: /\?\s*:/g },
  { name: 'Componentes tipados', pattern: /React\.ElementType/s },
  { name: 'Props con defaults', pattern: /= 'grid'/s }
];

tsFeatures.forEach(feature => {
  if (feature.pattern.test(enhancedStatsContent)) {
    console.log(`✅ ${feature.name} - CORRECTO`);
  } else {
    console.log(`❌ ${feature.name} - PROBLEMA`);
  }
});

// Verificar que no rompe la compatibilidad
console.log('\n🔄 VERIFICANDO COMPATIBILIDAD:');

const originalStatsContent = fs.readFileSync('Backend/src/components/ui/profile-stats.tsx', 'utf8');

if (originalStatsContent.includes('export function ProfileStats')) {
  console.log('✅ Componente original preservado');
} else {
  console.log('❌ Componente original modificado');
}

if (enhancedStatsContent.includes('export function ProfileStatsEnhanced')) {
  console.log('✅ Nuevo componente exportado correctamente');
} else {
  console.log('❌ Nuevo componente no exportado');
}

// Verificar hooks
console.log('\n🎣 VERIFICANDO HOOKS:');

const userStatsContent = fs.readFileSync('Backend/src/hooks/useUserStats.ts', 'utf8');
const userFavoritesContent = fs.readFileSync('Backend/src/hooks/useUserFavorites.ts', 'utf8');

if (userStatsContent.includes('loading') && userStatsContent.includes('error')) {
  console.log('✅ useUserStats tiene estados de loading y error');
} else {
  console.log('❌ useUserStats falta estados');
}

if (userFavoritesContent.includes('favoritesCount')) {
  console.log('✅ useUserFavorites exporta favoritesCount');
} else {
  console.log('❌ useUserFavorites no exporta favoritesCount');
}

// Resumen final
console.log('\n📊 RESUMEN FASE 3:');
console.log(`✅ Características implementadas: ${featuresImplemented}/${requiredFeatures.length}`);

if (featuresImplemented >= requiredFeatures.length * 0.8) {
  console.log('🎉 FASE 3 COMPLETADA EXITOSAMENTE');
  console.log('\n📝 PRÓXIMOS PASOS:');
  console.log('1. Integrar ProfileStatsEnhanced en InquilinoProfilePage');
  console.log('2. Probar en navegador');
  console.log('3. Proceder con Fase 4 (Verificación de APIs)');
} else {
  console.log('⚠️  FASE 3 NECESITA MEJORAS');
  console.log('Revisar características faltantes antes de continuar');
}

console.log('\n' + '='.repeat(60));
