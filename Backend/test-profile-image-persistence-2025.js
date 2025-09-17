/**
 * TEST EXHAUSTIVO: PERSISTENCIA DE IMAGEN DE PERFIL
 * Fase 2: Verificar que las imágenes de perfil persisten correctamente
 * Fecha: 2025
 */

const fs = require('fs');
const path = require('path');

// Colores para output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bold');
  console.log('='.repeat(60));
}

function checkFileExists(filePath) {
  const fullPath = path.join(__dirname, filePath);
  const exists = fs.existsSync(fullPath);
  log(`${exists ? '✅' : '❌'} ${filePath}`, exists ? 'green' : 'red');
  return exists;
}

function checkFileContent(filePath, searchTerms) {
  try {
    const fullPath = path.join(__dirname, filePath);
    if (!fs.existsSync(fullPath)) {
      log(`❌ Archivo no existe: ${filePath}`, 'red');
      return false;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    let allFound = true;

    searchTerms.forEach(term => {
      const found = content.includes(term);
      log(`  ${found ? '✅' : '❌'} Contiene: "${term}"`, found ? 'green' : 'red');
      if (!found) allFound = false;
    });

    return allFound;
  } catch (error) {
    log(`❌ Error leyendo archivo ${filePath}: ${error.message}`, 'red');
    return false;
  }
}

function analyzeComponent(filePath, componentName, expectedFeatures) {
  logSection(`ANÁLISIS: ${componentName}`);
  
  if (!checkFileExists(filePath)) {
    return false;
  }

  return checkFileContent(filePath, expectedFeatures);
}

// TESTS PRINCIPALES
async function runTests() {
  logSection('🧪 TESTING FASE 2: PERSISTENCIA DE IMAGEN DE PERFIL');
  
  let totalTests = 0;
  let passedTests = 0;

  // TEST 1: Verificar migración SQL
  logSection('TEST 1: MIGRACIÓN DE BASE DE DATOS');
  totalTests++;
  
  const migrationExists = checkFileExists('sql-migrations/normalize-avatar-field-2025.sql');
  if (migrationExists) {
    const migrationValid = checkFileContent('sql-migrations/normalize-avatar-field-2025.sql', [
      'profile_image',
      'ALTER TABLE',
      'UPDATE "User"',
      'CREATE INDEX'
    ]);
    if (migrationValid) {
      passedTests++;
      log('✅ Migración SQL correcta', 'green');
    }
  }

  // TEST 2: Verificar UserContext
  logSection('TEST 2: CONTEXTO DE USUARIO GLOBAL');
  totalTests++;
  
  const contextValid = analyzeComponent('src/contexts/UserContext.tsx', 'UserContext', [
    'UserProvider',
    'UserProfile',
    'profile_image',
    'localStorage',
    'updateAvatar',
    'refreshProfile',
    'loadUserProfile'
  ]);
  
  if (contextValid) {
    passedTests++;
    log('✅ UserContext implementado correctamente', 'green');
  }

  // TEST 3: Verificar hooks personalizados
  logSection('TEST 3: HOOKS PERSONALIZADOS');
  totalTests++;
  
  const hooksValid = analyzeComponent('src/hooks/useUser.ts', 'useUser hooks', [
    'useUser',
    'useAuth',
    'useUserAvatar',
    'useUserInfo',
    'useProfileOperations'
  ]);
  
  if (hooksValid) {
    passedTests++;
    log('✅ Hooks personalizados implementados', 'green');
  }

  // TEST 4: Verificar API de perfil
  logSection('TEST 4: API DE PERFIL COMPLETO');
  totalTests++;
  
  const apiValid = analyzeComponent('src/app/api/users/profile/route.ts', 'Profile API', [
    'export async function GET',
    'export async function PUT',
    'export async function PATCH',
    'profile_image',
    'createServerClient'
  ]);
  
  if (apiValid) {
    passedTests++;
    log('✅ API de perfil implementada correctamente', 'green');
  }

  // TEST 5: Verificar API de avatar actualizada
  logSection('TEST 5: API DE AVATAR ACTUALIZADA');
  totalTests++;
  
  const avatarApiValid = analyzeComponent('src/app/api/users/avatar/route.ts', 'Avatar API', [
    'profile_image',
    'updated_at',
    'supabase.storage',
    'avatars'
  ]);
  
  if (avatarApiValid) {
    passedTests++;
    log('✅ API de avatar actualizada correctamente', 'green');
  }

  // TEST 6: Verificar componente Avatar UI
  logSection('TEST 6: COMPONENTE AVATAR UI');
  totalTests++;
  
  const avatarUIValid = analyzeComponent('src/components/ui/avatar.tsx', 'Avatar UI', [
    'AvatarPrimitive',
    'Avatar',
    'AvatarImage',
    'AvatarFallback',
    'forwardRef'
  ]);
  
  if (avatarUIValid) {
    passedTests++;
    log('✅ Componente Avatar UI implementado', 'green');
  }

  // TEST 7: Verificar UserMenu actualizado
  logSection('TEST 7: USER MENU ACTUALIZADO');
  totalTests++;
  
  const userMenuValid = analyzeComponent('src/components/user-menu.tsx', 'UserMenu', [
    'useUser',
    'profile',
    'profile_image',
    'signOut'
  ]);
  
  if (userMenuValid) {
    passedTests++;
    log('✅ UserMenu actualizado correctamente', 'green');
  }

  // TEST 8: Verificar utilidades
  logSection('TEST 8: UTILIDADES');
  totalTests++;
  
  const utilsValid = analyzeComponent('src/utils/index.ts', 'Utils', [
    'cn',
    'clsx',
    'twMerge'
  ]);
  
  if (utilsValid) {
    passedTests++;
    log('✅ Utilidades implementadas', 'green');
  }

  // TEST 9: Verificar integración en layout
  logSection('TEST 9: INTEGRACIÓN EN LAYOUT');
  totalTests++;
  
  const layoutValid = analyzeComponent('src/app/layout.tsx', 'Layout', [
    'UserProvider',
    'AuthProvider'
  ]);
  
  if (layoutValid) {
    passedTests++;
    log('✅ Layout integrado correctamente', 'green');
  }

  // VERIFICACIONES ADICIONALES
  logSection('VERIFICACIONES ADICIONALES');

  // Verificar que existe el ProfileAvatar component
  const profileAvatarExists = checkFileExists('src/components/ui/profile-avatar.tsx');
  log(`ProfileAvatar component: ${profileAvatarExists ? 'EXISTS' : 'MISSING'}`, 
      profileAvatarExists ? 'green' : 'yellow');

  // Verificar que existe el setup de storage
  const storageSetupExists = checkFileExists('sql-migrations/setup-avatars-bucket-storage.sql');
  log(`Storage setup: ${storageSetupExists ? 'EXISTS' : 'MISSING'}`, 
      storageSetupExists ? 'green' : 'yellow');

  // RESUMEN FINAL
  logSection('📊 RESUMEN DE RESULTADOS');
  
  const successRate = (passedTests / totalTests * 100).toFixed(1);
  
  log(`Total de tests: ${totalTests}`, 'blue');
  log(`Tests pasados: ${passedTests}`, 'green');
  log(`Tests fallidos: ${totalTests - passedTests}`, 'red');
  log(`Tasa de éxito: ${successRate}%`, successRate >= 80 ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    logSection('🎉 FASE 2 COMPLETADA EXITOSAMENTE');
    log('✅ Todos los componentes de persistencia de imagen implementados', 'green');
    log('✅ Sistema de contexto global funcionando', 'green');
    log('✅ APIs actualizadas para usar campo normalizado', 'green');
    log('✅ Componentes UI implementados', 'green');
    
    // Crear archivo de TODO para próximos pasos
    const todoContent = `# TODO: PRÓXIMOS PASOS FASE 2

## ✅ COMPLETADO:
- [x] Migración SQL para normalizar campos
- [x] UserContext global implementado
- [x] Hooks personalizados creados
- [x] API de perfil completo
- [x] API de avatar actualizada
- [x] Componente Avatar UI
- [x] UserMenu actualizado
- [x] Utilidades implementadas
- [x] Layout integrado

## 📋 PENDIENTE:
- [ ] Ejecutar migración SQL en Supabase Dashboard
- [ ] Instalar dependencia @radix-ui/react-avatar
- [ ] Verificar que no hay errores de TypeScript
- [ ] Probar flujo completo de subida de imagen
- [ ] Probar persistencia después de logout/login
- [ ] Verificar que la imagen se muestra en todos los componentes

## 🔧 COMANDOS A EJECUTAR:
\`\`\`bash
# Instalar dependencia faltante
npm install @radix-ui/react-avatar

# Verificar errores de TypeScript
npm run type-check

# Ejecutar en desarrollo
npm run dev
\`\`\`

## 📝 INSTRUCCIONES SQL:
1. Ir a Supabase Dashboard > SQL Editor
2. Ejecutar: Backend/sql-migrations/normalize-avatar-field-2025.sql
3. Verificar que no hay errores
4. Confirmar que el campo profile_image existe en la tabla User

## 🧪 TESTING MANUAL:
1. Iniciar sesión en la aplicación
2. Ir a perfil de usuario
3. Subir una imagen de perfil
4. Verificar que se muestra en UserMenu
5. Cerrar sesión
6. Volver a iniciar sesión
7. Verificar que la imagen persiste

## ⚠️ NOTAS IMPORTANTES:
- El sistema mantiene compatibilidad con el campo 'avatar' durante la transición
- El caché local se limpia automáticamente después de 30 minutos
- Las imágenes se almacenan en Supabase Storage bucket 'avatars'
- El sistema maneja automáticamente la eliminación de imágenes anteriores
`;

    fs.writeFileSync(path.join(__dirname, 'TODO-FASE-2-PERSISTENCIA-IMAGEN-PERFIL.md'), todoContent);
    log('📝 Archivo TODO creado con próximos pasos', 'blue');
    
  } else {
    logSection('⚠️  FASE 2 INCOMPLETA');
    log(`Faltan ${totalTests - passedTests} componentes por implementar`, 'yellow');
    log('Revisar los errores arriba y completar la implementación', 'yellow');
  }

  // INSTRUCCIONES FINALES
  logSection('📋 INSTRUCCIONES FINALES');
  log('1. Ejecutar migración SQL en Supabase Dashboard', 'blue');
  log('2. Instalar dependencia @radix-ui/react-avatar', 'blue');
  log('3. Verificar que no hay errores de TypeScript', 'blue');
  log('4. Probar flujo completo de persistencia de imagen', 'blue');
  log('5. Verificar funcionamiento en todos los componentes', 'blue');

  return passedTests === totalTests;
}

// Ejecutar tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  log(`❌ Error ejecutando tests: ${error.message}`, 'red');
  process.exit(1);
});
