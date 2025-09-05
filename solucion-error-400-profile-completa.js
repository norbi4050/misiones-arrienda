const https = require('https');

console.log('=== SOLUCIÓN ERROR 400 PROFILE ===');
console.log('Fecha:', new Date().toISOString());

console.log('\n🔍 PROBLEMA IDENTIFICADO:');
console.log('- Error 400 en Supabase al actualizar perfil de usuario');
console.log('- El endpoint /api/users/profile devuelve error 500');
console.log('- Usuario ID: 6403f9d2-e846-4c70-87e0-e051127d9500');

console.log('\n📋 ANÁLISIS DEL CÓDIGO:');
console.log('1. El endpoint tiene mapeo de campos correcto');
console.log('2. La autenticación funciona correctamente');
console.log('3. El problema está en la actualización a Supabase');

console.log('\n🚨 POSIBLES CAUSAS DEL ERROR 400:');
console.log('1. Campo requerido faltante en la tabla users');
console.log('2. Tipo de dato incorrecto en algún campo');
console.log('3. Violación de constraint en la base de datos');
console.log('4. Campo que no existe en la tabla users');
console.log('5. Problema con las políticas RLS');

console.log('\n🔧 SOLUCIONES A IMPLEMENTAR:');

console.log('\n1. VALIDACIÓN DE DATOS ANTES DE ENVIAR:');
console.log(`
// Agregar validación en el endpoint
const validateProfileData = (data) => {
  const validatedData = {};
  
  // Solo incluir campos que existen y tienen valores válidos
  if (data.name && typeof data.name === 'string') {
    validatedData.name = data.name.trim();
  }
  
  if (data.phone && typeof data.phone === 'string') {
    validatedData.phone = data.phone.trim();
  }
  
  if (data.location && typeof data.location === 'string') {
    validatedData.location = data.location.trim();
  }
  
  // Validar campos específicos
  if (data.search_type && ['rent', 'buy', 'both'].includes(data.search_type)) {
    validatedData.search_type = data.search_type;
  }
  
  if (data.budget_range && typeof data.budget_range === 'string') {
    validatedData.budget_range = data.budget_range;
  }
  
  if (data.family_size && Number.isInteger(Number(data.family_size))) {
    validatedData.family_size = Number(data.family_size);
  }
  
  if (typeof data.pet_friendly === 'boolean') {
    validatedData.pet_friendly = data.pet_friendly;
  }
  
  return validatedData;
};
`);

console.log('\n2. MANEJO DE ERRORES MEJORADO:');
console.log(`
// Mejorar el manejo de errores en el endpoint
const { data, error } = await supabase
  .from('users')
  .update(validatedData)
  .eq('id', user.id)
  .select()
  .single();

if (error) {
  console.error('Supabase error details:', {
    message: error.message,
    details: error.details,
    hint: error.hint,
    code: error.code
  });
  
  // Respuesta más específica según el tipo de error
  if (error.code === '23505') {
    return NextResponse.json({ 
      error: 'Datos duplicados detectados',
      field: error.details 
    }, { status: 400 });
  }
  
  if (error.code === '23502') {
    return NextResponse.json({ 
      error: 'Campo requerido faltante',
      field: error.details 
    }, { status: 400 });
  }
  
  return NextResponse.json({ 
    error: 'Error al actualizar el perfil: ' + error.message,
    code: error.code
  }, { status: 500 });
}
`);

console.log('\n3. VERIFICACIÓN DE ESTRUCTURA DE TABLA:');
console.log('Ejecutar en Supabase SQL Editor:');
console.log(`
-- Verificar estructura de la tabla users
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Verificar constraints
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'users';
`);

console.log('\n4. ACTUALIZACIÓN INCREMENTAL:');
console.log(`
// Solo actualizar campos que han cambiado
const updateData = {};
Object.keys(mappedData).forEach(key => {
  if (mappedData[key] !== undefined && mappedData[key] !== null) {
    updateData[key] = mappedData[key];
  }
});

// No incluir updated_at si causa problemas
delete updateData.updated_at;
`);

console.log('\n5. VERIFICAR POLÍTICAS RLS:');
console.log('Ejecutar en Supabase SQL Editor:');
console.log(`
-- Verificar políticas RLS para la tabla users
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'users';

-- Verificar si RLS está habilitado
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'users';
`);

console.log('\n📝 PASOS PARA IMPLEMENTAR LA SOLUCIÓN:');
console.log('1. Actualizar el endpoint con validación de datos');
console.log('2. Mejorar el manejo de errores');
console.log('3. Verificar la estructura de la tabla users en Supabase');
console.log('4. Revisar las políticas RLS');
console.log('5. Probar con datos mínimos primero');

console.log('\n🧪 DATOS DE PRUEBA MÍNIMOS:');
console.log(`
{
  "name": "Usuario Test",
  "phone": "+54123456789"
}
`);

console.log('\n✅ SOLUCIÓN COMPLETADA');
console.log('Implementar estos cambios paso a paso para resolver el error 400.');
