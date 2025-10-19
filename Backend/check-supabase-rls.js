const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Load .env.local
const envContent = fs.readFileSync('.env.local', 'utf8')
envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=')
    const value = valueParts.join('=')
    if (key && value) process.env[key] = value
  }
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkSupabaseConfig() {
  console.log('='.repeat(80))
  console.log('AUDITORÍA DE CONFIGURACIÓN DE SUPABASE')
  console.log('='.repeat(80))

  console.log('\n📋 PARTE 1: VERIFICAR POLÍTICAS RLS\n')
  console.log('NOTA: Las políticas RLS se verifican ejecutando queries y viendo si fallan')
  console.log('─'.repeat(80))

  // Test 1: Verificar si podemos leer users con service role
  console.log('\n✓ Test 1: Lectura de tabla users con service role')
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, name, user_type')
    .limit(1)

  if (usersError) {
    console.log('  ❌ ERROR:', usersError.message)
  } else {
    console.log('  ✅ OK - Service role puede leer users')
    console.log(`  ${users.length} registros leídos`)
  }

  // Test 2: Verificar si podemos leer user_profiles con service role
  console.log('\n✓ Test 2: Lectura de tabla user_profiles con service role')
  const { data: profiles, error: profilesError } = await supabase
    .from('user_profiles')
    .select('id, userId, role')
    .limit(1)

  if (profilesError) {
    console.log('  ❌ ERROR:', profilesError.message)
  } else {
    console.log('  ✅ OK - Service role puede leer user_profiles')
    console.log(`  ${profiles.length} registros leídos`)
  }

  // Test 3: Intentar UPDATE en users con service role
  console.log('\n✓ Test 3: UPDATE en tabla users con service role')
  const testUserId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Cesar
  const testValue = `Test-${Date.now()}`

  const { data: updateData, error: updateError } = await supabase
    .from('users')
    .update({ description: testValue })
    .eq('id', testUserId)
    .select()

  if (updateError) {
    console.log('  ❌ ERROR:', updateError.message)
    console.log('  ⚠️  RLS podría estar bloqueando updates incluso con service role!')
  } else {
    console.log('  ✅ OK - Service role puede actualizar users')
    console.log(`  ${updateData.length} filas actualizadas`)

    // Revertir el cambio
    await supabase
      .from('users')
      .update({ description: null })
      .eq('id', testUserId)
  }

  // Test 4: Intentar UPDATE en user_profiles con service role
  console.log('\n✓ Test 4: UPDATE en tabla user_profiles con service role')
  const testProfileId = 'up_59263b34-8563-4e53-b249-42e6eeba4772' // Cesar profile

  const { data: profileUpdateData, error: profileUpdateError } = await supabase
    .from('user_profiles')
    .update({ bio: testValue })
    .eq('id', testProfileId)
    .select()

  if (profileUpdateError) {
    console.log('  ❌ ERROR:', profileUpdateError.message)
    console.log('  ⚠️  RLS podría estar bloqueando updates incluso con service role!')
  } else {
    console.log('  ✅ OK - Service role puede actualizar user_profiles')
    console.log(`  ${profileUpdateData.length} filas actualizadas`)

    // Revertir el cambio
    await supabase
      .from('user_profiles')
      .update({ bio: null })
      .eq('id', testProfileId)
  }

  console.log('\n\n📋 PARTE 2: VERIFICAR STORAGE (bucket avatars)\n')
  console.log('─'.repeat(80))

  // Test 5: Listar archivos en bucket avatars
  console.log('\n✓ Test 5: Listar archivos en bucket "avatars"')
  const { data: files, error: filesError } = await supabase
    .storage
    .from('avatars')
    .list('', { limit: 5 })

  if (filesError) {
    console.log('  ❌ ERROR:', filesError.message)
    console.log('  ⚠️  Bucket "avatars" podría no existir o no tener permisos')
  } else {
    console.log('  ✅ OK - Bucket "avatars" accesible')
    console.log(`  ${files.length} carpetas encontradas`)
  }

  // Test 6: Verificar que un archivo específico existe
  console.log('\n✓ Test 6: Verificar archivo específico de Cesar')
  const cesarAvatarPath = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b/avatar.jpeg'

  const { data: fileExists, error: fileError } = await supabase
    .storage
    .from('avatars')
    .list('a4ef1f3d-c3e8-46df-b186-5b5c837cc14b')

  if (fileError) {
    console.log('  ❌ ERROR:', fileError.message)
  } else {
    console.log('  ✅ OK - Carpeta del usuario accesible')
    console.log(`  ${fileExists.length} archivos en la carpeta`)
    fileExists.forEach(file => {
      console.log(`    - ${file.name} (${(file.metadata?.size / 1024).toFixed(2)} KB)`)
    })
  }

  console.log('\n\n📋 PARTE 3: VERIFICAR CONFIGURACIÓN DEL BUCKET\n')
  console.log('─'.repeat(80))

  // Test 7: Obtener configuración del bucket
  console.log('\n✓ Test 7: Configuración del bucket "avatars"')
  const { data: bucket, error: bucketError } = await supabase
    .storage
    .getBucket('avatars')

  if (bucketError) {
    console.log('  ❌ ERROR:', bucketError.message)
  } else {
    console.log('  ✅ Bucket encontrado')
    console.log(`  Público: ${bucket.public}`)
    console.log(`  Tamaño máximo archivo: ${bucket.file_size_limit ? (bucket.file_size_limit / 1024 / 1024) + ' MB' : 'Sin límite'}`)
    console.log(`  Tipos permitidos: ${bucket.allowed_mime_types?.join(', ') || 'Todos'}`)
  }

  console.log('\n\n📋 RESUMEN DE CONFIGURACIÓN RECOMENDADA\n')
  console.log('─'.repeat(80))

  console.log('\n🔒 POLÍTICAS RLS RECOMENDADAS:\n')
  console.log('Tabla "users":')
  console.log('  1. SELECT: authenticated users pueden leer su propio registro')
  console.log('  2. UPDATE: authenticated users pueden actualizar su propio registro')
  console.log('  3. Service role: bypass todas las políticas ✓')

  console.log('\nTabla "user_profiles":')
  console.log('  1. SELECT: authenticated users pueden leer cualquier perfil público')
  console.log('  2. UPDATE: authenticated users pueden actualizar solo su perfil')
  console.log('  3. Service role: bypass todas las políticas ✓')

  console.log('\n📁 STORAGE RECOMENDADO:\n')
  console.log('Bucket "avatars":')
  console.log('  - Público: true (para que las imágenes sean accesibles)')
  console.log('  - Políticas:')
  console.log('    1. INSERT: authenticated users pueden subir a su carpeta (userId/*)')
  console.log('    2. UPDATE: authenticated users pueden actualizar archivos en su carpeta')
  console.log('    3. DELETE: authenticated users pueden borrar archivos en su carpeta')
  console.log('    4. SELECT: público puede ver archivos (bucket público)')
}

checkSupabaseConfig()
  .then(() => console.log('\n\n✅ Auditoría completada'))
  .catch(err => {
    console.error('\n\n❌ Error en auditoría:', err)
    process.exit(1)
  })
