const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO VARIABLES DE ENTORNO CON CREDENCIALES REALES');
console.log('===========================================================');

// Variables de entorno esperadas con valores reales
const expectedEnvVars = {
  // Supabase
  'NEXT_PUBLIC_SUPABASE_URL': 'https://qfeyhaaxyemmnohqdele.supabase.co',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzU5NzQsImV4cCI6MjA1MDU1MTk3NH0.YOUR_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmZXloYWF4eWVtbW5vaHFkZWxlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDk3NTk3NCwiZXhwIjoyMDUwNTUxOTc0fQ.YOUR_SERVICE_ROLE_KEY',
  
  // Base de datos
  'DATABASE_URL': 'postgresql://postgres:TU_PASSWORD%21@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require',
  'DIRECT_URL': 'postgresql://postgres:TU_PASSWORD%21@db.qfeyhaaxyemmnohqdele.supabase.co:5432/postgres?sslmode=require',
  
  // Next.js
  'NEXTAUTH_SECRET': '5685128fb42e3ceca234ecd61cac300c',
  'NEXTAUTH_URL': 'http://localhost:3000',
  
  // MercadoPago
  'MERCADOPAGO_PUBLIC_KEY': 'APP_USR-5abed961-c23a-4458-82c7-0f564bf7b9d5',
  'MERCADOPAGO_ACCESS_TOKEN': 'APP_USR-3647290553297438-082512-ea1978cb2f7b9768080ad2bab3df7600-77412419',
  'MERCADOPAGO_CLIENT_ID': '3647290553297438',
  'MERCADOPAGO_CLIENT_SECRET': 'ENlqoDJIZ0fffS8QftXGYfvePfMDd8NO',
  
  // Email
  'SMTP_HOST': 'smtp.gmail.com',
  'SMTP_PORT': '587',
  'SMTP_USER': 'your-email@gmail.com',
  'SMTP_PASS': 'your-app-password',
  
  // Environment
  'NODE_ENV': 'development'
};

function checkEnvFile(filePath) {
  console.log(`\n📄 Verificando: ${filePath}`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ Archivo no encontrado: ${filePath}`);
    return false;
  }
  
  try {
    const envContent = fs.readFileSync(filePath, 'utf8');
    const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    let foundVars = {};
    let missingVars = [];
    let incorrectVars = [];
    
    // Parsear variables del archivo
    envLines.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remover comillas
        foundVars[key.trim()] = value.trim();
      }
    });
    
    // Verificar variables críticas de Supabase
    const criticalVars = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DATABASE_URL'
    ];
    
    console.log('\n🔍 VERIFICACIÓN DE VARIABLES CRÍTICAS:');
    
    criticalVars.forEach(varName => {
      if (foundVars[varName]) {
        const expected = expectedEnvVars[varName];
        const actual = foundVars[varName];
        
        if (varName === 'NEXT_PUBLIC_SUPABASE_URL') {
          if (actual === expected) {
            console.log(`✅ ${varName}: Correcto`);
          } else {
            console.log(`❌ ${varName}: Incorrecto`);
            console.log(`   Esperado: ${expected}`);
            console.log(`   Actual: ${actual}`);
            incorrectVars.push(varName);
          }
        } else if (varName === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
          if (actual.startsWith('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
            console.log(`✅ ${varName}: Formato JWT correcto`);
          } else {
            console.log(`❌ ${varName}: Formato incorrecto (debe ser JWT)`);
            incorrectVars.push(varName);
          }
        } else if (varName === 'DATABASE_URL') {
          if (actual.includes('qfeyhaaxyemmnohqdele.supabase.co')) {
            console.log(`✅ ${varName}: URL de Supabase correcta`);
          } else {
            console.log(`❌ ${varName}: URL de Supabase incorrecta`);
            incorrectVars.push(varName);
          }
        }
      } else {
        console.log(`❌ ${varName}: FALTANTE`);
        missingVars.push(varName);
      }
    });
    
    // Verificar otras variables importantes
    console.log('\n📋 OTRAS VARIABLES:');
    Object.keys(expectedEnvVars).forEach(varName => {
      if (!criticalVars.includes(varName)) {
        if (foundVars[varName]) {
          console.log(`✅ ${varName}: Presente`);
        } else {
          console.log(`⚠️  ${varName}: Faltante (opcional)`);
        }
      }
    });
    
    // Resumen
    console.log('\n📊 RESUMEN:');
    console.log(`✅ Variables encontradas: ${Object.keys(foundVars).length}`);
    console.log(`❌ Variables faltantes críticas: ${missingVars.length}`);
    console.log(`⚠️  Variables incorrectas: ${incorrectVars.length}`);
    
    if (missingVars.length === 0 && incorrectVars.length === 0) {
      console.log('\n🎉 ¡CONFIGURACIÓN DE SUPABASE CORRECTA!');
      return true;
    } else {
      console.log('\n⚠️  CONFIGURACIÓN REQUIERE CORRECCIONES');
      
      if (missingVars.length > 0) {
        console.log('\n🔧 Variables faltantes que debes agregar:');
        missingVars.forEach(varName => {
          console.log(`${varName}="${expectedEnvVars[varName]}"`);
        });
      }
      
      if (incorrectVars.length > 0) {
        console.log('\n🔧 Variables que debes corregir:');
        incorrectVars.forEach(varName => {
          console.log(`${varName}="${expectedEnvVars[varName]}"`);
        });
      }
      
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error leyendo archivo: ${error.message}`);
    return false;
  }
}

// Verificar archivos de entorno
const envFiles = [
  'Backend/.env.local',
  'Backend/.env'
];

let allCorrect = true;

envFiles.forEach(file => {
  const result = checkEnvFile(file);
  if (!result) allCorrect = false;
});

console.log('\n' + '='.repeat(60));

if (allCorrect) {
  console.log('🎯 RESULTADO FINAL: ✅ CONFIGURACIÓN LISTA PARA TESTING');
  console.log('\n🚀 PRÓXIMOS PASOS:');
  console.log('1. Ejecutar: cd Backend && npm run dev');
  console.log('2. Ejecutar testing: node test-integracion-supabase-autenticacion-completo.js');
} else {
  console.log('🎯 RESULTADO FINAL: ⚠️  CONFIGURACIÓN REQUIERE CORRECCIONES');
  console.log('\n🔧 ACCIONES REQUERIDAS:');
  console.log('1. Corregir las variables mostradas arriba');
  console.log('2. Verificar nuevamente: node verificar-variables-entorno-reales.js');
  console.log('3. Una vez corregido, ejecutar testing completo');
}

console.log('\n💡 NOTA: Las credenciales mostradas son las reales proporcionadas');
console.log('   Asegúrate de que coincidan exactamente en tu archivo .env.local');
