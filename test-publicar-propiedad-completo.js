// Test completo del sistema de publicación de propiedades
// Este script identifica todos los problemas posibles

console.log('🔍 INICIANDO ANÁLISIS COMPLETO DEL SISTEMA DE PUBLICACIÓN');
console.log('='.repeat(60));

// 1. VERIFICAR ESTRUCTURA DE ARCHIVOS
console.log('\n📁 1. VERIFICANDO ESTRUCTURA DE ARCHIVOS...');

const fs = require('fs');
const path = require('path');

const archivosRequeridos = [
  'Backend/src/app/publicar/page.tsx',
  'Backend/src/app/api/properties/route.ts',
  'Backend/src/hooks/useSupabaseAuth.ts',
  'Backend/prisma/schema.prisma',
  'Backend/.env',
  'Backend/src/lib/supabase/client.ts',
  'Backend/src/lib/supabaseServer.ts'
];

let archivosExistentes = 0;
archivosRequeridos.forEach(archivo => {
  if (fs.existsSync(archivo)) {
    console.log(`✅ ${archivo} - EXISTE`);
    archivosExistentes++;
  } else {
    console.log(`❌ ${archivo} - NO EXISTE`);
  }
});

console.log(`\n📊 Archivos encontrados: ${archivosExistentes}/${archivosRequeridos.length}`);

// 2. ANALIZAR SCHEMA DE PRISMA
console.log('\n🗄️ 2. ANALIZANDO SCHEMA DE PRISMA...');

if (fs.existsSync('Backend/prisma/schema.prisma')) {
  const schemaContent = fs.readFileSync('Backend/prisma/schema.prisma', 'utf8');
  
  // Verificar modelo Property
  const hasPropertyModel = schemaContent.includes('model Property');
  const hasCurrencyField = schemaContent.includes('currency');
  const hasUserIdField = schemaContent.includes('user_id') || schemaContent.includes('userId');
  
  console.log(`✅ Modelo Property: ${hasPropertyModel ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Campo currency: ${hasCurrencyField ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Campo user_id: ${hasUserIdField ? 'EXISTE' : 'NO EXISTE'}`);
  
  // Extraer campos del modelo Property
  const propertyModelMatch = schemaContent.match(/model Property \{([\s\S]*?)\}/);
  if (propertyModelMatch) {
    console.log('\n📋 CAMPOS DEL MODELO PROPERTY:');
    const fields = propertyModelMatch[1].split('\n')
      .filter(line => line.trim() && !line.trim().startsWith('//') && !line.trim().startsWith('@@'))
      .map(line => line.trim().split(/\s+/)[0])
      .filter(field => field && field !== '{' && field !== '}');
    
    fields.forEach(field => {
      console.log(`   - ${field}`);
    });
  }
} else {
  console.log('❌ Schema de Prisma no encontrado');
}

// 3. VERIFICAR VARIABLES DE ENTORNO
console.log('\n🔐 3. VERIFICANDO VARIABLES DE ENTORNO...');

if (fs.existsSync('Backend/.env')) {
  const envContent = fs.readFileSync('Backend/.env', 'utf8');
  
  const requiredEnvVars = [
    'DATABASE_URL',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];
  
  requiredEnvVars.forEach(envVar => {
    const hasVar = envContent.includes(envVar);
    const isEmpty = envContent.includes(`${envVar}=`) && 
                   envContent.split(`${envVar}=`)[1]?.split('\n')[0]?.trim() === '';
    
    if (hasVar && !isEmpty) {
      console.log(`✅ ${envVar} - CONFIGURADO`);
    } else if (hasVar && isEmpty) {
      console.log(`⚠️ ${envVar} - EXISTE PERO VACÍO`);
    } else {
      console.log(`❌ ${envVar} - NO EXISTE`);
    }
  });
} else {
  console.log('❌ Archivo .env no encontrado');
}

// 4. ANALIZAR API ROUTE
console.log('\n🔌 4. ANALIZANDO API ROUTE...');

if (fs.existsSync('Backend/src/app/api/properties/route.ts')) {
  const apiContent = fs.readFileSync('Backend/src/app/api/properties/route.ts', 'utf8');
  
  const hasPostMethod = apiContent.includes('export async function POST');
  const hasSupabaseAuth = apiContent.includes('supabase.auth.getUser');
  const hasPropertyInsert = apiContent.includes('.from(\'Property\')') || apiContent.includes('.from("Property")');
  const hasCurrencyField = apiContent.includes('currency:');
  const hasUserIdAssignment = apiContent.includes('user_id:');
  
  console.log(`✅ Método POST: ${hasPostMethod ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Autenticación Supabase: ${hasSupabaseAuth ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Insert en Property: ${hasPropertyInsert ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Campo currency: ${hasCurrencyField ? 'INCLUIDO' : 'NO INCLUIDO'}`);
  console.log(`✅ Asignación user_id: ${hasUserIdAssignment ? 'INCLUIDO' : 'NO INCLUIDO'}`);
  
  // Verificar nombres de campos en el insert
  const insertMatch = apiContent.match(/\.insert\(\[([\s\S]*?)\]\)/);
  if (insertMatch) {
    console.log('\n📋 CAMPOS EN EL INSERT:');
    const insertContent = insertMatch[1];
    const fieldMatches = insertContent.match(/(\w+):/g);
    if (fieldMatches) {
      fieldMatches.forEach(field => {
        console.log(`   - ${field.replace(':', '')}`);
      });
    }
  }
} else {
  console.log('❌ API Route no encontrado');
}

// 5. ANALIZAR HOOK DE AUTENTICACIÓN
console.log('\n🔐 5. ANALIZANDO HOOK DE AUTENTICACIÓN...');

if (fs.existsSync('Backend/src/hooks/useSupabaseAuth.ts')) {
  const hookContent = fs.readFileSync('Backend/src/hooks/useSupabaseAuth.ts', 'utf8');
  
  const hasUserState = hookContent.includes('useState') && hookContent.includes('user');
  const hasAuthCheck = hookContent.includes('getSession') || hookContent.includes('getUser');
  const hasUserInterface = hookContent.includes('interface AuthUser') || hookContent.includes('type AuthUser');
  
  console.log(`✅ Estado de usuario: ${hasUserState ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Verificación de auth: ${hasAuthCheck ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Interface de usuario: ${hasUserInterface ? 'EXISTE' : 'NO EXISTE'}`);
} else {
  console.log('❌ Hook de autenticación no encontrado');
}

// 6. VERIFICAR PÁGINA DE PUBLICAR
console.log('\n📄 6. ANALIZANDO PÁGINA DE PUBLICAR...');

if (fs.existsSync('Backend/src/app/publicar/page.tsx')) {
  const pageContent = fs.readFileSync('Backend/src/app/publicar/page.tsx', 'utf8');
  
  const hasAuthCheck = pageContent.includes('useSupabaseAuth');
  const hasFormSubmit = pageContent.includes('handleSubmit');
  const hasApiCall = pageContent.includes('/api/properties');
  const hasCurrencyField = pageContent.includes('currency:');
  const hasAuthGuard = pageContent.includes('if (!user)') || pageContent.includes('!user');
  
  console.log(`✅ Hook de autenticación: ${hasAuthCheck ? 'USADO' : 'NO USADO'}`);
  console.log(`✅ Manejo de submit: ${hasFormSubmit ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Llamada a API: ${hasApiCall ? 'EXISTE' : 'NO EXISTE'}`);
  console.log(`✅ Campo currency: ${hasCurrencyField ? 'INCLUIDO' : 'NO INCLUIDO'}`);
  console.log(`✅ Protección de auth: ${hasAuthGuard ? 'EXISTE' : 'NO EXISTE'}`);
} else {
  console.log('❌ Página de publicar no encontrada');
}

// 7. PROBLEMAS POTENCIALES IDENTIFICADOS
console.log('\n🚨 7. PROBLEMAS POTENCIALES IDENTIFICADOS:');

const problemas = [];

// Verificar desajuste de nombres de campos
if (fs.existsSync('Backend/src/app/api/properties/route.ts') && fs.existsSync('Backend/prisma/schema.prisma')) {
  const apiContent = fs.readFileSync('Backend/src/app/api/properties/route.ts', 'utf8');
  const schemaContent = fs.readFileSync('Backend/prisma/schema.prisma', 'utf8');
  
  // Campos que se intentan insertar en la API
  const insertMatch = apiContent.match(/\.insert\(\[([\s\S]*?)\]\)/);
  if (insertMatch) {
    const insertContent = insertMatch[1];
    
    // Verificar si usa 'propertyType' en lugar de 'type'
    if (insertContent.includes('propertyType:') && !schemaContent.includes('propertyType')) {
      problemas.push('❌ DESAJUSTE: API usa "propertyType" pero schema podría usar "type"');
    }
    
    // Verificar si usa 'deposito' en lugar de 'deposit'
    if (insertContent.includes('deposito:') && !schemaContent.includes('deposito')) {
      problemas.push('❌ DESAJUSTE: API usa "deposito" pero schema podría usar "deposit"');
    }
    
    // Verificar campos de fecha
    if (insertContent.includes('createdAt:') && !schemaContent.includes('createdAt')) {
      problemas.push('❌ DESAJUSTE: API usa "createdAt" pero schema podría usar "created_at"');
    }
    
    if (insertContent.includes('updatedAt:') && !schemaContent.includes('updatedAt')) {
      problemas.push('❌ DESAJUSTE: API usa "updatedAt" pero schema podría usar "updated_at"');
    }
  }
}

// Verificar problemas de autenticación
if (fs.existsSync('Backend/src/app/api/properties/route.ts')) {
  const apiContent = fs.readFileSync('Backend/src/app/api/properties/route.ts', 'utf8');
  
  if (!apiContent.includes('supabase.auth.getUser')) {
    problemas.push('❌ AUTENTICACIÓN: API no verifica usuario autenticado');
  }
  
  if (!apiContent.includes('user_id:')) {
    problemas.push('❌ RELACIÓN: API no asigna user_id a la propiedad');
  }
}

// Verificar problemas de configuración
if (!fs.existsSync('Backend/.env')) {
  problemas.push('❌ CONFIGURACIÓN: Archivo .env no existe');
}

if (problemas.length === 0) {
  console.log('✅ No se detectaron problemas obvios en el código');
} else {
  problemas.forEach(problema => console.log(problema));
}

// 8. RECOMENDACIONES
console.log('\n💡 8. RECOMENDACIONES PARA SOLUCIONAR:');

console.log(`
1. 🔍 VERIFICAR NOMBRES DE CAMPOS:
   - Asegurar que los nombres en la API coincidan exactamente con el schema
   - Revisar: propertyType vs type, deposito vs deposit, etc.

2. 🔐 VERIFICAR AUTENTICACIÓN:
   - Confirmar que el usuario esté autenticado antes de crear propiedad
   - Verificar que user_id se asigne correctamente

3. 🗄️ VERIFICAR BASE DE DATOS:
   - Ejecutar: npx prisma generate
   - Verificar conexión a Supabase
   - Confirmar que la tabla Property existe

4. 🔧 VERIFICAR CONFIGURACIÓN:
   - Revisar variables de entorno
   - Confirmar credenciales de Supabase

5. 🧪 TESTING PASO A PASO:
   - Probar autenticación primero
   - Luego probar creación de propiedad
   - Revisar logs del navegador y servidor
`);

console.log('\n🎯 PRÓXIMO PASO RECOMENDADO:');
console.log('Ejecutar el comando: cd Backend && npm run dev');
console.log('Luego abrir las herramientas de desarrollador del navegador');
console.log('Intentar publicar una propiedad y revisar los errores en la consola');

console.log('\n' + '='.repeat(60));
console.log('✅ ANÁLISIS COMPLETO FINALIZADO');
