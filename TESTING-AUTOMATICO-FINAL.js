
const fs = require('fs');

console.log('🧪 TESTING AUTOMÁTICO - PROYECTO MISIONES ARRIENDA');
console.log('=================================================');

async function testSupabaseConnection() {
  console.log('\n🔧 Probando conexión Supabase...');
  
  try {
    const response = await fetch('http://localhost:3000/api/health/db');
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Conexión Supabase: EXITOSA');
      return true;
    } else {
      console.log('❌ Conexión Supabase: FALLÓ');
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error probando conexión:', error.message);
    return false;
  }
}

async function testRegistration() {
  console.log('\n🔧 Probando registro de usuario...');
  
  const testUser = {
    email: 'test@example.com',
    password: 'test123456',
    name: 'Usuario Test'
  };
  
  try {
    const response = await fetch('http://localhost:3000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });
    
    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ Registro de usuario: EXITOSO');
      return true;
    } else {
      console.log('❌ Registro de usuario: FALLÓ');
      console.log('   Error:', result.error);
      return false;
    }
  } catch (error) {
    console.log('❌ Error probando registro:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Iniciando testing completo...\n');
  
  const results = {
    connection: await testSupabaseConnection(),
    registration: await testRegistration()
  };
  
  const successCount = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  console.log('\n📊 RESULTADOS FINALES:');
  console.log('========================');
  console.log(`✅ Tests exitosos: ${successCount}/${totalTests}`);
  console.log(`📈 Porcentaje de éxito: ${Math.round((successCount/totalTests) * 100)}%`);
  
  if (successCount === totalTests) {
    console.log('🎉 ¡TODOS LOS TESTS PASARON!');
  } else {
    console.log('⚠️  Algunos tests fallaron. Revisar configuración.');
  }
  
  return results;
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests, testSupabaseConnection, testRegistration };
