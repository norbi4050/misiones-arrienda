const fs = require('fs');
const path = require('path');

console.log('🔍 VERIFICANDO CONFIGURACIÓN DE SUPABASE');
console.log('==========================================');

// Función para verificar si existe un archivo
function checkFileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

// Verificar archivos de configuración
const configFiles = [
  'Backend/.env.local',
  'Backend/.env',
  'Backend/.env.example'
];

console.log('\n📁 Verificando archivos de configuración:');
configFiles.forEach(file => {
  const exists = checkFileExists(file);
  console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? 'existe' : 'no encontrado'}`);
});

// Verificar archivos de Supabase
const supabaseFiles = [
  'Backend/src/lib/supabase/client.ts',
  'Backend/src/lib/supabase/server.ts',
  'Backend/src/middleware.ts'
];

console.log('\n🔧 Verificando archivos de Supabase:');
supabaseFiles.forEach(file => {
  const exists = checkFileExists(file);
  console.log(`${exists ? '✅' : '❌'} ${file} ${exists ? 'existe' : 'no encontrado'}`);
});

// Crear archivo .env.local de ejemplo si no existe
const envLocalPath = 'Backend/.env.local';
if (!checkFileExists(envLocalPath)) {
  console.log('\n📝 Creando archivo .env.local de ejemplo...');
  
  const envContent = `# Configuración de Supabase
# Reemplaza estos valores con tus credenciales reales de Supabase

NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_clave_anonima_aqui

# Base de datos
DATABASE_URL="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"

# Otras configuraciones
NEXTAUTH_SECRET=tu_secret_aqui
NEXTAUTH_URL=http://localhost:3000
`;

  try {
    fs.writeFileSync(envLocalPath, envContent);
    console.log('✅ Archivo .env.local creado exitosamente');
    console.log('⚠️  IMPORTANTE: Debes configurar las variables reales de Supabase');
  } catch (error) {
    console.log('❌ Error creando .env.local:', error.message);
  }
}

console.log('\n🎯 PRÓXIMOS PASOS:');
console.log('1. Configura las variables de entorno en .env.local');
console.log('2. Obtén las credenciales desde tu proyecto de Supabase');
console.log('3. Ejecuta: node activar-middleware-supabase.js');
console.log('4. Inicia el servidor: cd Backend && npm run dev');
console.log('5. Ejecuta el testing: node test-integracion-supabase-autenticacion-completo.js');
