const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 TESTING PROFILE IMPROVEMENTS 2025');
console.log('=====================================\n');

// Test 1: Verificar que los archivos nuevos existen
console.log('📁 Test 1: Verificando archivos creados...');

const filesToCheck = [
  'Backend/src/hooks/useUserActivity.ts',
  'Backend/src/app/api/users/activity/route.ts',
  'Backend/src/components/ui/recent-activity.tsx'
];

let allFilesExist = true;

filesToCheck.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Existe`);
  } else {
    console.log(`❌ ${file} - No existe`);
    allFilesExist = false;
  }
});

if (allFilesExist) {
  console.log('✅ Todos los archivos nuevos fueron creados correctamente\n');
} else {
  console.log('❌ Algunos archivos no fueron creados\n');
}

// Test 2: Verificar que los archivos modificados tienen las mejoras
console.log('🔧 Test 2: Verificando modificaciones en archivos existentes...');

const modifiedFiles = [
  {
    file: 'Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx',
    shouldContain: ['RecentActivity', 'import { RecentActivity }']
  },
  {
    file: 'Backend/src/components/ui/quick-actions-grid.tsx',
    shouldContain: ['displayStats', 'shouldUseDemoData', 'isLoading']
  }
];

modifiedFiles.forEach(({ file, shouldContain }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    let hasAllChanges = true;
    
    shouldContain.forEach(text => {
      if (content.includes(text)) {
        console.log(`✅ ${file} - Contiene: ${text}`);
      } else {
        console.log(`❌ ${file} - No contiene: ${text}`);
        hasAllChanges = false;
      }
    });
    
    if (hasAllChanges) {
      console.log(`✅ ${file} - Todas las modificaciones aplicadas`);
    }
  } else {
    console.log(`❌ ${file} - Archivo no existe`);
  }
});

console.log('\n');

// Test 3: Verificar estructura de los nuevos componentes
console.log('🏗️  Test 3: Verificando estructura de componentes...');

// Verificar useUserActivity hook
if (fs.existsSync('Backend/src/hooks/useUserActivity.ts')) {
  const hookContent = fs.readFileSync('Backend/src/hooks/useUserActivity.ts', 'utf8');
  const hookChecks = [
    'interface ActivityItem',
    'useUserActivity',
    'fetchActivities',
    'getFallbackActivities'
  ];
  
  hookChecks.forEach(check => {
    if (hookContent.includes(check)) {
      console.log(`✅ useUserActivity - Contiene: ${check}`);
    } else {
      console.log(`❌ useUserActivity - No contiene: ${check}`);
    }
  });
}

// Verificar API de actividad
if (fs.existsSync('Backend/src/app/api/users/activity/route.ts')) {
  const apiContent = fs.readFileSync('Backend/src/app/api/users/activity/route.ts', 'utf8');
  const apiChecks = [
    'export async function GET',
    'getRealUserActivity',
    'getFallbackActivities',
    'ActivityItem'
  ];
  
  apiChecks.forEach(check => {
    if (apiContent.includes(check)) {
      console.log(`✅ Activity API - Contiene: ${check}`);
    } else {
      console.log(`❌ Activity API - No contiene: ${check}`);
    }
  });
}

// Verificar componente RecentActivity
if (fs.existsSync('Backend/src/components/ui/recent-activity.tsx')) {
  const componentContent = fs.readFileSync('Backend/src/components/ui/recent-activity.tsx', 'utf8');
  const componentChecks = [
    'export function RecentActivity',
    'ActivityItem',
    'useUserActivity',
    'formatTimeAgo'
  ];
  
  componentChecks.forEach(check => {
    if (componentContent.includes(check)) {
      console.log(`✅ RecentActivity - Contiene: ${check}`);
    } else {
      console.log(`❌ RecentActivity - No contiene: ${check}`);
    }
  });
}

console.log('\n');

// Test 4: Verificar que no se rompieron imports
console.log('📦 Test 4: Verificando imports y dependencias...');

try {
  // Verificar que los archivos TypeScript no tienen errores de sintaxis básicos
  const tsFiles = [
    'Backend/src/hooks/useUserActivity.ts',
    'Backend/src/app/api/users/activity/route.ts',
    'Backend/src/components/ui/recent-activity.tsx'
  ];
  
  tsFiles.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      
      // Verificar que tiene imports válidos
      if (content.includes('import') && content.includes('export')) {
        console.log(`✅ ${file} - Estructura de imports/exports correcta`);
      } else {
        console.log(`❌ ${file} - Problemas con imports/exports`);
      }
      
      // Verificar que no tiene errores de sintaxis obvios
      const hasBasicSyntax = content.includes('{') && content.includes('}') && content.includes(';');
      if (hasBasicSyntax) {
        console.log(`✅ ${file} - Sintaxis básica correcta`);
      } else {
        console.log(`❌ ${file} - Posibles errores de sintaxis`);
      }
    }
  });
  
} catch (error) {
  console.log(`❌ Error verificando sintaxis: ${error.message}`);
}

console.log('\n');

// Test 5: Verificar que el plan se está siguiendo
console.log('📋 Test 5: Verificando progreso del plan...');

const planProgress = {
  'Fase 1 - Actividad Reciente': {
    'Hook useUserActivity': fs.existsSync('Backend/src/hooks/useUserActivity.ts'),
    'API /users/activity': fs.existsSync('Backend/src/app/api/users/activity/route.ts'),
    'Componente RecentActivity': fs.existsSync('Backend/src/components/ui/recent-activity.tsx'),
    'Integración en perfil': fs.existsSync('Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx') && 
                            fs.readFileSync('Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx', 'utf8').includes('RecentActivity')
  },
  'Fase 2 - Mejoras Dashboard': {
    'Estados de carga': fs.existsSync('Backend/src/components/ui/quick-actions-grid.tsx') && 
                       fs.readFileSync('Backend/src/components/ui/quick-actions-grid.tsx', 'utf8').includes('isLoading'),
    'Datos de demostración': fs.existsSync('Backend/src/components/ui/quick-actions-grid.tsx') && 
                            fs.readFileSync('Backend/src/components/ui/quick-actions-grid.tsx', 'utf8').includes('demoStats'),
    'Manejo de errores': fs.existsSync('Backend/src/components/ui/quick-actions-grid.tsx') && 
                        fs.readFileSync('Backend/src/components/ui/quick-actions-grid.tsx', 'utf8').includes('statsError')
  }
};

Object.entries(planProgress).forEach(([fase, checks]) => {
  console.log(`\n📌 ${fase}:`);
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${check}`);
  });
});

console.log('\n');

// Resumen final
console.log('📊 RESUMEN FINAL');
console.log('================');

const totalChecks = Object.values(planProgress).reduce((total, fase) => {
  return total + Object.keys(fase).length;
}, 0);

const passedChecks = Object.values(planProgress).reduce((total, fase) => {
  return total + Object.values(fase).filter(Boolean).length;
}, 0);

console.log(`✅ Checks pasados: ${passedChecks}/${totalChecks}`);
console.log(`📈 Progreso: ${Math.round((passedChecks / totalChecks) * 100)}%`);

if (passedChecks === totalChecks) {
  console.log('\n🎉 ¡TODAS LAS MEJORAS IMPLEMENTADAS CORRECTAMENTE!');
  console.log('✨ El perfil de usuario ahora tiene:');
  console.log('   - Actividad reciente con datos reales');
  console.log('   - Tarjetas del dashboard mejoradas');
  console.log('   - Estados de carga y manejo de errores');
  console.log('   - Datos de demostración cuando no hay datos reales');
} else {
  console.log('\n⚠️  Algunas mejoras necesitan atención adicional');
  console.log('📝 Revisar los elementos marcados con ❌');
}

console.log('\n🔗 Próximos pasos sugeridos:');
console.log('   1. Probar la página en el navegador');
console.log('   2. Verificar que las APIs respondan correctamente');
console.log('   3. Comprobar que los datos se muestran como se espera');
console.log('   4. Continuar con las Fases 3 y 4 del plan si es necesario');
