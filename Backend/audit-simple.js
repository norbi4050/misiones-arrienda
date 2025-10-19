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

async function audit() {
  console.log('='.repeat(100))
  console.log('AUDITORÍA COMPLETA - SISTEMA DE AVATARES Y PERFILES')
  console.log('='.repeat(100))

  // IDs de los usuarios de prueba
  const cesarId = 'a4ef1f3d-c3e8-46df-b186-5b5c837cc14b' // Inmobiliaria
  const carlosId = '6403f9d2-e846-4c70-87e0-e051127d9500' // Inquilino

  console.log('\n📋 CESAR (Inmobiliaria)')
  console.log('─'.repeat(100))

  const { data: cesarUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', cesarId)
    .single()

  console.log('Tabla users:')
  console.log(`  user_type: ${cesarUser.user_type}`)
  console.log(`  is_company: ${cesarUser.is_company}`)
  console.log(`  company_name: ${cesarUser.company_name}`)
  console.log(`  avatar: ${cesarUser.avatar || 'NULL'}`)
  console.log(`  profile_image: ${cesarUser.profile_image || 'NULL'}`)
  console.log(`  logo_url: ${cesarUser.logo_url || 'NULL'}`)

  const { data: cesarProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('userId', cesarId)
    .maybeSingle()

  if (cesarProfile) {
    console.log('\nTabla user_profiles:')
    console.log(`  id: ${cesarProfile.id}`)
    console.log(`  role: ${cesarProfile.role}`)
    console.log(`  avatar_url: ${cesarProfile.avatar_url || 'NULL'}`)
    console.log(`  display_name: ${cesarProfile.display_name || 'NULL'}`)
  } else {
    console.log('\nTabla user_profiles: NO TIENE')
  }

  console.log('\n\n📋 CARLOS (Inquilino)')
  console.log('─'.repeat(100))

  const { data: carlosUser } = await supabase
    .from('users')
    .select('*')
    .eq('id', carlosId)
    .single()

  console.log('Tabla users:')
  console.log(`  user_type: ${carlosUser.user_type}`)
  console.log(`  is_company: ${carlosUser.is_company}`)
  console.log(`  avatar: ${carlosUser.avatar || 'NULL'}`)
  console.log(`  profile_image: ${carlosUser.profile_image || 'NULL'}`)

  const { data: carlosProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('userId', carlosId)
    .maybeSingle()

  if (carlosProfile) {
    console.log('\nTabla user_profiles:')
    console.log(`  id: ${carlosProfile.id}`)
    console.log(`  role: ${carlosProfile.role}`)
    console.log(`  avatar_url: ${carlosProfile.avatar_url || 'NULL'}`)
    console.log(`  display_name: ${carlosProfile.display_name || 'NULL'}`)
  } else {
    console.log('\nTabla user_profiles: NO TIENE')
  }

  // Ahora buscar todos los endpoints que manejan avatares
  console.log('\n\n📋 ENDPOINTS DE PERFIL')
  console.log('─'.repeat(100))
  console.log('Buscando archivos route.ts relacionados con perfil y avatar...\n')
}

audit().then(() => console.log('\n✅ Auditoría completada'))
