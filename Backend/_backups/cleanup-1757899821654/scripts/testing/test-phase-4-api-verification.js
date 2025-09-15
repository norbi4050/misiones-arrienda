const fs = require('fs');
const path = require('path');

console.log('🔍 FASE 4: VERIFICACIÓN DE APIS');
console.log('=' .repeat(60));

// APIs a verificar
const apisToVerify = [
  {
    name: 'User Stats API',
    path: 'Backend/src/app/api/users/stats/route.ts',
    endpoint: '/api/users/stats',
    description: 'Estadísticas del usuario (vistas, favoritos, mensajes, rating)'
  },
  {
    name: 'User Activity API',
    path: 'Backend/src/app/api/users/activity/route.ts',
    endpoint: '/api/users/activity',
    description: 'Actividad reciente del usuario'
  },
  {
    name: 'User Favorites API',
    path: 'Backend/src/app/api/users/favorites/route.ts',
    endpoint: '/api/users/favorites',
    description: 'Favoritos del usuario'
  }
];

console.log('📋 VERIFICANDO EXISTENCIA DE APIS:');

let allApisExist = true;

apisToVerify.forEach(api => {
  if (fs.existsSync(api.path)) {
    console.log(`✅ ${api.name} - EXISTE`);
    console.log(`   📍 ${api.endpoint}`);
    console.log(`   📝 ${api.description}`);
  } else {
    console.log(`❌ ${api.name} - NO EXISTE`);
    console.log(`   📍 ${api.endpoint}`);
    allApisExist = false;
  }
  console.log('');
});

if (!allApisExist) {
  console.log('❌ FALTAN APIS CRÍTICAS');
  process.exit(1);
}

// Verificar contenido de las APIs
console.log('🔧 VERIFICANDO CONTENIDO DE APIS:');

// 1. Verificar User Stats API
console.log('\n1️⃣ USER STATS API:');
const statsApiContent = fs.readFileSync('Backend/src/app/api/users/stats/route.ts', 'utf8');

const statsFeatures = [
  { name: 'Autenticación', pattern: /getUser.*authError/s },
  { name: 'Función SQL get_user_stats', pattern: /rpc.*get_user_stats/s },
  { name: 'Fallback queries', pattern: /getFallbackStats/s },
  { name: 'Manejo de errores', pattern: /catch.*error/s },
  { name: 'Respuesta JSON', pattern: /NextResponse\.json/s }
];

statsFeatures.forEach(feature => {
  if (feature.pattern.test(statsApiContent)) {
    console.log(`✅ ${feature.name} - IMPLEMENTADO`);
  } else {
    console.log(`❌ ${feature.name} - FALTA`);
  }
});

// 2. Verificar User Activity API
console.log('\n2️⃣ USER ACTIVITY API:');
const activityApiContent = fs.readFileSync('Backend/src/app/api/users/activity/route.ts', 'utf8');

const activityFeatures = [
  { name: 'Autenticación', pattern: /getUser.*authError/s },
  { name: 'Consulta favoritos recientes', pattern: /favorites.*created_at/s },
  { name: 'Consulta actualizaciones perfil', pattern: /users.*updated_at/s },
  { name: 'Consulta búsquedas', pattern: /user_searches/s },
  { name: 'Consulta mensajes', pattern: /user_messages/s },
  { name: 'Fallback activities', pattern: /getFallbackActivities/s }
];

activityFeatures.forEach(feature => {
  if (feature.pattern.test(activityApiContent)) {
    console.log(`✅ ${feature.name} - IMPLEMENTADO`);
  } else {
    console.log(`⚠️  ${feature.name} - OPCIONAL/FALTA`);
  }
});

// 3. Verificar User Favorites API
console.log('\n3️⃣ USER FAVORITES API:');
const favoritesApiContent = fs.readFileSync('Backend/src/app/api/users/favorites/route.ts', 'utf8');

const favoritesFeatures = [
  { name: 'GET method', pattern: /export.*async.*function.*GET/s },
  { name: 'POST method', pattern: /export.*async.*function.*POST/s },
  { name: 'Autenticación', pattern: /getUser/s },
  { name: 'Consulta favoritos', pattern: /favorites.*select/s },
  { name: 'Toggle favoritos', pattern: /propertyId/s }
];

favoritesFeatures.forEach(feature => {
  if (feature.pattern.test(favoritesApiContent)) {
    console.log(`✅ ${feature.name} - IMPLEMENTADO`);
  } else {
    console.log(`❌ ${feature.name} - FALTA`);
  }
});

// Verificar hooks
console.log('\n🎣 VERIFICANDO HOOKS:');

const hooksToVerify = [
  {
    name: 'useUserStats',
    path: 'Backend/src/hooks/useUserStats.ts',
    endpoint: '/api/users/stats'
  },
  {
    name: 'useUserActivity',
    path: 'Backend/src/hooks/useUserActivity.ts',
    endpoint: '/api/users/activity'
  },
  {
    name: 'useUserFavorites',
    path: 'Backend/src/hooks/useUserFavorites.ts',
    endpoint: '/api/users/favorites'
  }
];

hooksToVerify.forEach(hook => {
  if (fs.existsSync(hook.path)) {
    console.log(`✅ ${hook.name} - EXISTE`);
    
    const hookContent = fs.readFileSync(hook.path, 'utf8');
    
    // Verificar características del hook
    const hasLoading = /loading.*useState.*true/s.test(hookContent);
    const hasError = /error.*useState/s.test(hookContent);
    const hasFetch = new RegExp(hook.endpoint.replace('/', '\\/'), 's').test(hookContent);
    
    console.log(`   ${hasLoading ? '✅' : '❌'} Estado de loading`);
    console.log(`   ${hasError ? '✅' : '❌'} Manejo de errores`);
    console.log(`   ${hasFetch ? '✅' : '❌'} Fetch a ${hook.endpoint}`);
  } else {
    console.log(`❌ ${hook.name} - NO EXISTE`);
  }
  console.log('');
});

// Verificar componentes
console.log('🧩 VERIFICANDO COMPONENTES:');

const componentsToVerify = [
  {
    name: 'RecentActivity',
    path: 'Backend/src/components/ui/recent-activity.tsx',
    hook: 'useUserActivity'
  },
  {
    name: 'QuickActionsGrid',
    path: 'Backend/src/components/ui/quick-actions-grid.tsx',
    hooks: ['useUserStats', 'useUserFavorites']
  },
  {
    name: 'ProfileStatsEnhanced',
    path: 'Backend/src/components/ui/profile-stats-enhanced.tsx',
    hooks: ['useUserStats', 'useUserFavorites']
  }
];

componentsToVerify.forEach(component => {
  if (fs.existsSync(component.path)) {
    console.log(`✅ ${component.name} - EXISTE`);
    
    const componentContent = fs.readFileSync(component.path, 'utf8');
    
    // Verificar uso de hooks
    if (component.hook) {
      const usesHook = new RegExp(component.hook).test(componentContent);
      console.log(`   ${usesHook ? '✅' : '❌'} Usa ${component.hook}`);
    }
    
    if (component.hooks) {
      component.hooks.forEach(hookName => {
        const usesHook = new RegExp(hookName).test(componentContent);
        console.log(`   ${usesHook ? '✅' : '❌'} Usa ${hookName}`);
      });
    }
    
    // Verificar estados
    const hasLoading = /loading/s.test(componentContent);
    const hasError = /error/s.test(componentContent);
    
    console.log(`   ${hasLoading ? '✅' : '❌'} Maneja loading`);
    console.log(`   ${hasError ? '✅' : '❌'} Maneja errores`);
  } else {
    console.log(`❌ ${component.name} - NO EXISTE`);
  }
  console.log('');
});

// Verificar integración en página principal
console.log('🏠 VERIFICANDO INTEGRACIÓN EN PÁGINA PRINCIPAL:');

const profilePagePath = 'Backend/src/app/profile/inquilino/InquilinoProfilePage.tsx';
if (fs.existsSync(profilePagePath)) {
  console.log('✅ InquilinoProfilePage.tsx - EXISTE');
  
  const profilePageContent = fs.readFileSync(profilePagePath, 'utf8');
  
  // Verificar imports
  const hasRecentActivity = /RecentActivity/s.test(profilePageContent);
  const hasQuickActions = /QuickActionsGrid/s.test(profilePageContent);
  const hasProfileStats = /ProfileStats/s.test(profilePageContent);
  
  console.log(`   ${hasRecentActivity ? '✅' : '❌'} Usa RecentActivity`);
  console.log(`   ${hasQuickActions ? '✅' : '❌'} Usa QuickActionsGrid`);
  console.log(`   ${hasProfileStats ? '✅' : '❌'} Usa ProfileStats`);
  
  // Verificar si usa componentes mejorados
  const usesEnhanced = /Enhanced/s.test(profilePageContent);
  console.log(`   ${usesEnhanced ? '✅' : '⚠️ '} Usa componentes mejorados`);
  
} else {
  console.log('❌ InquilinoProfilePage.tsx - NO EXISTE');
}

// Recomendaciones para Fase 4
console.log('\n📋 RECOMENDACIONES FASE 4:');

console.log('\n🔧 PASOS PENDIENTES:');
console.log('1. Verificar que las tablas de BD existan:');
console.log('   - favorites');
console.log('   - profile_views');
console.log('   - user_messages');
console.log('   - user_searches');
console.log('   - user_activity_log');

console.log('\n2. Crear datos de prueba si es necesario');

console.log('\n3. Probar APIs en desarrollo:');
console.log('   - curl http://localhost:3000/api/users/stats');
console.log('   - curl http://localhost:3000/api/users/activity');
console.log('   - curl http://localhost:3000/api/users/favorites');

console.log('\n4. Integrar componentes mejorados en página principal');

console.log('\n5. Testing en navegador completo');

console.log('\n' + '='.repeat(60));
console.log('🎯 FASE 4: APIs verificadas, listo para testing en vivo');
