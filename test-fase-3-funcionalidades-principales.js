/**
 * FASE 3.1: TESTING INTEGRAL DE FUNCIONALIDADES PRINCIPALES
 * Script completo para verificar todas las funcionalidades core del proyecto
 * Misiones Arrienda - 2025
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(80));
  log(title, 'bold');
  console.log('='.repeat(80));
}

function logSubSection(title) {
  console.log('\n' + '-'.repeat(60));
  log(title, 'cyan');
  console.log('-'.repeat(60));
}

// Función para verificar archivos críticos
function checkCriticalFiles() {
  logSubSection('VERIFICACIÓN DE ARCHIVOS CRÍTICOS');
  
  const criticalFiles = [
    // Autenticación
    { path: 'Backend/src/hooks/useSupabaseAuth.ts', description: 'Hook de autenticación' },
    { path: 'Backend/src/components/auth-provider.tsx', description: 'Provider de autenticación' },
    { path: 'Backend/src/contexts/UserContext.tsx', description: 'Contexto de usuario' },
    
    // APIs principales
    { path: 'Backend/src/app/api/users/favorites/route.ts', description: 'API de favoritos' },
    { path: 'Backend/src/app/api/users/stats/route.ts', description: 'API de estadísticas' },
    { path: 'Backend/src/app/api/users/profile/route.ts', description: 'API de perfil' },
    { path: 'Backend/src/app/api/properties/route.ts', description: 'API de propiedades' },
    
    // Páginas principales
    { path: 'Backend/src/app/dashboard/page.tsx', description: 'Dashboard principal' },
    { path: 'Backend/src/app/profile/inquilino/InquilinoProfilePageCorrected.tsx', description: 'Página de perfil' },
    
    // Componentes UI críticos
    { path: 'Backend/src/components/ui/avatar.tsx', description: 'Componente Avatar' },
    { path: 'Backend/src/components/user-menu.tsx', description: 'Menú de usuario' },
    
    // Configuración
    { path: 'Backend/src/lib/supabase/browser.ts', description: 'Cliente Supabase browser' },
    { path: 'Backend/src/lib/supabase/server.ts', description: 'Cliente Supabase server' }
  ];

  let filesFound = 0;
  let totalFiles = criticalFiles.length;

  criticalFiles.forEach(file => {
    const fullPath = path.join(__dirname, file.path);
    const exists = fs.existsSync(fullPath);
    
    if (exists) {
      log(`✅ ${file.description}`, 'green');
      filesFound++;
    } else {
      log(`❌ ${file.description} - ARCHIVO FALTANTE: ${file.path}`, 'red');
    }
  });

  const percentage = ((filesFound / totalFiles) * 100).toFixed(1);
  log(`\n📊 Archivos encontrados: ${filesFound}/${totalFiles} (${percentage}%)`, 
      percentage >= 90 ? 'green' : percentage >= 70 ? 'yellow' : 'red');

  return { filesFound, totalFiles, percentage: parseFloat(percentage) };
}

// Función para analizar APIs
function analyzeAPIs() {
  logSubSection('ANÁLISIS DE APIs PRINCIPALES');
  
  const apis = [
    {
      path: 'Backend/src/app/api/users/favorites/route.ts',
      name: 'Favoritos API',
      expectedMethods: ['GET', 'POST', 'DELETE'],
      criticalFeatures: ['auth.getUser', 'supabase.from', 'error handling']
    },
    {
      path: 'Backend/src/app/api/users/stats/route.ts',
      name: 'Estadísticas API',
      expectedMethods: ['GET'],
      criticalFeatures: ['auth.getUser', 'user statistics', 'error handling']
    },
    {
      path: 'Backend/src/app/api/users/profile/route.ts',
      name: 'Perfil API',
      expectedMethods: ['GET', 'PUT', 'PATCH'],
      criticalFeatures: ['auth.getUser', 'profile update', 'validation']
    },
    {
      path: 'Backend/src/app/api/properties/route.ts',
      name: 'Propiedades API',
      expectedMethods: ['GET', 'POST'],
      criticalFeatures: ['pagination', 'filters', 'search']
    }
  ];

  let totalScore = 0;
  let analyzedAPIs = 0;

  apis.forEach(api => {
    log(`\n🔍 Analizando: ${api.name}`, 'blue');
    
    const fullPath = path.join(__dirname, api.path);
    if (!fs.existsSync(fullPath)) {
      log(`❌ Archivo no encontrado: ${api.path}`, 'red');
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let score = 0;
      let maxScore = api.expectedMethods.length + api.criticalFeatures.length;

      // Verificar métodos HTTP
      api.expectedMethods.forEach(method => {
        if (content.includes(`export async function ${method}`)) {
          log(`  ✅ Método ${method} implementado`, 'green');
          score++;
        } else {
          log(`  ❌ Método ${method} faltante`, 'red');
        }
      });

      // Verificar características críticas
      api.criticalFeatures.forEach(feature => {
        if (content.includes(feature) || content.includes(feature.replace(/\s+/g, ''))) {
          log(`  ✅ ${feature} implementado`, 'green');
          score++;
        } else {
          log(`  ⚠️  ${feature} no encontrado`, 'yellow');
        }
      });

      const apiScore = (score / maxScore * 100).toFixed(1);
      log(`  📊 Score: ${apiScore}%`, apiScore >= 80 ? 'green' : apiScore >= 60 ? 'yellow' : 'red');
      
      totalScore += parseFloat(apiScore);
      analyzedAPIs++;

    } catch (error) {
      log(`❌ Error leyendo ${api.name}: ${error.message}`, 'red');
    }
  });

  const averageScore = analyzedAPIs > 0 ? (totalScore / analyzedAPIs).toFixed(1) : 0;
  log(`\n📈 Score promedio de APIs: ${averageScore}%`, 
      averageScore >= 80 ? 'green' : averageScore >= 60 ? 'yellow' : 'red');

  return { averageScore: parseFloat(averageScore), analyzedAPIs, totalAPIs: apis.length };
}

// Función para verificar autenticación
function analyzeAuthentication() {
  logSubSection('ANÁLISIS DEL SISTEMA DE AUTENTICACIÓN');
  
  const authFiles = [
    {
      path: 'Backend/src/hooks/useSupabaseAuth.ts',
      name: 'Hook de Autenticación',
      features: ['useEffect', 'useState', 'auth.onAuthStateChange', 'getSession']
    },
    {
      path: 'Backend/src/components/auth-provider.tsx',
      name: 'Provider de Autenticación',
      features: ['AuthProvider', 'useContext', 'children', 'auth state']
    },
    {
      path: 'Backend/src/contexts/UserContext.tsx',
      name: 'Contexto de Usuario',
      features: ['createContext', 'UserProvider', 'useUser', 'profile data']
    }
  ];

  let totalAuthScore = 0;
  let analyzedAuthFiles = 0;

  authFiles.forEach(file => {
    log(`\n🔐 Analizando: ${file.name}`, 'blue');
    
    const fullPath = path.join(__dirname, file.path);
    if (!fs.existsSync(fullPath)) {
      log(`❌ Archivo no encontrado: ${file.path}`, 'red');
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let score = 0;
      let maxScore = file.features.length;

      file.features.forEach(feature => {
        if (content.includes(feature)) {
          log(`  ✅ ${feature} implementado`, 'green');
          score++;
        } else {
          log(`  ❌ ${feature} faltante`, 'red');
        }
      });

      const fileScore = (score / maxScore * 100).toFixed(1);
      log(`  📊 Score: ${fileScore}%`, fileScore >= 80 ? 'green' : fileScore >= 60 ? 'yellow' : 'red');
      
      totalAuthScore += parseFloat(fileScore);
      analyzedAuthFiles++;

    } catch (error) {
      log(`❌ Error leyendo ${file.name}: ${error.message}`, 'red');
    }
  });

  const authScore = analyzedAuthFiles > 0 ? (totalAuthScore / analyzedAuthFiles).toFixed(1) : 0;
  log(`\n🔒 Score de Autenticación: ${authScore}%`, 
      authScore >= 80 ? 'green' : authScore >= 60 ? 'yellow' : 'red');

  return { authScore: parseFloat(authScore), analyzedFiles: analyzedAuthFiles };
}

// Función para verificar componentes UI
function analyzeUIComponents() {
  logSubSection('ANÁLISIS DE COMPONENTES UI CRÍTICOS');
  
  const uiComponents = [
    {
      path: 'Backend/src/components/ui/avatar.tsx',
      name: 'Avatar Component',
      features: ['forwardRef', 'className', 'AvatarPrimitive', '@radix-ui']
    },
    {
      path: 'Backend/src/components/user-menu.tsx',
      name: 'User Menu',
      features: ['useUser', 'signOut', 'Avatar', 'profile?.profile_image']
    },
    {
      path: 'Backend/src/components/ui/profile-stats-enhanced.tsx',
      name: 'Profile Stats',
      features: ['stats', 'loading', 'error', 'useEffect']
    }
  ];

  let totalUIScore = 0;
  let analyzedUIComponents = 0;

  uiComponents.forEach(component => {
    log(`\n🎨 Analizando: ${component.name}`, 'blue');
    
    const fullPath = path.join(__dirname, component.path);
    if (!fs.existsSync(fullPath)) {
      log(`⚠️  Archivo no encontrado: ${component.path}`, 'yellow');
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let score = 0;
      let maxScore = component.features.length;

      component.features.forEach(feature => {
        if (content.includes(feature)) {
          log(`  ✅ ${feature} implementado`, 'green');
          score++;
        } else {
          log(`  ⚠️  ${feature} no encontrado`, 'yellow');
        }
      });

      const componentScore = (score / maxScore * 100).toFixed(1);
      log(`  📊 Score: ${componentScore}%`, componentScore >= 80 ? 'green' : componentScore >= 60 ? 'yellow' : 'red');
      
      totalUIScore += parseFloat(componentScore);
      analyzedUIComponents++;

    } catch (error) {
      log(`❌ Error leyendo ${component.name}: ${error.message}`, 'red');
    }
  });

  const uiScore = analyzedUIComponents > 0 ? (totalUIScore / analyzedUIComponents).toFixed(1) : 0;
  log(`\n🎨 Score de Componentes UI: ${uiScore}%`, 
      uiScore >= 80 ? 'green' : uiScore >= 60 ? 'yellow' : 'red');

  return { uiScore: parseFloat(uiScore), analyzedComponents: analyzedUIComponents };
}

// Función para verificar configuración de Supabase
function analyzeSupabaseConfig() {
  logSubSection('ANÁLISIS DE CONFIGURACIÓN SUPABASE');
  
  const supabaseFiles = [
    {
      path: 'Backend/src/lib/supabase/browser.ts',
      name: 'Cliente Browser',
      features: ['createBrowserClient', 'NEXT_PUBLIC_SUPABASE_URL', 'cookies']
    },
    {
      path: 'Backend/src/lib/supabase/server.ts',
      name: 'Cliente Server',
      features: ['createServerClient', 'cookies', 'CookieOptions']
    }
  ];

  let totalSupabaseScore = 0;
  let analyzedSupabaseFiles = 0;

  supabaseFiles.forEach(file => {
    log(`\n🗄️ Analizando: ${file.name}`, 'blue');
    
    const fullPath = path.join(__dirname, file.path);
    if (!fs.existsSync(fullPath)) {
      log(`❌ Archivo no encontrado: ${file.path}`, 'red');
      return;
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf8');
      let score = 0;
      let maxScore = file.features.length;

      file.features.forEach(feature => {
        if (content.includes(feature)) {
          log(`  ✅ ${feature} configurado`, 'green');
          score++;
        } else {
          log(`  ❌ ${feature} faltante`, 'red');
        }
      });

      const fileScore = (score / maxScore * 100).toFixed(1);
      log(`  📊 Score: ${fileScore}%`, fileScore >= 80 ? 'green' : fileScore >= 60 ? 'yellow' : 'red');
      
      totalSupabaseScore += parseFloat(fileScore);
      analyzedSupabaseFiles++;

    } catch (error) {
      log(`❌ Error leyendo ${file.name}: ${error.message}`, 'red');
    }
  });

  const supabaseScore = analyzedSupabaseFiles > 0 ? (totalSupabaseScore / analyzedSupabaseFiles).toFixed(1) : 0;
  log(`\n🗄️ Score de Configuración Supabase: ${supabaseScore}%`, 
      supabaseScore >= 80 ? 'green' : supabaseScore >= 60 ? 'yellow' : 'red');

  return { supabaseScore: parseFloat(supabaseScore), analyzedFiles: analyzedSupabaseFiles };
}

// Función para verificar migraciones SQL
function analyzeSQLMigrations() {
  logSubSection('ANÁLISIS DE MIGRACIONES SQL');
  
  const migrationFiles = [
    'Backend/FIX-CRITICO-RLS-USER-TABLE-2025.sql',
    'Backend/sql-migrations/setup-supabase-storage-and-rls.sql',
    'Backend/sql-migrations/normalize-avatar-field-2025.sql',
    'Backend/sql-migrations/fix-favorites-foreign-key-2025.sql'
  ];

  let migrationsFound = 0;
  let totalMigrations = migrationFiles.length;

  migrationFiles.forEach(file => {
    const fullPath = path.join(__dirname, file);
    const exists = fs.existsSync(fullPath);
    const fileName = path.basename(file);
    
    if (exists) {
      log(`✅ ${fileName}`, 'green');
      migrationsFound++;
      
      // Verificar contenido crítico
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('CREATE POLICY')) {
          log(`  ✅ Contiene políticas RLS`, 'green');
        }
        if (content.includes('ALTER TABLE')) {
          log(`  ✅ Contiene modificaciones de tabla`, 'green');
        }
      } catch (error) {
        log(`  ⚠️  Error leyendo contenido`, 'yellow');
      }
    } else {
      log(`❌ ${fileName} - FALTANTE`, 'red');
    }
  });

  const migrationScore = ((migrationsFound / totalMigrations) * 100).toFixed(1);
  log(`\n📊 Migraciones encontradas: ${migrationsFound}/${totalMigrations} (${migrationScore}%)`, 
      migrationScore >= 80 ? 'green' : migrationScore >= 60 ? 'yellow' : 'red');

  return { migrationScore: parseFloat(migrationScore), migrationsFound, totalMigrations };
}

// Función principal de testing
async function runComprehensiveTesting() {
  logSection('🔍 FASE 3.1: TESTING INTEGRAL DE FUNCIONALIDADES PRINCIPALES');
  log('Iniciando verificación exhaustiva del proyecto Misiones Arrienda...', 'blue');

  const results = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  try {
    // 1. Verificar archivos críticos
    log('\n📁 PASO 1: Verificación de archivos críticos', 'magenta');
    results.tests.criticalFiles = checkCriticalFiles();

    // 2. Analizar APIs
    log('\n🔌 PASO 2: Análisis de APIs principales', 'magenta');
    results.tests.apis = analyzeAPIs();

    // 3. Verificar autenticación
    log('\n🔐 PASO 3: Análisis del sistema de autenticación', 'magenta');
    results.tests.authentication = analyzeAuthentication();

    // 4. Analizar componentes UI
    log('\n🎨 PASO 4: Análisis de componentes UI', 'magenta');
    results.tests.uiComponents = analyzeUIComponents();

    // 5. Verificar configuración Supabase
    log('\n🗄️ PASO 5: Análisis de configuración Supabase', 'magenta');
    results.tests.supabaseConfig = analyzeSupabaseConfig();

    // 6. Verificar migraciones SQL
    log('\n📊 PASO 6: Análisis de migraciones SQL', 'magenta');
    results.tests.sqlMigrations = analyzeSQLMigrations();

    // Calcular score general
    const scores = [
      results.tests.criticalFiles.percentage,
      results.tests.apis.averageScore,
      results.tests.authentication.authScore,
      results.tests.uiComponents.uiScore,
      results.tests.supabaseConfig.supabaseScore,
      results.tests.sqlMigrations.migrationScore
    ].filter(score => score > 0);

    const overallScore = scores.length > 0 ? 
      (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : 0;

    results.overallScore = parseFloat(overallScore);

    // Mostrar resumen final
    logSection('📊 RESUMEN FINAL DEL TESTING');
    log(`Score General del Proyecto: ${overallScore}%`, 
        overallScore >= 85 ? 'green' : overallScore >= 70 ? 'yellow' : 'red');

    log('\n📋 Desglose por categoría:', 'bold');
    log(`  📁 Archivos Críticos: ${results.tests.criticalFiles.percentage}%`, 
        results.tests.criticalFiles.percentage >= 90 ? 'green' : 'yellow');
    log(`  🔌 APIs: ${results.tests.apis.averageScore}%`, 
        results.tests.apis.averageScore >= 80 ? 'green' : 'yellow');
    log(`  🔐 Autenticación: ${results.tests.authentication.authScore}%`, 
        results.tests.authentication.authScore >= 80 ? 'green' : 'yellow');
    log(`  🎨 Componentes UI: ${results.tests.uiComponents.uiScore}%`, 
        results.tests.uiComponents.uiScore >= 80 ? 'green' : 'yellow');
    log(`  🗄️ Supabase Config: ${results.tests.supabaseConfig.supabaseScore}%`, 
        results.tests.supabaseConfig.supabaseScore >= 80 ? 'green' : 'yellow');
    log(`  📊 Migraciones SQL: ${results.tests.sqlMigrations.migrationScore}%`, 
        results.tests.sqlMigrations.migrationScore >= 80 ? 'green' : 'yellow');

    // Recomendaciones
    logSection('💡 RECOMENDACIONES');
    
    if (overallScore >= 90) {
      log('🎉 EXCELENTE: El proyecto está en excelente estado', 'green');
      log('✅ Listo para continuar con testing manual y verificación de seguridad', 'green');
    } else if (overallScore >= 80) {
      log('✅ BUENO: El proyecto está en buen estado con mejoras menores', 'yellow');
      log('⚠️  Revisar componentes con score bajo antes de continuar', 'yellow');
    } else if (overallScore >= 70) {
      log('⚠️  ACEPTABLE: El proyecto necesita algunas mejoras', 'yellow');
      log('🔧 Priorizar corrección de archivos faltantes y APIs incompletas', 'yellow');
    } else {
      log('❌ CRÍTICO: El proyecto necesita atención inmediata', 'red');
      log('🚨 Revisar y corregir problemas críticos antes de continuar', 'red');
    }

    // Próximos pasos
    logSection('🚀 PRÓXIMOS PASOS');
    
    if (overallScore >= 80) {
      log('1. Ejecutar testing manual de funcionalidades', 'blue');
      log('2. Verificar políticas RLS en Supabase Dashboard', 'blue');
      log('3. Realizar testing de seguridad', 'blue');
      log('4. Proceder con limpieza de código', 'blue');
    } else {
      log('1. Corregir archivos faltantes identificados', 'yellow');
      log('2. Completar implementación de APIs incompletas', 'yellow');
      log('3. Re-ejecutar este testing', 'yellow');
      log('4. Continuar con siguiente fase cuando score >= 80%', 'yellow');
    }

    // Guardar reporte
    const reportContent = `# 📊 REPORTE TESTING FASE 3.1 - FUNCIONALIDADES PRINCIPALES

## 🎯 RESUMEN EJECUTIVO
- **Score General:** ${overallScore}%
- **Fecha:** ${new Date().toLocaleString()}
- **Estado:** ${overallScore >= 85 ? 'EXCELENTE' : overallScore >= 70 ? 'BUENO' : 'NECESITA MEJORAS'}

## 📋 RESULTADOS DETALLADOS

### 📁 Archivos Críticos: ${results.tests.criticalFiles.percentage}%
- Archivos encontrados: ${results.tests.criticalFiles.filesFound}/${results.tests.criticalFiles.totalFiles}

### 🔌 APIs Principales: ${results.tests.apis.averageScore}%
- APIs analizadas: ${results.tests.apis.analyzedAPIs}/${results.tests.apis.totalAPIs}

### 🔐 Sistema de Autenticación: ${results.tests.authentication.authScore}%
- Archivos analizados: ${results.tests.authentication.analyzedFiles}

### 🎨 Componentes UI: ${results.tests.uiComponents.uiScore}%
- Componentes analizados: ${results.tests.uiComponents.analyzedComponents}

### 🗄️ Configuración Supabase: ${results.tests.supabaseConfig.supabaseScore}%
- Archivos de configuración: ${results.tests.supabaseConfig.analyzedFiles}

### 📊 Migraciones SQL: ${results.tests.sqlMigrations.migrationScore}%
- Migraciones encontradas: ${results.tests.sqlMigrations.migrationsFound}/${results.tests.sqlMigrations.totalMigrations}

## 🎯 CONCLUSIÓN
${overallScore >= 85 ? 
  'El proyecto está en excelente estado y listo para las siguientes fases de testing.' : 
  overallScore >= 70 ? 
  'El proyecto está en buen estado pero necesita algunas mejoras antes de continuar.' :
  'El proyecto necesita atención inmediata en las áreas identificadas.'}

---
*Reporte generado automáticamente - ${new Date().toISOString()}*
`;

    fs.writeFileSync(path.join(__dirname, 'REPORTE-TESTING-FASE-3-1-FUNCIONALIDADES.md'), reportContent);
    log('\n📝 Reporte guardado en: REPORTE-TESTING-FASE-3-1-FUNCIONALIDADES.md', 'blue');

    return results;

  } catch (error) {
    log(`❌ Error durante el testing: ${error.message}`, 'red');
    console.error(error);
    return null;
  }
}

// Ejecutar testing
if (require.main === module) {
  runComprehensiveTesting().then(results => {
    if (results && results.overallScore >= 80) {
      log('\n🎉 TESTING FASE 3.1 COMPLETADO EXITOSAMENTE', 'green');
      process.exit(0);
    } else {
      log('\n⚠️  TESTING FASE 3.1 COMPLETADO CON OBSERVACIONES', 'yellow');
      process.exit(1);
    }
  }).catch(error => {
    log(`❌ Error fatal en testing: ${error.message}`, 'red');
    process.exit(1);
  });
}

module.exports = { runComprehensiveTesting };
