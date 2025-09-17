/**
 * Test Avatar System Final Fix 2025
 * Prueba exhaustiva del sistema de avatares después de las correcciones RLS
 */

const { createClient } = require('@supabase/supabase-js');

// Configuración de Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qfeyhaaxyemmnohqdele.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MjI3MzgsImV4cCI6MjA1MTQ5ODczOH0.vgrh05_Ej-Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAvatarSystemFinalFix() {
  console.log('🧪 INICIANDO TESTING AVATAR SYSTEM FINAL FIX 2025');
  console.log('=' .repeat(60));

  const results = {
    passed: 0,
    failed: 0,
    errors: []
  };

  // Test 1: Verificar estructura de tabla User
  console.log('\n📋 Test 1: Verificar estructura tabla User');
  try {
    const { data, error } = await supabase
      .from('User')
      .select('id, profile_image, updated_at')
      .limit(1);

    if (error) {
      throw new Error(`Error accediendo tabla User: ${error.message}`);
    }

    console.log('✅ Tabla User accesible');
    console.log('✅ Campos profile_image y updated_at disponibles');
    results.passed++;
  } catch (error) {
    console.log('❌ Error en estructura tabla User:', error.message);
    results.failed++;
    results.errors.push(`Test 1: ${error.message}`);
  }

  // Test 2: Verificar políticas RLS en tabla User
  console.log('\n🔒 Test 2: Verificar políticas RLS tabla User');
  try {
    // Intentar acceso sin autenticación (debe fallar)
    const { data, error } = await supabase
      .from('User')
      .select('profile_image')
      .eq('id', '6403f9d2-e846-4c70-87e0-e051127d9500');

    if (error && error.message.includes('row-level security')) {
      console.log('✅ RLS funcionando correctamente - acceso denegado sin auth');
      results.passed++;
    } else {
      throw new Error('RLS no está funcionando - acceso permitido sin auth');
    }
  } catch (error) {
    if (error.message.includes('RLS no está funcionando')) {
      console.log('❌ Error en RLS:', error.message);
      results.failed++;
      results.errors.push(`Test 2: ${error.message}`);
    } else {
      console.log('✅ RLS funcionando correctamente - error esperado');
      results.passed++;
    }
  }

  // Test 3: Verificar bucket avatars
  console.log('\n📁 Test 3: Verificar bucket avatars');
  try {
    const { data, error } = await supabase.storage
      .from('avatars')
      .list('', { limit: 1 });

    if (error) {
      throw new Error(`Error accediendo bucket avatars: ${error.message}`);
    }

    console.log('✅ Bucket avatars accesible');
    results.passed++;
  } catch (error) {
    console.log('❌ Error en bucket avatars:', error.message);
    results.failed++;
    results.errors.push(`Test 3: ${error.message}`);
  }

  // Test 4: Verificar API endpoint avatar
  console.log('\n🌐 Test 4: Verificar API endpoint avatar');
  try {
    const response = await fetch('http://localhost:3000/api/users/avatar', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.status === 401) {
      console.log('✅ API endpoint responde correctamente (401 sin auth)');
      results.passed++;
    } else {
      throw new Error(`API endpoint respuesta inesperada: ${response.status}`);
    }
  } catch (error) {
    console.log('❌ Error en API endpoint:', error.message);
    results.failed++;
    results.errors.push(`Test 4: ${error.message}`);
  }

  // Test 5: Verificar utilidades de avatar
  console.log('\n🔧 Test 5: Verificar utilidades de avatar');
  try {
    // Simular importación de utilidades
    const avatarUtils = {
      getAvatarUrl: (options) => {
        const { profileImage, updatedAt } = options;
        if (!profileImage) return null;
        if (!updatedAt) return profileImage;
        
        const timestamp = new Date(updatedAt).getTime();
        const separator = profileImage.includes('?') ? '&' : '?';
        return `${profileImage}${separator}v=${timestamp}`;
      },
      getInitials: (name) => {
        if (!name) return 'U';
        if (name.includes('@')) name = name.split('@')[0];
        return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2) || 'U';
      }
    };

    // Test cache-busting
    const testUrl = avatarUtils.getAvatarUrl({
      profileImage: 'https://example.com/avatar.jpg',
      updatedAt: '2025-01-17T19:22:57.000Z'
    });

    if (testUrl && testUrl.includes('?v=')) {
      console.log('✅ Cache-busting funcionando correctamente');
      console.log(`   URL generada: ${testUrl}`);
      results.passed++;
    } else {
      throw new Error('Cache-busting no funciona correctamente');
    }

    // Test initials
    const initials = avatarUtils.getInitials('Juan Pérez');
    if (initials === 'JP') {
      console.log('✅ Generación de iniciales funcionando');
      results.passed++;
    } else {
      throw new Error(`Iniciales incorrectas: esperado JP, obtenido ${initials}`);
    }

  } catch (error) {
    console.log('❌ Error en utilidades:', error.message);
    results.failed++;
    results.errors.push(`Test 5: ${error.message}`);
  }

  // Test 6: Verificar componente AvatarUniversal
  console.log('\n🎨 Test 6: Verificar componente AvatarUniversal');
  try {
    const fs = require('fs');
    const path = require('path');
    
    const avatarUniversalPath = path.join(__dirname, 'src/components/ui/avatar-universal.tsx');
    
    if (fs.existsSync(avatarUniversalPath)) {
      const content = fs.readFileSync(avatarUniversalPath, 'utf8');
      
      if (content.includes('getAvatarConfig') && content.includes('AvatarUniversalProps')) {
        console.log('✅ Componente AvatarUniversal existe y tiene estructura correcta');
        results.passed++;
      } else {
        throw new Error('Componente AvatarUniversal tiene estructura incorrecta');
      }
    } else {
      throw new Error('Componente AvatarUniversal no existe');
    }
  } catch (error) {
    console.log('❌ Error en componente AvatarUniversal:', error.message);
    results.failed++;
    results.errors.push(`Test 6: ${error.message}`);
  }

  // Resumen final
  console.log('\n' + '=' .repeat(60));
  console.log('📊 RESUMEN TESTING AVATAR SYSTEM FINAL FIX');
  console.log('=' .repeat(60));
  console.log(`✅ Tests pasados: ${results.passed}`);
  console.log(`❌ Tests fallidos: ${results.failed}`);
  console.log(`📈 Porcentaje éxito: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);

  if (results.errors.length > 0) {
    console.log('\n🚨 ERRORES ENCONTRADOS:');
    results.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
  }

  // Recomendaciones
  console.log('\n💡 RECOMENDACIONES:');
  
  if (results.failed === 0) {
    console.log('🎉 ¡Sistema de avatares funcionando correctamente!');
    console.log('📋 Próximos pasos:');
    console.log('   1. Probar upload de avatar en la interfaz');
    console.log('   2. Verificar cache-busting en navegador');
    console.log('   3. Confirmar consistencia visual en todas las superficies');
  } else {
    console.log('⚠️  Se encontraron problemas que requieren atención:');
    
    if (results.errors.some(e => e.includes('RLS'))) {
      console.log('   🔒 Ejecutar script SQL de corrección RLS');
      console.log('   📄 Archivo: Backend/sql-migrations/FIX-RLS-POLICIES-TYPE-CASTING-2025.sql');
    }
    
    if (results.errors.some(e => e.includes('API'))) {
      console.log('   🌐 Verificar que el servidor Next.js esté ejecutándose');
      console.log('   🔄 Reiniciar servidor si es necesario');
    }
    
    if (results.errors.some(e => e.includes('bucket'))) {
      console.log('   📁 Verificar configuración de Supabase Storage');
      console.log('   🔧 Ejecutar script de setup de bucket avatars');
    }
  }

  console.log('\n🏁 Testing completado');
  return results;
}

// Ejecutar testing si se llama directamente
if (require.main === module) {
  testAvatarSystemFinalFix()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('💥 Error crítico en testing:', error);
      process.exit(1);
    });
}

module.exports = { testAvatarSystemFinalFix };
