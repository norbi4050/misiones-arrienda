/**
 * DIAGNÓSTICO FINAL: Error 500 Internal Server Error
 * Identifica la causa raíz del error del servidor
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO ERROR 500 - ANÁLISIS COMPLETO\n');

// 1. Verificar archivos críticos que pueden causar error 500
console.log('1️⃣ VERIFICACIÓN DE ARCHIVOS CRÍTICOS:');

const criticalFiles = [
  { file: 'src/app/layout.tsx', desc: 'Layout principal' },
  { file: 'src/app/page.tsx', desc: 'Página principal' },
  { file: 'src/middleware.ts', desc: 'Middleware de Next.js' },
  { file: 'src/components/auth-provider.tsx', desc: 'Proveedor de autenticación' },
  { file: 'src/lib/supabase/server.ts', desc: 'Cliente servidor Supabase' }
];

criticalFiles.forEach(({ file, desc }) => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    console.log(`✅ ${file} (${desc})`);
    
    // Verificar imports problemáticos
    const problematicImports = [
      'getBrowserSupabase',
      'getSupabaseClient',
      'createClient'
    ];
    
    problematicImports.forEach(imp => {
      if (content.includes(imp)) {
        console.log(`   📍 Usa: ${imp}`);
      }
    });
    
    // Verificar errores de sintaxis obvios
    const syntaxIssues = [
      { pattern: /import.*from.*['""][^'"]*['""](?!\s*;)/, desc: 'Import sin punto y coma' },
      { pattern: /export.*{[^}]*$/, desc: 'Export incompleto' },
      { pattern: /function.*{[^}]*$/, desc: 'Función sin cerrar' }
    ];
    
    syntaxIssues.forEach(({ pattern, desc }) => {
      if (pattern.test(content)) {
        console.log(`   ⚠️ Posible problema: ${desc}`);
      }
    });
    
  } else {
    console.log(`❌ ${file}: NO ENCONTRADO`);
  }
});

// 2. Verificar variables de entorno
console.log('\n2️⃣ VERIFICACIÓN DE VARIABLES DE ENTORNO:');

const envFile = path.join(__dirname, '.env.local');
if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  console.log('✅ .env.local encontrado');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredVars.forEach(varName => {
    if (envContent.includes(varName)) {
      const line = envContent.split('\n').find(l => l.startsWith(varName));
      const hasValue = line && line.includes('=') && line.split('=')[1].trim();
      console.log(`   ${varName}: ${hasValue ? '✅ Configurado' : '❌ Vacío'}`);
    } else {
      console.log(`   ${varName}: ❌ No encontrado`);
    }
  });
} else {
  console.log('❌ .env.local no encontrado');
}

// 3. Verificar package.json y scripts
console.log('\n3️⃣ VERIFICACIÓN DE PACKAGE.JSON:');

const packagePath = path.join(__dirname, 'package.json');
if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  console.log('✅ package.json encontrado');
  
  // Verificar scripts
  const scripts = pkg.scripts || {};
  console.log('📋 Scripts disponibles:');
  Object.entries(scripts).forEach(([name, script]) => {
    console.log(`   ${name}: ${script}`);
  });
  
  // Verificar versiones críticas
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const criticalDeps = ['next', 'react', '@supabase/ssr'];
  
  console.log('📦 Versiones críticas:');
  criticalDeps.forEach(dep => {
    console.log(`   ${dep}: ${deps[dep] || 'NO INSTALADO'}`);
  });
}

// 4. Verificar configuración de TypeScript
console.log('\n4️⃣ VERIFICACIÓN DE TYPESCRIPT:');

const tsconfigPath = path.join(__dirname, 'tsconfig.json');
if (fs.existsSync(tsconfigPath)) {
  const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
  console.log('✅ tsconfig.json encontrado');
  
  const compilerOptions = tsconfig.compilerOptions || {};
  const importantOptions = [
    'moduleResolution',
    'allowSyntheticDefaultImports',
    'esModuleInterop',
    'jsx'
  ];
  
  console.log('⚙️ Opciones importantes:');
  importantOptions.forEach(option => {
    console.log(`   ${option}: ${compilerOptions[option] || 'No configurado'}`);
  });
}

// 5. Análisis de posibles causas del error 500
console.log('\n5️⃣ ANÁLISIS DE CAUSAS PROBABLES:');

const possibleCauses = [
  {
    cause: 'Error en auth-provider.tsx',
    probability: 'ALTA',
    reason: 'Refactor reciente de getBrowserSupabase',
    solution: 'Verificar imports y inicialización'
  },
  {
    cause: 'Variables de entorno faltantes',
    probability: 'ALTA',
    reason: 'Supabase requiere configuración específica',
    solution: 'Verificar .env.local'
  },
  {
    cause: 'Error en middleware.ts',
    probability: 'MEDIA',
    reason: 'Middleware puede bloquear todas las rutas',
    solution: 'Revisar lógica de middleware'
  },
  {
    cause: 'Problema de compilación TypeScript',
    probability: 'MEDIA',
    reason: 'Errores de tipos pueden causar runtime errors',
    solution: 'Ejecutar npx tsc --noEmit'
  },
  {
    cause: 'Cache corrupto de Next.js',
    probability: 'BAJA',
    reason: 'Cache ya fue limpiado anteriormente',
    solution: 'Reiniciar servidor completamente'
  }
];

possibleCauses.forEach(({ cause, probability, reason, solution }) => {
  console.log(`\n🔍 ${cause}`);
  console.log(`   Probabilidad: ${probability}`);
  console.log(`   Razón: ${reason}`);
  console.log(`   Solución: ${solution}`);
});

// 6. Plan de acción paso a paso
console.log('\n6️⃣ PLAN DE ACCIÓN PASO A PASO:');

const actionPlan = [
  '1. Detener servidor actual (Ctrl+C en terminal npm run dev)',
  '2. Verificar errores de TypeScript: npx tsc --noEmit',
  '3. Verificar variables de entorno en .env.local',
  '4. Revisar logs del servidor al reiniciar',
  '5. Probar con logging adicional en auth-provider',
  '6. Si persiste, revisar middleware.ts',
  '7. Como último recurso, rollback temporal del refactor'
];

actionPlan.forEach(action => console.log(`   ${action}`));

// 7. Comandos de debugging
console.log('\n7️⃣ COMANDOS DE DEBUGGING:');

const debugCommands = [
  'npm run dev 2>&1 | tee server-logs.txt',
  'npx tsc --noEmit --pretty',
  'npx next lint',
  'node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"'
];

console.log('💻 Ejecutar en orden:');
debugCommands.forEach((cmd, i) => console.log(`   ${i + 1}. ${cmd}`));

console.log('\n✅ DIAGNÓSTICO COMPLETADO');
console.log('🎯 PRIORIDAD: Resolver error 500 antes de continuar con optimizaciones');
