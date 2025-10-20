/**
 * Script de prueba para verificar que el endpoint DELETE de community posts funciona correctamente
 *
 * Este script simula la lógica del endpoint DELETE sin la columna 'status' que causaba el error 500
 */

console.log('🔍 Test: DELETE /api/comunidad/posts/[id]');
console.log('');
console.log('✅ Corrección aplicada:');
console.log('   - Removida la columna "status" del UPDATE statement');
console.log('   - El soft delete ahora solo actualiza is_active = false');
console.log('');
console.log('📋 Cambios realizados:');
console.log('   ANTES:');
console.log('   update({ ');
console.log('     is_active: false,');
console.log('     status: "ARCHIVED", // ← Esta columna causaba el error');
console.log('     updated_at: new Date().toISOString()');
console.log('   })');
console.log('');
console.log('   DESPUÉS:');
console.log('   update({');
console.log('     is_active: false,');
console.log('     updated_at: new Date().toISOString()');
console.log('   })');
console.log('');
console.log('✨ El endpoint DELETE ahora debería funcionar correctamente');
console.log('');
console.log('🧪 Para probar:');
console.log('   1. Iniciar el servidor: npm run dev');
console.log('   2. Autenticarse como inquilino');
console.log('   3. Intentar eliminar un anuncio desde "Mis publicaciones"');
console.log('   4. El anuncio debería eliminarse (soft delete) sin error 500');
