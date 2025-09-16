const fs = require('fs');
const path = require('path');

console.log('🎨 DIAGNÓSTICO: Problema de CSS en Perfil de Usuario - 2025');
console.log('=' .repeat(60));

// Test 1: Verificar archivos CSS principales
console.log('\n1. Verificando archivos CSS principales...');
try {
  const globalsCssPath = path.join(__dirname, 'src/app/globals.css');
  const globalsCssContent = fs.readFileSync(globalsCssPath, 'utf8');
  
  if (globalsCssContent.includes('@tailwind base')) {
    console.log('✅ globals.css tiene @tailwind base');
  } else {
    console.log('❌ globals.css NO tiene @tailwind base');
  }
  
  if (globalsCssContent.includes('body {')) {
    console.log('✅ globals.css tiene estilos para body');
  } else {
    console.log('❌ globals.css NO tiene estilos para body');
  }
  
  if (globalsCssContent.includes('.dark')) {
    console.log('⚠️  globals.css tiene configuración de modo oscuro');
  } else {
    console.log('✅ globals.css NO tiene modo oscuro problemático');
  }
} catch (error) {
  console.log('❌ Error leyendo globals.css:', error.message);
}

// Test 2: Verificar ThemeProvider
console.log('\n2. Verificando ThemeProvider...');
try {
  const layoutPath = path.join(__dirname, 'src/app/layout.tsx');
  const layoutContent = fs.readFileSync(layoutPath, 'utf8');
  
  if (layoutContent.includes('ThemeProvider')) {
    console.log('✅ Layout usa ThemeProvider');
    
    if (layoutContent.includes('defaultTheme="system"')) {
      console.log('⚠️  ThemeProvider usa defaultTheme="system" (puede causar modo oscuro)');
    } else if (layoutContent.includes('defaultTheme="light"')) {
      console.log('✅ ThemeProvider usa defaultTheme="light"');
    } else {
      console.log('⚠️  ThemeProvider sin defaultTheme específico');
    }
  } else {
    console.log('❌ Layout NO usa ThemeProvider');
  }
} catch (error) {
  console.log('❌ Error leyendo layout.tsx:', error.message);
}

// Test 3: Verificar página de perfil específica
console.log('\n3. Verificando página de perfil...');
try {
  const profilePagePath = path.join(__dirname, 'src/app/profile/inquilino/InquilinoProfilePage.tsx');
  const profilePageContent = fs.readFileSync(profilePagePath, 'utf8');
  
  if (profilePageContent.includes('bg-gray-50')) {
    console.log('✅ Página de perfil tiene fondo bg-gray-50');
  } else if (profilePageContent.includes('bg-white')) {
    console.log('✅ Página de perfil tiene fondo bg-white');
  } else {
    console.log('⚠️  Página de perfil sin fondo específico');
  }
  
  if (profilePageContent.includes('text-gray-900')) {
    console.log('✅ Página de perfil tiene texto text-gray-900');
  } else {
    console.log('⚠️  Página de perfil sin color de texto específico');
  }
  
  if (profilePageContent.includes('min-h-screen')) {
    console.log('✅ Página de perfil tiene min-h-screen');
  } else {
    console.log('⚠️  Página de perfil sin min-h-screen');
  }
} catch (error) {
  console.log('❌ Error leyendo página de perfil:', error.message);
}

// Test 4: Verificar Tailwind config
console.log('\n4. Verificando configuración de Tailwind...');
try {
  const tailwindConfigPath = path.join(__dirname, 'tailwind.config.ts');
  const tailwindConfigContent = fs.readFileSync(tailwindConfigPath, 'utf8');
  
  if (tailwindConfigContent.includes('./src/app/**/*.{js,ts,jsx,tsx,mdx}')) {
    console.log('✅ Tailwind config incluye archivos de src/app');
  } else {
    console.log('❌ Tailwind config NO incluye archivos de src/app');
  }
  
  if (tailwindConfigContent.includes('./src/components/**/*.{js,ts,jsx,tsx,mdx}')) {
    console.log('✅ Tailwind config incluye archivos de src/components');
  } else {
    console.log('❌ Tailwind config NO incluye archivos de src/components');
  }
} catch (error) {
  console.log('❌ Error leyendo tailwind.config.ts:', error.message);
}

// Test 5: Verificar PostCSS
console.log('\n5. Verificando PostCSS...');
try {
  const postcssConfigPath = path.join(__dirname, 'postcss.config.js');
  const postcssConfigContent = fs.readFileSync(postcssConfigPath, 'utf8');
  
  if (postcssConfigContent.includes('tailwindcss')) {
    console.log('✅ PostCSS incluye tailwindcss');
  } else {
    console.log('❌ PostCSS NO incluye tailwindcss');
  }
  
  if (postcssConfigContent.includes('autoprefixer')) {
    console.log('✅ PostCSS incluye autoprefixer');
  } else {
    console.log('❌ PostCSS NO incluye autoprefixer');
  }
} catch (error) {
  console.log('❌ Error leyendo postcss.config.js:', error.message);
}

console.log('\n' + '=' .repeat(60));
console.log('🎯 POSIBLES SOLUCIONES:');
console.log('=' .repeat(60));
console.log('1. Cambiar ThemeProvider defaultTheme a "light"');
console.log('2. Forzar modo claro en la página de perfil');
console.log('3. Verificar que Tailwind CSS se esté compilando correctamente');
console.log('4. Limpiar cache de Next.js: rm -rf .next');
console.log('5. Reinstalar dependencias: npm install');
console.log('\n🏁 DIAGNÓSTICO COMPLETADO');
console.log('=' .repeat(60));
