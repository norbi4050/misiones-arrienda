const fs = require('fs');
const path = require('path');

console.log('🔍 TESTING: Profile Authentication and Image Issues Fix - 2025');
console.log('=' .repeat(60));

// Test 1: Verificar hook de autenticación
console.log('\n1. Verificando hook useSupabaseAuth...');
try {
  const authHookPath = path.join(__dirname, 'src/hooks/useSupabaseAuth.ts');
  const authHookContent = fs.readFileSync(authHookPath, 'utf8');
  
  if (authHookContent.includes('isAuthenticated: !!user && !!session')) {
    console.log('✅ Hook useSupabaseAuth tiene isAuthenticated correctamente implementado');
  } else {
    console.log('❌ Hook useSupabaseAuth no tiene isAuthenticated implementado');
  }
  
  if (authHookContent.includes('updateProfile')) {
    console.log('✅ Hook useSupabaseAuth tiene función updateProfile');
  } else {
    console.log('❌ Hook useSupabaseAuth no tiene función updateProfile');
  }
} catch (error) {
  console.log('❌ Error leyendo hook useSupabaseAuth:', error.message);
}

// Test 2: Verificar página de perfil
console.log('\n2. Verificando página de perfil del inquilino...');
try {
  const profilePagePath = path.join(__dirname, 'src/app/profile/inquilino/InquilinoProfilePage.tsx');
  const profilePageContent = fs.readFileSync(profilePagePath, 'utf8');
  
  if (profilePageContent.includes('if (!isAuthenticated || !session || !user)')) {
    console.log('✅ Página de perfil usa verificación de autenticación correcta');
  } else if (profilePageContent.includes('if (!user)')) {
    console.log('⚠️  Página de perfil usa verificación básica (solo user)');
  } else {
    console.log('❌ Página de perfil no tiene verificación de autenticación clara');
  }
  
  if (profilePageContent.includes('updateProfile')) {
    console.log('✅ Página de perfil usa función updateProfile');
  } else {
    console.log('❌ Página de perfil no usa función updateProfile');
  }
} catch (error) {
  console.log('❌ Error leyendo página de perfil:', error.message);
}

// Test 3: Verificar página de comunidad para warnings de Image
console.log('\n3. Verificando página de comunidad para warnings de Next.js Image...');
try {
  const comunidadPagePath = path.join(__dirname, 'src/app/comunidad/page.tsx');
  const comunidadPageContent = fs.readFileSync(comunidadPagePath, 'utf8');
  
  // Buscar componentes Image con fill
  const imageWithFillRegex = /<Image[^>]*fill[^>]*>/g;
  const imageMatches = comunidadPageContent.match(imageWithFillRegex);
  
  if (imageMatches) {
    console.log(`⚠️  Encontrados ${imageMatches.length} componentes Image con fill`);
    
    let hasProperSizes = true;
    imageMatches.forEach((match, index) => {
      if (!match.includes('sizes=')) {
        console.log(`❌ Image ${index + 1} no tiene prop 'sizes'`);
        hasProperSizes = false;
      }
    });
    
    if (hasProperSizes) {
      console.log('✅ Todos los componentes Image con fill tienen prop sizes');
    }
  } else {
    console.log('✅ No se encontraron componentes Image con fill en comunidad');
  }
} catch (error) {
  console.log('❌ Error leyendo página de comunidad:', error.message);
}

// Test 4: Verificar componente ProfileAvatar
console.log('\n4. Verificando componente ProfileAvatar...');
try {
  const avatarPath = path.join(__dirname, 'src/components/ui/profile-avatar.tsx');
  const avatarContent = fs.readFileSync(avatarPath, 'utf8');
  
  if (avatarContent.includes('onUploadComplete') || avatarContent.includes('onImageChange')) {
    console.log('✅ ProfileAvatar tiene callback para cambios de imagen');
  } else {
    console.log('❌ ProfileAvatar no tiene callback para cambios de imagen');
  }
  
  if (avatarContent.includes('toast.success') || avatarContent.includes('toast.error')) {
    console.log('✅ ProfileAvatar tiene notificaciones de estado');
  } else {
    console.log('❌ ProfileAvatar no tiene notificaciones de estado');
  }
} catch (error) {
  console.log('❌ Error leyendo componente ProfileAvatar:', error.message);
}

// Test 5: Verificar ImageCarousel para sizes prop
console.log('\n5. Verificando ImageCarousel para prop sizes...');
try {
  const carouselPath = path.join(__dirname, 'src/components/ImageCarousel.tsx');
  const carouselContent = fs.readFileSync(carouselPath, 'utf8');
  
  if (carouselContent.includes('sizes=')) {
    console.log('✅ ImageCarousel tiene prop sizes implementado');
  } else {
    console.log('❌ ImageCarousel no tiene prop sizes');
  }
} catch (error) {
  console.log('❌ Error leyendo ImageCarousel:', error.message);
}

console.log('\n' + '=' .repeat(60));
console.log('🏁 TESTING COMPLETADO');
console.log('=' .repeat(60));
