console.log('=== INVESTIGACIÓN EXHAUSTIVA ERROR 400 PROFILE ===');
console.log('Fecha:', new Date().toISOString());

console.log('\n🔍 ANÁLISIS DE LOGS REALES:');
console.log('URL Request:', 'https://www.misionesarrienda.com.ar/api/users/profile');
console.log('Método:', 'PUT');
console.log('Status Frontend:', '500 Internal Server Error');
console.log('Status Supabase:', '400 Bad Request');

console.log('\n📊 DATOS CRÍTICOS DEL LOG:');
console.log('- Request URL Supabase:', 'https://qfeyhaaxyemmnohqdele.supabase.co/rest/v1/users?id=eq.6403f9d2-e846-4c70-87e0-e051127d9500&select=*');
console.log('- Método Supabase:', 'PATCH');
console.log('- Content-Type:', 'application/json');
console.log('- Content-Length:', '280 bytes');
console.log('- User-Agent:', 'node');
console.log('- X-Client-Info:', 'supabase-ssr/0.7.0 createServerClient');

console.log('\n🔑 INFORMACIÓN DE AUTENTICACIÓN:');
console.log('- Auth User ID:', '6403f9d2-e846-4c70-87e0-e051127d9500');
console.log('- Role:', 'authenticated');
console.log('- Session ID:', 'a61ffa55-ebaf-405d-b89d-8ece1be5cac5');
console.log('- JWT válido:', 'Sí (expires_at: 1757038988)');

console.log('\n🚨 PROBLEMAS IDENTIFICADOS:');

console.log('\n1. DISCREPANCIA DE MÉTODOS:');
console.log('   - Frontend envía: PUT');
console.log('   - Supabase recibe: PATCH');
console.log('   - Problema: Posible transformación incorrecta del método HTTP');

console.log('\n2. QUERY PARAMETERS SOSPECHOSOS:');
console.log('   - URL incluye: ?id=eq.6403f9d2-e846-4c70-87e0-e051127d9500&select=*');
console.log('   - Problema: select=* en una operación UPDATE/PATCH es inusual');
console.log('   - Posible causa: Configuración incorrecta del cliente Supabase');

console.log('\n3. CONTENT-LENGTH vs DATOS:');
console.log('   - Content-Length: 280 bytes');
console.log('   - Problema: No vemos el contenido real del body');
console.log('   - Posible causa: Datos malformados o campos incorrectos');

console.log('\n4. HEADERS ESPECÍFICOS:');
console.log('   - Accept: application/vnd.pgrst.object+json');
console.log('   - Prefer: return=representation');
console.log('   - Problema: Configuración específica de PostgREST');

console.log('\n🔬 HIPÓTESIS PRINCIPALES:');

console.log('\n📌 HIPÓTESIS 1: PROBLEMA EN EL CLIENTE SUPABASE');
console.log('- El cliente Supabase está mal configurado');
console.log('- Está enviando select=* en una operación de actualización');
console.log('- Posible uso incorrecto de .update() vs .upsert()');

console.log('\n📌 HIPÓTESIS 2: ESTRUCTURA DE DATOS INCORRECTA');
console.log('- Los 280 bytes del body contienen datos malformados');
console.log('- Campos con nombres incorrectos (camelCase vs snake_case)');
console.log('- Tipos de datos incompatibles con el esquema de Supabase');

console.log('\n📌 HIPÓTESIS 3: PROBLEMA DE RLS (Row Level Security)');
console.log('- Las políticas RLS están bloqueando la actualización');
console.log('- El usuario autenticado no tiene permisos para actualizar');
console.log('- Conflicto entre el user_id del JWT y el id en la query');

console.log('\n📌 HIPÓTESIS 4: PROBLEMA DE ESQUEMA DE BASE DE DATOS');
console.log('- La tabla users no existe o tiene estructura diferente');
console.log('- Campos requeridos faltantes o con constraints violados');
console.log('- Conflictos de tipos de datos UUID vs string');

console.log('\n📌 HIPÓTESIS 5: PROBLEMA EN EL ENDPOINT NEXT.JS');
console.log('- El endpoint está transformando incorrectamente los datos');
console.log('- Error en la configuración del cliente Supabase server-side');
console.log('- Problema con el middleware de autenticación');

console.log('\n🎯 PLAN DE INVESTIGACIÓN DETALLADA:');

console.log('\n🔍 PASO 1: EXAMINAR EL ENDPOINT ACTUAL');
console.log('- Leer Backend/src/app/api/users/profile/route.ts');
console.log('- Verificar configuración del cliente Supabase');
console.log('- Analizar el método HTTP usado');
console.log('- Revisar el mapeo de datos');

console.log('\n🔍 PASO 2: VERIFICAR ESQUEMA DE SUPABASE');
console.log('- Consultar estructura de la tabla users');
console.log('- Verificar tipos de datos de cada campo');
console.log('- Revisar constraints y índices');
console.log('- Verificar políticas RLS activas');

console.log('\n🔍 PASO 3: ANALIZAR CONFIGURACIÓN DEL CLIENTE');
console.log('- Revisar Backend/src/lib/supabase/server.ts');
console.log('- Verificar variables de entorno');
console.log('- Analizar configuración de headers');
console.log('- Revisar configuración de auth');

console.log('\n🔍 PASO 4: EXAMINAR DATOS ENVIADOS');
console.log('- Interceptar el body de 280 bytes');
console.log('- Verificar formato JSON');
console.log('- Analizar nombres de campos');
console.log('- Verificar tipos de datos');

console.log('\n🔍 PASO 5: TESTING DIRECTO CON SUPABASE');
console.log('- Probar query directa en Supabase Dashboard');
console.log('- Verificar permisos del usuario');
console.log('- Probar con datos mínimos');
console.log('- Verificar logs de Supabase');

console.log('\n⚡ ACCIONES INMEDIATAS:');
console.log('1. Leer el endpoint actual para entender la implementación');
console.log('2. Verificar la configuración del cliente Supabase');
console.log('3. Examinar el esquema de la tabla users en Supabase');
console.log('4. Crear un test directo con datos mínimos');
console.log('5. Implementar logging detallado para capturar el body');

console.log('\n✅ INVESTIGACIÓN INICIADA');
console.log('Procediendo con el análisis paso a paso...');
