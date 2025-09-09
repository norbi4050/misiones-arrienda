#!/usr/bin/env node

/**
 * BLACKBOX - VERIFICACIÓN DE VARIABLES DE ENTORNO SUPABASE
 * Script seguro que verifica la presencia de variables sin exponer valores completos
 */

console.log('🔍 BLACKBOX - VERIFICACIÓN DE VARIABLES DE ENTORNO SUPABASE\n');

// Verificar NEXT_PUBLIC_SUPABASE_URL
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl) {
  // Extraer solo el host (dominio) sin exponer el valor completo
  const url = new URL(supabaseUrl);
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL: Configurada');
  console.log(`   📍 Host: ${url.hostname}`);
  console.log(`   🔗 Protocolo: ${url.protocol}`);
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: NO CONFIGURADA');
}

// Verificar NEXT_PUBLIC_SUPABASE_ANON_KEY
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (supabaseAnonKey) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY: Configurada');
  console.log(`   🔑 Longitud: ${supabaseAnonKey.length} caracteres`);
  console.log(`   📝 Prefijo: ${supabaseAnonKey.substring(0, 10)}...`);
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: NO CONFIGURADA');
}

// Verificar SUPABASE_SERVICE_ROLE_KEY (solo en servidor)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (serviceRoleKey) {
  console.log('✅ SUPABASE_SERVICE_ROLE_KEY: Configurada (servidor)');
  console.log(`   🔑 Longitud: ${serviceRoleKey.length} caracteres`);
  console.log(`   📝 Prefijo: ${serviceRoleKey.substring(0, 10)}...`);
} else {
  console.log('⚠️  SUPABASE_SERVICE_ROLE_KEY: No encontrada (solo necesaria para operaciones admin)');
}

// Verificación de conectividad básica
console.log('\n🌐 VERIFICACIÓN DE CONECTIVIDAD:');
if (supabaseUrl && supabaseAnonKey) {
  console.log('✅ Variables básicas configuradas - conexión posible');
} else {
  console.log('❌ Faltan variables básicas - verificar configuración');
}

console.log('\n📋 ARCHIVOS DONDE SE LEEN LAS VARIABLES:');
console.log('   📁 Backend/src/lib/supabase/server.ts');
console.log('   📁 Backend/src/lib/supabase/browser.ts');
console.log('   📁 Backend/.env (archivo local)');

console.log('\n🎯 TABLA UTILIZADA POR LA API:');
console.log('   🗄️  Tabla: "Property" (CamelCase)');
console.log('   📍 Archivo: Backend/src/app/api/properties/route.ts');
console.log('   🔍 Línea: .from(\'Property\')');

console.log('\n✨ VERIFICACIÓN COMPLETADA');
