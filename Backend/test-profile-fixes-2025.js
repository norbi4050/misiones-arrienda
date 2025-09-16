const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING: Verificación de correcciones del perfil de usuario - 2025');
console.log('=' .repeat(80));

// Test 1: Verificar que useSupabaseAuth tiene las propiedades necesarias
console.log('\n📋 Test 1: Verificando hook useSupabaseAuth...');
try {
  const authHookPath = path.join(__dirname, 'src/hooks/useSupabaseAuth.ts');
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');
  
  const requiredProperties = ['session', 'error', 'updateProfile', 'register'];
  const missingProperties = [];
  
  requiredProperties.forEach(prop => {
    if (!authHookContent.includes(prop)) {
      missingProperties.push(prop);
    }
  });
  
  if (missingProperties.length === 0) {
    console.log('✅ Hook useSupabaseAuth: Todas las propiedades necesarias están presentes');
  } else {
    console.log('❌ Hook useSupabaseAuth: Faltan propiedades:', missingProperties.join(', '));
  }
  
  // Verificar que isAuthenticated verifica tanto user como session
  if (authHookContent.includes('!!user && !!session')) {
    console.log('✅ isAuthenticated: Verifica correctamente user y session');
  } else {
    console.log('❌ isAuthenticated: No verifica correctamente user y session');
  }
  
} catch (error) {
  console.log('❌ Error leyendo useSupabaseAuth:', error.message);
}

// Test 2: Verificar que InquilinoProfilePage maneja el avatar correctamente
console.log('\n📋 Test 2: Verificando página de perfil del inquilino...');
try {
  const profilePagePath = path.join(__dirname, 'src/app/profile/inquilino/InquilinoProfilePage.tsx');
  const profilePageContent = fs.readFileSync(profilePagePath, 'utf8');
  
  // Verificar que no usa window.location.reload()
  if (!profilePageContent.includes('window.location.reload()')) {
    console.log('✅ Página de perfil: No usa window.location.reload()');
  } else {
    console.log('❌ Página de perfil: Todavía usa window.location.reload()');
  }
  
  // Verificar que usa updateProfile para el avatar
  if (profilePageContent.includes('await updateProfile({ profile_image: url })')) {
    console.log('✅ Página de perfil: Usa updateProfile para el avatar');
  } else {
    console.log('❌ Página de perfil: No usa updateProfile para el avatar');
  }
  
  // Verificar que tiene manejo de errores con toast
  if (profilePageContent.includes('toast.success') && profilePageContent.includes('toast.error')) {
    console.log('✅ Página de perfil: Tiene manejo de errores con toast');
  } else {
    console.log('❌ Página de perfil: Falta manejo de errores con toast');
  }
  
} catch (error) {
  console.log('❌ Error leyendo InquilinoProfilePage:', error.message);
}

// Test 3: Verificar que las imágenes en comunidad tienen sizes prop
console.log('\n📋 Test 3: Verificando imágenes en página de comunidad...');
try {
  const comunidadPagePath = path.join(__dirname, 'src/app/comunidad/page.tsx');
  const comunidadPageContent = fs.readFileSync(comunidadPagePath, 'utf8');
  
  // Verificar que las imágenes con fill tienen sizes
  const imageWithFillRegex = /<Image[^>]*fill[^>]*>/g;
  const matches = comunidadPageContent.match(imageWithFillRegex);
  
  if (matches) {
    let allHaveSizes = true;
    matches.forEach((match, index) => {
      if (!match.includes('sizes=')) {
        allHaveSizes = false;
        console.log(`❌ Imagen ${index + 1}: Falta prop sizes`);
      }
    });
    
    if (allHaveSizes) {
      console.log('✅ Página de comunidad: Todas las imágenes con fill tienen prop sizes');
    }
  } else {
    console.log('ℹ️ Página de comunidad: No se encontraron imágenes con prop fill');
  }
  
} catch (error) {
  console.log('❌ Error leyendo página de comunidad:', error.message);
}

// Test 4: Verificar estructura de archivos críticos
console.log('\n📋 Test 4: Verificando estructura de archivos...');
const criticalFiles = [
  'src/hooks/useSupabaseAuth.ts',
  'src/hooks/useAuth.ts',
  'src/app/profile/inquilino/InquilinoProfilePage.tsx',
  'src/app/api/users/avatar/route.ts',
  'src/components/ui/profile-avatar-enhanced.tsx'
];

criticalFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}: Existe`);
  } else {
    console.log(`❌ ${file}: No existe`);
  }
});

// Test 5: Verificar sintaxis básica de archivos TypeScript
console.log('\n📋 Test 5: Verificando sintaxis básica...');
try {
  const authHookPath = path.join(__dirname, 'src/hooks/useSupabaseAuth.ts');
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');
  
  // Verificar que no hay errores de sintaxis obvios
  const syntaxIssues = [];
  
  // Verificar paréntesis balanceados
  const openParens = (authHookContent.match(/\(/g) || []).length;
  const closeParens = (authHookContent.match(/\)/g) || []).length;
  if (openParens !== closeParens) {
    syntaxIssues.push('Paréntesis desbalanceados');
  }
  
  // Verificar llaves balanceadas
  const openBraces = (authHookContent.match(/\{/g) || []).length;
  const closeBraces = (authHookContent.match(/\}/g) || []).length;
  if (openBraces !== closeBraces) {
    syntaxIssues.push('Llaves desbalanceadas');
  }
  
  if (syntaxIssues.length === 0) {
    console.log('✅ Sintaxis: No se detectaron problemas obvios');
  } else {
    console.log('❌ Sintaxis: Problemas detectados:', syntaxIssues.join(', '));
  }
  
} catch (error) {
  console.log('❌ Error verificando sintaxis:', error.message);
}

console.log('\n' + '=' .repeat(80));
console.log('🏁 TESTING COMPLETADO');
console.log('=' .repeat(80));
