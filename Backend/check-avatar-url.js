const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load .env.local
const envPath = path.join(__dirname, '.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      const value = valueParts.join('=')
      if (key && value) process.env[key] = value
    }
  })
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAvatarUrl() {
  console.log('='.repeat(100))
  console.log('VERIFICACIÓN DE AVATARES - DESPUÉS DE FIXES')
  console.log('='.repeat(100))

  // IDs de los usuarios de prueba
  const cesarId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Inmobiliaria
  const carlosId = '6403f9d2-e846-4c70-87e0-e051127d9500' // Inquilino

  console.log('\n📋 CESAR (Inmobiliaria)')
  console.log('─'.repeat(100))

  const { data: cesarUser } = await supabase
    .from('users')
    .select('id, name, user_type, is_company, avatar, logo_url')
    .eq('id', cesarId)
    .single()

  if (cesarUser) {
    console.log(`✅ Usuario encontrado:`)
    console.log(`   ID: ${cesarUser.id}`)
    console.log(`   Nombre: ${cesarUser.name}`)
    console.log(`   Tipo: ${cesarUser.user_type}`)
    console.log(`   Es empresa: ${cesarUser.is_company}`)
    console.log(`   Avatar (users.avatar): ${cesarUser.avatar || 'NULL'}`)
    console.log(`   Logo (users.logo_url): ${cesarUser.logo_url || 'NULL'}`)
  }

  const { data: cesarProfile } = await supabase
    .from('user_profiles')
    .select('userId, role, avatar_url, display_name')
    .eq('userId', cesarId)
    .maybeSingle()

  if (cesarProfile) {
    console.log(`\n✅ UserProfile encontrado:`)
    console.log(`   Role: ${cesarProfile.role}`)
    console.log(`   Avatar URL (user_profiles.avatar_url): ${cesarProfile.avatar_url || 'NULL'}`)
    console.log(`   Display Name: ${cesarProfile.display_name || 'NULL'}`)
  } else {
    console.log(`\n⚠️  NO tiene UserProfile (normal para inmobiliaria nueva)`)
  }

  console.log('\n\n📋 CARLOS (Inquilino)')
  console.log('─'.repeat(100))

  const { data: carlosUser } = await supabase
    .from('users')
    .select('id, name, user_type, is_company, avatar, profile_image')
    .eq('id', carlosId)
    .single()

  if (carlosUser) {
    console.log(`✅ Usuario encontrado:`)
    console.log(`   ID: ${carlosUser.id}`)
    console.log(`   Nombre: ${carlosUser.name}`)
    console.log(`   Tipo: ${carlosUser.user_type}`)
    console.log(`   Avatar (users.avatar): ${carlosUser.avatar || 'NULL'}`)
    console.log(`   Profile Image (users.profile_image): ${carlosUser.profile_image || 'NULL'}`)
  }

  const { data: carlosProfile } = await supabase
    .from('user_profiles')
    .select('userId, role, avatar_url, display_name')
    .eq('userId', carlosId)
    .maybeSingle()

  if (carlosProfile) {
    console.log(`\n✅ UserProfile encontrado:`)
    console.log(`   Role: ${carlosProfile.role}`)
    console.log(`   Avatar URL (user_profiles.avatar_url): ${carlosProfile.avatar_url || 'NULL'}`)
    console.log(`   Display Name: ${carlosProfile.display_name || 'NULL'}`)
  } else {
    console.log(`\n❌ NO tiene UserProfile (PROBLEMA - inquilino debe tenerlo)`)
  }

  console.log('\n\n📋 RESUMEN DE FIXES APLICADOS')
  console.log('─'.repeat(100))

  console.log('\n✅ FIX 1: Agregado campo "avatar" a CompanyProfile interface')
  console.log('   Archivo: src/app/mi-empresa/mi-empresa-client.tsx:78')
  console.log('   Efecto: Ahora el componente puede recibir y usar el avatar del usuario inmobiliaria')

  console.log('\n✅ FIX 2: Optimizado cache-busting para refresh instantáneo')
  console.log('   Archivo: src/components/ui/avatar-universal.tsx:129-140')
  console.log('   Efecto: Avatar se actualiza inmediatamente sin delay de 500ms')

  console.log('\n\n🏢 INMOBILIARIA (Cesar):')
  console.log(`   Avatar para mensajes/navbar: ${cesarUser?.avatar || cesarProfile?.avatar_url || 'NO CONFIGURADO'}`)
  console.log(`   Logo para perfil público: ${cesarUser?.logo_url || 'NO CONFIGURADO'}`)

  console.log('\n👤 INQUILINO (Carlos):')
  console.log(`   Avatar principal: ${carlosProfile?.avatar_url || carlosUser?.avatar || 'NO CONFIGURADO'}`)

  console.log('\n\n📝 INSTRUCCIONES PARA PROBAR:')
  console.log('1. Usuario INMOBILIARIA:')
  console.log('   - Ir a /mi-empresa')
  console.log('   - Hacer clic en "Editar Perfil"')
  console.log('   - Ahora debería aparecer botón de cámara (📷) en el avatar')
  console.log('   - Subir imagen y verificar que aparece instantáneamente')

  console.log('\n2. Usuario INQUILINO:')
  console.log('   - Ir a /profile/inquilino')
  console.log('   - Subir avatar y verificar refresh instantáneo (sin delay)')

  console.log('\n\n✅ Verificación completada')
}

checkAvatarUrl()
  .catch(err => {
    console.error('\n❌ Error en verificación:', err)
    process.exit(1)
  })
