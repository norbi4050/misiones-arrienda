/**
 * Test para diagnosticar error 404 en sistema de avatares
 * Verifica rutas de importación y archivos faltantes
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO ERROR 404 - SISTEMA AVATARES');
console.log('='.repeat(50));

// Verificar archivos creados
const filesToCheck = [
  'Backend/src/utils/avatar.ts',
  'Backend/src/components/ui/avatar-universal.tsx',
  'Backend/src/app/api/users/avatar/route.ts',
  'Backend/src/components/navbar.tsx',
  'Backend/src/components/ui/profile-dropdown.tsx'
];

console.log('\n📁 VERIFICANDO ARCHIVOS EXISTENTES:');
filesToCheck.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`${exists ? '✅' : '❌'} ${file}`);
  
  if (exists) {
    const stats = fs.statSync(file);
    console.log(`   📊 Tamaño: ${stats.size} bytes`);
    console.log(`   📅 Modificado: ${stats.mtime.toISOString()}`);
  }
});

// Verificar imports en archivos clave
console.log('\n🔗 VERIFICANDO IMPORTS:');

// Verificar imports en navbar
if (fs.existsSync('Backend/src/components/navbar.tsx')) {
  const navbarContent = fs.readFileSync('Backend/src/components/navbar.tsx', 'utf8');
  const hasAvatarUniversalImport = navbarContent.includes('AvatarUniversal');
  const hasUserContextImport = navbarContent.includes('useUser');
  
  console.log(`📄 navbar.tsx:`);
  console.log(`   ${hasAvatarUniversalImport ? '✅' : '❌'} Import AvatarUniversal`);
  console.log(`   ${hasUserContextImport ? '✅' : '❌'} Import useUser`);
}

// Verificar imports en profile-dropdown
if (fs.existsSync('Backend/src/components/ui/profile-dropdown.tsx')) {
  const dropdownContent = fs.readFileSync('Backend/src/components/ui/profile-dropdown.tsx', 'utf8');
  const hasAvatarUniversalImport = dropdownContent.includes('AvatarUniversal');
  const hasUserContextImport = dropdownContent.includes('useUser');
  
  console.log(`📄 profile-dropdown.tsx:`);
  console.log(`   ${hasAvatarUniversalImport ? '✅' : '❌'} Import AvatarUniversal`);
  console.log(`   ${hasUserContextImport ? '✅' : '❌'} Import useUser`);
}

// Verificar estructura de directorios
console.log('\n📂 ESTRUCTURA DE DIRECTORIOS:');
const dirsToCheck = [
  'Backend/src/utils',
  'Backend/src/components/ui',
  'Backend/src/app/api/users/avatar'
];

dirsToCheck.forEach(dir => {
  const exists = fs.existsSync(dir);
  console.log(`${exists ? '✅' : '❌'} ${dir}`);
  
  if (exists) {
    const files = fs.readdirSync(dir);
    console.log(`   📁 Archivos: ${files.join(', ')}`);
  }
});

// Verificar posibles problemas de rutas
console.log('\n🚨 POSIBLES PROBLEMAS:');

// Verificar si hay imports con rutas incorrectas
const commonIssues = [
  {
    file: 'Backend/src/components/navbar.tsx',
    issue: 'Import path incorrecto para AvatarUniversal',
    check: (content) => content.includes('@/components/ui/avatar-universal') && !fs.existsSync('Backend/src/components/ui/avatar-universal.tsx')
  },
  {
    file: 'Backend/src/components/ui/profile-dropdown.tsx',
    issue: 'Import path incorrecto para AvatarUniversal',
    check: (content) => content.includes('@/components/ui/avatar-universal') && !fs.existsSync('Backend/src/components/ui/avatar-universal.tsx')
  }
];

commonIssues.forEach(({ file, issue, check }) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    if (check(content)) {
      console.log(`❌ ${issue} en ${file}`);
    }
  }
});

console.log('\n🔧 RECOMENDACIONES:');
console.log('1. Verificar que todos los archivos existan en las rutas correctas');
console.log('2. Revisar imports en navbar.tsx y profile-dropdown.tsx');
console.log('3. Asegurar que las rutas @/ estén configuradas correctamente');
console.log('4. Verificar que no haya errores de TypeScript');

console.log('\n✅ DIAGNÓSTICO COMPLETADO');
